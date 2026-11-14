import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (token === 'demo-token-buyer') {
        setUser({
          id: 'd9b3e1a0-1234-4567-89ab-cdef01234567',
          role: 'MANUFACTURER',
          company_name: 'Kamau Fabricators',
          full_name: 'Kamau Mwangi',
          email: 'kamau@fabricators.co.ke'
        });
        setLoading(false);
        return;
      }
      if (token === 'demo-token-supplier') {
        setUser({
          id: 'e8c2f3b1-5678-4321-98ba-fedcba987654',
          role: 'SUPPLIER',
          company_name: 'Nairobi Steel Supply',
          full_name: 'Nairobi Steel Supply Ltd',
          email: 'sales@nairobi-steel.co.ke'
        });
        setLoading(false);
        return;
      }

      apiClient('/auth/me')
        .then(res => {
          setUser(res.data);
        })
        .catch(() => {
          // If offline/demo fallback
          const savedRole = localStorage.getItem('demo_role') || 'MANUFACTURER';
          setUser({
            id: 'd9b3e1a0-1234-4567-89ab-cdef01234567',
            role: savedRole,
            company_name: savedRole === 'SUPPLIER' ? 'Nairobi Steel Supply' : 'Kamau Fabricators',
            full_name: savedRole === 'SUPPLIER' ? 'Nairobi Steel Supply Ltd' : 'Kamau Mwangi',
            email: savedRole === 'SUPPLIER' ? 'sales@nairobi-steel.co.ke' : 'kamau@fabricators.co.ke'
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await apiClient('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    const token = response.data?.access_token || response.access_token;
    localStorage.setItem('token', token);

    const meRes = await apiClient('/auth/me');
    const userData = meRes.data;
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const payload = {
      email: userData.email,
      password: userData.password,
      full_name: userData.company_name || userData.full_name || userData.email.split('@')[0],
      role: userData.role === 'BUYER' ? 'MANUFACTURER' : (userData.role || 'MANUFACTURER'),
      company_name: userData.company_name,
      phone_number: userData.phone_number,
      company_registration_number: userData.company_registration_number
    };

    await apiClient('/auth/register', {
      method: 'POST',
      body: payload
    });

    // Auto login after registration
    return login(userData.email, userData.password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
