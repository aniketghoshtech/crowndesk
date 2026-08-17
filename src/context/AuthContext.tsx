import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ forcePasswordChange?: boolean; user: User }>;
  adminLogin: (email: string, pass: string) => Promise<{ forcePasswordChange?: boolean; user: User }>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  forcePasswordChangeModalOpen: boolean;
  setForcePasswordChangeModalOpen: (open: boolean) => void;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isDesigner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('crowndesk_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [forcePasswordChangeModalOpen, setForcePasswordChangeModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('crowndesk_token');
      if (storedToken) {
        try {
          const { user: fetchedUser } = await api.getMe();
          setUser(fetchedUser);
          if (fetchedUser.forcePasswordChange) {
            setForcePasswordChangeModalOpen(true);
          }
        } catch (e) {
          console.warn('Session expired, clearing token');
          localStorage.removeItem('crowndesk_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const refreshUser = async () => {
    try {
      const { user: fetchedUser } = await api.getMe();
      setUser(fetchedUser);
      if (fetchedUser.forcePasswordChange) {
        setForcePasswordChangeModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem('crowndesk_token', res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.forcePasswordChange) {
      setForcePasswordChangeModalOpen(true);
    }
    return { forcePasswordChange: res.forcePasswordChange, user: res.user };
  };

  const adminLogin = async (email: string, pass: string) => {
    const res = await api.adminLogin(email, pass);
    localStorage.setItem('crowndesk_token', res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.forcePasswordChange) {
      setForcePasswordChangeModalOpen(true);
    }
    return { forcePasswordChange: res.forcePasswordChange, user: res.user };
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('crowndesk_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('crowndesk_token');
    setToken(null);
    setUser(null);
    setForcePasswordChangeModalOpen(false);
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isDoctor = user?.role === 'DOCTOR_LAB';
  const isDesigner = user?.role === 'DESIGNER_EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        adminLogin,
        register,
        logout,
        refreshUser,
        forcePasswordChangeModalOpen,
        setForcePasswordChangeModalOpen,
        isSuperAdmin,
        isAdmin,
        isDoctor,
        isDesigner
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
