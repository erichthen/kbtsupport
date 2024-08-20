import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getParentById } from '../services/firestore';
import { getSessionsByParentId, generateTimeSlots, getAvailableSlots, filterAvailableSlots, deleteSessionByDate , deleteSessionById, addSession} from '../services/sessions';
import { useHistory, Redirect, Link } from 'react-router-dom';
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
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [loading, setLoading] = useState(false); // Add this state to manage button disable
  // eslint-disable-next-line
  const [selectedSession, setSelectedSession] = useState(null);
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
    // Check if selectedDayToRescheduleTo is valid before proceeding
    if (selectedDayToRescheduleTo && !isNaN(new Date(selectedDayToRescheduleTo))) {
      console.log('Valid selectedDayToRescheduleTo:', selectedDayToRescheduleTo);
  
      const fetchSlots = async () => {
        try {
          const availableSlots = generateTimeSlots();
          const bookedSlotsArray = await getAvailableSlots();
  
          // Log bookedSlotsArray to check its content
          console.log('Booked Slots:', bookedSlotsArray);
  
          // Call filterAvailableSlots and pass selectedDayToRescheduleTo
          const filteredSlots = filterAvailableSlots(availableSlots, bookedSlotsArray, selectedDayToRescheduleTo);
  
          // Log the filtered slots
          console.log('Filtered Slots:', filteredSlots);
  
          setFilteredSlots(filteredSlots);
        } catch (error) {
          console.error('Error fetching slots:', error);
        }
      };
  
      fetchSlots();
    } else {
      console.warn('Invalid or undefined selectedDayToRescheduleTo:', selectedDayToRescheduleTo);
    }
  }, [selectedDayToRescheduleTo]);

  if (!user) {
    return <Redirect to="/login" />;
  }

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

  const showRescheduleSession = () => {
    setShowReschedule(true); // Show reschedule form
  };

  const handleClosePopup = () => {
    setShowSessions(false);
    setShowReschedule(false); // Close reschedule form
  };

  const getFormattedDate = (date) => {
    const options = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
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
    
    if (!isNaN(selected.getTime())) { // Ensure it's a valid date
      setSelectedDayToRescheduleTo(selected);
    } else {
      console.error('Invalid date selected:', selected);
    }
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
      alert("Please select a day and provide a reason for cancelation.");
      return;
    }
  
    try {
      setLoading(true);
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
        console.log("Cancelation email sent successfully.");
  
        // Delete the session for the selected day (pass the actual Date object)
        await deleteSessionByDate(parentData.id, selectedDay);  // Pass selectedDay as Date
  
        alert("Session canceled successfully.");
        setShowCancel(false); // Hide cancel form and return to options
        setShowOptions(true);  // Show options page
      } else {
        alert("Error sending cancelation email: " + emailResponse.data.error);
      }
    } catch (error) {
      console.error("Error canceling session:", error);
      alert("Error canceling session. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.session_time) - new Date(b.session_time));

  const getAllWeekends = () => {
    const weekends = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 3); // Two months from now
  
    let currentDate = new Date(today);
  
    while (currentDate <= endDate) {
      const day = currentDate.getDay();
      if (day === 6 || day === 0) { // Saturday (6) or Sunday (0)
        weekends.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return weekends;
  };

  const handleRescheduleSession = async () => {
    try {
      setLoading(true); // Disable button while loading
  
      // Ensure that all required fields are filled
      if (!selectedDay || !selectedSessions.length || !selectedDayToRescheduleTo || !selectedTimeSlot) {
        alert("Please fill out all of the fields.");
        setLoading(false);
        return;
      }
  
      // Get the session to be deleted (first session in the selectedSessions array)
      const selectedSession = selectedSessions[0];
      if (!selectedSession.id) {
        console.error("Selected session does not have an ID.");
        setLoading(false);
        return;
      }
  
      // Delete the selected session by its ID
      await deleteSessionById(selectedSession.id);
      console.log(`Session for ${selectedSession.child_name} on ${selectedSession.session_time} deleted successfully.`);
  
      // Handle time conversion logic for PM and AM
      const timeParts = selectedTimeSlot.split(':');
      let hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
  
      // Adjust the hour for PM cases
      if (selectedTimeSlot.includes('PM') && hours !== 12) {
        hours += 12; // Convert 1:00 PM to 13:00
      } else if (selectedTimeSlot.includes('AM') && hours === 12) {
        hours = 0; // Handle 12 AM case
      }
  
      // Add the rescheduled session
      const rescheduleDate = new Date(selectedDayToRescheduleTo.setHours(hours, minutes, 0, 0));
      const sessionData = {
        session_time: rescheduleDate.toISOString(),
        child_name: selectedSession.child_name,
        parent_id: selectedSession.parent_id,
      };
  
      // Call addSession to add the new rescheduled session
      const newSessionId = await addSession(selectedSession.parent_id, sessionData);
      console.log(`Rescheduled session added successfully with ID: ${newSessionId}`);
  
      // Fetch parent data for the email
      const parentData = await getParentById(user.uid);
  
      // Call the cloud function to send the reschedule email
      const sendRescheduleEmail = httpsCallable(functions, 'sendRescheduleEmail');
      const emailResponse = await sendRescheduleEmail({
        parentName: parentData.parent_name,
        oldSessionDate: new Date(selectedSession.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        oldTimeSlot: new Date(selectedSession.session_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        newSessionDate: rescheduleDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }), // Use the correct date format
        newTimeSlot: selectedTimeSlot
      });
  
      if (emailResponse.data.success) {
        alert("Session rescheduled successfully.");
        setShowReschedule(false); // Hide reschedule form
        setShowOptions(true); // Go back to options container
      } else {
        alert("Error sending reschedule email: " + emailResponse.data.error);
      }
  
    } catch (error) {
      console.error("Error during rescheduling: ", error);
      alert("Error rescheduling the session.");
    } finally {
      setLoading(false); // Enable button after operation is complete
    }
  };

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
              <button className="option-button" onClick={showRescheduleSession}>
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
            <select className="session-dropdown" onChange={(e) => setSelectedSession(e.target.value)}>
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
              {getAllWeekends().map((day, index) => (
                <option key={index} value={day.toISOString()}>
                  {getFormattedDate(new Date(day))}
                </option>
              ))}
            </select>
  
            {/* Select time to reschedule to */}
            <p className="select-new-time">Select time to reschedule to</p>
            <select className="session-dropdown" onChange={(e) => setSelectedTimeSlot(e.target.value)}>
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
            <p>An email will be sent to kelli.b.then@gmail.com</p>
            <button 
              className="reschedule-button" onClick={handleRescheduleSession}
              disabled={loading} // Disable the button while the operation is in progress
            >
              {loading ? 'Rescheduling...' : 'Reschedule Session'}
            </button>
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
            <p>An email will be sent to kelli.b.then@gmail.com</p>
            <button
              className="cancel-session-button"
              onClick={submitCancelSession}
              disabled={loading || !selectedDay || !cancelReason} // Disable button if the day or reason is missing
            >
              {loading ? 'Canceling...' : 'Cancel Session'}
            </button>
  
            <button className="back-button" onClick={() => { setShowCancel(false); setShowOptions(true); }}>Back</button>
          </div>
        )}
        <Link to="/report-an-issue" className="report-issue-link">
          Report an issue
        </Link>
      </div>
    </div>
  );

};

export default DashBoard;