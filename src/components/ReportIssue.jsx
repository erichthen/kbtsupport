import React, { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";
import { useHistory } from "react-router-dom";
import '../styles/reportissue.css';

const ReportIssue = () => {
  const [email, setEmail] = useState("");
  const [issue, setIssue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const history = useHistory();

  useEffect(() => {
    document.body.classList.add("report-issue");
    return () => {
      document.body.classList.remove("report-issue");
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !issue) {
      setMessage("Please fill out both fields.");
      return;
    }

    setLoading(true);

    const reportIssue = httpsCallable(functions, "reportIssue");

    try {
      const result = await reportIssue({ clientEmail: email, issue: issue });
      if (result.data.success) {
        setSubmitted(true);
      } else {
        setMessage("Failed to report issue. Please try again.");
      }
    } catch (error) {
      console.error("Error reporting issue:", error);
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-issue report-issue-container">
      {submitted ? (
        <p className="thank-you-message">
          Thank you for reporting an issue. We value your feedback, and
          will work on resolving it as soon as possible.
        </p>
      ) : (
        <>
          <h1>Report an Issue</h1>
          <p className="report-text">
            Please briefly describe the issue you're experiencing.<br />
            Please provide your email in case the issue is specific to you.
          </p>
          <form onSubmit={handleSubmit}>
            <input
              id="email"
              name="email"
              type="email"
              className="report-email-input"
              placeholder="Enter your email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <textarea
              className="report-issue-textarea"
              placeholder="Describe the issue you're facing..."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
            />
            <button className="report-submit-button" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>
          {message && <p className="message">{message}</p>}
        </>
      )}

      <button
        className="report-back-button"
        onClick={() => history.push("/dashboard")}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default ReportIssue;