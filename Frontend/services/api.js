import axios from 'axios';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
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
export const API_ORIGIN = primaryOrigin;
let sessionToken = '';
const CACHE_DIRECTORY = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}api-cache/`;

const CACHE_TTLS = {
  short: 15 * 60 * 1000,
  medium: 60 * 60 * 1000,
  long: 24 * 60 * 60 * 1000,
  extended: 7 * 24 * 60 * 60 * 1000,
};

let cacheDirectoryReady = false;

const ensureCacheDirectory = async () => {
  if (cacheDirectoryReady) {
    return;
  }

  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIRECTORY);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIRECTORY, { intermediates: true });
    }
    cacheDirectoryReady = true;
  } catch (error) {
    console.warn('API cache directory setup failed:', error?.message || error);
  }
};

const hashString = (value) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16);
};

const toQueryString = (params = {}) => {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  if (!entries.length) {
    return '';
  }

  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
};

const buildCacheKey = (url, params = {}) => {
  const query = toQueryString(params);
  return `${url}${query ? `?${query}` : ''}`;
};

const getCacheFilePath = (cacheKey) => `${CACHE_DIRECTORY}${hashString(cacheKey)}.json`;

const readCachedData = async (cacheKey, ttlMs) => {
  try {
    await ensureCacheDirectory();
    const cacheFilePath = getCacheFilePath(cacheKey);
    const info = await FileSystem.getInfoAsync(cacheFilePath);

    if (!info.exists) {
      return null;
    }

    const fileContents = await FileSystem.readAsStringAsync(cacheFilePath);
    const payload = JSON.parse(fileContents);

    if (!payload || !('data' in payload) || !payload.timestamp) {
      return null;
    }

    if (ttlMs && Date.now() - payload.timestamp > ttlMs) {
      return null;
    }

    return payload.data;
  } catch (error) {
    console.warn('API cache read failed:', error?.message || error);
    return null;
  }
};

const writeCachedData = async (cacheKey, data) => {
  try {
    await ensureCacheDirectory();
    const cacheFilePath = getCacheFilePath(cacheKey);
    await FileSystem.writeAsStringAsync(
      cacheFilePath,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch (error) {
    console.warn('API cache write failed:', error?.message || error);
  }
};

export const setSessionToken = (token) => {
  sessionToken = token || '';
};

export const clearSessionToken = () => {
  sessionToken = '';
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT token
api.interceptors.request.use(async (config) => {
  config.headers = config.headers ?? {};
  if (sessionToken) {
    config.headers.Authorization = `Bearer ${sessionToken}`;
  }
  return config;
});

// Response interceptor - handle 401 logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearSessionToken();
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
export const getCachedApiData = async (
  url,
  {
    params,
    policy = 'network-first',
    ttlMs = CACHE_TTLS.medium,
  } = {}
) => {
  const cacheKey = buildCacheKey(url, params);

  if (policy === 'cache-first') {
    const cachedData = await readCachedData(cacheKey, ttlMs);
    if (cachedData !== null) {
      return {
        data: cachedData,
        meta: { fromCache: true },
      };
    }
  }

  try {
    const response = await api.get(url, { params });
    await writeCachedData(cacheKey, response.data);
    return {
      data: response.data,
      meta: { fromCache: false },
    };
  } catch (error) {
    const cachedData = await readCachedData(cacheKey, ttlMs);

    if (cachedData !== null) {
      return {
        data: cachedData,
        meta: { fromCache: true, stale: true },
      };
    }

    throw error;
  }
};

export const getAttraction = (id) =>
  getCachedApiData(`/attractions/${id}`, {
    policy: 'cache-first',
    ttlMs: CACHE_TTLS.extended,
  }).then((response) => response.data);
export const getAttractions = () =>
  getCachedApiData('/attractions', {
    policy: 'cache-first',
    ttlMs: CACHE_TTLS.extended,
  }).then((response) => response.data);
export const createBooking = (data) => api.post('/bookings', data).then((response) => response.data);
export const getMyBookings = () =>
  getCachedApiData('/bookings/my', {
    policy: 'network-first',
    ttlMs: CACHE_TTLS.long,
  }).then((response) => response.data);

export const getLiveStreams = () => api.get('/live-streams').then((response) => response.data);
export const getLiveStream = (streamId) => api.get(`/live-streams/${streamId}`).then((response) => response.data);
export const createLiveStream = (data) => api.post('/live-streams', data).then((response) => response.data);
export const stopLiveStream = (streamId) => api.patch(`/live-streams/${streamId}`).then((response) => response.data);
export const getLiveStreamSession = (streamId, role = 'subscriber') =>
  api.get(`/live-streams/${streamId}/session`, { params: { role } }).then((response) => response.data);
export const updateLiveStreamViewerPresence = (streamId, action) =>
  api.post(`/live-streams/${streamId}/viewers`, { action }).then((response) => response.data);
