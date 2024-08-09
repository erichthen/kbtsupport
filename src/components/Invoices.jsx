import React, { useEffect, useState } from 'react';
import { getParents } from '../services/firestore';
import { useHistory } from 'react-router-dom';
import '../styles/invoices.css';
import axios from 'axios';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const history = useHistory();

  useEffect(() => {
    const fetchInvoices = async () => {
      const invoicesData = await getParents();
      setInvoices(invoicesData);
    };

    fetchInvoices();
  }, []);

  const handleBackToAdmin = () => {
    history.push('/admin');
  };

  const handleBackToInvoices = () => {
    setSelectedParent(null);
    setNote('');
  };

  const handleNoteChange = (event) => {
    setNote(event.target.value);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSendInvoiceClick = (parent) => {
    setSelectedParent(parent);
  };

  const handleSendInvoice = async () => {
    if (!file) {
      alert('Please upload a file');
      return;
    }

    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);

    fileReader.onload = async () => {
      const base64File = fileReader.result.split(',')[1]; 
      try {
        await axios.post('https://us-central1-kbt-reading-support.cloudfunctions.net/sendMail', {
          email: selectedParent.email,
          subject: 'View Your Monthly Invoice from KBT Reading Support',
          message: note,
          fileContent: base64File,
          fileName: file.name
        });
        alert('Invoice sent successfully');
        handleBackToInvoices();
      } 
      catch (error) {
        console.error(error.response.data);
        alert('Error sending mail');
      }
    };
  };

  return (
    <div className="invoices-main-container">
      {!selectedParent ? (
        <div className="invoices-section">
          <h2>Invoices for {new Date().toLocaleString('default', { month: 'long' })}</h2>
          <ul>
            {invoices.map(invoice => (
              <li key={invoice.id}>
                <span>{invoice.parent_name} - {invoice.child_name}</span>
                <button className="send-invoice-button" onClick={() => handleSendInvoiceClick(invoice)}>Send Invoice</button>
              </li>
            ))}
          </ul>
          <button className="back-button" onClick={handleBackToAdmin}>Back</button>
        </div>
      ) : (
        <div className="invoice-upload-section">
          <h2>Send Invoice to {selectedParent.parent_name}</h2>
          <textarea className="note-field" value={note} onChange={handleNoteChange} placeholder="(Optional) Write a note..."/>
          <label htmlFor="file-input" className="upload-button">Upload the invoice PDF</label>
          <input type="file" id="file-input" className="file-input" accept="application/pdf" onChange={handleFileChange}/>
          {file && <p>Uploaded File: {file.name}</p>}
          <p>This email will be sent to: {selectedParent.email}</p>
          <div className="buttons-container">
            <button className="back-button" onClick={handleBackToInvoices}>Back</button>
            <button className="send-invoice-button" onClick={handleSendInvoice}>Send Invoice</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;