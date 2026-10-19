import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, getMeApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('mini_ats_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mini_ats_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('mini_ats_token');
      if (storedToken) {
        try {
          const res = await getMeApi();
          setUser(res.data.user);
          localStorage.setItem('mini_ats_user', JSON.stringify(res.data.user));
        } catch {
          // Token expired or invalid
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('mini_ats_token', receivedToken);
    localStorage.setItem('mini_ats_user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mini_ats_token');
    localStorage.removeItem('mini_ats_user');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
