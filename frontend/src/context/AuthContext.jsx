import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const normalizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      id: userData.id || userData._id || null,
    };
  };

  const checkUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(normalizeUser(res.data.user));
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    setUser(normalizeUser(res.data.user));
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  if (loading) return <div className="page-placeholder">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout, checkUser }}>
      {children}
    </AuthContext.Provider>
  );
};
