import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '5000';
const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const normalizeHostname = (hostname) => {
  if (Platform.OS === 'android' && LOCALHOST_HOSTS.has(hostname)) {
    return '10.0.2.2';
  }

  return hostname;
};

const isPrivateOrLocalHostname = (hostname) => {
  if (!hostname) {
    return false;
  }

  return (
    LOCALHOST_HOSTS.has(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
};

const normalizeBaseOrigin = (value) => {
  if (!value) {
    return '';
  }

  const candidate = /^https?:\/\//i.test(value) ? value : `http://${value}`;

  try {
    const url = new URL(candidate);
    url.pathname = '';
    url.search = '';
    url.hash = '';
    url.hostname = normalizeHostname(url.hostname);
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
};

const getExpoHostOrigin = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = hostUri.split(':')[0];

  if (!host) {
    return '';
  }

  return `http://${normalizeHostname(host)}:${API_PORT}`;
};

const joinApiPath = (origin) => `${origin.replace(/\/+$/, '')}/api`;

const envBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const configBaseUrl = Constants.expoConfig?.extra?.apiUrl?.trim();
const configuredOrigin = normalizeBaseOrigin(envBaseUrl || configBaseUrl);
const expoHostOrigin = getExpoHostOrigin();
const defaultOrigin = `http://${normalizeHostname('127.0.0.1')}:${API_PORT}`;
const primaryOrigin = configuredOrigin || expoHostOrigin || defaultOrigin;

const shouldUseExpoFallback =
  !envBaseUrl &&
  configuredOrigin &&
  expoHostOrigin &&
  configuredOrigin !== expoHostOrigin &&
  isPrivateOrLocalHostname(new URL(configuredOrigin).hostname);

const FALLBACK_API_BASE_URL = shouldUseExpoFallback ? joinApiPath(expoHostOrigin) : '';
const API_BASE_URL = joinApiPath(primaryOrigin);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  config.headers = config.headers ?? {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('authToken');
      // Redirect to login via navigation (handled in AuthContext)
    }

    const requestConfig = error.config || {};
    const canRetryWithExpoHost =
      error.code === 'ERR_NETWORK' &&
      !error.response &&
      FALLBACK_API_BASE_URL &&
      !requestConfig.__retryWithExpoHost &&
      requestConfig.baseURL !== FALLBACK_API_BASE_URL;

    if (canRetryWithExpoHost) {
      return api.request({
        ...requestConfig,
        __retryWithExpoHost: true,
        baseURL: FALLBACK_API_BASE_URL,
      });
    }

    return Promise.reject(error);
  }
);

export default api;

export const authAPI = api;
export const attractionsAPI = api;
export const bookingsAPI = api;
export const getAttraction = (id) => api.get(`/attractions/${id}`).then((response) => response.data);
export const getAttractions = () => api.get('/attractions').then((response) => response.data);
export const createBooking = (data) => api.post('/bookings', data).then((response) => response.data);
export const getMyBookings = () => api.get('/bookings/my').then((response) => response.data);

export const getStreamToken = (attractionId) => api.get(`/live-streams/streams/${attractionId}/token`).then((response) => response.data);
export const getLiveStreams = () => api.get('/live-streams').then((response) => response.data);
