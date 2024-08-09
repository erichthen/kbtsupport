import React from 'react';

const Step1 = ({ name, child, setName, setChild, goToNextStep }) => {
  return (
    <>
    <h1>Welcome!</h1>
      <div className="input-container">
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          aria-label="Enter your name"
        />
      </div>
      <div className="input-container">
        <input
          id="child"
          name="child"
          type="text"
          value={child}
          onChange={(e) => setChild(e.target.value)}
          placeholder="Enter your child's name"
          aria-label="Enter your child's name"
        />
      </div>
      <div className="nav-buttons">
        <button type="button" onClick={goToNextStep}>Next</button>
      </div>
    </>
  );
};

export default Step1;