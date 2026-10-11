import React from 'react';
import './Card.css';

const Card = ({ children, className = '', title, headerRight, ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || headerRight) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {headerRight && <div className="card-header-right">{headerRight}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;
