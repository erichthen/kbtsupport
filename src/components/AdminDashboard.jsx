// I apologize for the length of this file. Too lazy to refactor components at the moment. 

import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { sendSignInLink, logoutUser } from '../services/auth';
import DatePicker from 'react-datepicker';
import { deleteSessionsNotRaffaele } from '../services/sessions';
import { getSessions, deleteSessionsByDate, deleteSessionById, addSession } from '../services/sessions';
import { getParentEmailById, getParentByDocumentId, updateInvoiceStatus, getParents, getAllParentEmails, getAllParentNames } from '../services/firestore';
import { functions } from '../firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import '../styles/admindash.css';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { generateTimeSlots, getAvailableSlots, filterAvailableSlots } from '../services/sessions';
import { Helmet } from 'react-helmet';


const AdminDashboard = () => {

  const history = useHistory();
  const [email, setEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [selectedDayToRescheduleTo, setSelectedDayToRescheduleTo] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [showCancel, setShowCancel] = useState(false);  
  const [showOptions, setShowOptions] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showInvoices, setShowInvoices] = useState(false);
  const [invoices, setInvoices] = useState([]); 
  const [selectedParent, setSelectedParent] = useState(null);
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [showEmailParentForm, setShowEmailParentForm] = useState(false);
  const [showEmailAllParentsForm, setShowEmailAllParentsForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null); 
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState([]);
  const [parents, setParents] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedParentEmail, setSelectedParentEmail] = useState('');
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');
  const [successMessageEmail, setSuccessMessageEmail] = useState('');

  // applying CSS classes on mount
  useEffect(() => {
    document.body.classList.add('admin-dashboard');
    return () => {
      document.body.classList.remove('admin-dashboard');
    };
  }, []);

  // fetch the sessions from the database on component mount
  // and store into state
  useEffect(() => {
    // 
    const fetchSessions = async () => {
      const sessionsData = await getSessions();
      const formattedSessions = sessionsData.map(session => ({
        ...session,
        session_time: new Date(session.session_time)
      }));
      setSessions(formattedSessions);
    };

    fetchSessions();
  }, []);


  //
  useEffect(() => {
    const fetchSlotsForRescheduleToDay = async () => {
      if (!selectedDayToRescheduleTo || isNaN(selectedDayToRescheduleTo.getTime())) {
        return;
      }
  
      const availableSlots = generateTimeSlots(); 
      const bookedSlotsArray = await getAvailableSlots();
  
      const filteredBookedSlots = bookedSlotsArray.filter(slot => {
        const slotDate = new Date(slot);
        return (
          slotDate.getFullYear() === selectedDayToRescheduleTo.getFullYear() &&
          slotDate.getMonth() === selectedDayToRescheduleTo.getMonth() &&
          slotDate.getDate() === selectedDayToRescheduleTo.getDate()
        );
      });
  
      const filteredSlots = filterAvailableSlots(availableSlots, filteredBookedSlots, selectedDayToRescheduleTo);
  
      setFilteredSlots(filteredSlots); 
    };
  
    fetchSlotsForRescheduleToDay();
  }, [selectedDayToRescheduleTo]);

  // load the invoices that haven't been sent for the month
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoicesData = await getParents();
        const filteredInvoices = invoicesData.filter(invoice => !invoice.invoice_status);
        setInvoices(filteredInvoices);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };
    fetchInvoices();
  }, []);

  // store parent names into state on load
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const parentNames = await getAllParentNames();
        setParents(parentNames);
      } catch (error) {
        console.error("Failure to fetch names:", error);
        setErrorEmail("Failed to load parent names");
      }
    };
  
    fetchParents();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    history.push('/login');
  };

  // send a parent an invitation email that has a link to the registration form
  const handleSendInvite = async (e) => {
    e.preventDefault(); 

    // link to form
    const actionCodeSettings = {
      // url: 'https://kbt-reading-support.web.app/register',
      url: 'http://localhost:3000/register',
      handleCodeInApp: true,
    };
    
    try {
      setLoading(true);
      await sendSignInLink(email, actionCodeSettings);
      setSuccessMessage('Registration email sent successfully.');
      setEmail('');
    } catch (error) {
      setError(error);
      console.error('Error sending sign-in link:', error);
      alert('Error sending registration link.');
    }
    finally {
      setLoading(false);
    }
  };  

  // this is so the calendar knows which days have sessions
  const isDayWithSession = (date) => {
    return sessions.some(session => {
      const sessionDate = new Date(session.session_time);
      return (
        sessionDate.getFullYear() === date.getFullYear() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getDate() === date.getDate()
      );
    });
  };

  // when a day with sessions on the calendar is clicked, 
  // a modal with pop up with info on which sessions and when
  const handleDayClick = (date) => {
    const sessionsForDay = sessions.filter(session => {
      const sessionDate = new Date(session.session_time);
      return (
        sessionDate.getFullYear() === date.getFullYear() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getDate() === date.getDate()
      );
    });
  
    const formattedSessions = sessionsForDay.map(session => {
      const sessionTime = new Date(session.session_time);
  
      // sets the time explicitly in EST, regardless of the user's local timezone
      const formattedTime = sessionTime.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
  
      return {
        ...session,
        formattedTime: `${formattedTime} EST`, 
        sessionTime: sessionTime
      };
    });
    
    // sort the session times in ascending order
    formattedSessions.sort((a, b) => a.sessionTime - b.sessionTime);
  
    setSelectedSessions(formattedSessions);
    setSelectedDate(date);
    setShowSessions(true); 
  };

  // closes session popup
  const handleClosePopup = () => {
    setSelectedSessions([]);
    setShowSessions(false); 
  };

  const handleCancelSessions = () => {
    setShowCancelConfirmation(true);
  };

  const handleCloseCancelConfirmation = () => {
    setShowCancelConfirmation(false); 
  };

  // on submisson of canceling multiple sessions
  const confirmCancelSessions = async () => {
    if (selectedSessions.length === 0) {
      alert('No sessions selected');
      return;
    }

    try {
      const sessionDate = new Date(selectedSessions[0].session_time);

      // iterate through sessions to be cancelled and email parents of each session
      for (const session of selectedSessions) {
        const parentId = session.parent_id;
        const sessionDate = new Date(session.session_time).toLocaleString();

        const parentEmail = await getParentEmailById(parentId);

        const message = `
          Dear Parent,<br>
          Your child's session on ${sessionDate} has been canceled. We apologize for any inconvenience this may cause.<br>
          Best Regards,<br>
          KBT Reading Support
        `;

        const response = await axios.post('https://us-central1-kbt-reading-support.cloudfunctions.net/sendCancelationEmails', {
          email: parentEmail,
          subject: 'Session Cancelation Notification',
          message: message
        });
        console.log(response.data.message || 'Cancelation email sent successfully.');
      }

      // after sending the message, delete the session (logic handled in ../services/sessions.js)
      await deleteSessionsByDate(sessionDate);

      alert('All cancelation emails sent and sessions deleted successfully. Refresh to see changes.');
      setSelectedSessions([]);
      setShowSessions(false);
      setShowCancelConfirmation(false); 

    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
      alert('Error sending cancelation emails or deleting sessions.');
    }
  };

  // hide other containers and show reschedule container when clicked
  const handleRescheduleClick = () => {
    setShowCancel(false);
    setShowReschedule(false);
    setShowOptions(true); 
    setShowSendEmail(false);
    setShowInvoices(false);
  };

  // format how the date is shown in the dropdown and in sessions for day title
  const getFormattedDate = (date) => {
    const options = { month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // hide other containers, show send email
  const handleSendEmailClick = () => {
    setShowSendEmail(true);
    setShowInviteForm(false);
    setShowOptions(false);
    setShowReschedule(false);
    setShowCancel(false);
    setShowInvoices(false);
    setShowSessions(false);
  };

  // used when a dropdown option is selected
  const handleDaySelect = (event) => {
    const selected = new Date(event.target.value);
    setSelectedDay(selected); 
  };

  // once user selects a day, filter sessions to only contain sessions on that day
  const sessionsForSelectedDay = selectedDay
    ? sessions.filter(session => {
        const sessionDate = new Date(session.session_time);
        return (
          sessionDate.getFullYear() === selectedDay.getFullYear() &&
          sessionDate.getMonth() === selectedDay.getMonth() &&
          sessionDate.getDate() === selectedDay.getDate()
        );
      })
    : [];

  // once admin selects a day to reschedule, filter for the sessions only on that day
  // in order to populate the dropdown for that day
  const handleDayToRescheduleToSelect = async (event) => {
    const selected = new Date(event.target.value);
    setSelectedDayToRescheduleTo(selected); 
  
    const availableSlots = generateTimeSlots();
  
    const bookedSlots = await getAvailableSlots();
  
    const filteredSlots = filterAvailableSlots(availableSlots, bookedSlots, selected); 
  
    setFilteredSlots(filteredSlots);
  };

  // handle when admin sends an invoice to a client
  const handleSendInvoice = async () => {
    if (!file) {
      alert("Please upload a file");
      return;
    }

    // loading state where button is disabled
    setLoading(true);
    const fileReader = new FileReader();
    // 
    fileReader.readAsDataURL(file);
    fileReader.onload = async () => {
      const base64File = fileReader.result.split(",")[1];
      try {
        await axios.post(
          "https://us-central1-kbt-reading-support.cloudfunctions.net/sendMail",
          {
            email: selectedParent.email,
            subject: "View Your Monthly Invoice from KBT Reading Support",
            message: note,
            fileContent: base64File,
            fileName: file.name,
          }
        );
  
        // update the invoice status in the database for the selected parent
        await updateInvoiceStatus(selectedParent.id, true);
  
        // remove the invoice from local state so it no longer appears in the list
        setInvoices(invoices.filter((invoice) => invoice.id !== selectedParent.id));
  
        alert("Invoice sent successfully");
        // reset the invoice view (similar to handleBackToInvoices)
        setSelectedParent(null);
        setNote("");
      } catch (error) {
        console.error(error);
        alert("Error sending mail");
      } finally {
        setLoading(false);
      }
    };
  };

  // when admin confirms reschedule 
  const handleRescheduleSession = async () => {
    try {

      setLoading(true);
      // for debugging
      console.log("Selected Day:", selectedDay);
      console.log("Selected Session:", selectedSession);
      console.log("Selected Day to Reschedule To:", selectedDayToRescheduleTo);
      console.log("Selected Time Slot:", selectedTimeSlot);
  
      // if any of the fields are empty
      if (!selectedDay || !selectedSession || !selectedDayToRescheduleTo || !selectedTimeSlot) {
        alert("Please fill out all of the fields.");
        setLoading(false);
        return;
      }
      
      // for debugging a database issue
      if (!selectedSession.id) {
        console.error("Selected session does not have an ID.");
        setLoading(false);
        return;
      }
  
      await deleteSessionById(selectedSession.id);
      console.log(`Session for ${selectedSession.child_name} on ${selectedSession.session_time} deleted successfully.`);
  
      // deconstruct the date object info for the selected session to reschedule
      const timeParts = selectedTimeSlot.split(':');
      let hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      //handle am, pm, bc it was reading as 1:00am when it should have been pm
      if (selectedTimeSlot.includes('PM') && hours !== 12) {
        hours += 12;
      } else if (selectedTimeSlot.includes('AM') && hours === 12) {
        hours = 0; 
      }
      
      // construct the date object for the newly scheduled session
      const sessionData = {
        session_time: new Date(selectedDayToRescheduleTo.setHours(hours, minutes, 0, 0)).toISOString(),
        child_name: selectedSession.child_name,
        parent_id: selectedSession.parent_id,
      };
  
      // add the session
      const newSessionId = await addSession(selectedSession.parent_id, sessionData);
      console.log(`Rescheduled session added successfully with ID: ${newSessionId}`);
  
      // get the parent info so an email can be sent
      const parentData = await getParentByDocumentId(selectedSession.parent_id);
  
      if (!parentData) {
        console.log("Parent data or email not found.");
        setLoading(false);
        return;
      }
  
      // call the sendAdminReschedule firebase cloud function to send the email to the parent
      const sendAdminRescheduleEmail = httpsCallable(functions, 'sendAdminReschedule');
      const emailResponse = await sendAdminRescheduleEmail({
        parentEmail: parentData.email,
        parentName: parentData.parent_name,
        oldSessionDate: new Date(selectedSession.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        oldTimeSlot: new Date(selectedSession.session_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        newSessionDate: new Date(sessionData.session_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        newTimeSlot: selectedTimeSlot
      });
  
      if (emailResponse.data.success) {
        console.log("Reschedule email sent to parent successfully.");
        alert("Session rescheduled and email sent successfully. Refresh to see changes.");
      } else {
        alert("Error sending reschedule email: " + emailResponse.data.error);
      }
  
    } catch (error) {
      console.error("Error during rescheduling:", error);
      alert("Error rescheduling the session.");
    } finally {
      setLoading(false)
    }
  };

  const handleEmailParentClick = () => {
    setShowEmailParentForm(true);
    setShowEmailAllParentsForm(false);
  };

  const handleEmailAllParentsClick = () => {
    setShowEmailParentForm(false);
    setShowEmailAllParentsForm(true);
  };

  // process the file so it can be sent in the email
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

  // emailing all parents
  const handleSendEmailToAllParents = async (e) => {
    e.preventDefault();
    setLoadingEmail(true);
    setSuccessMessageEmail("");
    setErrorEmail("");
  
    // sessions.js helper 
    const emails = await getAllParentEmails();
    if (emails.length === 0) {
      setErrorEmail("There are no recipients");
      setLoadingEmail(false);
      return;
    }
    // try calling the firebase cloud function
    try {
      const sendEmailToAllParents = httpsCallable(functions, "emailAllParents");
      const response = await sendEmailToAllParents({
        // these are set using useStates in the return component
        subject,
        message,
        attachment,
      });

      // clear the fields when email is sent
      if (response.data.success) {
        setSuccessMessageEmail("Email sent successfully to all parents!");
        setSubject("");
        setMessage("");
        setAttachment(null);
      } else {
        setErrorEmail("Failed to send email.");
      }
    } catch (err) {
      console.error("Error sending email:", err);
      setErrorEmail("An error occurred while sending the email.");
    } finally {
      setLoadingEmail(false);
    }
  };

  // view the emails of each parent that will receieve the message
  const handleViewRecipients = async () => {
    try {
      const emails = await getAllParentEmails();
      setRecipientEmails(emails);
      setShowRecipientsModal(true);
    } catch (error) {
      console.error("Error fetching recipient emails:", error);
      setErrorEmail("Failed to fetch recipient emails.");
    }
  };

  // when a parent is selected or changed in the email a parent menu
  const handleParentChange = (e) => {
    const parentId = e.target.value;
    setSelectedParentId(parentId);
    const parent = parents.find((parent) => parent.id === parentId);
    if (parent) {
      setSelectedParentEmail(parent.email);
    } else {
      setSelectedParentEmail("");
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

  const handleBackClick = () => {
    if (showEmailAllParentsForm || showEmailParentForm) {
      setShowEmailAllParentsForm(false);
      setShowEmailParentForm(false);
      setSubject('');
      setMessage('');
      setAttachment(null);
    } else {
      // otherwise, just hide the send email branch.
      setShowSendEmail(false);
    }
  };

  // populate dropdown for options when rescheduling a session
  const getAllDaysForNextThreeMonths = () => {
    const days = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 3);
  
    let currentDate = new Date(today);
  
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return days;
  };

  const submitCancelSession = async () => {

    if (!selectedDay || !selectedSession) {
      alert("Please select a day and session to cancel.");
      return;
    }
  
    try {
      setLoading(true);
      const parentData = await getParentByDocumentId(selectedSession.parent_id);
      
      if (!parentData) {
        console.log("Parent data or email not found.");
        setLoading(false);
        return;
      }
      
      // format the date of the canceled session for the email
      const sessionDateFormatted = new Date(selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  
      const sendAdminCancel = httpsCallable(functions, 'sendAdminCancel');
      const emailResponse = await sendAdminCancel({
        parentName: parentData.parent_name,
        parentEmail: parentData.email,
        sessionDate: sessionDateFormatted
      });
  
      if (emailResponse.data.success) {
        alert("Cancelation email sent successfully.");
  
        // remove session from db if the email was sent successfully
        await deleteSessionById(selectedSession.id);
  
        alert("Session canceled successfully. Refresh to see changes.");
        setShowCancel(false); 
        setShowOptions(true); 
      } else {
        alert("Error sending cancelation email: " + emailResponse.data.error);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error canceling session:", error);
      alert("Error canceling session. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Admin Dashboard - KBT</title>
      </Helmet>
      <body>
        <header>
          <h1>KBT Reading Support</h1>
          <nav>
            <button
              className="nav-button"
              onClick={() => {
                setShowInviteForm(true);
                setShowOptions(false);
                setShowReschedule(false);
                setShowCancel(false);
                setShowInvoices(false);
                setShowSessions(false);
                setShowSendEmail(false);
              }}
            >
              Add Client
            </button>
            <button
              className="nav-button"
              onClick={() =>
                window.open(
                  "https://us04web.zoom.us/j/8821932666?pwd=c08ydWNqQld0VzFFRVJDcm1IcTBUdz09&omn=74404485715",
                  "_blank",
                  "noopener noreferrer"
                )
              }
            >
              Join Zoom Meeting
            </button>
            <button
              className="nav-button"
              onClick={() => {
                setShowInvoices(true);
                setShowInviteForm(false);
                setShowOptions(false);
                setShowReschedule(false);
                setShowCancel(false);
                setShowSessions(false);
              }}
            >
              Invoices
            </button>
            <button className="nav-button" onClick={handleRescheduleClick}>
              Reschedule/Cancel
            </button>
            <button className="nav-button" onClick={handleSendEmailClick}>
              Send Email(s)
            </button>
          </nav>
        </header>
        <main>
          <div className="content-wrapper">
            {!(showReschedule || showSessions || showCancel || showOptions || showInviteForm || showSendEmail || showInvoices) && <h2 className="greeting">Hello, Kelli!</h2>}
            <div className="wrapper">
              {showInvoices ? (
                <div className="invoices-main-container">
                  {!selectedParent ? (
                    <>
                      <h2 className="invoice-title">
                        Invoices for {new Date().toLocaleString("default", { month: "long" })}
                      </h2>
                      <div className="invoices-section">
                        <ul>
                          {invoices.length === 0 ? (
                            <p className="no-invoices-message">
                              <strong>No more invoices for the month!</strong>
                              <br />
                              Invoice statuses will be reset at 11:59 p.m. on the first day of the month.
                            </p>
                          ) : (
                            <>
                              <p id="invoice-count-text"><strong>You have {invoices.length} invoices to send out.</strong></p>
                              {invoices.map((invoice) => (
                                <li key={invoice.id}>
                                  <button
                                    className="send-invoice-button"
                                    onClick={() => setSelectedParent(invoice)}
                                  >
                                    Click here to send an invoice to <strong>{invoice.parent_name}</strong> - {invoice.child_name}'s parent
                                  </button>
                                </li>
                              ))}
                            </>
                          )}
                        </ul>
                        <button
                          id="invoice-back-button"
                          className="back-button"
                          onClick={() => setShowInvoices(false)}
                        >
                          Back
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 id="invoice-send-title">Send an invoice to {selectedParent.parent_name}</h2>
                      <textarea
                        className="note-field"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="(Optional) Write a note..."
                      />
                      <label id="invoice-upload-label" htmlFor="file-input" className="upload-button">
                        Click here to upload a PDF of the invoice
                      </label>
                      <input
                        type="file"
                        id="file-input"
                        className="file-input"
                        accept="application/pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                      />
                      {file && <p>Uploaded File: {file.name}</p>}
                      <p id="invoice-email-message"><strong>An email containing this invoice and the optional note will be sent to {selectedParent.email}</strong></p>
                      <div className="buttons-container">
                        <button
                          className="final-send-button"
                          onClick={handleSendInvoice}
                          disabled={loading}
                        >
                          {loading ? "Sending..." : "Send Invoice"}
                        </button>
                        <button
                          id="invoice-back-button"
                          className="back-button"
                          onClick={() => {
                            setSelectedParent(null);
                            setNote("");
                          }}
                        >
                          Back
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : showReschedule ? (
                <div className="reschedule-container">
                  <h2 className="reschedule-title">Reschedule a Session</h2>
                  <select
                    id="first-dropdown"
                    className="session-dropdown"
                    onChange={handleDaySelect}
                  >
                    <option value="">Select a Day</option>
                    {sessions
                      .sort((a, b) => new Date(a.session_time) - new Date(b.session_time))
                      .map((session, index) => (
                        <option key={index} value={session.session_time}>
                          {getFormattedDate(new Date(session.session_time))}
                        </option>
                      ))}
                  </select>
                  <select
                    className="session-dropdown"
                    onChange={(e) => {
                      const sessionId = e.target.value;
                      const session = sessionsForSelectedDay.find((s) => s.id === sessionId);
                      setSelectedSession(session);
                    }}
                  >
                    <option value="">Select a Session</option>
                    {sessionsForSelectedDay.length > 0 ? (
                      sessionsForSelectedDay.map((session, index) => (
                        <option key={index} value={session.id}>
                          {`${session.child_name} at ${session.session_time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}`}
                        </option>
                      ))
                    ) : (
                      <option>No sessions available</option>
                    )}
                  </select>
                  <select className="session-dropdown" onChange={handleDayToRescheduleToSelect}>
                    <option className="day-select" value="">Select a New Day</option>
                    {getAllDaysForNextThreeMonths().map((day, index) => (
                      <option key={index} value={day.toISOString()}>
                        {getFormattedDate(new Date(day))}
                      </option>
                    ))}
                  </select>
                  <select
                    className="session-dropdown"
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  >
                    <option value="">Select a New Time</option>
                    {filteredSlots.map((slot, index) => (
                      <option key={index} value={slot.time} disabled={slot.status === "unavailable"}>
                        {slot.time} {slot.status === "unavailable" ? "(Unavailable)" : ""}
                      </option>
                    ))}
                  </select>
                  <p id="reschedule-note">
                    <strong>Note: </strong>An email will be sent to the parent.
                  </p>
                  <button
                    className="reschedule-session-button"
                    onClick={handleRescheduleSession}
                    disabled={loading}
                  >
                    {loading ? "Rescheduling..." : "Reschedule Session"}
                  </button>
                  <button
                    id="reschedule-back-button"
                    className="back-button"
                    onClick={() => {
                      setShowReschedule(false);
                      setShowOptions(true);
                    }}
                  >
                    Back
                  </button>
                </div>
              ) : showSendEmail ? (
                <div className="send-emails">
                    {!showEmailParentForm && !showEmailAllParentsForm && (
                      <h2 className="send-email-title">Send an email to...</h2>
                    )}
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
                        <button type="button" id="email-back-button" className="back-button" onClick={handleBackClick}>
                          Back
                        </button>
                      </>
                    )}
                    {showEmailAllParentsForm && (
                      <form className="email-all-parents-form" onSubmit={handleSendEmailToAllParents}>
                        <h2 className="email-all-parents-title">Email All Parents</h2>
                        <div className="form-group">
                          <label class="send-email-label" htmlFor="email-all-subject-input">Subject of the email:</label>
                          <input
                            className="email-subject-input"
                            id="email-all-subject-input"
                            type="text"
                            value={subject}
                            placeholder="Subject..."
                            onChange={(e) => setSubject(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label class="send-email-label" for="email-all-email-input">Write the email below:</label>
                          <textarea
                            id="email-all-email-input"
                            className="email-textbox"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type out email..."
                            required
                          ></textarea>
                        </div>
                        <div className="form-group">
                          <label class="send-email-label" id="send-emails-file-label" htmlFor="email-all-file-input">Click here to upload a file (Optional)</label>
                          <input id="email-all-file-input" type="file" onChange={handleAttachmentChange} />
                        </div>
                        <div id="view-recipients-div">
                          <button className="view-recipients-button" type="button" onClick={handleViewRecipients}>
                            Click here to view recipients
                          </button>
                        </div>

                        {successMessage && <p className="success-message">{successMessage}</p>}
                        {error && <p className="error-message">{error}</p>}
                        <div class="email-send-and-back-btn-container">
                          <button type="submit" className="send-email-button" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Email'}
                          </button>
                          <button type="button" id="email-all-back-button" className="back-button" onClick={handleBackClick}>
                            Back
                          </button>
                        </div>
                      </form>
                    )}
                    {showEmailParentForm && (
                      <form className="email-parent-form" onSubmit={handleEmailParent}>
                        <h2 className="email-a-parent-title">Email a Parent</h2>
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
                        {selectedParentEmail && (<p className="selected-parent-email">An email will be sent to: <strong>{selectedParentEmail}</strong></p>)}
                        <div className="form-group">
                          <label class="send-email-label" htmlFor="send-email-subject-input">Subject of the email: </label>
                          <input
                            id="send-email-subject-input"
                            className="email-subject-input"
                            type="text"
                            value={subject}
                            placeholder="Email subject"
                            onChange={(e) => setSubject(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label class="send-email-label" for="email-parent-input">Write the email below:</label>
                          <textarea
                            id="email-parent-input"
                            className="email-textbox"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your email here"
                            required
                          ></textarea>
                        </div>
                        <div className="form-group">
                          <label id="send-email-file-label" class="send-email-label" htmlFor="email-parent-file-input">Click here to upload a file (Optional)</label>
                          <input id="email-parent-file-input" type="file" onChange={handleAttachmentChange} />
                        </div>
                        {successMessage && <p className="success-message">{successMessage}</p>}
                        {error && <p className="error-message">{error}</p>}
                        <div class="email-send-and-back-btn-container">
                          <button type="submit" className="send-email-button" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Email'}
                          </button>
                          <button type="button" id="email-a-parent-back-button" className="back-button" onClick={handleBackClick}>
                            Back
                          </button>
                        </div>
                      </form>
                    )}
                    {showRecipientsModal && (
                        <div className="modal-overlay">
                          <div className="modal-content">
                            <h3 id="recipients-title">Recipients</h3>
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
              ) : showSessions ? (
                <div className="session-container">
                  <h2 className="session-title">Sessions for {getFormattedDate(selectedDate)}</h2>
                  {selectedSessions.length > 0 ? (
                    selectedSessions.map((session, index) => (
                      <div key={session.id} className="session-info">
                        <p>{session.child_name}</p>
                        <p>
                          {session.session_time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="no-sessions">No sessions!</p>
                  )}
                  <div className="sessions-buttons">
                    {selectedSessions.length > 0 && (
                      <button
                        className="cancel-sessions-button"
                        onClick={handleCancelSessions}
                      >
                        Cancel Sessions
                      </button>
                    )}
                    <button className="back-button" onClick={handleClosePopup}>
                      Back
                    </button>
                  </div>
                </div>
              ) : showCancel ? (
                <div className="cancel-container">
                  <h2 className="cancel-title">Cancel a Session</h2>
                  <p className="cancel-note">
                    If you would like to cancel <strong>a day <br />of sessions,</strong> you can do so
                    <br />by clicking the day on the calendar.
                  </p>
                  <select className="cancel-session-dropdown" onChange={handleDaySelect}>
                    <option value="">Select a Day</option>
                    {sessions
                      .sort((a, b) => new Date(a.session_time) - new Date(b.session_time))
                      .map((session, index) => (
                        <option key={index} value={session.session_time}>
                          {getFormattedDate(new Date(session.session_time))}
                        </option>
                      ))}
                  </select>
                  <select
                    className="cancel-session-dropdown"
                    onChange={(e) => {
                      const sessionId = e.target.value;
                      const session = sessionsForSelectedDay.find((s) => s.id === sessionId);
                      setSelectedSession(session);
                    }}
                  >
                    <option value="">Select a Session</option>
                    {sessionsForSelectedDay.length > 0 ? (
                      sessionsForSelectedDay.map((session, index) => (
                        <option key={index} value={session.id}>
                          {`${session.child_name} at ${session.session_time.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}`}
                        </option>
                      ))
                    ) : (
                      <option>No sessions available</option>
                    )}
                  </select>
                  <p className="cancel-note-2">
                    <strong>Note: </strong>An email will be sent to the parent.
                  </p>
                  <button
                    className="cancel-session-btn"
                    onClick={submitCancelSession}
                    disabled={loading}
                  >
                    {loading ? "Canceling..." : "Cancel Selected Session"}
                  </button>
                  <button
                    id="cancel-back-button"
                    className="back-button"
                    onClick={() => {
                      setShowCancel(false);
                      setShowOptions(true);
                    }}
                  >
                    Back
                  </button>
                </div>
              ) : showOptions ? (
                <div className="options-container">
                  <h2 id="options-title">Do you want to...</h2>
                  <div className="options-buttons">
                    <button
                      id="reschedule-option-button"
                      className="option-buttons"
                      onClick={() => {
                        setShowReschedule(true);
                        setShowOptions(false);
                      }}
                    >
                      Reschedule
                    </button>
                    <button
                      id="cancel-option-button"
                      className="option-buttons"
                      onClick={() => {
                        setShowCancel(true);
                        setShowOptions(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  <button
                    id="options-back-button"
                    className="back-button"
                    onClick={() => {
                      setShowOptions(false);
                    }}
                  >
                    Go back
                  </button>
                </div>
              ) : (
                <>
                  {showInviteForm ? (
                    <div>
                      <div className="add-client-container">
                        <h2 className="add-client-title">Add a client</h2>
                        <form className="add-client-form" onSubmit={handleSendInvite}>
                          <input
                            className="client-email-input"
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setSuccessMessage("");
                            }}
                            placeholder="Enter parent email..."
                            required
                          />
                          <div className={`success-message ${successMessage ? "visible" : ""}`}>
                            {successMessage}
                          </div>
                          {error && <div className="error">{error}</div>}
                          <button
                            className="send-button"
                            type="submit"
                            disabled={loading || email === ""}
                          >
                            {loading ? "Sending..." : "Send Invite"}
                          </button>
                        </form>
                        <button
                          id="add-client-back-button"
                          className="back-button"
                          onClick={() => {
                            setShowInviteForm(false);
                            setEmail("");
                            setError("");
                            setSuccessMessage("");
                          }}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="calendar-container">
                      <DatePicker
                        inline
                        highlightDates={sessions.map((session) => new Date(session.session_time))}
                        dayClassName={(date) => (isDayWithSession(date) ? "session-day" : undefined)}
                        onChange={handleDayClick}
                      />
                    </div>
                  )}
                </>
              )}
              {showCancelConfirmation && (
                <div className="cancel-confirmation-overlay">
                  <div className="cancel-confirmation-popup">
                    <p>
                      Are you sure you want to cancel these sessions? <br /> An email will be sent to the parent
                    </p>
                    <div className="cancel-confirmation-buttons">
                      <button className="sessions-confirm-button" onClick={confirmCancelSessions}>
                        Yes
                      </button>
                      <button className="sessions-cancel-button" onClick={handleCloseCancelConfirmation}>
                        No
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {!(showReschedule ||
              showSessions ||
              showCancel ||
              showOptions ||
              showInviteForm ||
              showSendEmail || 
              showInvoices) && (
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        </main>
        <footer>
          <p>Proudly empowering young readers around the globe, one word at a time.</p>
        </footer>
      </body>
    </>
  );
};

  export default AdminDashboard;