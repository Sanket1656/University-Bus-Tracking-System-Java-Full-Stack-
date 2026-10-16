import axios from 'axios';

/**
 * Normalizes and resolves the API base URL:
 * 1. Checks Vite environment variables (VITE_API_BASE_URL, fallback to VITE_API_URL).
 * 2. In production builds (import.meta.env.PROD), defaults to the deployed backend URL:
 *    https://university-bus-tracking-backend.onrender.com/api
 * 3. In local development, falls back to http://localhost:5000/api.
 * 4. Trims trailing slashes and ensures the path ends with '/api' without duplicate '/api/api'.
 */
export const getApiBaseUrl = () => {
  const envUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL;

  let url = envUrl;
  if (!url || typeof url !== 'string' || !url.trim()) {
    url = import.meta.env.PROD
      ? 'https://university-bus-tracking-backend.onrender.com/api'
      : 'http://localhost:5000/api';
  }

  // Trim and strip all trailing slashes
  url = url.trim().replace(/\/+$/, '');

  // Ensure /api suffix without accidental /api/api
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }

  return url;
};

const BASE_URL = getApiBaseUrl();

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request and safeguard against duplicate /api in paths
apiClient.interceptors.request.use(
  (config) => {
    // If an endpoint was accidentally passed with leading '/api/' (e.g., '/api/auth/login'),
    // strip the leading '/api' so it does not result in '/api/api/auth/login' against baseURL.
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.substring(4);
    }

    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response handler — redirect to /login on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { BASE_URL };
export default apiClient;

