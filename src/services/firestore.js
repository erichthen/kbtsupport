import { collection, addDoc, getDocs} from "firebase/firestore";
import { db } from '../firebaseConfig';

// Function to add a parent to the parents collection
export const addParent = async (parentData) => {
  try {
    const docRef = await addDoc(collection(db, 'parents'), { ...parentData });
    return docRef.id;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};

// Function to get available slots from the sessions collection
export const getAvailableSlots = async () => {
  const slots = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"];
  const sessionsSnapshot = await getDocs(collection(db, "sessions"));
  const bookedSlots = sessionsSnapshot.docs.map(doc => doc.data().session_time);
  return slots.filter(slot => !bookedSlots.includes(slot));
};




// import { collection, addDoc, getDocs, updateDoc, doc } from "firebase/firestore";
// import { db } from '../firebaseConfig';

// Function to add a parent
// Function to get available slots



// // Function to request a schedule change
// export const requestScheduleChange = async (parent_id, current_slot, new_slot) => {
//   try {
//     const requestRef = await addDoc(collection(db, "scheduleChangeRequests"), { parent_id, current_slot, new_slot, status: 'pending' });
//     return requestRef.id;
//   } catch (error) {
//     console.error("Error requesting schedule change: ", error);
//     throw error;
//   }
// };

// // Function to approve a schedule change
// export const approveScheduleChange = async (requestId) => {
//   try {
//     const requestRef = doc(db, "scheduleChange", requestId);
//     await updateDoc(requestRef, { status: 'approved' });

//     const requestDoc = await requestRef.get();
//     const { parent_id, new_slot, current_slot} = requestDoc.data();

//     const parentRef = doc(db, "parents", parent_id);
//     const parentDoc = await parentRef.get();
//     const sessions = parentDoc.data().sessions;
//     const updatedSessions = sessions.map(session => session === current_slot ? new_slot : session);

//     await updateDoc(parentRef, { sessions: updatedSessions });
//   } catch (error) {
//     console.error("Error approving schedule change: ", error);
//     throw error;
//   }
// };

// // Function to deny a schedule change
// export const denyScheduleChange = async (requestId) => {
//   try {
//     const requestRef = doc(db, "scheduleChange", requestId);
//     await updateDoc(requestRef, { status: 'denied' });
//   } catch (error) {
//     console.error("Error denying schedule change: ", error);
//     throw error;
//   }
// };