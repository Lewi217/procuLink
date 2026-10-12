import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ThemeToggle';
import Badge from '../ui/Badge';
import './Layout.css';

const TopNav = ({ userContext }) => {
  const { logout } = useAuth ? useAuth() : {};
  const displayName = userContext?.company_name || userContext?.full_name || userContext?.email || 'User';
  const displayRole = userContext?.role === 'MANUFACTURER' ? 'BUYER' : (userContext?.role || 'BUYER');
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="topnav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{displayName}</span> 
          <Badge variant="default">{displayRole}</Badge>
        </h2>
      </div>
      <div className="topnav-right">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} / {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} EAT
        </div>
        <ThemeToggle />
        <button 
          title="Sign out"
          onClick={logout} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <LogOut size={18} />
        </button>
        <div className="user-avatar" title={displayName}>
          {initials}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
