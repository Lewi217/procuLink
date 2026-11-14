import React, { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, LogOut, Check, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ThemeToggle';
import './Layout.css';

const TopNav = ({ userContext }) => {
  const { logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isSupplier = userContext?.role === 'SUPPLIER';
  const displayName = userContext?.company_name || userContext?.full_name || (isSupplier ? 'Nairobi Steel Supply' : 'Kamau Fabricators');
  const displayRole = isSupplier ? 'SUPPLIER' : 'BUYER';
  const initials = isSupplier ? 'NS' : (displayName.substring(0, 2).toUpperCase() || 'KF');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchToBuyer = () => {
    setDropdownOpen(false);
    if (setUser) {
      setUser({
        ...userContext,
        role: 'MANUFACTURER',
        company_name: 'Kamau Fabricators',
        full_name: 'Kamau Mwangi',
      });
    }
    navigate('/buyer/overview');
  };

  const handleSwitchToSupplier = () => {
    setDropdownOpen(false);
    if (setUser) {
      setUser({
        ...userContext,
        role: 'SUPPLIER',
        company_name: 'Nairobi Steel Supply',
        full_name: 'Nairobi Steel Supply Ltd',
      });
    }
    navigate('/supplier/overview');
  };

  return (
    <header className="topnav">
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <div className="topnav-brand">
          <div className="brand-icon-box">
            <Layers size={18} />
          </div>
          <span className="brand-title">JUMUA</span>
        </div>

        <div className="topnav-user-selector" ref={dropdownRef}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className="topnav-company">{displayName}</span>
            <span className="role-pill">{displayRole}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>

          {dropdownOpen && (
            <div className="role-dropdown-menu">
              <div style={{ fontSize: '0.6875rem', fontWeight: '700', color: 'var(--text-muted)', padding: '0.35rem 0.75rem', textTransform: 'uppercase' }}>
                Switch Workspace View
              </div>
              <button 
                className="role-dropdown-item" 
                onClick={handleSwitchToBuyer}
              >
                <span>Kamau Fabricators (Buyer)</span>
                {!isSupplier && <Check size={14} color="var(--primary)" />}
              </button>
              <button 
                className="role-dropdown-item" 
                onClick={handleSwitchToSupplier}
              >
                <span>Nairobi Steel Supply (Supplier)</span>
                {isSupplier && <Check size={14} color="var(--primary)" />}
              </button>
              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
              <button 
                className="role-dropdown-item" 
                onClick={() => { setDropdownOpen(false); navigate(isSupplier ? '/supplier/account' : '/buyer/account'); }}
              >
                <span>Account Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="topnav-right">
        <div className="topnav-location-time">
          NAIROBI, KE / EAT
        </div>

        <button className="notif-btn" title="Notifications">
          <Bell size={18} />
          <span className="notif-pip" />
        </button>

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
