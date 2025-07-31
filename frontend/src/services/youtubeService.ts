import { api } from "./authService";

export const startDownloadPlaylist = async (playlistId: string) => {
  const response = await api.post(`/download/playlist/${playlistId}/`);
  return response.data;
};

export const getDownloadStatus = async (taskId: string) => {
  const response = await api.get(`/download/status/${taskId}/`);
  return response.data;
};

export const getDownloadedFile = async (taskId: string) => {
  const response = await api.get(`/download/retrieve/${taskId}/`, { responseType: 'blob' });
  return response;
};
