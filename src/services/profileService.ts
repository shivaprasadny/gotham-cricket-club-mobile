import api from "../api/axiosConfig";

export type UpdateMyProfileRequest = {
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  nickname?: string;
  countryCode?: string | null;
  phone?: string | null;
  battingStyle?: string;
  bowlingStyle?: string;
  playerType?: string;
  jerseyNumber?: number | null;
  showEmail?: boolean;
  showPhone?: boolean;
  showWhatsApp?: boolean;
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