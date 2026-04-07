import axios from 'axios';

// Base API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for httpOnly cookies
});

// Request Interceptor: Attach JWT token to headers if it exists
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

// Response Interceptor: Handle global errors (like token expiration)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only clear token on 401 if the message indicates token expiry/invalidity
    // NOT on role-based 403 or other 401s (e.g., wrong password)
    if (error.response && error.response.status === 401) {
      const message = error.response.data?.message || '';
      const isTokenError =
        message.toLowerCase().includes('token') ||
        message.toLowerCase().includes('expired') ||
        message.toLowerCase().includes('unauthorized') ||
        message.toLowerCase().includes('no token');

      if (isTokenError) {
        localStorage.removeItem('token');
        // Optional: redirect to login if needed
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;