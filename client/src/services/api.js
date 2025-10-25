// client/src/services/api.js
import { BASE_API_URL } from '../config/api';
import axios from 'axios';

const api = axios.create({
  baseURL: BASE_API_URL, // Our backend API URL
} );

// Interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
