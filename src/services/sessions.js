import { collection, addDoc, getDocs, query, where, doc, writeBatch, deleteDoc} from 'firebase/firestore';
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

export const filterAvailableSlots = (slots, bookedSlots) => {
  if (!Array.isArray(slots)) {
    console.error('Slots is not an array:', slots);
    return [];
  }
  // convert booked slots to comparable format
  const unavailableSlots = bookedSlots.map(slot => {
    const date = new Date(slot);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  return slots.map(time => ({
    time,
    status: unavailableSlots.includes(time) ? 'unavailable' : 'available'
  }));
};

//called when admin cancels a day of sessions
export const deleteSessionsByDate = async (sessions) => {
  try {
    const batch = writeBatch(db); 

    for (const session of sessions) {
      const sessionRef = doc(db, 'sessions', session.id);
      batch.delete(sessionRef);
    }

    await batch.commit();
    console.log('Sessions deleted successfully');
  } catch (error) {
    console.error('Error deleting sessions: ', error);
    throw error;
  }
};

//called when client cancels a session
export const deleteSessionByDate = async (parentId, sessionDate) => {
  try {
    const sessionRef = collection(db, 'sessions');
    const q = query(
      sessionRef,
      where('parent_id', '==', parentId),
      where('session_time', '==', sessionDate) // exact match for the ISO string
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
