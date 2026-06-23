import api from "../api/axiosConfig";
import {
  LeaderboardCategory,
  LeagueStatistics,
  LeagueCharts,
  PlayerCharts,
  PlayerDashboard,
  PlayerLeaderboardEntry,
  PlayerStatistics,
  StatisticsFilterOptions,
  StatisticsFilters,
  TeamStatistics,
  TeamCharts,
} from "../types/scorecard";

export const getPlayerStatistics = async (
  playerId: number,
  filters: StatisticsFilters = {}
): Promise<PlayerStatistics> => {
  const response = await api.get(`/statistics/players/${playerId}`, {
    params: filters,
  });
  return response.data;
};

export const getTeamStatistics = async (
  teamId: number,
  leagueId?: number
): Promise<TeamStatistics> => {
  const response = await api.get(`/statistics/teams/${teamId}`, {
    params: leagueId ? { leagueId } : undefined,
  });
  return response.data;
};

export const getLeagueStatistics = async (
  leagueId: number
): Promise<LeagueStatistics> => {
  const response = await api.get(`/statistics/leagues/${leagueId}`);
  return response.data;
};

export const getLeagueLeaders = async (
  leagueId: number,
  category: LeaderboardCategory,
  limit = 10,
  filters: Omit<StatisticsFilters, "leagueId"> = {}
): Promise<PlayerLeaderboardEntry[]> => {
  const response = await api.get(`/statistics/leagues/${leagueId}/leaders`, {
    params: { category, limit, ...filters },
  });
  return response.data;
};

export const getClubLeaders = async (
  category: LeaderboardCategory,
  limit = 10,
  filters: Omit<StatisticsFilters, "leagueId"> = {}
): Promise<PlayerLeaderboardEntry[]> => {
  const response = await api.get("/statistics/club/leaders", {
    params: { category, limit, ...filters },
  });
  return response.data;
};

export const getStatisticsFilterOptions =
  async (): Promise<StatisticsFilterOptions> => {
    const response = await api.get("/statistics/filter-options");
    return response.data;
  };

export const getMyPlayerDashboard = async (
  filters: StatisticsFilters = {},
  recentLimit = 5
): Promise<PlayerDashboard> => {
  const response = await api.get("/statistics/players/me/dashboard", {
    params: { ...filters, recentLimit },
  });
  return response.data;
};

export const getPlayerDashboard = async (
  playerId: number,
  filters: StatisticsFilters = {},
  recentLimit = 5
): Promise<PlayerDashboard> => {
  const response = await api.get(`/statistics/players/${playerId}/dashboard`, {
    params: { ...filters, recentLimit },
  });
  return response.data;
};

export const getPlayerCharts = async (
  playerId: number,
  filters: StatisticsFilters = {},
  limit = 10
): Promise<PlayerCharts> => {
  const response = await api.get(`/statistics/players/${playerId}/charts`, {
    params: { ...filters, limit },
  });
  return response.data;
};

export const getTeamCharts = async (
  teamId: number,
  filters: Pick<StatisticsFilters, "year" | "leagueId"> = {},
  limit = 10
): Promise<TeamCharts> => {
  const response = await api.get(`/statistics/teams/${teamId}/charts`, {
    params: { ...filters, limit },
  });
  return response.data;
};

export const getLeagueCharts = async (
  leagueId: number,
  year?: number,
  limit = 10
): Promise<LeagueCharts> => {
  const response = await api.get(`/statistics/leagues/${leagueId}/charts`, {
    params: { year, limit },
  });
  return response.data;
};
