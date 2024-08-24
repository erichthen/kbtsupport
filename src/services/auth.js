import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from '../firebaseConfig';
import { sendPasswordResetEmail as firebasesendPasswordResetEmail } from "firebase/auth";

export const sendSignInLink = async (email, actionCodeSettings, message) => {
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      console.log(message);
      window.localStorage.setItem('emailForSignIn', email);
    } catch (error) {
      console.error('Error sending sign-in link:', error);
      throw error;
    }
  };

export const sendPasswordResetEmail = async (email) => {
    try {
        await firebasesendPasswordResetEmail(auth, email);
    }
    catch(error) {
        console.error('Error sending password reset email: ', error);
        throw error;
    }
};

export const loginUser = async (email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    }
    catch (error) {
        console.error('Error logging in user: ', error);
        throw error;
    }
};

export const registerUser = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential; 
    } catch (error) {
      console.error('Error during registration: ', error);
      throw error;
    }
  };

export const checkSignInLink = (url) => {
    return isSignInWithEmailLink(auth, url);
};

export const completeSignIn = (email, url) => {
    return signInWithEmailLink(auth, email, url);
};

export const logoutUser = () => {
    return signOut(auth);
};

export const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(callback);
};