import React, { useEffect, useState } from 'react';
import '../styles/steps.css';

const Step2 = ({ email, password, confirmPassword, setEmail, handlePasswordChange, setConfirmPassword, passwordStrength, goToPreviousStep, goToNextStep }) => {
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.body.classList.add('step2');
    return () => {
      document.body.classList.remove('step2');
    };
  }, []);

  useEffect(() => {
    setPasswordMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  useEffect(() => {
    setIsStep2Valid(password.length !== 0 && passwordMatch && passwordStrength !== 'weak' && email.trim() !== '');
  }, [passwordMatch, passwordStrength, email, password]);

  return (
    <>
      <div className="input-container">
        <input
          id="email"
          name="email"
          type="email"
          className="email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          aria-label="Enter your email"
          autoComplete="off"
        />
      </div>
      <div className="input-container">
        <div className="password-input-container">
          <input
            className="password-input"
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            placeholder="Create a password"
            aria-label="Enter a password"
            autoComplete="new-password"
          />
        </div>
        <button className="view-password" type="button" onClick={() => setShowPassword(!showPassword)}>View password</button>
        <span className={`password-strength ${passwordStrength}`}>
          {(passwordStrength === 'weak' && password.length !== 0) ? 'Password is too weak' : ''}
        </span> 
      </div>
      <div className="input-container">
        <div className="password-input-container">
          <input
            className="confirm-password-input"
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            aria-label="Confirm your password"
            autoComplete="new-password"
          />
        </div>
        <span className='passwords-match'>
          {!passwordMatch ? 'Passwords do not match': ''}
        </span>
      </div>
      <div className="nav">
        <button type="button" className="nav-buttons" onClick={goToPreviousStep}>Prev</button>
        <button type="button" className="nav-buttons" onClick={goToNextStep} disabled={!isStep2Valid}>Next</button>
      </div>
      <p className="step-number">Step 2 of 3</p>
    </>
  );
};

export default Step2;