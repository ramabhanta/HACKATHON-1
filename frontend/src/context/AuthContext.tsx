import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../i18n/translations';

export type UserRole = 'FARMER' | 'VENDOR' | 'BUYER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  language: Language;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
  language?: Language;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  // Farmer fields
  totalAcreage?: number;
  primaryCrops?: string[];
  farmingType?: 'ORGANIC' | 'CONVENTIONAL' | 'INTEGRATED';
  soilTypeDefault?: string;
  irrigationType?: string;
  // Vendor fields
  shopName?: string;
  licenseNumber?: string;
  address?: string;
  // Expert fields
  qualification?: string;
  institution?: string;
  specialization?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => Promise<void>;
  isFarmer: boolean;
  isVendor: boolean;
  isBuyer: boolean;
  isExpert: boolean;
  isAdmin: boolean;
}

const DEFAULT_DEMO_USER: User = {
  id: 'usr-farmer-1',
  name: 'Ramesh Patel',
  phone: '+91 98480 12345',
  email: 'farmer@agriconnect.com',
  role: 'FARMER',
  language: 'en',
  village: 'Kadiri Rural',
  district: 'Sri Sathya Sai',
  state: 'Andhra Pradesh'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('agri_user');
    return saved ? JSON.parse(saved) : DEFAULT_DEMO_USER;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('agri_token') || 'demo_token_farmer';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('agri_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('agri_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('agri_token', token);
    } else {
      localStorage.removeItem('agri_token');
    }
  }, [token]);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier, phone: identifier, password: pass })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('agri_user');
    localStorage.removeItem('agri_token');
  };

  const switchRole = async (newRole: UserRole) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const role = user?.role || 'FARMER';
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        switchRole,
        isFarmer: role === 'FARMER',
        isVendor: role === 'VENDOR',
        isBuyer: role === 'BUYER',
        isExpert: false,
        isAdmin: role === 'ADMIN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
