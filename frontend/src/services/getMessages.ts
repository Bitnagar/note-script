import apiClient from '@/api';

export const getMessages = async (documentId?: string) => {
  if (!documentId) {
    return [];
  }
  const response = await apiClient.get(`/api/documents/${documentId}/messages`);
  return response.data;
};
