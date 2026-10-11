import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.125rem 0.5rem',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
  };

  const variants = {
    default: { backgroundColor: 'var(--border-color)', color: 'var(--text-main)' },
    primary: { backgroundColor: 'rgba(249, 115, 22, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)' },
    success: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', border: '1px solid var(--status-success)' },
    warning: { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-warning)', border: '1px solid var(--status-warning)' }
  };

  const style = { ...baseStyle, ...(variants[variant] || variants.default) };

  return (
    <span style={style} className={className}>
      {children}
    </span>
  );
};

export default Badge;
