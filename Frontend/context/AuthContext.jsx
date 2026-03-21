import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

const extractAuthPayload = (data) => {
  const { token, user, ...userFields } = data || {};

  return {
    token,
    user: user || userFields,
  };
};

const buildFallbackUserFromToken = (payload) => ({
  _id: payload?.id || '',
  name: payload?.name || '',
  email: payload?.email || '',
  role: payload?.role || '',
  preferences: payload?.preferences || {},
});

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    case 'LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  // Load token on app start
  useEffect(() => {
    void loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const payload = jwtDecode(token);
        if (payload.exp * 1000 > Date.now()) {
          try {
            const userRes = await api.get('/users/profile');
            dispatch({ type: 'LOGIN', payload: userRes.data });
          } catch (error) {
            if (error.response?.status === 401) {
              await SecureStore.deleteItemAsync('authToken');
              dispatch({ type: 'LOGOUT' });
              return;
            }

            console.warn('Auth profile refresh failed, using the stored token temporarily.', error);
            dispatch({ type: 'LOGIN', payload: buildFallbackUserFromToken(payload) });
          }
        } else {
          await SecureStore.deleteItemAsync('authToken');
          dispatch({ type: 'LOGOUT' });
        }
      }
    } catch (error) {
      console.error('Auth load error:', error);
      await SecureStore.deleteItemAsync('authToken');
      dispatch({ type: 'LOGOUT' });
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = extractAuthPayload(response.data);

      if (!token || !user?._id) {
        throw new Error('Invalid login response');
      }

      await SecureStore.setItemAsync('authToken', token);
      dispatch({ type: 'LOGIN', payload: user });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Login failed' };
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = extractAuthPayload(response.data);

      if (!token || !user?._id) {
        throw new Error('Invalid registration response');
      }

      await SecureStore.setItemAsync('authToken', token);
      dispatch({ type: 'LOGIN', payload: user });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Registration failed' };
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch (error) {
      console.error('Logout error:', error);
    }
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (profileData) => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      const response = await api.put('/users/profile', profileData);
      dispatch({ type: 'UPDATE_USER', payload: response.data });
      return { success: true, user: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Profile update failed' };
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  };

  const requestPasswordReset = async (email) => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Could not request reset code' };
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  };

  const resetPassword = async ({ email, code, newPassword }) => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      const response = await api.post('/auth/reset-password', { email, code, newPassword });
      return { success: true, ...response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Password reset failed' };
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    requestPasswordReset,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
