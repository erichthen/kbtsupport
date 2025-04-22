import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import '../styles/contact.css';

const Contact = () => {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hasChild, setHasChild] = useState('');
  const [childAge, setChildAge] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [hearAbout, setHearAbout] = useState('');
  const [consent, setConsent] = useState(false);

  const history = useHistory();

  useEffect(() => {
    document.body.classList.add('contact-us');
    return () => document.body.classList.remove('contact-us');
  }, []);

  const resetAll = () => {
    setShowForm(false);
    setSubmitted(false);
    setName('');
    setEmail('');
    setHasChild('');
    setChildAge('');
    setOtherReason('');
    setHearAbout('');
    setConsent(false);
  };

  const handleFormSubmit = e => {
    e.preventDefault();
    const payload = {
      name,
      email,
      hasChild,
      ...(hasChild === 'yes' ? { childAge } : { otherReason }),
      hearAbout,
      consent
    };
    console.log('submit payload', payload);
    // TODO: actually send payload...
    setSubmitted(true);
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - KBT</title>
      </Helmet>
      <body>
        <header>
          <h1>KBT Reading Support</h1>
          <nav>
            <button
              className="contact-us-button"
              onClick={() => history.push('/contact-us')}
            >
              Contact Us
            </button>
            <button
              className="contact-us-button"
              onClick={() => history.push('/about-us')}
            >
              About Us
            </button>
          </nav>
        </header>

        <main>
          <div className="main-container">
            <h2>Reach out to us!</h2>
            <div className="container">

              {/** Initial view */}
              {!showForm && !submitted && (
                <>
                  <img src="/logo.jpg" alt="KBT Logo" className="contact-logo" />
                  <p>
                    Interested in reading support for your child? <br />
                    <strong>Fill out the form and let us know!</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="show-form-button"
                  >
                    Open Contact Form
                  </button>
                  <button
                    type="button"
                    onClick={() => history.push('/login')}
                    className="return-login-button"
                  >
                    Return to login
                  </button>
                </>
              )}

              {/** The form */}
              {showForm && !submitted && (
                <form className="contact-us-form" onSubmit={handleFormSubmit}>
                  <label className="name-label">
                    Name:
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </label>

                  <label className="email-label">
                    Email:
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </label>

                  <fieldset>
                    <legend>
                      Do you have a child who needs reading, comprehension, or writing support?
                    </legend>
                    <label>
                      <input
                        type="radio"
                        name="hasChild"
                        value="yes"
                        checked={hasChild === 'yes'}
                        onChange={e => setHasChild(e.target.value)}
                        required
                      />{' '}
                      Yes
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="hasChild"
                        value="no"
                        checked={hasChild === 'no'}
                        onChange={e => setHasChild(e.target.value)}
                      />{' '}
                      No
                    </label>
                  </fieldset>

                  {hasChild === 'yes' && (
                    <>
                    <label className="child-age-label">
                      Child Age:
                      <input
                        type="number"
                        min="1"
                        value={childAge}
                        onChange={e => setChildAge(e.target.value)}
                        required
                      />
                    </label>

                    <label className="child-needs-label"> 
                        Briefly describe your childs needs:
                        <textarea className="child-needs-text"></textarea>
                    </label>
                    </>
                  )}

                  {hasChild === 'no' && (
                    <label>
                      Please describe your inquiry:
                      <textarea
                        value={otherReason}
                        onChange={e => setOtherReason(e.target.value)}
                        required
                      />
                    </label>
                  )}

                  <label className="stacked">
                    How did you hear about us?
                    <select
                      value={hearAbout}
                      onChange={e => setHearAbout(e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      <option value="google">Google search</option>
                      <option value="referral">Friend/Family referral</option>
                      <option value="social">Social media</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={e => setConsent(e.target.checked)}
                      required
                    />{' '}
                    I agree to receive email and text (if phone included) updates about my inquiry
                  </label>

                  <button type="submit" className="submit-button">
                    Submit
                  </button>
                  <button
                    type="button"
                    className="close-form-button"
                    onClick={resetAll}
                  >
                    Close
                  </button>
                </form>
              )}

              {/** Thank‑you view */}
              {submitted && (
                <>
                  <p className="thank-you-message">
                    Thanks for reaching out! <br />We will get back to you soon.
                  </p>
                  <button
                    type="button"
                    className="show-form-button"
                    onClick={resetAll}
                  >
                    Return
                  </button>
                </>
              )}

            </div>
          </div>
        </main>

        <footer>
          <p>
            Proudly empowering young readers around the globe, one word at a time.
          </p>
        </footer>
      </body>
    </>
  );
};

export default Contact;