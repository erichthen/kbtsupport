import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getParentById } from '../services/firestore';
import { getSessionsByParentId, generateTimeSlots, getAvailableSlots, filterAvailableSlots, deleteSessionByDate , deleteSessionById, addSession} from '../services/sessions';
import { useHistory, Link } from 'react-router-dom';
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
  const [selectedDay, setSelectedDay] = useState(null); 
  const [selectedDayToRescheduleTo, setSelectedDayToRescheduleTo] = useState(null);
  const [filteredSlots, setFilteredSlots] = useState([]); 
  const [showCancel, setShowCancel] = useState(false); 
  const [cancelReason, setCancelReason] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [loading, setLoading] = useState(false); 
  // eslint-disable-next-line
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCancelAllPopup, setShowCancelAllPopup] = useState(false); 
  const [showRescheduleAllForm, setShowRescheduleAllForm] = useState(false);
  const [selectedDayForAll, setSelectedDayForAll] = useState(null);
  const [selectedTimeSlotForAll, setSelectedTimeSlotForAll] = useState(null); 
  const [availableSlots, setAvailableSlots] = useState([]);
  const { user } = useAuth();
  const history = useHistory();

  const daysOfWeek = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
  };

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
    if (selectedDayToRescheduleTo !== null && !isNaN(new Date(selectedDayToRescheduleTo))) {
      console.log('Valid selectedDayToRescheduleTo:', selectedDayToRescheduleTo);
  
      const fetchSlots = async () => {
        try {
          const availableSlots = generateTimeSlots();
          const bookedSlotsArray = await getAvailableSlots();
  
          console.log('Booked Slots:', bookedSlotsArray);
  
          const filteredSlots = filterAvailableSlots(availableSlots, bookedSlotsArray, selectedDayToRescheduleTo);
  
          console.log('Filtered Slots:', filteredSlots);
  
          setFilteredSlots(filteredSlots);
        } catch (error) {
          console.error('Error fetching slots:', error);
        }
      };
  
      fetchSlots();
    }
  }, [selectedDayToRescheduleTo]);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const availableSlotsData = generateTimeSlots();
        const bookedSlotsArray = await getAvailableSlots();
        const filteredSlots = filterAvailableSlots(
          availableSlotsData,
          bookedSlotsArray,
          selectedDayForAll
        );
        setAvailableSlots(filteredSlots);
      } catch (error) {
        console.error("Error fetching slots:", error);
      }
    };
  
    if (selectedDayForAll) {
      fetchSlots();
    }
  }, [selectedDayForAll]);

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
    setShowRescheduleAllForm(false);
  };

  const showRescheduleSession = () => {
    setShowReschedule(true); 
  };

  const handleClosePopup = () => {
    setShowSessions(false);
    setShowReschedule(false); 
  };

  const handleCloseRescheduleAll = () => {
    setShowRescheduleAllForm(false);
    setShowOptions(true);
  }

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
    
    if (!isNaN(selected.getTime())) { 
      setSelectedDayToRescheduleTo(selected);
    } else {
      console.error('Invalid date selected:', selected);
    }
  };

  const handleDaySelect = (event) => {
    const selected = new Date(event.target.value);
    setSelectedDay(selected); 
  
    const filteredSessionsForDay = sessions.filter(session => {
      const sessionDate = new Date(session.session_time);
      return (
        sessionDate.getFullYear() === selected.getFullYear() &&
        sessionDate.getMonth() === selected.getMonth() &&
        sessionDate.getDate() === selected.getDate()
      );
    });
  
    setSelectedSessions(filteredSessionsForDay); 
  };

  const handleDayToCancelSelect = (event) => {
    const selected = new Date(event.target.value);
    setSelectedDay(selected); 
  };

  const handleShowRescheduleAllForm = () => {
    setShowRescheduleAllForm(true);
    setShowOptions(false);
  };

  const navigateToCancelForm = () => {
    setShowCancel(true); 
    setShowOptions(false); 
  };

  const submitCancelSession = async () => {
    if (!selectedDay || !cancelReason) {
      alert("Please select a day and provide a reason for cancelation.");
      return;
    }
  
    try {
      setLoading(true);
      const parentData = await getParentById(user.uid);
      const sessionDateFormatted = new Date(selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      
      const sendCancelEmail = httpsCallable(functions, 'sendCancelEmail');
      const emailResponse = await sendCancelEmail({
        parentName: parentData.parent_name,
        sessionDate: sessionDateFormatted,  
        note: cancelReason
      });
  
      if (emailResponse.data.success) {
        console.log("Cancelation email sent successfully.");
  
        await deleteSessionByDate(parentData.id, selectedDay);  
  
        alert("Session canceled successfully. Refresh to see changes.");
        setShowCancel(false); 
        setShowOptions(true);

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

  const getAllDaysForOneMonth = () => {
    const days = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 1);

    let currentDate = new Date(today); 

    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  const handleRescheduleSession = async () => {
    try {
      setLoading(true);
  
      if (!selectedDay || !selectedSessions.length || !selectedDayToRescheduleTo || !selectedTimeSlot) {
        alert("Please fill out all of the fields.");
        setLoading(false);
        return;
      }
  
      const selectedSession = selectedSessions[0];
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
  
      if (selectedTimeSlot.includes('PM') && hours !== 12) {
        hours += 12;
      } else if (selectedTimeSlot.includes('AM') && hours === 12) {
        hours = 0;
      }
  
      const rescheduleDate = new Date(selectedDayToRescheduleTo.setHours(hours, minutes, 0, 0));
      const sessionData = {
        session_time: rescheduleDate.toISOString(),
        child_name: selectedSession.child_name,
        parent_id: selectedSession.parent_id,
      };
  
      const newSessionId = await addSession(selectedSession.parent_id, sessionData);
      console.log(`Rescheduled session added successfully with ID: ${newSessionId}`);
  
      const parentData = await getParentById(user.uid);
  
      const sendRescheduleEmail = httpsCallable(functions, 'sendRescheduleEmail');
      const emailResponse = await sendRescheduleEmail({
        parentName: parentData.parent_name,
        oldSessionDate: new Date(selectedSession.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        oldTimeSlot: new Date(selectedSession.session_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        newSessionDate: rescheduleDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        newTimeSlot: selectedTimeSlot
      });
  
      if (emailResponse.data.success) {
        alert("Session rescheduled successfully. Refresh to see changes.");
        setShowReschedule(false);
      } else {
        alert("Error sending reschedule email: " + emailResponse.data.error);
      }
  
    } catch (error) {
      console.error("Error during rescheduling: ", error);
      alert("Error rescheduling the session.");
    } finally {
      setLoading(false);
    }
  };

  const openCancelAllPopup = () => {
    setShowCancelAllPopup(true); 
  };
  
  const closeCancelAllPopup = () => {
    setShowCancelAllPopup(false);
  };

  const cancelAllSessions = async () => {
    if (!user || !sessions.length) {
      alert('No sessions to cancel.');
    }
    setLoading(true);

    try {
      const parentData = await getParentById(user.uid);

      if (!parentData || !parentData.id) {
        alert('Error fetchign data');
        setLoading(false);
        return;
      }

      for (const session of sessions) {
        await deleteSessionById(session.id);
      }

      setSessions([]);

      const sendCancelAllSession = httpsCallable(functions, 'sendCancelAllSession');
      await sendCancelAllSession({user: parentName});

      alert('All sessions canceled and email sent successfully. Refresh to see changes.');
    }
    catch (error) {
      console.error('Error canceling all sessions: ', error);
      alert('Error canceling all sessions');
    }
    finally {
      setLoading(false);
      setShowCancelAllPopup(false);
    }
  };

  const handleRescheduleAllSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
  
      if (!selectedDayForAll || !selectedTimeSlotForAll) {
        alert("Please select a day and time.");
        setLoading(false);
        return;
      }
  

      const parentData = await getParentById(user.uid);
      if (!parentData || !parentData.id) {
        alert("Parent data not found.");
        setLoading(false);
        return;
      }

      for (const session of sessions) {
        await deleteSessionById(session.id);
      }
  
      let currentDate = new Date(selectedDayForAll);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 9, 0); 
  
      const timeParts = selectedTimeSlotForAll.split(':');
      let hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
  
      if (selectedTimeSlotForAll.includes('PM') && hours !== 12) {
        hours += 12;
      } else if (selectedTimeSlotForAll.includes('AM') && hours === 12) {
        hours = 0; 
      }
  
      while (currentDate <= endDate) {
        const sessionDate = new Date(currentDate);
        sessionDate.setHours(hours, minutes, 0, 0);

        await addSession(parentData.id, {
          child_name: parentData.child_name,
          session_time: sessionDate.toISOString(),
        });
        currentDate.setDate(currentDate.getDate() + 7); 
      }
  
      const sendRescheduleAllEmail = httpsCallable(functions, 'sendRescheduleAll');
      await sendRescheduleAllEmail({
        parentName: parentData.parent_name,
        rescheduledDay: selectedDayForAll.toLocaleDateString('en-US', { weekday: 'long' }),
        rescheduledTime: selectedTimeSlotForAll
      });
  
      alert("All sessions rescheduled successfully. Refresh to see changes.");
      setShowRescheduleAllForm(false);
      setShowOptions(true);
  
    } catch (error) {
      console.error("Error during rescheduling all sessions: ", error);
      alert("Error rescheduling the sessions.");
    } finally {
      setLoading(false);
    }
  };

  const getNextDayOfWeek = (dayOfWeek) => {
    const today = new Date();
    const resultDate = new Date(today);
  
    const daysUntilNext = (dayOfWeek + 7 - today.getDay()) % 7 || 7;
    resultDate.setDate(today.getDate() + daysUntilNext); 
  
    return resultDate;
  };
  
  return (
    <div className="outer-container">
      <div className="main-container">
        {!showOptions && !showReschedule && !showCancel && !showRescheduleAllForm && (
          <>
            <h1 className="greeting">Hello, {parentName || 'Loading...'}!</h1>
            <p className="schedule-details">Below is your schedule.<br />Click on a shaded day to see the time of your session.</p>
            <div className="calendar-container">
              <DatePicker
                inline
                highlightDates={sessions.map(session => new Date(session.session_time))}
                dayClassName={date => isDayWithSession(date) ? 'session-day' : undefined}
                onChange={handleDayClick}
              />
            </div>
            {showSessions && (
              <div className="modal-overlay">
                <div className="session-popup">
                  {selectedSessions.map((session, index) => (
                    <div key={session.id} className="session-info">
                      <p className="session-popup-date"><b>{formattedDate}</b></p>
                      <p>
                       <b>Time:</b> {session.session_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EST
                      </p>
                      {index < selectedSessions.length - 1 && <hr className="session-separator" />}
                    </div>
                  ))}
                  <button className="close-button" onClick={handleClosePopup}>Close</button>
                </div>
              </div>
            )}
            <div className="zoom-link">
              <a
                href="https://us04web.zoom.us/j/8821932666?pwd=c08ydWNqQld0VzFFRVJDcm1IcTBUdz09&omn=74404485715"
                target="_blank"
                rel="noopener noreferrer"
                className="zoom-link"
              >
                Zoom Link
              </a>
              <p className="zoom-info"><b>Meeting ID:</b>  882 193 2666<br /><b>Password:</b> 689887</p>
            </div>
            <button className="cancel-reschedule-button" onClick={handleShowOptions}>
              Cancel/Reschedule
            </button>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </>
        )}
  
        {showOptions && !showReschedule && !showCancel && !showRescheduleAllForm && (
          <div className="options-container">
            <h2 className="do-you-want">Do you want to...</h2>
            <div className="options-outer-container">
              <div className="inner-container1">
                <button className="option-button" onClick={navigateToCancelForm}>
                  Cancel a session
                </button>
                <button className="option-button" onClick={showRescheduleSession}>
                  Reschedule a session
                </button>
              </div>
              <div className="inner-container2">
                <button className="option-button" onClick={openCancelAllPopup}>
                  Cancel all sessions
                </button>
                <button className="option-button" onClick={handleShowRescheduleAllForm}>
                  Reschedule all sessions
                </button>
              </div>
            </div>
            <button className="options-back-button" onClick={handleGoBack}>Back</button>
          </div>
        )}
  
        {showCancelAllPopup && (
          <div className="cancel-all-popup">
            <div className="popup-content">
              <p><b>Are you sure you want to cancel all sessions? <br /><u>This action cannot be undone!</u></b></p>
              <button className="yes-button" onClick={cancelAllSessions} disabled={loading}>
                {loading ? "Processing..." : "Yes"}
              </button>
              <button className="no-button" onClick={closeCancelAllPopup}>No</button>
            </div>
          </div>
        )}
  
        {showReschedule && (
          <div className="reschedule-container">
            <h2 className="reschedule-title">Reschedule a Session</h2>
    
            <p className="select-date-title">Select day of session</p>
            <select className="session-dropdown" onChange={handleDaySelect}>
              <option value="">-- Select a Day --</option>
              {sortedSessions.map((session, index) => (
                <option key={index} value={session.session_time}>
                  {new Date(session.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </option>
              ))}
            </select>
    
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
    
            <p className="select-new-date">Select day to reschedule to (must be within one month)</p>
            <select className="session-dropdown" onChange={handleDayToRescheduleToSelect}>
              <option value="">-- Select a Day --</option>
              {getAllDaysForOneMonth().map((day, index) => (
                <option key={index} value={day.toISOString()}>
                  {getFormattedDate(new Date(day))}
                </option>
              ))}
            </select>
    
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
              disabled={loading} 
            >
              {loading ? 'Rescheduling...' : 'Reschedule Session'}
            </button>
            <button className="reschedule-back-button" onClick={handleClosePopup}>Back</button>
          </div>
        )}
  
        {showRescheduleAllForm && (
          <form onSubmit={handleRescheduleAllSubmit} className="reschedule-all-container">
            <h2 className="reschedule-all-title">Reschedule All Sessions</h2>
            <select
              className="session-dropdown"
              onChange={(e) => {
                const selectedDayName = e.target.value;
                const selectedDayNumber = daysOfWeek[selectedDayName];
                const selectedDate = getNextDayOfWeek(selectedDayNumber);
                setSelectedDayForAll(selectedDate);
              }}
              required
            >
              <option value="">Select the new day</option>
              {Object.keys(daysOfWeek).map((dayName) => (
                <option key={dayName} value={dayName}>
                  {dayName}
                </option>
              ))}
            </select>
            
            <select className="res-session-dropdown" onChange={(e) => setSelectedTimeSlotForAll(e.target.value)} required>
              <option value="">Select the new time</option>
              {availableSlots.map((slot, index) => (
                <option key={index} value={slot.time} disabled={slot.status === 'unavailable'}>
                  {slot.time} {slot.status === 'unavailable' ? '(Unavailable)' : ''}
                </option>
              ))}
            </select>
            
            <button type="submit" className="reschedule-all-button" disabled={loading}>
              {loading ? 'Rescheduling...' : 'Reschedule All Sessions'}
            </button>
            
            <button type="button" className="reschedule-all-back-button" onClick={handleCloseRescheduleAll}>Back</button>
          </form>
        )}
  
        {showCancel && (
          <div className="cancel-container">
            <h2 className="cancel-title">Cancel a Session</h2>
  
            <p className="cancel-select-date-title">Select day of session</p>
            <select className="session-dropdown" onChange={handleDayToCancelSelect}>
              <option value="">-- Select a Day --</option>
              {sortedSessions.map((session, index) => (
                <option key={index} value={session.session_time}>
                  {new Date(session.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </option>
              ))}
            </select>
  
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
              disabled={loading || !selectedDay || !cancelReason} 
            >
              {loading ? 'Canceling...' : 'Cancel Session'}
            </button>
  
            <button className="back-button" onClick={() => { setShowCancel(false); setShowOptions(true); }}>Back</button>
          </div>
        )}
      </div>
      {!showOptions && !showReschedule && !showCancel && !showRescheduleAllForm && (
        <Link to="/report-an-issue" className="report-issue-link">  
              Report an issue
        </Link>
      )}
    </div>
  );
};

export default DashBoard;