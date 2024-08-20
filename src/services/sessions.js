import { collection, addDoc, getDocs, query, where, writeBatch, deleteDoc, doc} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const addSession = async (parentId, sessionData) => {
  try {
    const sessionRef = await addDoc(collection(db, 'sessions'), {
      ...sessionData,
      parent_id: parentId  
    });
    return sessionRef.id;
  } catch (error) {
    console.error('Error adding session: ', error);
    throw error;
  }
};

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

export const getSessionsByParentId = async (parentDocId) => {
  try {
    const q = query(collection(db, 'sessions'), where('parent_id', '==', parentDocId));
    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => {
      return { id: doc.id, ...doc.data() };
    });
    return sessions;
  } catch (error) {
    console.error('Error fetching sessions: ', error);
    throw error;
  }
};

export const getAvailableSlots = async () => {
  try {
    const sessionsSnapshot = await getDocs(collection(db, "sessions"));
    const bookedSlots = sessionsSnapshot.docs.map(doc => doc.data().session_time);
    return bookedSlots;
  } catch (error) {
    console.error('Error getting available slots: ', error);
    throw error;
  }
};

export const generateTimeSlots = () => {
  const slots = [];
  const endTime = new Date();
  endTime.setHours(13, 40, 0, 0); // end at 1:40 PM

  let currentTime = new Date();
  currentTime.setHours(9, 0, 0, 0); // start at 9:00 AM

  while (currentTime < endTime) {
    slots.push(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    currentTime = new Date(currentTime.getTime() + 40 * 60000); // 40 minute interval
  }

  return slots;
};

export const filterAvailableSlots = (slots, bookedSlots, selectedDate) => {
  if (!Array.isArray(slots)) {
    console.error('Slots is not an array:', slots);
    return [];
  }

  // Ensure selectedDate is valid
  if (!(selectedDate instanceof Date) || isNaN(selectedDate)) {
    console.error('Invalid selectedDate:', selectedDate);
    return [];
  }

  const selectedDay = selectedDate.toLocaleDateString(); // Get the selected day in MM/DD/YYYY format

  // Convert bookedSlots to a format that includes both date and time for comparison
  const unavailableSlots = bookedSlots
    .filter(slot => slot) // Filter out undefined or invalid slots
    .map(slot => {
      const date = new Date(slot);
      if (!(date instanceof Date) || isNaN(date)) {
        console.error('Invalid slot date:', slot);
        return null;
      }
      const day = date.toLocaleDateString(); // Get the date (MM/DD/YYYY format)
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Get the time
      return { day, time }; // Return both the day and time
    })
    .filter(slot => slot); // Filter out any invalid/null slot objects

  // Filter out the slots that are unavailable on the selected day
  return slots.map(time => {
    const isUnavailable = unavailableSlots.some(slot => slot.day === selectedDay && slot.time === time);
    return {
      time,
      status: isUnavailable ? 'unavailable' : 'available'
    };
  });
};

export const deleteSessionsByDate = async (selectedDate) => {
  try {
    const batch = writeBatch(db);

    // Get the start and end of the selected date
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0); // Start at 00:00:00
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999); // End at 23:59:59

    console.log(`Deleting sessions from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Query to get all sessions that match the selected date
    const sessionsRef = collection(db, 'sessions');
    const q = query(sessionsRef, where('session_time', '>=', startOfDay.toISOString()),
                                    where('session_time', '<=', endOfDay.toISOString()));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('No sessions found for the selected date.');
      return;
    }

    // Iterate through the sessions and delete them
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('Sessions deleted successfully');
  } catch (error) {
    console.error('Error deleting sessions:', error);
    throw error;
  }
};


export const deleteSessionByDate = async (parentId, sessionDate) => {
  try {
    const sessionRef = collection(db, 'sessions');
    
    // Ensure both the queried date and stored date are in ISO format
    const sessionDateISO = sessionDate.toISOString(); 

    const q = query(
      sessionRef,
      where('parent_id', '==', parentId),
      where('session_time', '==', sessionDateISO) // Exact match for the ISO string
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('No matching session found.');
      return;
    }

    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
      console.log(`Session on ${sessionDate} deleted successfully.`);
    });
  } catch (error) {
    console.error('Error deleting session:', error);
  }
};

export const deleteSessionById = async (sessionId) => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId); // Referencing the document by its id
    await deleteDoc(sessionRef);
    console.log(`Session with ID: ${sessionId} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting session:', error);
  }
};