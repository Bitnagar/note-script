import apiClient from '@/api';

export const getDocs = async () => {
  const response = await apiClient.get('/api/documents');
  return response.data;
};
