import axios from 'axios';

const getCsrfToken = () => {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let c of cookies) {
    c = c.trim();
    if (c.startsWith(name + '=')) return c.slice(name.length + 1);
  }
  return null;
};

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getCsrfToken();
  if (token) config.headers['X-CSRFToken'] = token;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Keep backend alive on free tier
const keepAlive = () => {
  fetch(`${BACKEND_URL}/api/`)
    .catch(() => {}); // silently ignore errors
};

// Ping every 10 minutes
setInterval(keepAlive, 10 * 60 * 1000);

// Ping immediately on app load
keepAlive();
