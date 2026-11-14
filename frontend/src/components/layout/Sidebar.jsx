import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, FileText, Box, User, List } from 'lucide-react';
import './Layout.css';

const Sidebar = ({ role }) => {
  const isSupplier = role === 'SUPPLIER';

  const buyerLinks = [
    { to: '/buyer/overview', icon: <LayoutGrid size={18} />, label: 'Overview' },
    { to: '/buyer/rfqs', icon: <FileText size={18} />, label: 'RFQs' },
    { to: '/buyer/orders', icon: <Box size={18} />, label: 'Orders' },
    { to: '/buyer/account', icon: <User size={18} />, label: 'Account' },
  ];

  const supplierLinks = [
    { to: '/supplier/overview', icon: <LayoutGrid size={18} />, label: 'Overview' },
    { to: '/supplier/catalog', icon: <List size={18} />, label: 'Catalog' },
    { to: '/supplier/demand', icon: <Box size={18} />, label: 'Demand' },
    { to: '/supplier/account', icon: <User size={18} />, label: 'Account' },
  ];

  const links = isSupplier ? supplierLinks : buyerLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          {isSupplier ? 'SUPPLIER WORKSPACE' : 'BUYER WORKSPACE'}
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <a href="#help" className="sidebar-footer-link" onClick={(e) => { e.preventDefault(); alert("ProcuLink JUMUA Help Center:\nWhatsApp support: +254 700 123 456\nEmail: support@proculink.co.ke"); }}>
          Help &amp; support ↗
        </a>
        <div className="sidebar-tagline">
          BUY TOGETHER.<br />BUILD MORE.
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
