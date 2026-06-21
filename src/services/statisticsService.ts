import api from "../api/axiosConfig";
import {
  LeaderboardCategory,
  LeagueStatistics,
  PlayerLeaderboardEntry,
  PlayerStatistics,
  StatisticsFilterOptions,
  StatisticsFilters,
  TeamStatistics,
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
