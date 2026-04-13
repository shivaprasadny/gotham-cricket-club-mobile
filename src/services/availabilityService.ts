import api from "../api/axiosConfig";

export const markAvailability = async (payload: {
  matchId: number;
  status: "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED";
  message?: string;
}) => {
  const response = await api.post("/availability", payload);
  return response.data;
};

export const getAvailabilityByMatch = async (matchId: number) => {
  const response = await api.get(`/availability/match/${matchId}`);
  return response.data;
};

export const getAvailabilitySummary = async (matchId: number) => {
  const response = await api.get(`/availability/match/${matchId}/summary`);
  return response.data;
};