import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/steps.css'; 

const Step3 = ({ startDate, handleDateChange, selectedTime, setSelectedTime, filteredSlots, goToPreviousStep, isFormValid, loading }) => {

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('step3');
    return () => {
      document.body.classList.remove('step3');
    };
  }, []);

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 6 || day === 0;
  };

  return (
    <>
      <div className="instructions">
        <button className="instructions-button" onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}>Instructions for this step (click me)</button>
      </div>
      <div className="datepicker-container">
        <DatePicker
          id="start-date"
          selected={startDate}
          value={startDate}
          onChange={handleDateChange}
          dateFormat="yyyy/MM/dd"
          aria-label="Select start date"
          filterDate={isWeekend} // disables weekdays
          minDate={new Date()} // disables past dates
          inline 
        />
      </div>
      <div className="input-container">
        <select
          className="select-time"
          id="available-slots"
          name="availableSlots"
          value={selectedTime}
          onChange={(e) => setSelectedTime(e.target.value)}
          aria-label="Select Available Slot"
        >
        <option value="">Select a time slot</option>
        {filteredSlots.map((slot, index) => (
          <option key={index} value={slot.time} disabled={slot.status === 'unavailable'}>
            {`${slot.time} EST`} ({slot.status})
          </option>
        ))}
        </select>
      </div>
      <div className="nav">
        <button type="button" className="step3-nav" onClick={goToPreviousStep}>Prev</button>
        <button type="submit" className="step3-nav" disabled={!isFormValid || loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </div>
      <p className="step-number">Step 3 of 3</p>

      {isModalOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3 className="instructions-text-1">
            Please select the day of your <u>upcoming</u> session with Kelli on the calendar. For the time being, sessions are only on the weekends.
            Then, select the time of the session. The selected day of the week and time will be used to schedule your sessions for the school year.      
          </h3>
          <h3 className="instructions-text-2">
            Please note that the session times are in <u>Eastern Standard Time(EST).</u>
          </h3>
          <h3 className="instructions-text-3"> 
            If you need it, you can use this <br />
            <a href="https://dateful.com/time-zone-converter" target="_blank" className="converter-link" rel="noopener noreferrer">
            time zone converter.
            </a>
          </h3>
          <h3 className="instructions-text-4">
            You will be able to reschedule or cancel your sessions anytime. 
          </h3>
          <button className="close-button" onClick={() => setIsModalOpen(false)}>Close</button>
        </div>
      </div>
      )}
    </>
  );
};

export default Step3;