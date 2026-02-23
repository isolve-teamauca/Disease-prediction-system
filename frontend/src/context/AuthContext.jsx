import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me/');
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password, _role) => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login/', { email, password });
      setUser(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout/');
    } finally {
      setUser(null);
    }
  };

  const register = async (formData, role) => {
    const username = (formData.email || '').split('@')[0].replace(/[^a-zA-Z0-9]/g, '_') || 'user';
    const payload = {
      username: formData.username || username,
      email: formData.email,
      password: formData.password,
      confirm_password: formData.confirm_password,
      role,
      full_name: formData.full_name,
      phone: formData.phone || '',
    };
    if (role === 'patient') {
      payload.date_of_birth = formData.date_of_birth || null;
    } else {
      payload.specialization = formData.specialization || '';
      payload.license_number = formData.license_number || '';
    }
    const { data } = await api.post('/api/auth/register/', payload);
    return data;
  };

  const value = {
    user,
    role: user?.role ?? null,
    loading,
    login,
    logout,
    fetchMe,
    register,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
