import api from "../api/axiosConfig";

export const getAllMembers = async () => {
  const response = await api.get("/members");
  return response.data;
};

export const getMemberById = async (userId: number) => {
  const response = await api.get(`/members/${userId}`);
  return response.data;
};