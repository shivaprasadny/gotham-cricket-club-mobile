import api from "../api/axiosConfig";

export const getAnnouncements = async () => {
  const response = await api.get("/announcements");
  return response.data;
};

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