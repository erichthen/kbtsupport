import React from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { logoutUser } from '../services/auth';

const DashBoard = () => {
  const { user } = useAuth();
  const history = useHistory();

  const handleLogout = async () => {
    await logoutUser();
    history.push('/login');
  };

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
      {/* User dashboard content goes here */}
    </div>
  );
};

export default DashBoard;