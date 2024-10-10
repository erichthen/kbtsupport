import React, { useState, useEffect } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { loginUser, sendPasswordResetEmail } from '../services/auth'; 
import { useAuth } from '../context/authContext';
import '../styles/signin.css'; 

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [isFormValid, setIsFormValid] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false); 
  const [disableButtonAfterError, setDisableButtonAfterError] = useState(false);
  const [disableResetButtonAfterError, setDisableResetButtonAfterError] = useState(false);
  
  const history = useHistory();

  useEffect(() => {
  document.body.classList.add('sign-in');
  return () => {
    document.body.classList.remove('sign-in');
    };
  }, []);

  useEffect(() => {
    setIsFormValid(email.trim() !== '' && password.trim() !== '');
    setDisableButtonAfterError(false);
  }, [email, password]);

  useEffect(() => {
    setIsEmailValid(forgotPasswordEmail.includes('@'));
  }, [forgotPasswordEmail]);

  useEffect(() => {
    setIsFormValid(email.trim() !== '' && password.trim() !== '');
  }, [email, password, error]); 

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
      setError('Invalid Credentials');
      setDisableButtonAfterError(true);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault(); 
  
    const response = await sendPasswordResetEmail(forgotPasswordEmail);
  
    if (response.success) {
      setError(''); // Clear any existing errors
      setDisableResetButtonAfterError(false);
      setShowForgotPassword(false);
      alert('Password reset email sent. Please check your inbox.');
    } else {
      setError(response.error); 
      setDisableResetButtonAfterError(true);
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

        {showForgotPassword ? (
            <h3 className="welcome-message">Password Reset</h3>
          ) : (
            <h4 className="welcome-message">
              Welcome! Please enter the credentials you set <br />
              up while registering. Registration is invite-only.
            </h4>
          ) 
        }

        {showForgotPassword ? (
          <div className="forgot-password-container">

            <form className="forgot-password-form" onSubmit={handleForgotPassword}>
              <input
                type="email"
                className="emailforreset"
                value={forgotPasswordEmail}
                onChange={(e) => {
                  setForgotPasswordEmail(e.target.value);
                  setError('');
                  setDisableResetButtonAfterError(false);
                }}
                placeholder="Enter your email"
                required
              />
              {error && <div className="error">{error}</div>} 
              <button className="forgot-pass-submit" type="submit" disabled={!isEmailValid || disableResetButtonAfterError}>Send Password Reset Email</button>
            </form>

            <button 
              className="back-button" 
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
              }}
            >Go Back</button>

          </div>

        ) : (

          <div className="container">

            <form onSubmit={handleSubmit}>

              <div>
                <input
                  id="email"
                  className="email-input"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(''); 
                  }}
                  placeholder="Email"
                  required
                />
                <input
                  className=""
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Password"
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && <div className="error">{error}</div>}
              <button type="submit" disabled={!isFormValid || disableButtonAfterError}>Sign In</button>

            </form>

            <div className="forgot-password">
              <button className="forgot-password-link" 
                onClick={() => {
                  setShowForgotPassword(true);
                  setError(false);
                }}
              >Forgot Password?</button>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default SignIn;