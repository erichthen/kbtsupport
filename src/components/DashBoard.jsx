import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getParentById } from '../services/firestore';
import { getSessionsByParentId, generateTimeSlots, getAvailableSlots, filterAvailableSlots, deleteSessionByDate , deleteSessionById, addSession} from '../services/sessions';
import { useHistory, Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';
import { logoutUser } from '../services/auth';
import DatePicker from 'react-datepicker';
import moment from 'moment-timezone';
import { Helmet } from 'react-helmet';
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
  const [selectedDayToCancel, setSelectedDayToCancel] = useState(null); 
  const [selectedDayToRescheduleTo, setSelectedDayToRescheduleTo] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); 
  const [filteredSlots, setFilteredSlots] = useState([]); 
  const [showCancel, setShowCancel] = useState(false); 
  const [cancelReason, setCancelReason] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [loading, setLoading] = useState(false); 
  // eslint-disable-next-line
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCancelAllPopup, setShowCancelAllPopup] = useState(false); 
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [showReschedulePopup, setShowReschedulePopup] = useState(false);
  const [showRescheduleAllPopup, setShowRescheduleAllPopup] = useState(false);
  const [showRescheduleAllForm, setShowRescheduleAllForm] = useState(false);
  const [selectedDayForAll, setSelectedDayForAll] = useState(null);
  const [selectedTimeSlotForAll, setSelectedTimeSlotForAll] = useState(null); 
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showZoom, setShowZoom] = useState(false);
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

  document.addEventListener("DOMContentLoaded", function() {
    document.querySelector('.user-dashboard .outer-container').classList.add('is-visible');
  });

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
    setShowOptions(false);
  };

  const handleClosePopup = () => {
    setShowSessions(false);
    setShowReschedule(false); 
  };

  const handleCloseRescheduleAll = () => {
    setShowRescheduleAllForm(false);
    setShowOptions(true);
  }

  const handleGoBackFromReschedule = () => {
    setShowReschedule(false);
    setShowOptions(true);
    setSelectedDay(null);
    setSelectedSessions([]);
    setSelectedDayToRescheduleTo(null);
    setFilteredSlots([]);
    setSelectedTimeSlot(null);
    setFormattedDate('');
  }

  const handleGoBackFromCancel = () => {
    setShowCancel(false);
    setShowOptions(true);
    setSelectedDay(null);
    setSelectedSessions([]);
    setSelectedDayToRescheduleTo(null);
    setFilteredSlots([]);
    setSelectedTimeSlot(null);
    setFormattedDate('');
    setCancelReason('');
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

  const handleDayToCancelSelect = (event) => {

    const date = new Date(event.target.value);
    console.log(date);
    setSelectedDayToCancel(date);

    // format the date for the message that will pop up 
    // when user selects a day that they will cancel
    const formatted = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
    setFormattedDate(formatted);

    // fetch the session for that day by filtering the sessions array we populated 
    // based on the parent id
    const sessionsForDay = sessions.filter(session => 
      new Date(session.session_time).toDateString() === date.toDateString()
    );
    setSelectedSessions(sessionsForDay);
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

  const handleShowRescheduleAllForm = () => {
    setShowRescheduleAllForm(true);
    setShowOptions(false);
  };

  const navigateToCancelForm = () => {
    setShowCancel(true); 
    setShowOptions(false); 
  };

  const submitCancelSession = async () => {
    if (!selectedDayToCancel || !cancelReason) {
      alert("Please select a day and provide a reason for cancelation.");
      return;
    }
  
    try {
      setLoading(true);
      const parentData = await getParentById(user.uid);
      const sessionDateFormatted = new Date(selectedDayToCancel).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric' 
        });
      
      const sendCancelEmail = httpsCallable(functions, 'sendCancelEmail');
      const emailResponse = await sendCancelEmail({
        parentName: parentData.parent_name,
        sessionDate: sessionDateFormatted,  
        note: cancelReason
      });
  
      if (emailResponse.data.success) {
        console.log("Cancelation email sent successfully.");
  
        await deleteSessionByDate(parentData.id, selectedDayToCancel);  
  
        alert("Session canceled successfully. Refresh to see changes.");
        setShowCancel(false); 
        setShowOptions(true);

      } else {
        alert("Error sending cancelation email: " + emailResponse.data.error);
      }
    } catch (error) {
      console.error("Error canceling session:", error);
      alert("Error canceling session. Please try again, and report an issue if it persists.");
    } finally {
      setShowCancelPopup(false);
      setLoading(false);
    }
  };
  
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.session_time) - new Date(b.session_time));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingSessions = sortedSessions.filter((session) => {
    const sessionDate = new Date(session.session_time);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate >= today;
  });

  const getAllDaysForThreeMonths = () => {
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
  }

  const handleRescheduleSession = async () => {
    try {
      setLoading(true);
  
      if (!selectedDayToRescheduleTo || !selectedSessions.length || !selectedDayToRescheduleTo || !selectedTimeSlot) {
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
  
      // Set the reschedule time in EST and convert to UTC
      const rescheduleDateEST = moment.tz(selectedDayToRescheduleTo, 'America/New_York').set({
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0,
      });
      const rescheduleDateUTC = rescheduleDateEST.utc();
  
      const sessionData = {
        session_time: rescheduleDateUTC.toISOString(),
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
        newSessionDate: rescheduleDateEST.format('MMMM D'), // Keep it in EST for readability
        newTimeSlot: selectedTimeSlot,
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
  
      // Delete all existing sessions
      for (const session of sessions) {
        await deleteSessionById(session.id);
      }
  
      // Reschedule all sessions to the new day and time in EST
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
        const sessionDateEST = moment.tz(currentDate, 'America/New_York').set({
          hour: hours,
          minute: minutes,
          second: 0,
          millisecond: 0,
        });
        const sessionDateUTC = sessionDateEST.utc();
  
        await addSession(parentData.id, {
          child_name: parentData.child_name,
          session_time: sessionDateUTC.toISOString(),
        });
        currentDate.setDate(currentDate.getDate() + 7); // Weekly recurrence
      }
  
      const sendRescheduleAllEmail = httpsCallable(functions, 'sendRescheduleAll');
      await sendRescheduleAllEmail({
        parentName: parentData.parent_name,
        rescheduledDay: selectedDayForAll.toLocaleDateString('en-US', { weekday: 'long' }),
        rescheduledTime: selectedTimeSlotForAll,
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
    <>
      <Helmet>
        <title>KBT - User Dashboard</title>
      </Helmet>
      <body>
        <header>
          <h1>KBT Reading Support</h1>
          <nav>
            <button
              className="cancel-reschedule-button nav-button"
              onClick={() => {
                setShowZoom(false);
                handleShowOptions();
              }}
            >
              Cancel/Reschedule
            </button>
            <button
              className="about-us-button nav-button"
              onClick={() => history.push('/about-us')}
            >
              About Us
            </button>
            <button
              className="nav-button"
              onClick={() => {
                setShowZoom(true);
                setShowOptions(false);
                setShowReschedule(false);
                setShowCancel(false);
                setShowRescheduleAllForm(false);
              }}
            >
              Zoom Info
            </button>
            <button
              className="report-issue-button nav-button"
              onClick={() =>
                history.push({
                  pathname: '/report-an-issue',
                  state: { from: '/dashboard' },
                })
              }
            >
              Report an issue
            </button>
          </nav>
        </header>
  
        <main>
          {/* Greeting & schedule details */}
          {!showZoom && !showOptions && !showReschedule && !showCancel && !showRescheduleAllForm && (
            <>
              <h2 className="greeting">
                Hello, {parentName || 'Loading...'}!
              </h2>
              <p className="schedule-details">
                Below is your schedule.<br />
                Click on a shaded day to see the time of your session.
              </p>
            </>
          )}
  
          {/* Default calendar view, outside of main-container */}
          {!showZoom && !showOptions && !showReschedule && !showCancel && !showRescheduleAllForm && (
            <>
            <div className="calendar-container">
              <DatePicker
                inline
                highlightDates={sessions.map(s => new Date(s.session_time))}
                dayClassName={date => isDayWithSession(date) ? 'session-day' : undefined}
                onChange={handleDayClick}
              />
              {showSessions && (
                <div className="modal-overlay">
                  <div className="session-popup">
                    {selectedSessions.map((session, i) => (
                      <div key={session.id} className="session-info">
                        <p className="session-popup-date"><b>{formattedDate}</b></p>
                        <p>
                          <b>Local time:</b> {session.session_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {i < selectedSessions.length - 1 && <hr className="session-separator" />}
                      </div>
                    ))}
                    <button className="close-button" onClick={handleClosePopup}>Close</button>
                  </div>
                </div>
              )}
            </div>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
            </>
          )}
  
          {/* Everything else inside main-container */}
          {(showZoom || showOptions || showReschedule || showCancel || showRescheduleAllForm) && (
            <div className="main-container">
              {/*** Zoom Info ***/}
              {showZoom && (
                <div className="zoom-container">
                  <h2 className="reschedule-title">Your Zoom Meeting</h2>
                  <p className="zoom-info"><b>Meeting ID:</b> 882 193 2666</p>
                  <p className="zoom-info"><b>Password:</b> 689887</p>
                  <button
                    className="reschedule-button"
                    onClick={() =>
                      window.open(
                        "https://us04web.zoom.us/j/8821932666?pwd=c08ydWNqQld0VzFFRVJDcm1IcTBUdz09&omn=74404485715",
                        "_blank",
                        "noopener noreferrer"
                      )
                    }
                  >
                    Join Zoom Meeting
                  </button>
                  <button
                    className="reschedule-back-button"
                    onClick={() => setShowZoom(false)}
                  >
                    Back
                  </button>
                </div>
              )}
  
              {/*** Options Menu ***/}
              {showOptions && !showZoom && (
                <div className="options-container">
                  <h2 className="do-you-want">Do you want to...</h2>
                  <div className="options-outer-container">
                    <div className="inner-container1">
                      <button className="option-button" onClick={navigateToCancelForm}>Cancel a session</button>
                      <button className="option-button" onClick={showRescheduleSession}>Reschedule a session</button>
                    </div>
                    <div className="inner-container2">
                      <button className="option-button" onClick={() => setShowCancelAllPopup(true)}>
                        Cancel all sessions
                      </button>
                      <button className="option-button" onClick={handleShowRescheduleAllForm}>
                        Reschedule all sessions
                      </button>
                    </div>
                  </div>
                  <button className="options-back-button" onClick={handleGoBack}>Go back</button>
                </div>
              )}
  
              {/*** Cancel All Confirmation ***/}
              {showCancelAllPopup && (
                <div className="cancel-all-popup">
                  <div className="popup-content">
                    <p className="cancel-confirm" id="cancel-confirm-1">Are you sure you want to cancel all of your sessions?</p>
                    <p className="cancel-confirm" id="cancel-confirm-2">This action cannot be undone, and you will need to register again to schedule sessions!</p>
                    <button className="no-button" onClick={() => setShowCancelAllPopup(false)}>No</button>
                    <button className="yes-button" onClick={cancelAllSessions} disabled={loading}>
                      {loading ? "Canceling..." : "Yes"}
                    </button>
                  </div>
                </div>
              )}
  
              {/*** Reschedule Single ***/}
              {showReschedule && (
                <div className="reschedule-container">
                  <h2 className="reschedule-title">Reschedule a Session</h2>
  
                  <select className="reschedule-dropdown" onChange={handleDaySelect}>
                    <option value="">Select day of session</option>
                    {sortedSessions.map((session, index) => (
                      <option key={index} value={session.session_time}>
                        {new Date(session.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </option>
                    ))}
                  </select>
                  
                  <select className="reschedule-dropdown" onChange={(e) => setSelectedSession(e.target.value)}>
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
                  
                  <select className="reschedule-dropdown" onChange={handleDayToRescheduleToSelect}>
                    <option value="">Select new day</option>
                    {getAllDaysForThreeMonths().map((day, index) => (
                      <option key={index} value={day.toISOString()}>
                        {getFormattedDate(new Date(day))}
                      </option>
                    ))}
                  </select>
                  
                  <select className="reschedule-dropdown" onChange={(e) => setSelectedTimeSlot(e.target.value)}>
                    <option value="">Select new time</option>
                    {filteredSlots.length > 0 ? (
                      filteredSlots.map((slot, index) => (
                        <option key={index} value={slot.time} disabled={slot.status === 'unavailable'}>
                          {`${slot.time} EST`} {slot.status === 'unavailable' ? '(Unavailable)' : ''}
                        </option>
                      ))
                    ) : (
                      <option>No available slots</option>
                    )}
                  </select>
                    <button 
                      className="reschedule-button" 
                      onClick={() => setShowReschedulePopup(true)} 
                      disabled={
                        !selectedDay ||
                        !selectedDayToRescheduleTo ||
                        !selectedTimeSlot
                      }
                    > 
                      Reschedule Session
                    </button>
                    <button className="reschedule-back-button" onClick={handleGoBackFromReschedule}>Go back</button>
                </div>
              )}

              {showReschedulePopup && (
                <div className="cancel-all-popup">
                  <div className="popup-content">
                    <p id="reschedule-message">
                      Are you sure you want to reschedule this session? Please go back and 
                      confirm your selections before you click 'Yes'.
                    </p>
                    <button className="no-button" onClick={() => setShowReschedulePopup(false)}>No</button>
                    <button className="yes-button" onClick={handleRescheduleSession} disabled={loading}>
                      {loading ? "Loading" : "Yes"}
                    </button>
                  </div>
                </div>
              )}
  
              {/*** Reschedule All ***/}
              {showRescheduleAllForm && (
                <form onSubmit={handleRescheduleAllSubmit} className="reschedule-all-container">
                  <h2 className="reschedule-all-title">Reschedule All Sessions</h2>
                  <p id="reschedule-all-instructions">Please select the day of the week and time you want 
                    all of your sessions to be rescheduled to.
                  </p>
                  <select
                    className="session-dropdown"
                    id="new-day-selection"
                    onChange={(e) => {
                      const selectedDayName = e.target.value;
                      const selectedDayNumber = daysOfWeek[selectedDayName];
                      const selectedDate = getNextDayOfWeek(selectedDayNumber);
                      setSelectedDayForAll(selectedDate);
                    }}
                    required
                  >
                    <option value="">Select day</option>
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
                        {`${slot.time} EST`} {slot.status === 'unavailable' ? '(Unavailable)' : ''}
                      </option>
                    ))}
                  </select>
                  
                  <button 
                    type="submit" 
                    className="reschedule-all-button" 
                    disabled={!selectedDayForAll || !selectedTimeSlotForAll}
                    onClick={() => setShowRescheduleAllPopup(true)}
                  >
                    Reschedule Sessions
                  </button>
                  <button type="button" className="reschedule-all-back-button" onClick={handleCloseRescheduleAll}>Go back</button>
                </form>
              )}

              {showRescheduleAllPopup && (
                <div className="cancel-all-popup">
                  <div className="popup-content">
                    <p id="reschedule-message">
                      Are you sure you want to reschedule all of your sessions? Please go back and 
                      confirm your new day and time before you click 'Yes'.
                    </p>
                    <button className="no-button" onClick={() => setShowRescheduleAllPopup(false)}>No</button>
                    <button className="yes-button" onClick={handleRescheduleAllSubmit} disabled={loading}>
                      {loading ? "Loading" : "Yes"}
                    </button>
                  </div>
                </div>
              )}
  
              {/*** Cancel Single ***/}
              {showCancel && (
                <div className="cancel-container">
                  <h2 className="cancel-title">Cancel a Session</h2>
                  <select 
                    className="session-dropdown" 
                    onChange={handleDayToCancelSelect} 
                  >
                    <option value="">-- Select Day of Session --</option>
                    {upcomingSessions.map((session, index) => (
                      <option key={index} value={session.session_time}>
                        {new Date(session.session_time).toLocaleDateString('en-US', {
                          month: 'long', 
                          day: 'numeric'
                        })}
                      </option>
                    ))}
                  </select>     

                  <textarea
                    id="cancel-reason-textbox"
                    className="cancel-reason-textbox"
                    placeholder="Briefly explain reason for cancelation..."
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                  />
                  <button
                    className="cancel-session-button"
                    onClick={() => setShowCancelPopup(true)}
                    disabled={!selectedDayToCancel || !cancelReason}
                  >
                    Cancel Session
                  </button>
                  <button className="cancel-back-button" onClick={handleGoBackFromCancel}>Go back</button>
                </div>
              )}

              {showCancelPopup && (
                <div className="cancel-all-popup">
                  <div className="popup-content">
                      <p className="cancel-session-message">
                        Are you sure you want to cancel your session on <strong>{formattedDate}</strong> at <strong>
                        {selectedSessions[0].session_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}?</strong>
                      </p>
                    <button className="no-button" onClick={() => setShowCancelPopup(false)}>No</button>
                    <button className="yes-button" onClick={submitCancelSession} disabled={loading}>
                        {loading ? "Loading" : "Yes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
  
        <footer>
          <p>Proudly empowering young readers around the globe, one word at a time.</p>
        </footer>
      </body>
    </>
  );
};

export default DashBoard;


/*
TODO When you come back to work on this:

  Make a use state for modal popup for reschedule all
  replicate modal component
  onclick reschedule open modal
  onclick yes button handle reschedule all
  margins on reschedule all
*/