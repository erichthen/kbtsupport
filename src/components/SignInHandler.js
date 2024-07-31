import React, { useEffect } from 'react';
import { checkSignInLink, completeSignIn } from '../services/auth';

const SignInHandler = () => {

  useEffect(() => {
    if (checkSignInLink(window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }

      completeSignIn(email, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn');
          alert('Successfully signed in.');
        })
        .catch((error) => {
          console.error(error);
          alert('Error signing in.');
        });
    }
  }, []);
  
  return null;
};

export default SignInHandler;