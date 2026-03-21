import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';
import API from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  preferences: any;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const decoded: any = jwtDecode(token);
        // Check token expiry
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            _id: decoded._id,
            name: '', // Fetch full user
            email: '', 
            preferences: {}
          });
        } else {
          await SecureStore.deleteItemAsync('token');
        }
      }
    } catch (error) {
      console.error('Token check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await API.post('/auth/login', { email, password });
    const { token } = response.data;
    await SecureStore.setItemAsync('token', token);
    const decoded: any = jwtDecode(token);
    setUser({
      _id: decoded._id,
      name: response.data.name,
      email: response.data.email,
      preferences: response.data.preferences
    });
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

