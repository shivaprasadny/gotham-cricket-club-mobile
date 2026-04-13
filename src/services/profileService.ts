import api from "../api/axiosConfig";

export const getMyProfile = async () => {
  const response = await api.get("/profile/me");
  return response.data;
};

export const updateMyProfile = async (payload: {
  nickname?: string;
  phone?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  playerType?: string;
  jerseyNumber?: number | null;
}) => {
  const response = await api.put("/profile/me", payload);
  return response.data;
};