import { getAuth, sendSignInLinkToEmail } from "firebase/auth";
import { app } from '../firebaseConfig';

const auth = getAuth(app);

export const sendRegistrationInvitation = async (email) => {
  const actionCodeSettings = {
    url: 'https://www.example.com/register', // URL to the registration page CHANGE
    handleCodeInApp: true
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    alert('Registration invitation sent.');
  } catch (error) {
    console.error("Error sending registration invitation: ", error);
    alert('Error sending registration invitation.');
  }
};