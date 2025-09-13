import React from 'react';
import './ComingSoon.css';

const ComingSoon = ({ title = "Coming Soon", description = "This feature is under development." }) => {
  return (
    <div className="coming-soon">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">🚧</div>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="coming-soon-animation">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;