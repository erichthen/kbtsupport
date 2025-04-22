import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import '../styles/about.css';

const AboutUs = () => {
  const history = useHistory();

  const [currentIndex, setCurrentIndex] = useState(1);
  const totalSlides = 7; // you have 7 images

  const prev = () => setCurrentIndex(idx => (idx === 1 ? totalSlides : idx - 1));
  const next = () => setCurrentIndex(idx => (idx === totalSlides ? 1 : idx + 1));

  

  useEffect(() => {
    document.body.classList.add('about-us');
    return () => {
      document.body.classList.remove('about-us');
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>About Us – KBT</title>
      </Helmet>

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
            <h2>About KBT Reading Support LLC.</h2>
          <div className="container">
            {/* <img src="/logo.jpg" alt="KBT Logo" className="contact-logo" /> */}
            <p className="first-about-text">
              KBT Reading support (Est. 2019) was founded and is run entirely by  
              Kelli Then–an experienced school teacher and reading specialist.  
              Kelli has been a school teacher for <b>30 years</b>.<br /><br />
              She is specialized and certified in grades K-6, and has a great deal of experience teaching  
              kids reading and writing skills. She has not stopped at school teaching—she has held multiple  
              positions as a specialized reading interventionist. <br /><br />If you reach out, Kelli will happily send
              her resume that encapsulates her vast experience in this field. 
            </p>
            <div className="slideshow-wrapper">
               <div className="slideshow">
                 <button className="slide-btn left" onClick={prev}>&lt;</button>
                 <img
                   src={`/kelli-photo-${currentIndex}.jpg`}
                   alt={`Slide ${currentIndex}`}
                 />
                 <button className="slide-btn right" onClick={next}>&gt;</button>
               </div>
            </div>

            <h4><b>Kelli's Certificates and Licenses: </b></h4>
            <ul>
                <li>License #5238 Diocese of Charlotte Catholic Schools</li>
                <li>License #CP-0650757 Commonwealth of Virginia</li>
                <li>License Program Code 51-025, State of North Carolina Department of Public Instruction</li>
                <li>License #8583395 Kansas State Board of Education</li>
                <li>Certificate #243-45-7268 Commonwealth of Kentucky</li>
                <li>Certificate, Institute of Multi‑Sensory Education, Orton‑Gillingham</li>
            </ul>
            <p><b>Interested in our service? Want to learn more?</b></p>
            <button className="contact-link" onClick={() => history.push('/contact-us')}>Reach out today!</button>

          </div>
        </div>
      </main>

      <footer>
        <p>Proudly empowering young readers around the globe, one word at a time.</p>
      </footer>
    </>
  );
};

export default AboutUs;
