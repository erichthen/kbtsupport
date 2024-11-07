import { collection, addDoc, getDocs, query, where, writeBatch, deleteDoc, doc} from 'firebase/firestore';
import moment from 'moment-timezone';

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
  const startTime = moment.tz('09:00', 'HH:mm', 'America/New_York'); // Start at 9:00 AM EST
  const endTime = moment.tz('13:40', 'HH:mm', 'America/New_York'); // End at 1:40 PM EST

  while (startTime.isBefore(endTime)) {
    slots.push(startTime.format('hh:mm A'));
    startTime.add(40, 'minutes'); // Increment by 40 minutes
  }

  return slots;
};

export const filterAvailableSlots = (slots, bookedSlots, selectedDate) => {
  if (!Array.isArray(slots)) {
    console.error('Slots is not an array:', slots);
    return [];
  }

  // Convert selectedDate to an EST date string for consistency
  const selectedDayEST = moment.tz(selectedDate, 'America/New_York').format('MM/DD/YYYY');

  // Convert each booked slot from UTC to EST to compare with generated slots
  const unavailableSlots = bookedSlots
    .map(slot => {
      const date = moment.utc(slot).tz('America/New_York'); // Convert each slot from UTC to EST
      return {
        day: date.format('MM/DD/YYYY'),
        time: date.format('hh:mm A')
      };
    })
    .filter(slot => slot.day === selectedDayEST); // Compare only slots on the selected EST day

  return slots.map(time => {
    const isUnavailable = unavailableSlots.some(slot => slot.time === time);
    return {
      time,
      status: isUnavailable ? 'unavailable' : 'available'
    };
  });
};

export const deleteSessionsByDate = async (selectedDate) => {
  try {
    const batch = writeBatch(db);

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0); 
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Deleting sessions from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    //query to get all sessions that match the selected date
    const sessionsRef = collection(db, 'sessions');
    const q = query(sessionsRef, where('session_time', '>=', startOfDay.toISOString()),
                                    where('session_time', '<=', endOfDay.toISOString()));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('No sessions found for the selected date.');
      return;
    }

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

export const deleteSessionsNotRaffaele = async () => {
  try {
    const batch = writeBatch(db);
    const sessionsRef = collection(db, 'sessions');

    const q = query(sessionsRef, where('child_name', '!=', 'Raffaele'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('No sessions found with a child name other than Raffaele.');
      return;
    }

    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('Sessions not belonging to Raffaele deleted successfully');
  } catch (error) {
    console.error('Error deleting sessions:', error);
  }
};