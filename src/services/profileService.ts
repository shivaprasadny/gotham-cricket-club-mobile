import api from "../api/axiosConfig";

export type UpdateMyProfileRequest = {
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  nickname?: string;
  phone?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  playerType?: string;
  jerseyNumber?: number | null;
};

export const getMyProfile = async () => {
  const response = await api.get("/profile/me");
  return response.data;
};

export const updateMyProfile = async (
  payload: UpdateMyProfileRequest
): Promise<string> => {
  const response = await api.put("/profile/me", payload);
  return response.data;
};