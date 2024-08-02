import { collection, addDoc, getDocs, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Function to add a session
export const addSession = async (parentId, sessionData) => {
  try {
    const sessionRef = await addDoc(collection(db, 'sessions'), {
      ...sessionData,
      parent_id: doc(db, 'parents', parentId) // Set the parent_id reference
    });
    return sessionRef.id;
  } catch (error) {
    console.error('Error adding session: ', error);
    throw error;
  }
};

// Function to get all sessions
export const getSessions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'sessions'));
    const sessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return sessions;
  } catch (error) {
    console.error('Error getting sessions: ', error);
    throw error;
  }
};

// Function to get available slots
export const getAvailableSlots = async () => {
  try {
    const slots = generateTimeSlots();
    const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
    const bookedSlots = sessionsSnapshot.docs.map(doc => ({
      date: doc.data().date,
      time: doc.data().time,
    }));
    return { slots, bookedSlots };
  } catch (error) {
    console.error('Error getting available slots: ', error);
    throw error;
  }
};

// Function to generate time slots
export const generateTimeSlots = () => {
  const slots = [];
  const endTime = new Date();
  endTime.setHours(13, 40, 0, 0); // End at 1:40 PM

  let currentTime = new Date();
  currentTime.setHours(9, 0, 0, 0); // Start at 9:00 AM

  while (currentTime < endTime) {
    slots.push(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    currentTime = new Date(currentTime.getTime() + 40 * 60000); // 40 minutes interval
  }

  return slots;
};

// Function to filter available slots
export const filterAvailableSlots = (date, slots, bookedSlots) => {
  const formattedDate = date.toISOString().split('T')[0];
  const unavailableSlots = bookedSlots.filter(slot => slot.date === formattedDate).map(slot => slot.time);
  return slots.map(time => ({
    time,
    status: unavailableSlots.includes(time) ? 'unavailable' : 'available'
  }));
};