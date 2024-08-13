import React, { useEffect, useState } from 'react';

const Step2 = ({ email, password, confirmPassword, setEmail, handlePasswordChange, setConfirmPassword, passwordStrength, goToPreviousStep, goToNextStep }) => {
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [isStep2Valid, setIsStep2Valid] = useState(false);

  useEffect(() => {
    setPasswordMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  useEffect(() => {
    setIsStep2Valid(passwordMatch && passwordStrength !== 'weak' && email.trim() !== '' && password !== '');
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
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter a password"
            aria-label="Enter a password"
            autoComplete="new-password"
          />
        </div>
        {password && (
          <span className={`password-strength ${passwordStrength}`}>
            {passwordStrength === 'weak' ? 'Password is too weak' : 'Password is strong'}
          </span>
        )}
      </div>
      <div className="input-container">
        <div className="password-input-container">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            aria-label="Confirm your password"
            autoComplete="new-password"
          />
        </div>
        {!passwordMatch && (
          <span className="password-match">Passwords do not match</span>
        )}
      </div>
      <div className="nav-buttons">
        <button type="button" onClick={goToPreviousStep}>Prev</button>
        <button
          type="button"
          onClick={goToNextStep}
          disabled={!isStep2Valid}  
        >
          Next
        </button>
      </div>
    </>
  );
};

export default Step2;