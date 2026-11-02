import axios from 'axios';
import { getSessionEndReason, sessionEnded, store } from './store.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const auth = store.getState().auth;
  const token = auth.accessToken;
  const reason = getSessionEndReason(auth);
  if (reason && config.url !== '/auth/logout') {
    store.dispatch(sessionEnded(reason));
    throw new axios.CanceledError('Session ended. Please sign in again.');
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = store.getState().auth.accessToken;
    if (error.response?.status === 401 && token
      && error.config?.headers?.Authorization === `Bearer ${token}`) {
      store.dispatch(sessionEnded('expired'));
    }
    return Promise.reject(error);
  },
);