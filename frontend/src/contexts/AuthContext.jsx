import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiClient('/auth/me')
        .then(res => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
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
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
