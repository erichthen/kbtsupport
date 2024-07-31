import React, {useState} from 'react';
import {sendSignInLink} from '../services/auth';

const RegistrationForm = () => {

    const [email, setEmail] = useState('');

    const actionCodeSettings = {
        url: 'https://www.example.com/finishSignUp',
        handleCodeInApp: true
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendSignInLink(email, actionCodeSettings)
        .then(() => {
          window.localStorage.setItem('emailForSignIn', email);
          alert('Please check your email for the sign-in link.');
        })
        .catch((error) => {
          console.error(error);
          alert('Error sending email.');
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            <button type='submit'>Send Sign-In Link</button>
        </form>
    );
};

export default RegistrationForm;