import api from "../api/axiosConfig";

// Get all matches
export const getMatches = async () => {
  const response = await api.get("/matches");
  return response.data;
};

// Get one match details
export const getMatchById = async (matchId: number) => {
  const response = await api.get(`/matches/${matchId}`);
  return response.data;
};

// Create match
export const createMatch = async (payload: {
  homeTeamId: number | null;
  awayTeamId: number | null;
  externalOpponentName: string;
  leagueId: number | null;
  matchDate: string;
  venue: string;
  matchType: string;
  matchFormat: string;
  matchFee: number | null;
  notes: string;
  status: "UPCOMING" | "COMPLETED" | "CANCELLED";
}) => {
  const response = await api.post("/matches", payload);
  return response.data;
};

// Update match
export const updateMatch = async (
  matchId: number,
  payload: {
    homeTeamId: number | null;
    awayTeamId: number | null;
    externalOpponentName: string;
    leagueId: number | null;
    matchDate: string;
    venue: string;
    matchType: string;
    matchFormat: string;
    matchFee: number | null;
    notes: string;
    status: "UPCOMING" | "COMPLETED" | "CANCELLED";
  }
) => {
  const response = await api.put(`/matches/${matchId}`, payload);
  return response.data;
};

// Delete match
export const deleteMatch = async (matchId: number) => {
  const response = await api.delete(`/matches/${matchId}`);
  return response.data;
};