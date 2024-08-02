import React, { useState, useEffect } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { loginUser } from '../services/auth';
import { useAuth } from '../context/authContext';
import '../styles/signin.css'; // Update the import path to point to the sibling styles directory

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [isFormValid, setIsFormValid] = useState(false);
  
  const history = useHistory();

  useEffect(() => {
    setIsFormValid(email.trim() !== '' && password.trim() !== '');
  }, [email, password]);


  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await loginUser(email, password);
      
      // Check if the logged-in user is the admin
      if (email === 'erich.then2@gmail.com') { // Replace with the actual admin email
        history.push('/admin'); // Redirect to admin dashboard
      } else {
        history.push('/dashboard'); // Redirect to user dashboard
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // If the user is already logged in, redirect them to their respective dashboard
  if (user) {
    if (user.email === 'erich.then2@gmail.com') { // Replace with the actual admin email
      return <Redirect to="/admin" />;
    } else {
      return <Redirect to="/dashboard" />;
    }
  }

  return (
    <div className="main-container">
      <h1>KBT Reading Support</h1>
      <div className="outer-container">
        <div className="container">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                aria-label="Enter your email"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                aria-label="Enter your password"
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={!isFormValid}>Sign In</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;