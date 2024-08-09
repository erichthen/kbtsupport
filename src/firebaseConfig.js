// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {getFunctions} from 'firebase/functions';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAiUB7yNPBubSG1VpObel_oBVnUUX3QFx8",
  authDomain: "kbt-reading-support.firebaseapp.com",
  projectId: "kbt-reading-support",
  storageBucket: "kbt-reading-support.appspot.com",
  messagingSenderId: "882004401220",
  appId: "1:882004401220:web:5924228bf512135b1bb011",
  measurementId: "G-6Y1FW36GPM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

export {auth, db, app, functions}