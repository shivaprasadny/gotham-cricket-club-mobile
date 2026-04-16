import api from "../api/axiosConfig";

// Get all leagues
export const getLeagues = async () => {
  const response = await api.get("/leagues");
  return response.data;
};

// Get one league by id
export const getLeagueById = async (leagueId: number) => {
  const response = await api.get(`/leagues/${leagueId}`);
  return response.data;
};

// Create a new league
export const createLeague = async (payload: {
  name: string;
  season: string;
  type: "LEAGUE" | "TOURNAMENT" | "FRIENDLY_SERIES";
  description?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
}) => {
  const response = await api.post("/leagues", payload);
  return response.data;
};