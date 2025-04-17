import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, Link } from 'react-router-dom';
import moment from 'moment-timezone';
import DatePicker from 'react-datepicker';
import { registerUser } from '../services/auth';
import { addParent } from '../services/firestore';
import { getAvailableSlots, addSession, filterAvailableSlots, generateTimeSlots } from '../services/sessions';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import '../styles/registerform.css';
import { Helmet } from 'react-helmet';
import 'react-datepicker/dist/react-datepicker.css';

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
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('registration-form');
    return () => {
      document.body.classList.remove('registration-form');
    };
  }, []);

    // manage the “step1” body‑class
  useEffect(() => {
    if (currentStep === 1) {
      document.body.classList.add('step1');
    } else {
      document.body.classList.remove('step1');
    }
    // cleanup on unmount
    return () => document.body.classList.remove('step1');
  }, [currentStep]);

    // toggle the .step2 body‑class
  useEffect(() => {
    if (currentStep === 2) {
      document.body.classList.add('step2');
    } else {
      document.body.classList.remove('step2');
    }
    return () => document.body.classList.remove('step2');
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 3) {
      document.body.classList.add('step3');
    } else {
      document.body.classList.remove('step3');
    }
    return () => document.body.classList.remove('step3');
  }, [currentStep]);

  // keep passwords in sync
  useEffect(() => {
    setPasswordMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  // is this step valid?
  useEffect(() => {
    setIsStep2Valid(
      password.length > 0 &&
      passwordMatch &&
      passwordStrength !== 'weak' &&
      email.trim() !== '' &&
      email.includes('@')
    );
  }, [passwordMatch, passwordStrength, email, password]);

  const checkFormValidity = useCallback(() => {
    const requiredFields = [email, password, confirmPassword, name, child, selectedTime, startDate];
    const areFieldsFilled = requiredFields.every(field => field);
    setIsFormValid(areFieldsFilled);
  }, [email, password, confirmPassword, name, child, selectedTime, startDate]);


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
    <>
      <Helmet>
      </Helmet>
      <body>
        <header>
          <h1>KBT Reading Support</h1>
          <nav>
            <button className="contact-us-button">Contact Us</button>
            <button className="contact-us-button">About Us</button>
          </nav>
        </header>
        <main>
          <div className="main-container">
            {registered && (
              <div className="registered-overlay">
                <div className="registered-message">
                  <h3 className="successful-register-message">
                    Registration was successful!
                  </h3>
                  <p className="dashboard-details">
                    <b> In your dashboard, you can:</b> <br />
                    <br />
                    - Reschedule a session or all of your sessions<br />
                    - Cancel a session or all of your sessions<br />
                    - View your schedule<br />
                    - View session notes<br />
                    - Join zoom<br />
                    <br />
                    Please monitor your email for session reminders, changes to your
                    schedule, invoices, or any other messages.
                  </p>
                  <button
                    className="registered-login"
                    type="button"
                    onClick={() => history.push('/login')}
                  >
                    Login
                  </button>
                </div>
              </div>
            )}
  
            {registerError && (
              <div className="register-error-container">
                <div className="register-error-overlay">
                  <h3 className="error-register-message">
                    Uh Oh! Error during registration: {registerError}
                  </h3>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <>
                <h2 className="register-message-1">Welcome!</h2>
                <h4 className="register-message-2">
                  Please complete these steps to register.
                </h4>
              </>
            )}
  
            <div
              className={`container ${
                currentStep === 2 ? 'second-portion' : ''
              }`}
            >
              <form onSubmit={handleSubmit}>
                {currentStep === 1 && (
                  <>
                    <div className="input-container">
                      <input
                        className="step1-input"
                        id="name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Name (first and last)"
                        aria-label="Enter your name"
                      />
                    </div>
                    <div className="input-container">
                      <input
                        className="step1-input"
                        id="child"
                        name="child"
                        type="text"
                        value={child}
                        onChange={e => setChild(e.target.value)}
                        placeholder="Child’s name (first)"
                        aria-label="Enter your child's name"
                      />
                    </div>
                    <button
                      className="step1-next"
                      type="button"
                      onClick={goToNextStep}
                      disabled={!isFirstStepValid}
                    >
                      Next
                    </button>
                    <p className="step-number">Step 1 of 3</p>
                  </>
                )}
  
                {currentStep === 2 && (
                  <>
                    <div className="input-container">
                      <input
                        id="email-input"
                        name="email"
                        type="email"
                        className="step2-input"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        aria-label="Enter your email"
                        autoComplete="off"
                      />
                    </div>
  
                    <div className="input-container">
                      <div className="password-input-container">
                        <input
                          className="step2-input"
                          id="password-input"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={handlePasswordChange}
                          placeholder="Create a password"
                          aria-label="Enter a password"
                          autoComplete="new-password"
                        />
                      </div>
                      <button
                        className="view-password"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        Toggle password
                      </button>
                      <span className={`password-strength ${passwordStrength}`}>
                        {passwordStrength === 'weak' && password.length > 0
                          ? 'Password is too weak'
                          : ''}
                      </span>
                    </div>
  
                    <div className="input-container">
                      <div className="password-confirm-container">
                        <input
                          className="step2-input"
                          id="confirm-password-input"
                          name="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          aria-label="Confirm your password"
                          autoComplete="new-password"
                        />
                      </div>
                      <span className="passwords-match">
                        {!passwordMatch ? 'Passwords do not match' : ''}
                      </span>
                    </div>
  
                    <div className="nav">
                      <button
                        type="button"
                        className="nav-buttons"
                        onClick={goToPreviousStep}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="nav-buttons"
                        onClick={goToNextStep}
                        disabled={!isStep2Valid}
                      >
                        Next
                      </button>
                    </div>
  
                    <p className="step-number">Step 2 of 3</p>
                  </>
                )}
  
                {currentStep === 3 && (
                  <>
                    <div className="instructions">
                      <button
                        className="instructions-button"
                        onClick={e => {
                          e.preventDefault();
                          setIsModalOpen(true);
                        }}
                      >
                        Important Information (click here)
                      </button>
                    </div>
                    <div className="datepicker-container">
                      <DatePicker
                        id="start-date"
                        selected={startDate}
                        value={startDate}
                        onChange={handleDateChange}
                        dateFormat="yyyy/MM/dd"
                        aria-label="Select start date"
                        minDate={new Date()}
                        inline
                      />
                    </div>
                    <div className="input-container">
                      <select
                        className="select-time"
                        id="available-slots"
                        value={selectedTime}
                        onChange={e => setSelectedTime(e.target.value)}
                        aria-label="Select Available Slot"
                      >
                        <option value="">Select a time slot</option>
                        {filteredSlots.map((slot, i) => (
                          <option
                            key={i}
                            value={slot.time}
                            disabled={slot.status === 'unavailable'}
                          >
                            {slot.time} EST ({slot.status})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="nav">
                      <button
                        type="button"
                        className="step3-nav"
                        onClick={goToPreviousStep}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="step3-nav"
                        disabled={!isFormValid || loading}
                      >
                        {loading ? 'Registering' : 'Register'}
                      </button>
                    </div>
                    <p className="step-number">Step 3 of 3</p>
  
                    {isModalOpen && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <p className="instructions-text" id="instructions-text-1">
                        Please select the day of your upcoming session on the calendar.
                        If you do not have one, select an available day and time that works for you. 
                        <b> Note that the light blue shade
                        is the current day and it is not selected so times won't display.</b>
                      </p>
                      <p className="instructions-text">
                        Then, select the time of the session. The selected day of the week 
                        and time will be used to schedule your sessions for the year.      
                      </p>
                      <h3 className="instructions-text">
                        Please note that the session times are in <em>Eastern Standard Time (EST).</em>
                        <br />If you need it, you can use this <br />
                        <a href="https://dateful.com/time-zone-converter" target="_blank" className="converter-link" rel="noopener noreferrer">
                        time zone converter.
                        </a>
                      </h3>
                      <p className="instructions-text">
                        You will be able to reschedule or cancel one or all sessions anytime. 
                      </p>
                      <button className="close-button" onClick={() => setIsModalOpen(false)}>Close</button>
                    </div>
                  </div>
                  )}
                  </>
                )}
              </form>
            </div>
            <Link
              to={{
                pathname: '/report-an-issue',
                state: { from: '/register' },
              }}
              className="report-issue-link"
            >
              Report an issue
            </Link>
          </div>
        </main>
        <footer>
          <p>Proudly empowering young readers around the globe, one word at a time.</p>
        </footer>
      </body>
    </>
  );
};

export default RegistrationForm;