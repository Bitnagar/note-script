import axios from 'axios';
import { useAuthStore } from './store';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001',
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
