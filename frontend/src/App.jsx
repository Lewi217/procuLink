import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Placeholder Pages
const Placeholder = ({ title }) => <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{title} Coming Soon</div>;

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes inside Dashboard */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              {/* Buyer Routes */}
              <Route path="/buyer/overview" element={<Placeholder title="Buyer Overview" />} />
              <Route path="/buyer/rfqs" element={<Placeholder title="RFQs" />} />
              <Route path="/buyer/orders" element={<Placeholder title="Orders" />} />
              <Route path="/buyer/account" element={<Placeholder title="Account" />} />

              {/* Supplier Routes */}
              <Route path="/supplier/overview" element={<Placeholder title="Supplier Overview" />} />
              <Route path="/supplier/catalog" element={<Placeholder title="Catalog" />} />
              <Route path="/supplier/demand" element={<Placeholder title="Demand" />} />
              <Route path="/supplier/account" element={<Placeholder title="Account" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
