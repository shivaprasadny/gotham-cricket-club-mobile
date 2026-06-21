import api from "../api/axiosConfig";
import {
  SaveScorecardRequest,
  ScorecardResponse,
} from "../types/scorecard";

const endpoint = (matchId: number) => `/matches/${matchId}/scorecard`;

export const getScorecard = async (matchId: number): Promise<ScorecardResponse> => {
  const response = await api.get(endpoint(matchId));
  return response.data;
};

export const createScorecardDraft = async (
  matchId: number,
  payload: SaveScorecardRequest
): Promise<ScorecardResponse> => {
  const response = await api.post(endpoint(matchId), payload);
  return response.data;
};

export const updateScorecardDraft = async (
  matchId: number,
  payload: SaveScorecardRequest
): Promise<ScorecardResponse> => {
  const response = await api.put(endpoint(matchId), payload);
  return response.data;
};

export const publishScorecard = async (
  matchId: number
): Promise<ScorecardResponse> => {
  const response = await api.post(`${endpoint(matchId)}/publish`);
  return response.data;
};

export const reopenScorecard = async (
  matchId: number
): Promise<ScorecardResponse> => {
  const response = await api.post(`${endpoint(matchId)}/reopen`);
  return response.data;
};

export const deleteScorecardDraft = async (matchId: number): Promise<string> => {
  const response = await api.delete(endpoint(matchId));
  return response.data;
};
