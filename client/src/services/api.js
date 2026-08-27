import axios from 'axios';

// Calculate baseURL cleanly from environment variable or fallback to '/api'
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || typeof envUrl !== 'string' || envUrl.trim() === '') {
    return '/api';
  }

  const trimmed = envUrl.trim().replace(/\/+$/, '');
  // If it already ends with /api, use it; otherwise append /api
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mymaligai_token') || localStorage.getItem('kadaimate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect if unauthorized
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('mymaligai_token');
        localStorage.removeItem('mymaligai_user');
        localStorage.removeItem('kadaimate_token');
        localStorage.removeItem('kadaimate_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
