import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import {app} from '../firebaseConfig';

const auth = getAuth(app);

export const sendSignInLink = (email, actionCodeSettings) => {
    return sendSignInLinkToEmail(auth, email, actionCodeSettings);
};

export const checkSignInLink = (url) => {
    return isSignInWithEmailLink(auth, url);
};

export const completeSignIn = (email, url) => {
    return signInWithEmailLink(auth, email, url);
};

export const register = (email, password) => {
    return auth.createUserWithEmailAndPassword(auth, email, password);
};

export const login = (email, password) => {
    return auth.signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
    return auth.signOut();
};

export const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(auth, callback);
}