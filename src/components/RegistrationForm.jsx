import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { registerUser } from '../services/auth';
import { addParent } from '../services/firestore';
import { getAvailableSlots, addSession, filterAvailableSlots, generateTimeSlots } from '../services/sessions';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
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
  const [startDate, setStartDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [isFirstStepValid, setIsFirstStepValid] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);  
  const [registered, setRegistered] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const history = useHistory();

  useEffect(() => {
    document.body.classList.add('registration-form');
    return () => {
      document.body.classList.remove('registration-form');
    };
  }, []);


  useEffect(() => {
    if (!startDate) {
      console.error("Start date is undefined"); // early exit if startDate is not set
      return;
    }
  
    const fetchSlots = async () => {
      const availableSlots = generateTimeSlots();
      const bookedSlotsArray = await getAvailableSlots();
      const filteredSlots = filterAvailableSlots(availableSlots, bookedSlotsArray, startDate); // pass startDate instead of undefined
      setFilteredSlots(filteredSlots);
    };
  
    fetchSlots();
  }, [startDate]); // only trigger when startDate is set

  const checkFormValidity = useCallback(() => {
    const requiredFields = [email, password, confirmPassword, name, child, selectedTime, startDate];
    const areFieldsFilled = requiredFields.every(field => field);
    setIsFormValid(areFieldsFilled);
  }, [email, password, confirmPassword, name, child, selectedTime, startDate]);

  useEffect(() => {
    setIsFirstStepValid(name.trim() !== '' && child.trim() !== '');
  }, [name, child]);

  useEffect(() => {
    checkFormValidity();
  }, [checkFormValidity]);

  const handleDateChange = async (date) => {
    setStartDate(date);
  
    if (!(date instanceof Date) || isNaN(date)) {
      console.error('Invalid date:', date);
      return;
    }
  
    const availableSlots = generateTimeSlots();
    const bookedSlotsArray = await getAvailableSlots();
    const filteredSlots = filterAvailableSlots(availableSlots, bookedSlotsArray, date); // Pass the valid date
    setFilteredSlots(filteredSlots);
  };

  const handlePasswordChange = (event) => {
    const pwd = event.target.value;
    setPassword(pwd);
    const strength = checkPasswordStrength(pwd);
    setPasswordStrength(strength);
  };

  const checkPasswordStrength = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{7,}$/;
    return passwordRegex.test(password) ? 'strong' : 'weak';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    try {
      setLoading(true);
      const userCredential = await registerUser(email, password);
      const user = userCredential.user;
  
      // add parent to the firestore parents collection using their uid
      const parentData = {
        parent_name: name,
        email: email,
        child_name: child,
        invoice_status: false,
        uid: user.uid,
      };
      
      const parentId = await addParent(parentData);
      let currentDate = new Date(startDate);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 9, 0); 

      while (currentDate <= endDate) {
          const sessionDate = new Date(currentDate);
          const timeParts = selectedTime.split(':');
          let hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);

          //store the time in 24 hour format
          if (selectedTime.includes('PM') && hours !== 12) {
            hours += 12;
          } else if (selectedTime.includes('AM') && hours === 12) {
            hours = 0;
          }

          if (!isNaN(hours) && !isNaN(minutes)) {
            sessionDate.setHours(hours, minutes, 0, 0);

            //save the session to sessions collection
            await addSession(parentId, {
              child_name: child,
              session_time: sessionDate.toISOString(),
            });
          } else {
            throw new Error("Invalid time value");
          }
        currentDate.setDate(currentDate.getDate() + 7); // Move to the same day next week
      }

      const notifyAdmin = httpsCallable(functions, 'notifyOnRegister'); 
      await notifyAdmin({ parentEmail: email, parentName: name });
      setRegistered(true);

    } catch (error) {
      console.error('Error during registration: ', error.message, error.code);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'The email address is already in use by another account.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid.';
      } else {
        errorMessage = error.message;
      }
      setRegisterError(errorMessage);
    } finally {
      setLoading(false);
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
      <div className="outer-container">
        {registered && (
        <div className="registered-overlay">
          <div className="registered-message">
            <h3 className='successful-register-message'>Registration was successful!</h3>
            <p className="dashboard-details">
              <b> In your dashboard, you can:</b> <br/>
              <br />
                - Reschedule a session or all of your sessions<br/>
                - Cancel a session or all of your sessions<br/>
                - View your schedule<br/>
                - Join zoom<br/>
                <br/>
              Please monitor your email for session reminders, changes to your schedule, invoices, or any other messages.
            </p>
            <button className="registered-login" type="button" onClick={() => history.push('/login')}>Login</button>
          </div>
        </div>
        )}
        {registerError && (
          <div className="register-error-container">
            <div className="register-error-overlay">
              <h3 className='error-register-message'>Uh Oh! Error during registration: {registerError}</h3>
            </div>
          </div>
        )}
        <h1 className="register-title">Register for KBT Reading Support</h1>
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
                  loading={loading}
                />
              )}
            </form>
          </div>
          <Link
            to={{
            pathname: '/report-an-issue',
            state: { from: '/register' }, 
            }}
            className="report-issue-link"
            >Report an issue 
          </Link>
        </div>
      </div>
    );
};

export default RegistrationForm;