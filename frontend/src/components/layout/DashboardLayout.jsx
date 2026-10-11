import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import './Layout.css';

const DashboardLayout = () => {
  const { user } = useAuth();
  
  // Fallback if user is somehow null in protected route
  if (!user) return null;

  return (
    <div className="layout-container">
      <Sidebar role={user.role} />
      <div className="main-content">
        <TopNav userContext={user} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
