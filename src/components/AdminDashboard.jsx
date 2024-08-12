import React, { useEffect, useState } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { sendSignInLink, logoutUser } from '../services/auth';
import DatePicker from 'react-datepicker';
import { getSessions,  } from '../services/sessions';
import { getParentEmailById } from '../services/firestore';
import '../styles/admindash.css';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

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

  const handleLogout = async () => {
    await logoutUser();
    history.push('/login');
  };

  const handleSendInvite = async () => {
    const actionCodeSettings = {
      url: 'http://localhost:3000/register',
      handleCodeInApp: true,
    };

    const message = 'Hello, you have been invited to register to the KBT Reading Support website! Click the below link to do so.';

    try {
      await sendSignInLink(email, actionCodeSettings, message);
      alert('Registration link sent.');
      setShowInviteForm(false);
      setEmail('');
    } catch (error) {
      console.error();
      alert('Error sending registration link.');
    }
  };

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.email !== 'kelli.b.then@gmail.com') {
    return <Redirect to="/" />;
  }

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
      };
    });
  
    setSelectedSessions(formattedSessions);
  };

  const handleInvoicesClick = () => {
    history.push('/admin/invoices');
  };

  const handleClosePopup = () => {
    setSelectedSessions([]);
  };

  const handleCancelSessions = async () => {
    if (selectedSessions.length === 0) {
      alert('No sessions selected');
      return;
    }
  
    try {
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

        const response = await axios.post('https://us-central1-kbt-reading-support.cloudfunctions.net/sendCancellationEmails', {
          email: parentEmail,
          subject: 'Session Cancellation Notification',
          message: message
        });
        console.log(response.data.message || 'Cancellation email sent successfully.');
      }
  
      alert('All cancellation emails sent successfully.');
      setSelectedSessions([]); 
  
    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
      alert('Error sending cancellation emails.');
    }
  };
  
  return (
    <div className="main-container">
      <h1>Hello, Kelli!</h1>
      <div className="outer-container">
        <div className="container">
          {!showInviteForm && (
            <button className="add-client-button" onClick={() => setShowInviteForm(true)}>Add Client</button>
          )}
          {showInviteForm && (
            <div className="input-group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Client email"
              />
              <button className="send-button" onClick={handleSendInvite}>Send Invite</button>
            </div>
          )}
          <button className="zoom-button" onClick={() => window.open("https://us04web.zoom.us/j/8821932666?pwd=c08ydWNqQld0VzFFRVJDcm1IcTBUdz09&omn=74404485715", "_blank", "noopener noreferrer")}>Join Zoom Session</button>
          <p>Meeting ID: 882 193 2666 </p>
          <p>Passcode: 689887</p> 
          <button className="invoices-button" onClick={handleInvoicesClick}>Invoices</button>
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
        {selectedSessions.length > 0 && (
          <>
            <div className="session-popup">
              <button className="cancel-sessions-button" onClick={handleCancelSessions}>Cancel Sessions</button>
              <button className="close-button" onClick={handleClosePopup}>x</button>
              <p>{selectedDate}</p>
              {selectedSessions.map((session, index) => (
                <div key={session.id} className="session-info">
                  <p>Child's Name: {session.child_name}</p>
                  <p>Time: {session.session_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  {index < selectedSessions.length - 1 && <hr className="session-separator" />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;