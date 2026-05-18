import axios from 'axios';

const fallbackApiBase =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || fallbackApiBase
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('amena_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;