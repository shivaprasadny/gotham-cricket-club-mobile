import api from "../api/axiosConfig";

export const getAnnouncements = async () => {
  const response = await api.get("/announcements");
  return response.data;
};