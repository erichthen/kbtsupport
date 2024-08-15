import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getParentById } from '../services/firestore';
import { getSessionsByParentId, generateTimeSlots, getAvailableSlots, filterAvailableSlots, deleteSessionByDate } from '../services/sessions';
import { useHistory } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';
import { logoutUser } from '../services/auth';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/userdash.css';

const DashBoard = () => {
  const [parentName, setParentName] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [formattedDate, setFormattedDate] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // Day of session
  const [selectedDayToRescheduleTo, setSelectedDayToRescheduleTo] = useState(null); // Day to reschedule to
  const [filteredSlots, setFilteredSlots] = useState([]); // Available time slots for rescheduling
  const [showCancel, setShowCancel] = useState(false); // Control for showing the cancel form
  const [cancelReason, setCancelReason] = useState('');
  const { user } = useAuth();
  const history = useHistory();

  useEffect(() => {
    document.body.classList.add('user-dashboard');
    return () => {
      document.body.classList.remove('user-dashboard');
    };
  }, []);

  useEffect(() => {
    const fetchParentName = async () => {
      if (user) {
        try {
          const parentData = await getParentById(user.uid);
          if (parentData) {
            setParentName(parentData.parent_name);
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Error fetching parent data: ', error);
        }
      }
    };

    fetchParentName();
  }, [user]);

  useEffect(() => {
    const fetchSessions = async () => {
      if (user && parentName) {
        try {
          const parentData = await getParentById(user.uid);
          if (parentData && parentData.id) {
            const sessions = await getSessionsByParentId(parentData.id);
            const formattedSessions = sessions.map(session => ({
              ...session,
              session_time: new Date(session.session_time),
            }));
            setSessions(formattedSessions);
          }
        } catch (error) {
          console.error('Error fetching sessions: ', error);
        }
      }
    };

    fetchSessions();
  }, [user, parentName]);

  useEffect(() => {
    if (selectedDayToRescheduleTo) {
      const fetchSlots = async () => {
        const availableSlots = generateTimeSlots();
        const bookedSlotsArray = await getAvailableSlots();
        
        // Filter booked slots for the selected day
        const filteredBookedSlots = bookedSlotsArray.filter(slot => {
          const slotDate = new Date(slot);
          return (
            slotDate.getFullYear() === selectedDayToRescheduleTo.getFullYear() &&
            slotDate.getMonth() === selectedDayToRescheduleTo.getMonth() &&
            slotDate.getDate() === selectedDayToRescheduleTo.getDate()
          );
        });

        const filteredSlots = filterAvailableSlots(availableSlots, filteredBookedSlots);
        setFilteredSlots(filteredSlots);
      };

      fetchSlots();
    }
  }, [selectedDayToRescheduleTo]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      history.push('/login');
    } catch (error) {
      console.error('Error during logout: ', error);
      alert('Error during logout.');
    }
  };

  const handleShowOptions = () => {
    setShowOptions(true); 
  };

  const handleGoBack = () => {
    setShowOptions(false); 
  };

  const handleRescheduleSession = () => {
    setShowReschedule(true); // Show reschedule form
  };

  const handleClosePopup = () => {
    setShowSessions(false);
    setShowReschedule(false); // Close reschedule form
  };

  const isDayWithSession = (date) => {
    return sessions.some(session => {
      const sessionDate = new Date(session.session_time);
      return (
        sessionDate.getFullYear() === date.getFullYear() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getDate() === date.getDate()
      );
    });
  };

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const handleDayClick = (date) => {
    const sessionsForDay = sessions.filter(session => {
      const sessionDate = new Date(session.session_time);
      return (
        sessionDate.getFullYear() === date.getFullYear() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getDate() === date.getDate()
      );
    });
    const day = date.getDate();
    const ordinalSuffix = getOrdinalSuffix(day);
    const formattedDate = `${date.toLocaleDateString('en-US', { weekday: 'long' })}, ${date.toLocaleDateString('en-US', { month: 'long' })} ${day}${ordinalSuffix}`;
    setFormattedDate(formattedDate);
    setSelectedSessions(sessionsForDay);
    setShowSessions(true);
  };

  const handleDayToRescheduleToSelect = (event) => {
    const selected = new Date(event.target.value);
    setSelectedDayToRescheduleTo(selected);
  };

  const handleDaySelect = (event) => {
    const selected = new Date(event.target.value);
    setSelectedDay(selected); // Store the selected day
  
    // Filter sessions based on the selected day
    const filteredSessionsForDay = sessions.filter(session => {
      const sessionDate = new Date(session.session_time);
      return (
        sessionDate.getFullYear() === selected.getFullYear() &&
        sessionDate.getMonth() === selected.getMonth() &&
        sessionDate.getDate() === selected.getDate()
      );
    });
  
    setSelectedSessions(filteredSessionsForDay); // Update selected sessions based on the selected day
  };

  const handleDayToCancelSelect = (event) => {
    const selected = new Date(event.target.value);
    setSelectedDay(selected); // Set the selected day to cancel
  };

  const navigateToCancelForm = () => {
    setShowCancel(true); // Show cancel session form
    setShowOptions(false); // Hide options page
  };

  const submitCancelSession = async () => {
    if (!selectedDay || !cancelReason) {
      alert("Please select a day and provide a reason for cancellation.");
      return;
    }
  
    try {
      const parentData = await getParentById(user.uid); // Fetch parent data
      const sessionDateFormatted = new Date(selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      
      // Call the cloud function to send the email
      const sendCancelEmail = httpsCallable(functions, 'sendCancelEmail');
      const emailResponse = await sendCancelEmail({
        parentName: parentData.parent_name,
        sessionDate: sessionDateFormatted,  // For the email only, use a formatted string
        note: cancelReason
      });
  
      if (emailResponse.data.success) {
        console.log("Cancellation email sent successfully.");
  
        // Delete the session for the selected day (pass the actual Date object)
        await deleteSessionByDate(parentData.id, selectedDay);  // Pass selectedDay as Date
  
        alert("Session canceled successfully.");
        setShowCancel(false); // Hide cancel form and return to options
        setShowOptions(true);  // Show options page
      } else {
        alert("Error sending cancellation email: " + emailResponse.data.error);
      }
    } catch (error) {
      console.error("Error canceling session:", error);
      alert("Error canceling session. Please try again.");
    }
  };
  
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.session_time) - new Date(b.session_time));

  return (
    <div className="outer-container">
      <div className="main-container">
        {!showOptions && !showReschedule && !showCancel && (
          <>
            <h1>Hello, {parentName || 'Loading...'}!</h1>
            <p className="schedule-details">Below is your schedule, click on a shaded day to see session details.</p>
            <div className="calendar-container">
              <DatePicker
                inline
                highlightDates={sessions.map(session => new Date(session.session_time))}
                dayClassName={date => isDayWithSession(date) ? 'session-day' : undefined}
                onChange={handleDayClick}
              />
            </div>
            {showSessions && (
              <div className="session-popup">
                <button className="close-button" onClick={handleClosePopup}>x</button>
                <p>{formattedDate}</p>
                {selectedSessions.map((session, index) => (
                  <div key={session.id} className="session-info">
                    <p>Time: {session.session_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EST</p>
                    {index < selectedSessions.length - 1 && <hr className="session-separator" />}
                  </div>
                ))}
              </div>
            )}
            <div className="zoom-link">
              <a
                href="https://us04web.zoom.us/j/8821932666?pwd=c08ydWNqQld0VzFFRVJDcm1IcTBUdz09&omn=74404485715"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                Join Zoom Session
              </a>
              <p>Meeting ID: 882 193 2666 - Password: 689887</p>
            </div>
            <button className="cancel-reschedule-button" onClick={handleShowOptions}>
              Cancel/Reschedule
            </button>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </>
        )}
  
      {showOptions && !showReschedule && !showCancel && (
        <div className="options-container">
          <h2>Do you want to...</h2>
          <div className="options-buttons">
            <button className="option-button" onClick={navigateToCancelForm}>
              Cancel a session
            </button>
            <button className="option-button" onClick={handleRescheduleSession}>
              Reschedule a session
            </button>
          </div>
        <button className="back-button" onClick={handleGoBack}>Back</button>
        </div>
      )}
  
        {showReschedule && (
          <div className="reschedule-container">
            <h2 className="reschedule-title">Reschedule a Session</h2>
  
            {/* Select day of session */}
            <p className="select-date-title">Select day of session</p>
            <select className="session-dropdown" onChange={handleDaySelect}>
              <option value="">-- Select a Day --</option>
              {sortedSessions.map((session, index) => (
                <option key={index} value={session.session_time}>
                  {new Date(session.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </option>
              ))}
            </select>
  
            {/* Select session */}
            <p className="select-session">Select Session</p>
            <select className="session-dropdown">
              {selectedSessions.length > 0 ? (
                selectedSessions.map((session, index) => (
                  <option key={index} value={session.id}>
                    {`${session.child_name} at ${session.session_time.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}`}
                  </option>
                ))
              ) : (
                <option>No sessions available</option>
              )}
            </select>
  
            {/* Select day to reschedule to */}
            <p className="select-new-date">Select day to reschedule to</p>
            <select className="session-dropdown" onChange={handleDayToRescheduleToSelect}>
              <option value="">-- Select a Day --</option>
              {sortedSessions.map((session, index) => (
                <option key={index} value={session.session_time}>
                  {new Date(session.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </option>
              ))}
            </select>
  
            {/* Select time to reschedule to */}
            <p className="select-new-time">Select time to reschedule to</p>
            <select className="session-dropdown">
              <option value="">-- Select a Time --</option>
              {filteredSlots.length > 0 ? (
                filteredSlots.map((slot, index) => (
                  <option key={index} value={slot.time} disabled={slot.status === 'unavailable'}>
                    {slot.time} {slot.status === 'unavailable' ? '(Unavailable)' : ''}
                  </option>
                ))
              ) : (
                <option>No available slots</option>
              )}
            </select>
  
            <button className="back-button" onClick={handleClosePopup}>Back</button>
          </div>
        )}
  
        {showCancel && (
          <div className="cancel-container">
            <h2 className="cancel-title">Cancel a Session</h2>
  
            {/* Select day of session */}
            <p className="select-date-title">Select day of session</p>
            <select className="session-dropdown" onChange={handleDayToCancelSelect}>
              <option value="">-- Select a Day --</option>
              {sortedSessions.map((session, index) => (
                <option key={index} value={session.session_time}>
                  {new Date(session.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </option>
              ))}
            </select>
  
            {/* Textbox for cancellation reason */}
            <textarea
              className="cancel-reason-textbox"
              placeholder="Please provide a brief explanation of why you are canceling"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            ></textarea>
  
            {/* Cancel session button */}
            <button
              className="cancel-session-button"
              onClick={submitCancelSession}
              disabled={!selectedDay || !cancelReason} // Disable button if the day or reason is missing
            >Cancel Session </button>
  
            <button className="back-button" onClick={() => { setShowCancel(false); setShowOptions(true); }}>Back</button>
          </div>
        )}
      </div>
    </div>
  );

};

export default DashBoard;