import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { sendSignInLink, logoutUser } from '../services/auth';
import DatePicker from 'react-datepicker';
import { deleteSessionsNotRaffaele } from '../services/sessions';
import { getSessions, deleteSessionsByDate, deleteSessionById, addSession } from '../services/sessions';
import { getParentEmailById, getParentByDocumentId } from '../services/firestore';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import '../styles/admindash.css';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { generateTimeSlots, getAvailableSlots, filterAvailableSlots } from '../services/sessions';

const AdminDashboard = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [selectedDayToRescheduleTo, setSelectedDayToRescheduleTo] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [showCancel, setShowCancel] = useState(false);  
  const [showOptions, setShowOptions] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.body.classList.add('admin-dashboard');
    return () => {
      document.body.classList.remove('admin-dashboard');
    };
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      const sessionsData = await getSessions();
      const formattedSessions = sessionsData.map(session => ({
        ...session,
        session_time: new Date(session.session_time)
      }));
      setSessions(formattedSessions);
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    const fetchSlotsForRescheduleToDay = async () => {
      if (!selectedDayToRescheduleTo || isNaN(selectedDayToRescheduleTo.getTime())) {
        return;
      }
  
      const availableSlots = generateTimeSlots(); 
      const bookedSlotsArray = await getAvailableSlots();
  
      const filteredBookedSlots = bookedSlotsArray.filter(slot => {
        const slotDate = new Date(slot);
        return (
          slotDate.getFullYear() === selectedDayToRescheduleTo.getFullYear() &&
          slotDate.getMonth() === selectedDayToRescheduleTo.getMonth() &&
          slotDate.getDate() === selectedDayToRescheduleTo.getDate()
        );
      });
  
      const filteredSlots = filterAvailableSlots(availableSlots, filteredBookedSlots, selectedDayToRescheduleTo);
  
      setFilteredSlots(filteredSlots); 
    };
  
    fetchSlotsForRescheduleToDay();
  }, [selectedDayToRescheduleTo]);

  const handleInvoicesClick = () => {
    history.push('/admin/invoices');
  };

  const handleLogout = async () => {
    await logoutUser();
    history.push('/login');
  };

  //DONT FORGET TO UPDATE WHEN SWITCHING
  const handleSendInvite = async (e) => {
    e.preventDefault(); 
    const actionCodeSettings = {
      // url: 'https://kbt-reading-support.web.app/register',
      url: 'http://localhost:3000/register',
      handleCodeInApp: true,
    };
    
    try {
      setLoading(true);
      await sendSignInLink(email, actionCodeSettings);
      setSuccessMessage('Registration email sent successfully.');
      setEmail('');
    } catch (error) {
      setError(error);
      console.error('Error sending sign-in link:', error);
      alert('Error sending registration link.');
    }
    finally {
      setLoading(false);
    }
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

  const handleDayClick = (date) => {
    const sessionsForDay = sessions.filter(session => {
      const sessionDate = new Date(session.session_time);
      return (
        sessionDate.getFullYear() === date.getFullYear() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getDate() === date.getDate()
      );
    });
  
    const formattedSessions = sessionsForDay.map(session => {
      const sessionTime = new Date(session.session_time);
  
      // Set the time explicitly in EST, regardless of the user's local timezone
      const formattedTime = sessionTime.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
  
      return {
        ...session,
        formattedTime: `${formattedTime} EST`, 
        sessionTime: sessionTime
      };
    });
  
    formattedSessions.sort((a, b) => a.sessionTime - b.sessionTime);
  
    setSelectedSessions(formattedSessions);
    setSelectedDate(date);
    setShowSessions(true); 
  };

  const handleClosePopup = () => {
    setSelectedSessions([]);
    setShowSessions(false); 
  };

  const handleCancelSessions = () => {
    setShowCancelConfirmation(true);
  };

  const handleCloseCancelConfirmation = () => {
    setShowCancelConfirmation(false); 
  };

  const confirmCancelSessions = async () => {
    if (selectedSessions.length === 0) {
      alert('No sessions selected');
      return;
    }

    try {
      
      const sessionDate = new Date(selectedSessions[0].session_time);

      for (const session of selectedSessions) {
        const parentId = session.parent_id;
        const sessionTime = new Date(session.session_time).toLocaleString();

        const parentEmail = await getParentEmailById(parentId);

        const message = `
          Dear Parent,<br>
          Your child's session on ${sessionTime} has been canceled. We apologize for any inconvenience this may cause.<br>
          Best Regards,<br>
          KBT Reading Support
        `;

        const response = await axios.post('https://us-central1-kbt-reading-support.cloudfunctions.net/sendCancelationEmails', {
          email: parentEmail,
          subject: 'Session Cancelation Notification',
          message: message
        });
        console.log(response.data.message || 'Cancelation email sent successfully.');
      }

      await deleteSessionsByDate(sessionDate);

      alert('All cancelation emails sent and sessions deleted successfully. Refresh to see changes.');
      setSelectedSessions([]);
      setShowSessions(false);
      setShowCancelConfirmation(false); 

    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
      alert('Error sending cancelation emails or deleting sessions.');
    }
  };

  const handleRescheduleClick = () => {
    setShowCancel(false);
    setShowReschedule(false);
    setShowOptions(true); 
  };

  const getFormattedDate = (date) => {
    const options = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleSendEmailClick = () => {
    history.push('/admin/send-email');
  };

  const handleDaySelect = (event) => {
    const selected = new Date(event.target.value);
    setSelectedDay(selected); 
  };

  const sessionsForSelectedDay = selectedDay
    ? sessions.filter(session => {
        const sessionDate = new Date(session.session_time);
        return (
          sessionDate.getFullYear() === selectedDay.getFullYear() &&
          sessionDate.getMonth() === selectedDay.getMonth() &&
          sessionDate.getDate() === selectedDay.getDate()
        );
      })
    : [];

    const handleDayToRescheduleToSelect = async (event) => {
      const selected = new Date(event.target.value);
      setSelectedDayToRescheduleTo(selected); 
    
      const availableSlots = generateTimeSlots();
    
      const bookedSlots = await getAvailableSlots();
    
      const filteredSlots = filterAvailableSlots(availableSlots, bookedSlots, selected); 
    
      setFilteredSlots(filteredSlots);
    };

  const handleRescheduleSession = async () => {
    try {

      setLoading(true);
      console.log("Selected Day:", selectedDay);
      console.log("Selected Session:", selectedSession);
      console.log("Selected Day to Reschedule To:", selectedDayToRescheduleTo);
      console.log("Selected Time Slot:", selectedTimeSlot);
  
      if (!selectedDay || !selectedSession || !selectedDayToRescheduleTo || !selectedTimeSlot) {
        alert("Please fill out all of the fields.");
        setLoading(false);
        return;
      }
  
      if (!selectedSession.id) {
        console.error("Selected session does not have an ID.");
        setLoading(false);
        return;
      }
  
      await deleteSessionById(selectedSession.id);
      console.log(`Session for ${selectedSession.child_name} on ${selectedSession.session_time} deleted successfully.`);
  
      const timeParts = selectedTimeSlot.split(':');
      let hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      //handle am, pm, bc it was reading as 1:00am when it should have been pm
      if (selectedTimeSlot.includes('PM') && hours !== 12) {
        hours += 12;
      } else if (selectedTimeSlot.includes('AM') && hours === 12) {
        hours = 0; 
      }
  
      const sessionData = {
        session_time: new Date(selectedDayToRescheduleTo.setHours(hours, minutes, 0, 0)).toISOString(),
        child_name: selectedSession.child_name,
        parent_id: selectedSession.parent_id,
      };
  
      const newSessionId = await addSession(selectedSession.parent_id, sessionData);
      console.log(`Rescheduled session added successfully with ID: ${newSessionId}`);
  
      const parentData = await getParentByDocumentId(selectedSession.parent_id);
  
      if (!parentData) {
        console.log("Parent data or email not found.");
        setLoading(false);
        return;
      }
  
      const sendAdminRescheduleEmail = httpsCallable(functions, 'sendAdminReschedule');
      const emailResponse = await sendAdminRescheduleEmail({
        parentEmail: parentData.email,
        parentName: parentData.parent_name,
        oldSessionDate: new Date(selectedSession.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        oldTimeSlot: new Date(selectedSession.session_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        newSessionDate: new Date(sessionData.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        newTimeSlot: selectedTimeSlot
      });
  
      if (emailResponse.data.success) {
        console.log("Reschedule email sent to parent successfully.");
        alert("Session rescheduled and email sent successfully. Refresh to see changes.");
      } else {
        alert("Error sending reschedule email: " + emailResponse.data.error);
      }
  
    } catch (error) {
      console.error("Error during rescheduling:", error);
      alert("Error rescheduling the session.");
    } finally {
      setLoading(false)
    }
  };

  const handleDeleteSessionsNotRaffaele = async () => {
    try {
      setLoading(true); // Optional: Show loading indicator
      await deleteSessionsNotRaffaele();
      alert("Sessions not associated with 'Raffaele' have been deleted successfully.");
    } catch (error) {
      console.error("Error deleting sessions:", error);
      alert("Failed to delete sessions. Please try again.");
    } finally {
      setLoading(false); // Optional: Hide loading indicator
    }
  };


  const getAllDaysForNextThreeMonths = () => {
    const days = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 3);
  
    let currentDate = new Date(today);
  
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return days;
  };

  const submitCancelSession = async () => {

    if (!selectedDay || !selectedSession) {
      alert("Please select a day and session to cancel.");
      return;
    }
  
    try {
      setLoading(true);
      const parentData = await getParentByDocumentId(selectedSession.parent_id);
      
      if (!parentData) {
        console.log("Parent data or email not found.");
        setLoading(false);
        return;
      }
  
      const sessionDateFormatted = new Date(selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  
      const sendAdminCancel = httpsCallable(functions, 'sendAdminCancel');
      const emailResponse = await sendAdminCancel({
        parentName: parentData.parent_name,
        parentEmail: parentData.email,
        sessionDate: sessionDateFormatted
      });
  
      if (emailResponse.data.success) {
        alert("Cancelation email sent successfully.");
  
        await deleteSessionById(selectedSession.id);
  
        alert("Session canceled successfully. Refresh to see changes.");
        setShowCancel(false); 
        setShowOptions(true); 
      } else {
        alert("Error sending cancelation email: " + emailResponse.data.error);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error canceling session:", error);
      alert("Error canceling session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <button onClick={handleDeleteSessionsNotRaffaele} className="delete-sessions-button">
        Delete Non-Raffaele Sessions
      </button>
      {!(showReschedule || showSessions || showCancel || showOptions || showInviteForm) && <h1 className="greeting">Hello, Kelli!</h1>}
      <div className="wrapper">
        {showReschedule ? (
          <div className="reschedule-container">
              <h2 className="reschedule-title">Reschedule a Session</h2>
            <select className="session-dropdown" onChange={handleDaySelect}>
                <option value="">-- Select a Day --</option>
                {sessions
                  .sort((a, b) => new Date(a.session_time) - new Date(b.session_time))
                  .map((session, index) => (
                    <option key={index} value={session.session_time}>
                      {getFormattedDate(new Date(session.session_time))}
                    </option>
                  ))}
              </select>
            <select className="session-dropdown" onChange={(e) => {
              const sessionId = e.target.value;
              const session = sessionsForSelectedDay.find(s => s.id === sessionId);
              setSelectedSession(session); 
            }}>
              <option value="">-- Select a Session --</option>
              {sessionsForSelectedDay.length > 0 ? (
                sessionsForSelectedDay.map((session, index) => (
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
  
            <select className="session-dropdown" onChange={handleDayToRescheduleToSelect}>
              <option className="day-select" value="">-- Select a Day --</option>
              {getAllDaysForNextThreeMonths().map((day, index) => (
                <option key={index} value={day.toISOString()}>
                  {getFormattedDate(new Date(day))}
                </option>
              ))}
            </select>
  
            <select className="session-dropdown" onChange={(e) => setSelectedTimeSlot(e.target.value)}>
              <option value="">-- Select a Time --</option>
              {filteredSlots.map((slot, index) => (
                <option key={index} value={slot.time} disabled={slot.status === 'unavailable'}>
                  {slot.time} {slot.status === 'unavailable' ? '(Unavailable)' : ''}
                </option>
              ))}
            </select>
            <p>An email will be sent to the parent</p>
            <button className="reschedule-session-button" onClick={handleRescheduleSession} disabled={loading}>
              {loading ? 'Rescheduling...' : 'Reschedule Session'}
            </button>
            <button className="reschedule-back-button" onClick={() => setShowReschedule(false)}>Back</button>
          </div>
        ) : showSessions ? (
          <div className="session-container">
            <h2 className="session-title">Sessions for {getFormattedDate(selectedDate)}</h2>
            {selectedSessions.length > 0 ? (
              selectedSessions.map((session, index) => (
                <div key={session.id} className="session-info">
                  <p>{session.child_name}</p>
                  <p>{session.session_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                </div>
              ))
            ) : (
              <p className="no-sessions">No sessions!</p>
            )}
            {selectedSessions.length > 0 && (
              <button className="cancel-sessions-button" onClick={handleCancelSessions}>Cancel Sessions</button>
            )}
            <button className="sessionsforday-back-button" onClick={handleClosePopup}>Back</button>
          </div>
        ) : showCancel ? (
          <div className="cancel-container">
            <h2 className="cancel-title">Cancel a Session</h2>
            <p className="cancel-note">If you would like to cancel<br /> <strong>a day of sessions,</strong> <br />you can do so<br/>by clicking the day <br />on the calendar.</p>
            <select className="cancel-session-dropdown" onChange={handleDaySelect}>
              <option value="">-- Select a Day --</option>
              {sessions
                .sort((a, b) => new Date(a.session_time) - new Date(b.session_time))
                .map((session, index) => (
                  <option key={index} value={session.session_time}>
                    {getFormattedDate(new Date(session.session_time))}
                  </option>
                ))}
            </select>
            <select className="cancel-session-dropdown" onChange={(e) => {
              const sessionId = e.target.value;
              const session = sessionsForSelectedDay.find(s => s.id === sessionId);
              setSelectedSession(session); 
            }}>
              <option value="">-- Select a Session --</option>
              {sessionsForSelectedDay.length > 0 ? (
                sessionsForSelectedDay.map((session, index) => (
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
            <p>An email will be sent to the parent</p>
            <div className="cancel-session-buttons">
              <button className="cancel-button" onClick={submitCancelSession} disabled={loading}>
                {loading ? 'Canceling...' : 'Cancel Selected Session'}
              </button>
              <button className="cancel-back-button" onClick={() => setShowCancel(false)}>Back</button>
            </div>
          </div>
        ) : showOptions ? (
          <div className="options-container">
            <h2>Do you want to...</h2>
            <div className="options-buttons">
              <button 
                className="reschedule-option-button" 
                onClick={() => {
                  setShowReschedule(true);
                  setShowOptions(false);
                }}
              >
                Reschedule
              </button>
              <button 
                className="cancel-option-button" 
                onClick={() => {
                  setShowCancel(true);
                  setShowOptions(false);
                }}
              >
                Cancel
              </button>
            </div>
  
            <button className="options-back-button" onClick={() => setShowOptions(false)}>Back</button>
          </div>
      ) : (
          <>
            {showInviteForm ? (
              <div>
              <h2 className="add-client-title">Add A Client</h2>
              <div className="add-client-container">
                <form className="add-client-form" onSubmit={handleSendInvite}>
                  <input 
                    className="client-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSuccessMessage('');
                    }}
                    placeholder="Parent email"
                    required
                  />
                  <div className={`success-message ${successMessage ? 'visible' : ''}`}>
                    {successMessage}
                  </div>
                  {error && <div className="error">{error}</div>}
                  <button className="send-button" type="submit" disabled={loading || email === ''}>
                    {loading ? 'Sending...' : 'Send Registration Form'}
                  </button>
                </form>
                <button className="addclient-back-button" onClick={() => {
                  setShowInviteForm(false);
                  setEmail(''); 
                  setError(''); 
                  setSuccessMessage(''); 
                }}>
                  Back
                </button>
                </div>
              </div>
            ) : (
              <>
                <div className="container">
                  <button className="add-client-button" onClick={() => setShowInviteForm(true)}>
                    Add Client
                  </button>
                  <button className="zoom-button" onClick={() => window.open("https://us04web.zoom.us/j/8821932666?pwd=c08ydWNqQld0VzFFRVJDcm1IcTBUdz09&omn=74404485715", "_blank", "noopener noreferrer")}>Join Zoom Meeting</button>
                  <button className="invoices-button" onClick={handleInvoicesClick}>Invoices</button>
                  <button
                    className="reschedule-button"
                    onClick={handleRescheduleClick}
                  >
                    Reschedule/Cancel a Session
                  </button>
                  <button className="send-email-button" onClick={handleSendEmailClick}>Send Email(s)</button>
                </div>
                <div className="calendar-container">
                  <DatePicker
                    inline
                    highlightDates={sessions.map(session => new Date(session.session_time))}
                    dayClassName={date => isDayWithSession(date) ? 'session-day' : undefined}
                    onChange={handleDayClick}
                  />
                </div>
              </>
            )}  
          </>
        )}

        {showCancelConfirmation && (
              <div className="cancel-confirmation-overlay">
                <div className="cancel-confirmation-popup">
                  <p>Are you sure you want to cancel these sessions? <br /> An email will be sent to the parent</p>
                  <div className="cancel-confirmation-buttons">
                    <button className="sessions-confirm-button" onClick={confirmCancelSessions}>Yes</button>
                    <button className="sessions-cancel-button" onClick={handleCloseCancelConfirmation}>No</button>
                  </div>
                </div>
              </div>
        )}
        </div>
        {!(showReschedule || showSessions || showCancel || showOptions || showInviteForm) && <button className="logout-button" onClick={handleLogout}>Logout</button>}
      </div>
  );
};

  

  export default AdminDashboard;