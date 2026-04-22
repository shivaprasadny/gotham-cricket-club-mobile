import api from "../api/axiosConfig";

// Availability status type
export type AvailabilityStatus =
  | "AVAILABLE"
  | "NOT_AVAILABLE"
  | "MAYBE"
  | "INJURED";

// Mark or update availability
export const markAvailability = async (payload: {
  matchId: number;
  status: AvailabilityStatus;
  message?: string;
}) => {
  const response = await api.post("/availability", payload);
  return response.data;
};

// Get all responses for one match
export const getAvailabilityByMatch = async (matchId: number) => {
  const response = await api.get(`/availability/match/${matchId}`);
  return response.data;
};

// Get summary for one match
export const getAvailabilitySummary = async (matchId: number) => {
  const response = await api.get(`/availability/match/${matchId}/summary`);
  return response.data;
};

// Get current user's availability for one match
export const getMyAvailabilityByMatch = async (matchId: number) => {
  const response = await api.get(`/availability/match/${matchId}/me`);
  return response.data;
};

// Optional second helper if you still want to keep this
export const saveAvailability = async (payload: {
  matchId: number;
  status: AvailabilityStatus;
  note?: string;
}) => {
  const response = await api.post("/availability", payload);
  return response.data;
};