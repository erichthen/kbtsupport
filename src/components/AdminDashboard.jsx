import React, { useEffect, useState } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { sendSignInLink, logoutUser } from '../services/auth';
import '../styles/admindash.css'; // Import the new CSS file

const AdminDashboard = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    document.body.classList.add('admin-dashboard');
    return () => {
      document.body.classList.remove('admin-dashboard');
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    history.push('/login');
  };

  const handleSendInvite = async () => {
    const actionCodeSettings = {
      url: 'http://localhost:3000/register', // Update this to the correct registration URL
      handleCodeInApp: true,
    };

    const message = 'Hello, you have been invited to register to the KBT Reading Support website! Click the below link to do so.';

    try {
      await sendSignInLink(email, actionCodeSettings, message);
      alert('Registration link sent.');
      setShowInviteForm(false); // Hide the invite form
      setEmail(''); // Clear the email input
    } catch (error) {
      console.error('Error sending email: ', error);
      alert('Error sending registration link.');
    }
  };

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.email !== 'erich.then2@gmail.com') { // Replace with the actual admin email
    return <Redirect to="/" />;
  }

  return (
    <div className="main-container">
      <h1>Welcome to the Admin Dashboard</h1>
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
                placeholder="Enter parent email"
              />
              <button classname='send-button' onClick={handleSendInvite}>Send Invite</button>
            </div>
          )}
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;