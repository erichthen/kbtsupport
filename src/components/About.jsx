// src/components/AboutUs.jsx
import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
// import { Helmet } from 'react-helmet';
import '../styles/about.css';

const AboutUs = () => {
  const history = useHistory();

  useEffect(() => {
    document.body.classList.add('about-us');
    return () => {
      document.body.classList.remove('about-us');
    };
  }, []);

  return (
    <>
      {/* <Helmet>
        <title>About Us – KBT</title>
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
            <div className="container">
              <h2>About Us</h2>
                <p>*About page is in progress*
                    It will include images, a video, and some text
                </p>
            </div>
          </div>
        </main>

        <footer>
          <p>Proudly empowering young readers around the globe, one word at a time.</p>
        </footer>
      </body> */}
      <p>Note: About page still in progress.</p>
      <p>It will include the header/footer, images, a video, and text</p>
      <button onClick={() => {history.push('/login')}}>Return to login</button>
    </>
  );
};

export default AboutUs;