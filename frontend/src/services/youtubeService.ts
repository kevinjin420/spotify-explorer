import { api } from "./authService";

export const downloadPlaylist = async (playlistId: string) => {
  const response = await api.post(`/download/playlist/${playlistId}/`, {}, { responseType: 'blob' });
  return response;
};