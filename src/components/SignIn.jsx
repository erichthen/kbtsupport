import React, { useState, useEffect } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { loginUser, sendPasswordResetEmail } from '../services/auth'; 
import { useAuth } from '../context/authContext';
import '../styles/signin.css'; 
import '../styles/forgotpassword.css';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [isFormValid, setIsFormValid] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const history = useHistory();

  useEffect(() => {
    setIsFormValid(email.trim() !== '' && password.trim() !== '');
  }, [email, password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await loginUser(email, password);
      
      // Check if the logged-in user is the admin
      if (email === 'kelli.b.then@gmail.com') { 
        history.push('/admin'); 
      } else {
        history.push('/dashboard'); 
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    try {
      await sendPasswordResetEmail(forgotPasswordEmail);
      setResetEmailSent(true);
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Error sending password reset email: ', error);
      alert('Error sending password reset email. Please try again.');
    }
  };

  if (user) {
    if (user.email === 'kelli.b.then@gmail.com') {
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
                required
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
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={!isFormValid}>Sign In</button>
          </form>
          <div className="forgot-password">
            <button className="forgot-password-link" onClick={() => setShowForgotPassword(true)}>Forgot Password?</button>
          </div>
          {showForgotPassword && (
            <form className="forgot-password-form" onSubmit={handleForgotPassword}>
              <input
                type="email"
                className="emailforreset"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="Please enter your email"
                required
              />
              <button type="submit">Send Password Reset Email</button>
            </form>
          )}
          {resetEmailSent && <div className="success">Password reset email sent. Please check your inbox.</div>}
        </div>
      </div>
    </div>
  );
};

export default SignIn;