import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { registerUser } from '../services/auth';
import { addParent } from '../services/firestore';
import { getAvailableSlots, addSession, filterAvailableSlots, generateTimeSlots } from '../services/sessions';
import '../styles/registerform.css';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';

const RegistrationForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [child, setChild] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isFirstStepValid, setIsFirstStepValid] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const history = useHistory();

  useEffect(() => {
    document.body.classList.add('registration-form');
    return () => {
      document.body.classList.remove('registration-form');
    };
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      const availableSlots = generateTimeSlots();
      console.log('Available Slots:', availableSlots);
      const bookedSlotsArray = await getAvailableSlots();
      console.log('Booked Slots Array:', bookedSlotsArray);
      const filteredSlots = filterAvailableSlots(availableSlots, bookedSlotsArray);
      setFilteredSlots(filteredSlots);
      console.log('Filtered Slots:', filteredSlots);
    };
    fetchSlots();
  }, [startDate]);

  const checkFormValidity = useCallback(() => {
    const requiredFields = [email, password, confirmPassword, name, child, selectedTime];
    const areFieldsFilled = requiredFields.every(field => field);
    const isPasswordStrong = passwordStrength === 'strong';
    setIsFormValid(isPasswordStrong && areFieldsFilled);
  }, [email, password, confirmPassword, name, child, selectedTime, passwordStrength]);

  useEffect(() => {
    checkFormValidity();
  }, [checkFormValidity]);

  useEffect(() => {
    setIsFirstStepValid(name.trim() !== '' && child.trim() !== '');
  }, [name, child]);

  const handleDateChange = async (date) => {
    setStartDate(date);
    const availableSlots = generateTimeSlots();
    console.log('Available Slots:', availableSlots);
    const bookedSlotsArray = await getAvailableSlots();
    console.log('Booked Slots Array:', bookedSlotsArray);
    const filteredSlots = filterAvailableSlots(availableSlots, bookedSlotsArray);
    setFilteredSlots(filteredSlots);
    console.log('Filtered Slots:', filteredSlots);
  };

  const handlePasswordChange = (event) => {
    const pwd = event.target.value;
    setPassword(pwd);
    const strength = checkPasswordStrength(pwd);
    setPasswordStrength(strength);
  };

  const checkPasswordStrength = (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password) ? 'strong' : 'weak';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
  
    try {
      const userCredential = await registerUser(email, password);
      const user = userCredential.user;
  
      // Add parent to the firestore parents collection with their uid
      const parentData = {
        parent_name: name,
        email: email,
        child_name: child,
        invoice_status: false,
        uid: user.uid,
      };
      
      const parentId = await addParent(parentData);
  
      let currentDate = new Date(startDate);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0); 

      while (currentDate <= endDate) {
        if (currentDate.getDay() === 6 || currentDate.getDay() === 0) { // Saturday or Sunday
          const sessionDate = new Date(currentDate);
          const timeParts = selectedTime.split(':');
          let hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);

          if (selectedTime.includes('PM') && hours !== 12) {
            hours += 12;
          } else if (selectedTime.includes('AM') && hours === 12) {
            hours = 0;
          }

          if (!isNaN(hours) && !isNaN(minutes)) {
            sessionDate.setHours(hours, minutes, 0, 0);

            // Save the session to Firestore
            await addSession(parentId, {
              child_name: child,
              session_time: sessionDate.toISOString(),
            });
          } else {
            throw new Error("Invalid time value");
          }
        }
        currentDate.setDate(currentDate.getDate() + 7); // Move to the same day next week
      }
  
      alert('Registration complete. You can now log in with your email and password.');
      history.push('/login');
    } catch (error) {
      console.error("Error during registration: ", error.message, error.code);
      alert(`Error during registration: ${error.message}`);
    }
  };

  const goToNextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="main-container">
      <h1>Register for KBT Reading Support</h1>
      <div className="outer-container">
        <div className={`container ${currentStep === 2 ? 'second-portion' : ''}`}>
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <Step1 
                name={name} 
                child={child} 
                setName={setName} 
                setChild={setChild} 
                goToNextStep={goToNextStep} 
                isFirstStepValid={isFirstStepValid} 
              />
            )}
            {currentStep === 2 && (
              <Step2 
                email={email} 
                password={password} 
                confirmPassword={confirmPassword} 
                setEmail={setEmail} 
                handlePasswordChange={handlePasswordChange} 
                setConfirmPassword={setConfirmPassword} 
                passwordStrength={passwordStrength} 
                goToPreviousStep={goToPreviousStep} 
                goToNextStep={goToNextStep} 
              />
            )}
            {currentStep === 3 && (
              <Step3 
                startDate={startDate} 
                handleDateChange={handleDateChange} 
                selectedTime={selectedTime} 
                setSelectedTime={setSelectedTime} 
                filteredSlots={filteredSlots} 
                goToPreviousStep={goToPreviousStep} 
                isFormValid={isFormValid} 
              />
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;