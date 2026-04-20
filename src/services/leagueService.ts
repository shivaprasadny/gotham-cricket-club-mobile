import api from "../api/axiosConfig";

/**
 * League object shape used in frontend
 */
export type League = {
  id: number;
  name: string;
  season: string;
  type?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
};

/**
 * Get all leagues
 */
export const getLeagues = async (): Promise<League[]> => {
  const response = await api.get("/leagues");
  return response.data;
};

/**
 * Get one league by id
 */
export const getLeagueById = async (leagueId: number): Promise<League> => {
  const response = await api.get(`/leagues/${leagueId}`);
  return response.data;
};

/**
 * Create league
 */
export const createLeague = async (payload: {
  name: string;
  season: string;
  type: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
}) => {
  const response = await api.post("/leagues", payload);
  return response.data;
};

/**
 * Update league
 */
export const updateLeague = async (
  leagueId: number,
  payload: {
    name: string;
    season: string;
    type: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    active: boolean;
  }
) => {
  const response = await api.put(`/leagues/${leagueId}`, payload);
  return response.data;
};

/**
 * Delete league
 */
export const deleteLeague = async (leagueId: number) => {
  const response = await api.delete(`/leagues/${leagueId}`);
  return response.data;
};