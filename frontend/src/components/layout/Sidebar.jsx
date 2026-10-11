import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ShoppingCart, User, Layers, BarChart2 } from 'lucide-react';
import './Layout.css';

const Sidebar = ({ role }) => {
  const buyerLinks = [
    { to: '/buyer/overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { to: '/buyer/rfqs', icon: <FileText size={20} />, label: 'RFQs' },
    { to: '/buyer/orders', icon: <ShoppingCart size={20} />, label: 'Orders' },
    { to: '/buyer/account', icon: <User size={20} />, label: 'Account' },
  ];

  const supplierLinks = [
    { to: '/supplier/overview', icon: <LayoutDashboard size={20} />, label: 'Overview' },
    { to: '/supplier/catalog', icon: <Layers size={20} />, label: 'Catalog' },
    { to: '/supplier/demand', icon: <BarChart2 size={20} />, label: 'Demand' },
    { to: '/supplier/account', icon: <User size={20} />, label: 'Account' },
  ];

  const links = role === 'SUPPLIER' ? supplierLinks : buyerLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
          <Layers size={24} />
          <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>JUMUA</span>
        </div>
      </div>
      
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          {role === 'SUPPLIER' ? 'SUPPLIER WORKSPACE' : 'BUYER WORKSPACE'}
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
        <a href="#" className="sidebar-footer-link">Help & support ↗</a>
        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Buy together.<br/>Reach bulk.
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
