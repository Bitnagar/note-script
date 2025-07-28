import apiClient from '@/api';

export const deleteDoc = async (documentId?: string) => {
  if (!documentId) {
    return [];
  }
  const response = await apiClient.delete(`/api/documents/${documentId}`);
  return response.data;
};
