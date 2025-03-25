import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc} from "firebase/firestore";
import { db } from '../firebaseConfig';

export const addParent = async (parentData) => {
  try {
    const docRef = await addDoc(collection(db, 'parents'), { ...parentData });
    return docRef.id;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};

export const getParents = async () => {
  try {
    const parentsCollection = collection(db, 'parents');
    const parentsSnapshot = await getDocs(parentsCollection);
    const parents = parentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return parents;
  } catch (error) {
    console.error('Error fetching parents: ', error);
    throw error;
  }
};

export const getParentById = async (uid) => {
  try {
    const parentsCollection = collection(db, 'parents');
    const parentSnapshot = await getDocs(query(parentsCollection, where('uid', '==', uid)));
    if (!parentSnapshot.empty) {
      const parentDoc = parentSnapshot.docs[0];
      return { id: parentDoc.id, ...parentDoc.data() };
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching parent document: ', error);
    throw error;
  }
};

export const getParentByDocumentId = async (docId) => {
  try {
    const parentDocRef = doc(db, 'parents', docId);
    const parentDoc = await getDoc(parentDocRef);
    if (parentDoc.exists()) {
      return { id: parentDoc.id, ...parentDoc.data() };
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error fetching parent document by document ID: ', error);
    throw error;
  }
};

export const getAvailableSlots = async () => {
  const slots = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM"];
  const sessionsSnapshot = await getDocs(collection(db, "sessions"));
  const bookedSlots = sessionsSnapshot.docs.map(doc => doc.data().session_time);
  return slots.filter(slot => !bookedSlots.includes(slot));
};

export const getInvoices = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'parents'));
    const invoices = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return invoices;
  } catch (error) {
    console.error('Error retrieving invoices: ', error);
    throw error;
  }
};

export const getParentEmailById = async (parentId) => {
  try {
    const parentDocRef = doc(db, 'parents', parentId);
    const parentDoc = await getDoc(parentDocRef);

    if (parentDoc.exists()) {
      const parentData = parentDoc.data();
      return parentData.email;
    } else {
      console.error(`No parent found with ID: ${parentId}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching parent email:', error);
    throw new Error('Failed to retrieve parent email');
  }
};

export const getAllParentEmails = async () => {

  try {
    const parentsCollection = collection(db, 'parents');
    const parentsSnapshot = await getDocs(parentsCollection);
    const emails = parentsSnapshot.docs.map(doc => doc.data().email);
    return emails;
  } 
  catch (error) {
    console.error('Error fetching parent emails:', error);
    throw error;
  }
};

export const getAllParentNames = async () => {

  try {
    const parentsCollection = collection(db, 'parents');
    const parentsSnapshot = await getDocs(parentsCollection);
    const parents = parentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().parent_name,
      email: doc.data().email,
    }));
    return parents;
  } 
  catch (error) {
    console.error('Error fetching parent names:', error);
    throw error;
  }
};

export const updateInvoiceStatus = async (parentId, status) => {
  try {
    const parentRef = doc(db, 'parents', parentId);
    await updateDoc(parentRef, {
      invoice_status: status
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
};
