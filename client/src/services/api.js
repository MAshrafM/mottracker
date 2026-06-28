// client/src/services/api.js
import { BASE_API_URL } from '../config/api';
import axios from 'axios';

const api = axios.create({
  baseURL: BASE_API_URL, // Our backend API URL
});

// Interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const searchParams = new URLSearchParams(window.location.search);
    const qrToken = searchParams.get('qrToken') || searchParams.get('qrtoken');
    if (qrToken) {
      config.headers['x-qr-token'] = qrToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const searchParams = new URLSearchParams(window.location.search);
      const qrToken = searchParams.get('qrToken') || searchParams.get('qrtoken');
      if (!qrToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
