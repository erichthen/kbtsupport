import React, { useEffect, useState } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { sendSignInLink, logoutUser } from '../services/auth';
import DatePicker from 'react-datepicker';
import { getSessions, deleteSessionsByDate } from '../services/sessions';
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSessions, setShowSessions] = useState(false);

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

  const handleInvoicesClick = () => {
    history.push('/admin/invoices');
  };

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
    setSelectedDate(date);
    setShowSessions(true); // Replace outer-container content with sessions container
  };

  const handleClosePopup = () => {
    setSelectedSessions([]);
    setShowSessions(false); // Show calendar again
  };

  const handleCancelSessions = async () => {
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

        const response = await axios.post('https://us-central1-kbt-reading-support.cloudfunctions.net/sendCancellationEmails', {
          email: parentEmail,
          subject: 'Session Cancellation Notification',
          message: message
        });
        console.log(response.data.message || 'Cancellation email sent successfully.');
      }

      // After sending emails, delete the sessions
      await deleteSessionsByDate(sessionDate);

      alert('All cancellation emails sent and sessions deleted successfully.');
      setSelectedSessions([]);
      setShowSessions(false); // Show calendar again

    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
      alert('Error sending cancellation emails or deleting sessions.');
    }
  };

  const getFormattedDate = (date) => {
    const options = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="main-container">
      <h1>Hello, Kelli!</h1>
      <div className="outer-container">
        {showSessions ? (
          //show sessions if there are sessions on that day, if not, show message
          <div className="session-container">
            <h2 className="session-title">Sessions for {getFormattedDate(selectedDate)}</h2>
            <button className="close-button" onClick={handleClosePopup}>x</button>
            {selectedSessions.length > 0 ? (
              selectedSessions.map((session, index) => (
                <div key={session.id} className="session-info">
                  <p>Child's Name: {session.child_name}</p>
                  <p>Time: {session.session_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  {index < selectedSessions.length - 1 && <hr className="session-separator" />}
                </div>
              ))
            ) : (
              <p className="no-sessions">No sessions on this day!</p>
            )}
            <button className="cancel-sessions-button" onClick={handleCancelSessions}>Cancel Sessions</button>
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
                  <button className="send-button" onClick={handleSendInvite}>Send Invite</button>
                </div>
              )}
              <button className="zoom-button" onClick={() => window.open("https://us04web.zoom.us/j/8821932666?pwd=c08ydWNqQld0VzFFRVJDcm1IcTBUdz09&omn=74404485715", "_blank", "noopener noreferrer")}>Join Zoom Call</button>
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
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;