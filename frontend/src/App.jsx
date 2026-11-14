import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Buyer Pages
import BuyerOverview from './pages/buyer/Overview';
import BuyerRfqs from './pages/buyer/Rfqs';
import BuyerOrders from './pages/buyer/Orders';
import BuyerAccount from './pages/buyer/Account';

// Supplier Pages
import SupplierOverview from './pages/supplier/Overview';
import SupplierCatalog from './pages/supplier/Catalog';
import SupplierDemand from './pages/supplier/Demand';
import SupplierAccount from './pages/supplier/Account';

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
              <Route path="/buyer/overview" element={<BuyerOverview />} />
              <Route path="/buyer/rfqs" element={<BuyerRfqs />} />
              <Route path="/buyer/orders" element={<BuyerOrders />} />
              <Route path="/buyer/account" element={<BuyerAccount />} />

              {/* Supplier Routes */}
              <Route path="/supplier/overview" element={<SupplierOverview />} />
              <Route path="/supplier/catalog" element={<SupplierCatalog />} />
              <Route path="/supplier/demand" element={<SupplierDemand />} />
              <Route path="/supplier/account" element={<SupplierAccount />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
