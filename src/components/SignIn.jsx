import React, { useState, useEffect } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { loginUser, sendPasswordResetEmail } from '../services/auth'; 
import { useAuth } from '../context/authContext';
import '../styles/signin.css'; 
import { Helmet } from 'react-helmet';

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
  
      // push to admin dashboard if email matches (and password ofc, which is handled with above line)
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
      setError(''); // clear any existing errors
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
    <>
      <Helmet>
        <title>Login - KBT</title>
      </Helmet>
      <body>
        <header>
          <h1>KBT Reading Support</h1>
          <nav>
            <button className="contact-us-button" onClick={() => history.push('/contact-us')}>Contact Us</button>
            <button className="contact-us-button" onClick={() => history.push('/about-us')}>About Us</button>
          </nav>
        </header>
        <main>
          <div className="main-container">
            {showForgotPassword ? (
              <h3 className="forgot-password-title">Password Reset</h3>
            ) : (
              <>
                <h4 className="welcome-message-1">Welcome!</h4>
                <h4 className="welcome-message-2">Please enter the credentials you set up while registering.</h4>
              </>
            )}
  
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
                  <button
                    className="forgot-pass-submit"
                    type="submit"
                    disabled={!isEmailValid || disableResetButtonAfterError}
                  >
                    Send reset email
                  </button>
                </form>
                <button
                  className="forgot-back-button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError('');
                  }}
                >
                  Go Back
                </button>
              </div>
            ) : (
              <div className="container">
                <img src="/logo.jpg" alt="KBT Logo" className="login-logo" />
                <form onSubmit={handleSubmit}>
                  <div>
                    <input
                      id="email-input"
                      className="login-input"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter your email"
                      required
                    />
                    <input
                      id="password-input"
                      className="login-input"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="Enter your password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  {error && <div className="error">{error}</div>}
                  <button
                    className="sign-in-button"
                    type="submit"
                    disabled={!isFormValid || disableButtonAfterError}
                  >
                    Sign In
                  </button>
                </form>
                <button
                  className="forgot-password-link"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError(false);
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>
        </main>
        <footer>
          <p>Proudly empowering young readers around the globe, one word at a time.</p>
        </footer>
      </body>
    </>
  );

};

export default SignIn;