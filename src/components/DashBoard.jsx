import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getParentById } from '../services/firestore';
import { getSessionsByParentId } from '../services/sessions';
import { useHistory } from 'react-router-dom';
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

  // Fetch sessions based on parent ID
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

  const handleLogout = async () => {
    try {
      await logoutUser();
      history.push('/login');
    } catch (error) {
      console.error('Error during logout: ', error);
      alert('Error during logout.');
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


  return (
    <div className="outer-container">
      <div className="main-container">
        <h1>Hello, {parentName || 'Loading...'}!</h1>
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
          <a href="https://us04web.zoom.us/j/8821932666?pwd=c08ydWNqQld0VzFFRVJDcm1IcTBUdz09&omn=74404485715" target="_blank" rel="noopener noreferrer">Join Zoom Session</a>
          <p>Meeting ID: 882 193 2666 - Password: 689887</p>
        </div>
        <button className='logout-button' onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default DashBoard;