import React from 'react';

const ProgressBar = ({ progress = 0, labelLeft, labelRight, className = '' }) => {
  const percentage = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`progress-container ${className}`} style={{ width: '100%' }}>
      {(labelLeft || labelRight) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {labelLeft && <span>{labelLeft}</span>}
          {labelRight && <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{labelRight}</span>}
        </div>
      )}
      <div style={{ height: '0.5rem', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '1rem', overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${percentage}%`, 
            backgroundColor: 'var(--primary)', 
            transition: 'width 0.5s ease-in-out' 
          }} 
        />
      </div>
    </div>
  );
};

export default ProgressBar;
