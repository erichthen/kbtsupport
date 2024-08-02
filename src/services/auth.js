import {sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from "firebase/auth";
import { auth } from '../firebaseConfig'; // Adjust path based on actual location

export const sendSignInLink = (email, actionCodeSettings, message) => {
    // Simulating sending a custom email message
    return sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        console.log(message);
        window.localStorage.setItem('emailForSignIn', email);
      });
  };

export const checkSignInLink = (url) => {
    return isSignInWithEmailLink(auth, url);
};

export const completeSignIn = (email, url) => {
    return signInWithEmailLink(auth, email, url);
};

export const registerUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = () => {
    return signOut(auth);
}

export const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(callback);
};