import React, { useEffect } from 'react';
import '../styles/steps.css';

const Step1 = ({ name, child, setName, setChild, goToNextStep, isFirstStepValid }) => {

  useEffect(() => {
    document.body.classList.add('step1');
    return () => {
      document.body.classList.remove('step1');
    };
  }, []);

  return (
    <>
      <h2 className="welcome">Welcome!</h2>
      <div className="input-container">
        <input
          className="name-input"
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (first and last)"
          aria-label="Enter your name"
        />
      </div>
      <div className="input-container">
        <input
          className="child-name-input"
          id="child"
          name="child"
          type="text"
          value={child}
          onChange={(e) => setChild(e.target.value)}
          placeholder="Childs name (first)"
          aria-label="Enter your child's name"
        />
      </div>
        <button
          className="step1-next"
          type="button"
          onClick={goToNextStep}
          disabled={!isFirstStepValid} 
        >
          Next
        </button>
      <p className="step-number">Step 1 of 3</p>
    </>
  );
};

export default Step1;