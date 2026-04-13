import api from "../api/axiosConfig";

export const getMyProfile = async () => {
  try {
    const response = await api.get("/profile/me");
    console.log("PROFILE RESPONSE:", response.data);
    return response.data;
  } catch (error: any) {
    console.log("PROFILE ERROR FULL:", error);
    console.log("PROFILE ERROR RESPONSE:", error?.response?.data);
    console.log("PROFILE ERROR STATUS:", error?.response?.status);
    console.log("PROFILE ERROR MESSAGE:", error?.message);
    throw error;
  }
};

export const updateMyProfile = async (payload: any) => {
  const response = await api.put("/profile/me", payload);
  return response.data;
};