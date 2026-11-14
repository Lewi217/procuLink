import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import './Layout.css';

const DashboardLayout = () => {
  const { user } = useAuth();
  
  // Safe default user if user is null during testing/preview
  const effectiveUser = user || {
    role: 'MANUFACTURER',
    company_name: 'Kamau Fabricators',
    full_name: 'Kamau Mwangi',
    email: 'kamau@fabricators.co.ke'
  };

  return (
    <div className="layout-container">
      <TopNav userContext={effectiveUser} />
      <div className="layout-main-row">
        <Sidebar role={effectiveUser.role} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
