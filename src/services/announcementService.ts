import api from "../api/axiosConfig";



export const createAnnouncement = async (payload: {
  title: string;
  message: string;
}) => {
  const response = await api.post("/announcements", payload);
  return response.data;
};

export const updateAnnouncement = async (
  id: number,
  payload: { title: string; message: string }
) => {
  const response = await api.put(`/announcements/${id}`, payload);
  return response.data;
};

export const deleteAnnouncement = async (id: number) => {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
};

// Get all announcements
export const getAnnouncements = async () => {
  const response = await api.get("/announcements");
  return response.data;
};

// Get pinned announcement only
export const getPinnedAnnouncement = async () => {
  const response = await api.get("/announcements/pinned");
  return response.data;
};

// Pin one announcement
export const pinAnnouncement = async (announcementId: number) => {
  const response = await api.put(`/announcements/${announcementId}/pin`);
  return response.data;
};

// Unpin one announcement
export const unpinAnnouncement = async (announcementId: number) => {
  const response = await api.put(`/announcements/${announcementId}/unpin`);
  return response.data;
};