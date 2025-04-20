import React, { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";
import { useHistory, useLocation } from "react-router-dom";
import '../styles/reportissue.css';
import { Helmet } from 'react-helmet';

const ReportIssue = () => {
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const history = useHistory();
  const location = useLocation();

  const from = location.state?.from || '/dashboard';

  useEffect(() => {
    document.body.classList.add("report-issue");
    return () => {
      document.body.classList.remove("report-issue");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!issue) {
      alert('Invalid request: empty field');
      return;
    }

    setLoading(true);

    const reportIssue = httpsCallable(functions, "reportIssue");

    try {
      const result = await reportIssue({issue: issue });
      if (result.data.success) {
        console.log('Submisson went through')
        setSubmitted(true);
      } else {
        alert('Error during submission');
        console.log(result.data);
        return;
      }
    } catch (error) {
      console.error("Error reporting issue:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Report an Issue - KBT</title>
      </Helmet>
      <body>
        <header>
          <h1>KBT Reading Support</h1>
          <nav>
            <button className="contact-us-button">Contact Us</button>
            <button className="contact-us-button">About Us</button>
          </nav>
        </header>
        <main>
          <div className="main-container">
            <h2>Report an Issue</h2>
            <div className="report-issue-container">
              {submitted ? (
                <p className="thank-you-message">Thank you for reporting your issue. It will be resolved as soon as possible.</p>
              ) : (
                <>
                  <form onSubmit={handleSubmit}>
                    <textarea
                      className="report-issue-textarea"
                      placeholder="Please describe the issue you're facing..."
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                    />
                    <button className="report-submit-button" type="submit" disabled={loading}>
                      {loading ? "Submitting..." : "Submit Issue"}
                    </button>
                  </form>
                </>
              )}
              <button className="report-back-button" onClick={() => history.push(from)}>Back</button>
            </div>
          </div>
        </main>
        <footer>
          <p>Proudly empowering young readers around the globe, one word at a time.</p>
        </footer>
      </body>
    </>
  );

};

export default ReportIssue;