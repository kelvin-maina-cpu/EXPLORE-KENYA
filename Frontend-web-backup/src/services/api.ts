import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Adjust for production/IP
});

API.interceptors.request.use(async (req) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;

