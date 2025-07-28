import axios from 'axios';
import { useAuthStore } from './store';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
