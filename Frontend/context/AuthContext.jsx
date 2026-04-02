import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import api, { clearSessionToken, setSessionToken } from '../services/api';

const AuthContext = createContext();
const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';
const BIOMETRIC_EMAIL_KEY = 'biometricEmail';
const BIOMETRIC_PASSWORD_KEY = 'biometricPassword';
const BIOMETRIC_SETUP_EMAIL_KEY = 'biometricSetupEmail';
const BIOMETRIC_SETUP_PASSWORD_KEY = 'biometricSetupPassword';
const SAVED_LOGIN_EMAIL_KEY = 'savedLoginEmail';
const SAVED_LOGIN_PASSWORD_KEY = 'savedLoginPassword';

const getLocalAuthenticationModule = () => {
  if (Platform.OS === 'web') {
    return null;
  }

  return LocalAuthentication;
};

const extractAuthPayload = (data) => {
  const { token, user, ...userFields } = data || {};

  return {
    token,
    user: user || userFields,
  };
};

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
  const [biometricAvailable, setBiometricAvailable] = React.useState(false);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [biometricModuleAvailable, setBiometricModuleAvailable] = React.useState(false);
  const [lastLoginCredentials, setLastLoginCredentials] = React.useState(null);
  const [savedCredentials, setSavedCredentials] = React.useState(null);

  useEffect(() => {
    void initializeAuth();
  }, []);

  const persistBiometricSetupCredentials = async (email, password) => {
    const normalizedEmail = `${email || ''}`.trim().toLowerCase();
    const normalizedPassword = `${password || ''}`;

    if (!normalizedEmail || !normalizedPassword) {
      return;
    }

    await Promise.all([
      SecureStore.setItemAsync(BIOMETRIC_SETUP_EMAIL_KEY, normalizedEmail),
      SecureStore.setItemAsync(BIOMETRIC_SETUP_PASSWORD_KEY, normalizedPassword),
    ]);
    setLastLoginCredentials({ email: normalizedEmail, password: normalizedPassword });
  };

  const refreshBiometricState = async () => {
    const LocalAuthentication = getLocalAuthenticationModule();
    if (!LocalAuthentication) {
      setBiometricModuleAvailable(false);
      setBiometricAvailable(false);
      setBiometricEnabled(false);
      return;
    }

    setBiometricModuleAvailable(true);

    const [hasHardware, isEnrolled, storedEmail] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY),
    ]);

    setBiometricAvailable(Boolean(hasHardware && isEnrolled));
    setBiometricEnabled(Boolean(storedEmail));
  };

  const initializeAuth = async () => {
    try {
      await refreshBiometricState();

      const [savedEmail, savedPassword] = await Promise.all([
        SecureStore.getItemAsync(SAVED_LOGIN_EMAIL_KEY),
        SecureStore.getItemAsync(SAVED_LOGIN_PASSWORD_KEY),
      ]);
      setSavedCredentials(
        savedEmail && savedPassword
          ? { email: savedEmail, password: savedPassword }
          : null
      );

      const [savedToken, savedUser] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(AUTH_USER_KEY),
      ]);

      const [setupEmail, setupPassword] = await Promise.all([
        SecureStore.getItemAsync(BIOMETRIC_SETUP_EMAIL_KEY),
        SecureStore.getItemAsync(BIOMETRIC_SETUP_PASSWORD_KEY),
      ]);

      if (setupEmail && setupPassword) {
        setLastLoginCredentials({ email: setupEmail, password: setupPassword });
      }

      if (savedToken && savedUser) {
        setSessionToken(savedToken);
        dispatch({ type: 'LOGIN', payload: JSON.parse(savedUser) });
      }
    } catch {
      setBiometricModuleAvailable(false);
      setBiometricAvailable(false);
      setBiometricEnabled(false);
      setSavedCredentials(null);
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      const normalizedEmail = `${email || ''}`.trim().toLowerCase();
      const normalizedPassword = `${password || ''}`;
      const response = await api.post('/auth/login', { email: normalizedEmail, password: normalizedPassword });
      const { token, user } = extractAuthPayload(response.data);

      if (!token || !user?._id) {
        throw new Error('Invalid login response');
      }

      setSessionToken(token);
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user));
      await persistBiometricSetupCredentials(normalizedEmail, normalizedPassword);
      dispatch({ type: 'LOGIN', payload: user });
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Login failed' };
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  };

  const enableBiometricLogin = async (email, password) => {
    try {
      const LocalAuthentication = getLocalAuthenticationModule();
      if (!LocalAuthentication) {
        return {
          success: false,
          error: 'Fingerprint login is not available in this build. Use a development build or production build with biometric support.',
        };
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return { success: false, error: 'Fingerprint or device biometrics are not available on this device.' };
      }

      await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
      await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password, {
        requireAuthentication: true,
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });

      await refreshBiometricState();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Could not enable biometric login.' };
    }
  };

  const enableBiometricLoginFromSession = async () => {
    const setupEmail = lastLoginCredentials?.email || await SecureStore.getItemAsync(BIOMETRIC_SETUP_EMAIL_KEY);
    const setupPassword = lastLoginCredentials?.password || await SecureStore.getItemAsync(BIOMETRIC_SETUP_PASSWORD_KEY);

    if (!setupEmail || !setupPassword) {
      return {
        success: false,
        error: 'Sign in once with your email and password before enabling fingerprint login.',
      };
    }

    return enableBiometricLogin(setupEmail, setupPassword);
  };

  const disableBiometricLogin = async () => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY);
      await refreshBiometricState();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Could not disable biometric login.' };
    }
  };

  const saveLoginCredentials = async (email, password) => {
    try {
      await SecureStore.setItemAsync(SAVED_LOGIN_EMAIL_KEY, email);
      await SecureStore.setItemAsync(SAVED_LOGIN_PASSWORD_KEY, password);
      setSavedCredentials({ email, password });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Could not save login credentials.' };
    }
  };

  const clearSavedLoginCredentials = async () => {
    try {
      await SecureStore.deleteItemAsync(SAVED_LOGIN_EMAIL_KEY);
      await SecureStore.deleteItemAsync(SAVED_LOGIN_PASSWORD_KEY);
      setSavedCredentials(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || 'Could not clear saved login credentials.' };
    }
  };

  const loginWithBiometrics = async () => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      const LocalAuthentication = getLocalAuthenticationModule();
      if (!LocalAuthentication) {
        throw new Error('Fingerprint login is not available in this build. Use a development build or production build with biometric support.');
      }

      const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to sign in to Explore Kenya',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use device passcode',
        disableDeviceFallback: false,
      });

      if (!authResult.success) {
        throw new Error('Biometric authentication was cancelled or failed.');
      }

      const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY, {
        requireAuthentication: true,
      });

      if (!email || !password) {
        throw new Error('Biometric login has not been enabled for this account yet.');
      }

      const result = await login(email, password);
      return result;
    } catch (error) {
      dispatch({ type: 'LOADING', payload: false });
      return { success: false, error: error.message || 'Biometric login failed.' };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'LOADING', payload: true });
    try {
      const response = await api.post('/auth/register', userData);
      const { user } = extractAuthPayload(response.data);

      if (!user?._id) {
        throw new Error('Invalid registration response');
      }

      clearSessionToken();
      await persistBiometricSetupCredentials(userData.email, userData.password);
      dispatch({ type: 'LOGOUT' });
      return { success: true, message: 'Account created successfully.' };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Registration failed' };
    } finally {
      dispatch({ type: 'LOADING', payload: false });
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(AUTH_USER_KEY);
    clearSessionToken();
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
    biometricAvailable,
    biometricEnabled,
    biometricModuleAvailable,
    biometricSetupReady: Boolean(lastLoginCredentials?.email && lastLoginCredentials?.password),
    savedCredentials,
    biometricSupportMessage: biometricModuleAvailable
      ? biometricAvailable
        ? ''
        : 'Fingerprint login is not available on this device because no biometric method is enrolled.'
      : 'Fingerprint login requires a development build or production build. Expo Go does not include the native biometric module.',
    saveLoginCredentials,
    clearSavedLoginCredentials,
    enableBiometricLogin,
    enableBiometricLoginFromSession,
    disableBiometricLogin,
    loginWithBiometrics,
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
