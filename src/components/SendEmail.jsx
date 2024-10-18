import React, {useEffect, useState} from 'react';
import { useHistory } from 'react-router-dom';
import '../styles/sendemail.css';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';
import { getAllParentEmails, getAllParentNames } from '../services/firestore'; 

const SendEmail = () => {

    const history = useHistory();
    const [showEmailParentForm, setShowEmailParentForm] = useState(false);
    const [showEmailAllParentsForm, setShowEmailAllParentsForm] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [attachment, setAttachment] = useState(null); // For file upload
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [showRecipientsModal, setShowRecipientsModal] = useState(false);
    const [recipientEmails, setRecipientEmails] = useState([]);
    const [parents, setParents] = useState([]);
    const [selectedParentId, setSelectedParentId] = useState('');
    const [selectedParentEmail, setSelectedParentEmail] = useState('');

    useEffect(() => {
        document.body.classList.add('send-emails');

        const fetchParents = async () => {
            try {
                const parentNames = await getAllParentNames();
                setParents(parentNames);
            }
            catch (error) {
                console.error('Failure to fetch names: ', error);
                setError('Failed to load parent names');
            }
        };

        fetchParents();

        return () => {
          document.body.classList.remove('send-emails');
        };
      }, []);
    
    useEffect(() => {
      const testFunctions = async () => {
        try {
          const emails = await getAllParentEmails();
          console.log('Parent Emails:', emails);
    
          const parents = await getAllParentNames();
          console.log('Parents:', parents);
        } catch (error) {
          console.error('Error testing functions:', error);
        }
      };
    
      testFunctions();
    }, []);

    const handleEmailParentClick = () => {
        setShowEmailParentForm(true);
        setShowEmailAllParentsForm(false);
    };

    const handleEmailAllParentsClick = () => {
        setShowEmailParentForm(false);
        setShowEmailAllParentsForm(true);
    };

    const handleBackClick = () => {

        if (showEmailAllParentsForm || showEmailParentForm) {
          setShowEmailAllParentsForm(false);
          setShowEmailParentForm(false);
          setSubject('');
          setMessage('');
          setAttachment(null);
          setSuccessMessage('');
          setError('');

        } else {
          history.goBack();
        }
    };

    const handleAttachmentChange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setAttachment({
              fileName: file.name,
              content: reader.result.split(',')[1], 
            });
          };
          reader.readAsDataURL(file);
        } else {
          setAttachment(null);
        }
    };

    const handleSendEmailToAllParents = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setError('');
    
        const emails = await getAllParentEmails();
        if (emails.length === 0) {
          setError('There are no recepients');
          setLoading(false);
          return;
        }
        try {
          const sendEmailToAllParents = httpsCallable(functions, 'emailAllParents');
          const response = await sendEmailToAllParents({
            subject,
            message,
            attachment,
          });
    
          if (response.data.success) {
            setSuccessMessage('Email sent successfully to all parents!');
            setSubject('');
            setMessage('');
            setAttachment(null);
          } else {
            setError('Failed to send email.');
          }

        } catch (err) {
          console.error('Error sending email:', err);
          setError('An error occurred while sending the email.');

        } finally {
          setLoading(false);
        }
    };

    const handleViewRecipients = async () => {
        try {
          const emails = await getAllParentEmails();        
          setRecipientEmails(emails);
          setShowRecipientsModal(true);
        } catch (error) {
          console.error('Error fetching recipient emails:', error);
          setError('Failed to fetch recipient emails.');
        }
    };

    const handleParentChange = (e) => {
        const parentId = e.target.value;
        setSelectedParentId(parentId);
      
        const parent = parents.find((parent) => parent.id === parentId);
        if (parent) {
          setSelectedParentEmail(parent.email);
        } else {
          setSelectedParentEmail('');
        }
    };

    const handleEmailParent = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setError('');

        if (!selectedParentId) {
            setError('Please select a parent.');
            setLoading(false);
            return;
        }

        try {
            const sendEmailToParent = httpsCallable(functions, 'emailAParent');
            const response = await sendEmailToParent({
                email: selectedParentEmail,
                subject,
                message,
                attachment,
            });  

            if (response.data.success) {
                setSuccessMessage('Email sent successfully to the parent!');
                setSubject('');
                setMessage('');
                setAttachment(null);
                setSelectedParentId('');
                setSelectedParentEmail('');
              } else {
                setError('Failed to send email.');
              }
        } catch (err) {
              console.error('Error sending email:', err);
              setError('An error occurred while sending the email.');

        } finally {
              setLoading(false);
        }
    };


            
    
  return (
    <div className="send-emails">
      <div className="send-email-container">
        <div className="send-email-inner-container">
        {!showEmailParentForm && !showEmailAllParentsForm && (<h1 className="send-email-title">Send an email to...</h1>)}
          {!showEmailParentForm && !showEmailAllParentsForm && (
            <>
              <div className="email-options">
                <button className="email-option-button" onClick={handleEmailParentClick}>
                  A parent
                </button>
                <button className="email-option-button" onClick={handleEmailAllParentsClick}>
                  All parents
                </button>
              </div>
              <button type="button" className="email-back-button" onClick={handleBackClick}>
                Back
              </button>
            </>
          )}

          {showEmailAllParentsForm && (
            <form className="email-all-parents-form" onSubmit={handleSendEmailToAllParents}>
              <h2>Email All Parents</h2>
              <div className="form-group">
                <input
                  type="text"
                  value={subject}
                  placeholder='Email subject'
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  className="email-all-textbox"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder='Type your email here'
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label className="attachment">Attachment (optional):</label>
                <input type="file" onChange={handleAttachmentChange} />
              </div>

              <button className="view-recipients-button" type="button" onClick={handleViewRecipients}>View recepients</button>
              {successMessage && <p className="success-message">{successMessage}</p>}
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="send-email-button" disabled={loading}>
                {loading ? 'Sending...' : 'Send Email'}
              </button>
              <button type="button" className="email-back-button" onClick={handleBackClick}>
                Back
              </button>
            </form>
          )}

          {showEmailParentForm && (
            <form className="email-parent-form" onSubmit={handleEmailParent}>
              <h2>Email a Parent</h2>          
              <div className="form-group">
                <select
                  id="parent-select"
                  value={selectedParentId}
                  onChange={handleParentChange}
                  required
                >
                  <option value="">Select a Parent</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Display Selected Parent's Email */}
              {selectedParentEmail && (
                <p className="selected-parent-email">
                  An email will be sent to: {selectedParentEmail}
                </p>
              )}
          
              {/* Subject Input */}
              <div className="form-group">
                <input
                  type="text"
                  value={subject}
                  placeholder="Email subject"
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
          
              {/* Message Textarea */}
              <div className="form-group">
                <textarea
                  className="email-textbox"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder='Type your email here'
                  required
                ></textarea>
              </div>
          
              {/* Attachment Input */}
              <div className="form-group">
                <label>Attachment (optional):</label>
                <input type="file" onChange={handleAttachmentChange} />
              </div>
          
              {successMessage && <p className="success-message">{successMessage}</p>}
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="send-email-button" disabled={loading }>
                {loading ? 'Sending...' : 'Send Email'}
              </button>
              <button type="button" className="email-back-button" onClick={handleBackClick}>
                Back
              </button>
            </form>
          )}

          {showRecipientsModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                {recipientEmails.length > 0 ? (
                  <ul className="email-list">
                    {recipientEmails.map((email, index) => (
                      <li key={index}>{email}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No recipients found.</p>
                )}
                <button
                  className="close-modal-button"
                  onClick={() => setShowRecipientsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendEmail;





