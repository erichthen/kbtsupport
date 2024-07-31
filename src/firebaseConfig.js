import {initializeApp} from 'firebase/app';
import {getAuth} from "firebase/auth";
import {getAnalytics} from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAiUB7yNPBubSG1VpObel_oBVnUUX3QFx8",
    authDomain: "kbt-reading-support.firebaseapp.com",
    projectId: "kbt-reading-support",
    storageBucket: "kbt-reading-support.appspot.com",
    messagingSenderId: "882004401220",
    appId: "1:882004401220:web:5924228bf512135b1bb011",
    measurementId: "G-6Y1FW36GPM"
  };
  

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);


export {auth, analytics};