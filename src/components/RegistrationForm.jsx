import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, Link } from 'react-router-dom';
import moment from 'moment-timezone';
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
    // Set the selected date in EST to ensure consistent day/time handling
    const estDate = moment.tz(date, 'America/New_York').startOf('day');
    setStartDate(estDate.toDate());
  
    // Check for invalid date
    if (!estDate.isValid()) {
      console.error('Invalid date:', estDate);
      return;
    }
  
    // Generate available slots and filter them based on the selected EST date
    const availableSlots = generateTimeSlots();
    const bookedSlotsArray = await getAvailableSlots();
    const filteredSlots = filterAvailableSlots(availableSlots, bookedSlotsArray, estDate.toDate()); // Pass the EST date
    setFilteredSlots(filteredSlots);
  };

  const handlePasswordChange = (event) => {
    const pwd = event.target.value;
    setPassword(pwd);
    const strength = checkPasswordStrength(pwd);
    setPasswordStrength(strength);
  };

  const checkPasswordStrength = (password) => {
    const lengthCheck = password.length >= 6;
    //this is a regular expression literal to check if the password contains a digit
    const hasNumber = /\d/.test(password);
    return lengthCheck && hasNumber ? 'strong' : 'weak';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const userCredential = await registerUser(email, password);
      const user = userCredential.user;
  
      const parentData = {
        parent_name: name,
        email: email,
        child_name: child,
        invoice_status: false,
        uid: user.uid,
      };
  
      const parentId = await addParent(parentData);
      let currentDate = moment.tz(startDate, 'America/New_York');  // Set initial date in EST
      const endDate = currentDate.clone().add(9, 'months');
  
      while (currentDate.isSameOrBefore(endDate)) {
        const [hourString, minuteString] = selectedTime.split(':');
        let hours = parseInt(hourString, 10);
        const minutes = parseInt(minuteString, 10);
  
        // Adjust for AM/PM in 12-hour format
        if (selectedTime.includes('PM') && hours !== 12) {
          hours += 12;
        } else if (selectedTime.includes('AM') && hours === 12) {
          hours = 0;
        }
  
        // Create the session time in EST and then convert to UTC for storage
        const sessionDateEST = currentDate.clone().set({
          hour: hours,
          minute: minutes,
          second: 0,
          millisecond: 0,
        });
        const sessionDateUTC = sessionDateEST.clone().utc();
  
        await addSession(parentId, {
          child_name: child,
          session_time: sessionDateUTC.toISOString(),  // Store as UTC
        });
  
        currentDate.add(7, 'days');  // Move to the same day next week
      }
  
      const notifyAdmin = httpsCallable(functions, 'notifyOnRegister');
      await notifyAdmin({ parentEmail: email, parentName: name });
      setRegistered(true);
  
    } catch (error) {
      console.error('Error during registration:', error.message, error.code);
      setRegisterError('An unexpected error occurred. Please try again.');
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
                - Reschedule a session or all of your sessions<br />
                - Cancel a session or all of your sessions<br />
                - View your schedule<br />
                - View session notes<br />
                - Join zoom<br />
                <br />
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