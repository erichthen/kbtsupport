import React, { useEffect, useState } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { sendSignInLink, logoutUser } from '../services/auth';
import DatePicker from 'react-datepicker';
import { getSessions, deleteSessionsByDate, deleteSessionById, addSession } from '../services/sessions';
import { getParentEmailById, getParentByDocumentId } from '../services/firestore';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import '../styles/admindash.css';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { generateTimeSlots, getAvailableSlots, filterAvailableSlots } from '../services/sessions';

const AdminDashboard = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // Store selected day
  const [filteredSlots, setFilteredSlots] = useState([]); // For storing available slots
  const [selectedDayToRescheduleTo, setSelectedDayToRescheduleTo] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [showCancel, setShowCancel] = useState(false);  // For showing/hiding the Cancel view
  const [showOptions, setShowOptions] = useState(false);  // For toggling between Reschedule/Cancel options
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false); // For showing/hiding the cancel confirmation popup
  const [loading, setLoading] = useState(false);

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
      if (!selectedDayToRescheduleTo) return; // Wait until a day is selected
  
      const availableSlots = generateTimeSlots(); // Generate all possible slots for the day
      const bookedSlotsArray = await getAvailableSlots(); // Get all booked sessions across all days
  
      // Filter the booked slots to only include those on the day to reschedule to
      const filteredBookedSlots = bookedSlotsArray.filter(slot => {
        const slotDate = new Date(slot);
        return (
          slotDate.getFullYear() === selectedDayToRescheduleTo.getFullYear() &&
          slotDate.getMonth() === selectedDayToRescheduleTo.getMonth() &&
          slotDate.getDate() === selectedDayToRescheduleTo.getDate()
        );
      });
  
      // Filter the available slots based on booked slots only for the "reschedule to" day
      const filteredSlots = filterAvailableSlots(availableSlots, filteredBookedSlots);
  
      setFilteredSlots(filteredSlots); // Set filtered slots for the dropdown
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

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.email !== 'kelli.b.then@gmail.com') {
    return <Redirect to="/" />;
  }

  const handleSendInvite = async () => {
    const actionCodeSettings = {
      url: 'http://localhost:3000/register',
      handleCodeInApp: true,
    };

    const message = 'Hello, you have been invited to register to the KBT Reading Support website! Click the below link to do so.';

    try {
      setLoading(true);
      await sendSignInLink(email, actionCodeSettings, message);
      alert('Registration link sent.');
      setShowInviteForm(false);
      setEmail('');
    } catch (error) {
      console.error();
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

      // Convert the session time to the local time zone (EST/EDT) and format it
      const formattedTime = sessionTime.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      return {
        ...session,
        formattedTime: `${formattedTime} EST`, // Append EST manually
        sessionTime: sessionTime
      };
    });

    formattedSessions.sort((a, b) => a.sessionTime - b.sessionTime)

    setSelectedSessions(formattedSessions);
    setSelectedDate(date);
    setShowSessions(true); // Replace outer-container content with sessions container
  };

  const handleClosePopup = () => {
    setSelectedSessions([]);
    setShowSessions(false); // Show calendar again
  };

  const handleCancelSessions = () => {
    setShowCancelConfirmation(true); // Show confirmation popup
  };

  const handleCloseCancelConfirmation = () => {
    setShowCancelConfirmation(false); // Close the popup without canceling
  };

  const confirmCancelSessions = async () => {
    if (selectedSessions.length === 0) {
      alert('No sessions selected');
      return;
    }

    try {
      // Get the date from the first session (since all sessions are from the same day)
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

      // After sending emails, delete the sessions
      await deleteSessionsByDate(sessionDate);

      alert('All cancelation emails sent and sessions deleted successfully.');
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
    setShowOptions(true); // Show Reschedule/Cancel options
  };

  const getFormattedDate = (date) => {
    const options = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleDaySelect = (event) => {
    const selected = new Date(event.target.value);
    setSelectedDay(selected); // Store selected day as a Date object
  };

  // Log session data and filter sessions based on selected day
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
    const filteredSlots = filterAvailableSlots(availableSlots, bookedSlots);
    setFilteredSlots(filteredSlots);
  };

  const handleRescheduleSession = async () => {
    try {
      // Check if required fields are filled
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
  
      // Ensure that selectedSession is an object with an id
      if (!selectedSession.id) {
        console.error("Selected session does not have an ID.");
        setLoading(false);
        return;
      }
  
      // Call deleteSessionById to delete the selected session
      await deleteSessionById(selectedSession.id);
      console.log(`Session for ${selectedSession.child_name} on ${selectedSession.session_time} deleted successfully.`);
  
      // Handle time conversion logic for PM and AM
      const timeParts = selectedTimeSlot.split(':');
      let hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
  
      // Check for PM and adjust the hour accordingly
      if (selectedTimeSlot.includes('PM') && hours !== 12) {
        hours += 12; // Convert 1:00 PM to 13:00
      } else if (selectedTimeSlot.includes('AM') && hours === 12) {
        hours = 0; // Handle 12 AM case
      }
  
      // Add the rescheduled session
      const sessionData = {
        session_time: new Date(selectedDayToRescheduleTo.setHours(hours, minutes, 0, 0)).toISOString(),
        child_name: selectedSession.child_name,
        parent_id: selectedSession.parent_id,
      };
  
      const newSessionId = await addSession(selectedSession.parent_id, sessionData);
      console.log(`Rescheduled session added successfully with ID: ${newSessionId}`);
  
      // Fetch parent's data using the parent_id (document ID)
      const parentData = await getParentByDocumentId(selectedSession.parent_id);
  
      if (!parentData) {
        console.log("Parent data or email not found.");
        setLoading(false);
        return;
      }
  
      // Call the cloud function to send the reschedule email to the parent
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
        alert("Session rescheduled and email sent successfully.");
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

  const submitCancelSession = async () => {

    if (!selectedDay || !selectedSession) {
      alert("Please select a day and session to cancel.");
      return;
    }
  
    try {
      setLoading(true);
      // Fetch parent's data using the parent_id (document ID) from the selected session
      const parentData = await getParentByDocumentId(selectedSession.parent_id);
      
      if (!parentData) {
        console.log("Parent data or email not found.");
        setLoading(false);
        return;
      }
  
      const sessionDateFormatted = new Date(selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  
      // Call the cloud function to send the cancelation email to the parent
      const sendAdminCancel = httpsCallable(functions, 'sendAdminCancel');
      const emailResponse = await sendAdminCancel({
        parentName: parentData.parent_name,
        parentEmail: parentData.email,
        sessionDate: sessionDateFormatted
      });
  
      if (emailResponse.data.success) {
        alert("cancelation email sent successfully.");
  
        // Delete the session for the selected day
        await deleteSessionById(selectedSession.id);
  
        alert("Session canceled successfully.");
        setShowCancel(false); // Hide cancel form and return to options
        setShowOptions(true);  // Show options page
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
      {!(showReschedule || showSessions || showCancel || showOptions) && <h1>Hello, Kelli!</h1>}
      <div className="outer-container">
        {showReschedule ? (
          <div className="reschedule-container">
            <h2 className="reschedule-title">Reschedule a Session</h2>
            <p className="select-date-title">Select day of session</p>
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
  
            <p className="select-session">Select Session</p>
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
  
            <p className="select-new-date">Select day to reschedule to</p>
            <select className="session-dropdown" onChange={handleDayToRescheduleToSelect}>
              <option value="">-- Select a Day --</option>
              {getAllWeekends().map((day, index) => (
                <option key={index} value={day.toISOString()}>
                  {getFormattedDate(new Date(day))}
                </option>
              ))}
            </select>
  
            <p className="select-new-time">Select time to reschedule to</p>
            <select className="session-dropdown" onChange={(e) => setSelectedTimeSlot(e.target.value)}>
              <option value="">-- Select a Time --</option>
              {filteredSlots.map((slot, index) => (
                <option key={index} value={slot.time} disabled={slot.status === 'unavailable'}>
                  {slot.time} {slot.status === 'unavailable' ? '(Unavailable)' : ''}
                </option>
              ))}
            </select>
  
            <button className="reschedule-session-button" onClick={handleRescheduleSession} disabled={loading}>
              {loading ? 'Rescheduling...' : 'Rescheudle Session'}
            </button>
  
            <button className="back-button" onClick={() => setShowReschedule(false)}>Back</button>
          </div>
        ) : showSessions ? (
          <div className="session-container">
            <h2 className="session-title">Sessions for {getFormattedDate(selectedDate)}</h2>
            <button className="close-button" onClick={handleClosePopup}>x</button>
            {selectedSessions.length > 0 ? (
              selectedSessions.map((session, index) => (
                <div key={session.id} className="session-info">
                  <p>Child's Name: {session.child_name}</p>
                  <p>Time: {session.session_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                </div>
              ))
            ) : (
              <p className="no-sessions">No sessions on this day!</p>
            )}
            <button className="cancel-sessions-button" onClick={handleCancelSessions}>Cancel Sessions</button>
          </div>
        ) : showCancel ? (
          <div className="cancel-container">
            <h2 className="cancel-title">Cancel a Session</h2>
            <p className="cancel-note">If you would like to cancel<br /> a day of sessions, you can do so<br/>by clicking the day on the calendar.</p>
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
            <div className="container">
              {!showInviteForm && (
                <button className="add-client-button" onClick={() => setShowInviteForm(true)}>Add Client</button>
              )}
              {showInviteForm && (
                <div className="input-group">
                  <input
                    className="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Client email"
                  />
                  <button className="send-button" onClick={handleSendInvite} disabled={loading}>
                    {loading ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              )}
              <button className="zoom-button" onClick={() => window.open("https://us04web.zoom.us/j/8821932666?pwd=c08ydWNqQld0VzFFRVJDcm1IcTBUdz09&omn=74404485715", "_blank", "noopener noreferrer")}>Join Zoom Call</button>
              <button className="invoices-button" onClick={handleInvoicesClick}>Invoices</button>
              <button
                className="reschedule-button"
                onClick={handleRescheduleClick}
              >
                Reschedule/Cancel a Session
              </button>
              <button className="logout-button" onClick={handleLogout}>Logout</button>
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
  
        {/* New Cancel Confirmation Popup */}
        {showCancelConfirmation && (
          <div className="cancel-confirmation-overlay">
            <div className="cancel-confirmation-popup">
              <p>Are you sure you want to cancel these sessions?</p>
              <div className="cancel-confirmation-buttons">
                <button className="sessions-confirm-button" onClick={confirmCancelSessions}>Yes</button>
                <button className="sessions-cancel-button" onClick={handleCloseCancelConfirmation}>No</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;