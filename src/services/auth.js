import {sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from "firebase/auth";
import {auth} from '../firebaseConfig';
import {httpsCallable} from "firebase/functions";
import {functions} from '../firebaseConfig';

export const sendSignInLink = async (email, actionCodeSettings) => {
  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    console.log('Sign-in link sent successfully');
  } catch (error) {
    console.error('Error sending sign-in link:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email) => {
    const checkEmailAndSendReset = httpsCallable(functions, 'checkEmailSendReset');
  
    try {
      const response = await checkEmailAndSendReset({email});
      return response.data;  
    } catch (error) {
      return { success: false, error: 'Error communicating with server.' };
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