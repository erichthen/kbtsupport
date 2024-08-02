import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useHistory } from 'react-router-dom';
import { registerUser } from '../services/auth';
import { addParent } from '../services/firestore';
import { getAvailableSlots, addSession, filterAvailableSlots } from '../services/sessions';
import '../styles/registerform.css';

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
  
  const history = useHistory(); // Initialize useHistory

  useEffect(() => {
    document.body.classList.add('registration-form');
    return () => {
      document.body.classList.remove('registration-form');
    };
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      const { slots, bookedSlots } = await getAvailableSlots();
      setFilteredSlots(filterAvailableSlots(startDate, slots, bookedSlots));
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

  const handleDateChange = async (date) => {
    setStartDate(date);
    const { slots, bookedSlots } = await getAvailableSlots();
    setFilteredSlots(filterAvailableSlots(date, slots, bookedSlots));
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
      await registerUser(email, password);

      const parentId = await addParent({ name, email, child, invoice_status: false });

      let currentDate = new Date(startDate);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of the month

      while (currentDate <= endDate) {
        if (currentDate.getDay() === 6) { // 6 is Saturday
          await addSession(parentId, {
            child_name: child,
            session_time: new Date(currentDate.setHours(parseInt(selectedTime.split(':')[0]), parseInt(selectedTime.split(':')[1]))).toISOString(),
            zoom_link: ""
          });
        }
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      }

      alert('Registration complete. You can now log in with your email and password.');

      history.push('/login'); // Navigate to the login page
    } catch (error) {
      console.error("Error during registration: ", error.message, error.code);
      alert(`Error during registration: ${error.message}`);
    }
  };

  // Disable weekdays in the date picker
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 6 || day === 0; // 6 is Saturday, 0 is Sunday
  };

  return (
    <div className="main-container">
      <h1>Register for KBT Reading Support</h1>
      <div className="outer-container">
        <div className="container">
          <form onSubmit={handleSubmit}>
            <div>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                aria-label="Enter your name"
              />
            </div>
            <div>
              <input
                id="child"
                name="child"
                type="text"
                value={child}
                onChange={(e) => setChild(e.target.value)}
                placeholder="Enter your child's name"
                aria-label="Enter your child's name"
              />
            </div>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                aria-label="Enter your email"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                aria-label="Enter your password"
              />
              {password && (
                <span>
                  {passwordStrength === 'weak' ? 'Password is too weak' : 'Password is strong'}
                </span>
              )}
            </div>
            <div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                aria-label="Confirm your password"
              />
            </div>
            <div>
              <label htmlFor="start-date">Select Date</label>
              <DatePicker
                id="start-date"
                selected={startDate}
                onChange={handleDateChange}
                dateFormat="yyyy/MM/dd"
                aria-label="Select start date"
                filterDate={isWeekend} // Disable weekdays
              />
            </div>
            <div>
              <label htmlFor="available-slots">Select Available Slot</label>
              <select
                id="available-slots"
                name="availableSlots"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                aria-label="Select Available Slot"
              >
                <option value="">Select a time slot</option>
                {filteredSlots.map((slot, index) => (
                  <option key={index} value={slot.time} disabled={slot.status === 'unavailable'}>
                    {slot.time} ({slot.status})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={!isFormValid}>Register</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;