import api from "../api/axiosConfig";

export type MatchStatus = "UPCOMING" | "COMPLETED" | "CANCELLED";

export const getMatches = async () => {
  const response = await api.get("/matches");
  return response.data;
};

export const getMatchById = async (matchId: number) => {
  const response = await api.get(`/matches/${matchId}`);
  return response.data;
};

export const createMatch = async (payload: {
  opponentName: string;
  matchDate: string;
  venue: string;
  matchType: string;
  notes?: string;
  status?: MatchStatus;
}) => {
  const response = await api.post("/matches", payload);
  return response.data;
};

export const updateMatch = async (
  matchId: number,
  payload: {
    opponentName: string;
    matchDate: string;
    venue: string;
    matchType: string;
    notes?: string;
    status?: MatchStatus;
  }
) => {
  const response = await api.put(`/matches/${matchId}`, payload);
  return response.data;
};

export const deleteMatch = async (matchId: number) => {
  const response = await api.delete(`/matches/${matchId}`);
  return response.data;
};