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
const uniqueValues = (values) => [...new Set(values.filter(Boolean))];

const envBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const configBaseUrl = Constants.expoConfig?.extra?.apiUrl?.trim();
const configuredOrigin = normalizeBaseOrigin(envBaseUrl || configBaseUrl);
const expoHostOrigin = getExpoHostOrigin();
const defaultOrigin = `http://${normalizeHostname('127.0.0.1')}:${API_PORT}`;
const primaryOrigin = envBaseUrl
  ? configuredOrigin || expoHostOrigin || defaultOrigin
  : expoHostOrigin || configuredOrigin || defaultOrigin;

const FALLBACK_API_BASE_URLS = uniqueValues([
  expoHostOrigin ? joinApiPath(expoHostOrigin) : '',
  configuredOrigin ? joinApiPath(configuredOrigin) : '',
  joinApiPath(defaultOrigin),
].filter((origin) => origin !== joinApiPath(primaryOrigin)));

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
    const fallbackBaseUrl = FALLBACK_API_BASE_URLS.find(
      (candidate) => candidate !== requestConfig.baseURL && !(requestConfig.__triedBaseUrls || []).includes(candidate)
    );
    const canRetryWithFallback =
      error.code === 'ERR_NETWORK' &&
      !error.response &&
      fallbackBaseUrl;

    if (canRetryWithFallback) {
      return api.request({
        ...requestConfig,
        __triedBaseUrls: [...(requestConfig.__triedBaseUrls || []), requestConfig.baseURL].filter(Boolean),
        baseURL: fallbackBaseUrl,
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

export const getLiveStreams = () => api.get('/live-streams').then((response) => response.data);
export const getLiveStream = (streamId) => api.get(`/live-streams/${streamId}`).then((response) => response.data);
export const createLiveStream = (data) => api.post('/live-streams', data).then((response) => response.data);
export const stopLiveStream = (streamId) => api.patch(`/live-streams/${streamId}`).then((response) => response.data);
export const getLiveStreamSession = (streamId, role = 'subscriber') =>
  api.get(`/live-streams/${streamId}/session`, { params: { role } }).then((response) => response.data);
export const updateLiveStreamViewerPresence = (streamId, action) =>
  api.post(`/live-streams/${streamId}/viewers`, { action }).then((response) => response.data);
