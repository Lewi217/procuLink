import React from 'react';
import { Bell } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import Badge from '../ui/Badge';
import './Layout.css';

const TopNav = ({ userContext }) => {
  return (
    <header className="topnav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)' }}>
          {userContext.companyName} <Badge className="ml-2" variant="default">{userContext.role}</Badge>
        </h2>
      </div>
      <div className="topnav-right">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} / {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} EAT
        </div>
        <ThemeToggle />
        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <Bell size={20} />
        </button>
        <div className="user-avatar">
          {userContext.companyName.substring(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
