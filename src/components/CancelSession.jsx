import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getSessionsByParentId } from '../services/sessions';
import { getParentById } from '../services/firestore';
import { useHistory } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';
import { deleteSessionByDate } from '../services/sessions';
import '../styles/cancelsession.css';

const CancelSession = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [note, setNote] = useState(''); 
  const { user } = useAuth();
  const history = useHistory();
  const [parentName, setParentName] = useState('');

  useEffect(() => {
    document.body.classList.add('cancel-session');
    return () => {
      document.body.classList.remove('cancel-session');
    };
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      if (user) {
        try {
          const parentData = await getParentById(user.uid);
          if (parentData && parentData.id) {
            setParentName(parentData.parent_name);
            const sessions = await getSessionsByParentId(parentData.id);
            const sortedSessions = sessions.sort(
              (a, b) => new Date(a.session_time) - new Date(b.session_time)
            );
            setSessions(sortedSessions);
          }
        } catch (error) {
          console.error('Error fetching sessions: ', error);
        }
      }
    };

    fetchSessions();
  }, [user]);

  const formatSessionDate = (date) => {
    const sessionDate = new Date(date);
    const day = sessionDate.getDate();
    const ordinalSuffix = getOrdinalSuffix(day);
    return `${sessionDate.toLocaleString('en-US', { month: 'long' })} ${day}${ordinalSuffix}`;
  };

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const handleCancelSession = async () => {
    try {
      const parentData = await getParentById(user.uid);
      if (!parentData || !parentData.id) {
        throw new Error('Parent ID not found');
      }
      const parentId = parentData.id; 
  
      const sessionDate = selectedSession;

      console.log('Session to be deleted: ', sessionDate);
  
      const sendCancelEmail = httpsCallable(functions, 'sendCancelEmail');
      
      //calling cloud function to email amdin of cancellation
      const response = await sendCancelEmail({
        parentName: parentName,
        sessionDate: formatSessionDate(sessionDate),
        note: note,
      });
  
      if (response.data.success) {
        console.log('Cancellation email sent successfully.');
  
        //remove session from schedule
        await deleteSessionByDate(parentId, sessionDate);

        console.log(`Session should be deleted for parentId: ${parentId} at date: ${sessionDate}`);
  
        alert('Session canceled and email sent successfully.');
        history.push('/dashboard');
      } else {
        throw new Error(response.data.error || 'Failed to send cancellation email.');
      }
    } catch (error) {
      console.error(error);
      alert('Error canceling the session.');
    }
  };

  return (
    <div className="cancel-session-container">
      <h3>Select a session to cancel</h3>
      <select 
        value={selectedSession} 
        onChange={(e) => setSelectedSession(e.target.value)}
        className="session-dropdown"
      >
        <option value="">Select a session</option>
        {sessions.map(session => (
          <option key={session.id} value={session.session_time}>
            {formatSessionDate(session.session_time)}
          </option>
        ))}
      </select>
      
      {selectedSession && (
        <div className="note-container">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for the cancellation"
            className="note-textbox"
          />
        </div>
      )}
      <p>An email with the note will be sent to<br />KBT Reading Support regarding your cancellation.</p>
      <div className="buttons">
        <button
          onClick={handleCancelSession}
          className="cancel-button"
          disabled={!note || !selectedSession} 
        >
          Cancel Session
        </button>
        <button onClick={() => history.push('/dashboard')} className="back-button">Back</button>
      </div>
    </div>
  );
};

export default CancelSession;