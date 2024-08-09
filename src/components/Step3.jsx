import React, { useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/step3.css'; 

const Step3 = ({ startDate, handleDateChange, selectedTime, setSelectedTime, filteredSlots, goToPreviousStep, isFormValid }) => {

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
      <p>Please select a date and time for your upcoming session. The same day and time will be applied for the following months, 
      however you will be able to request a reschedule or cancel anytime.</p>
      <div className="input-container datepicker-container">
        <DatePicker
          id="start-date"
          selected={startDate}
          onChange={handleDateChange}
          dateFormat="yyyy/MM/dd"
          aria-label="Select start date"
          filterDate={isWeekend} // disables weekdays
          inline 
        />
      </div>
      <div className="input-container">
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
      <div className="nav-buttons">
        <button type="button" onClick={goToPreviousStep}>Prev</button>
        <button type="submit" disabled={!isFormValid}>Register</button>
      </div>
    </>
  );
};

export default Step3;