import api from "../api/axiosConfig";

export const getSquadByMatch = async (matchId: number) => {
  const response = await api.get(`/matches/${matchId}/squad`);
  return response.data;
};

export const addOrUpdateSquadMember = async (
  matchId: number,
  payload: {
    userId: number;
    isPlayingXi: boolean;
    roleInMatch?: string;
  }
) => {
  const response = await api.post(`/matches/${matchId}/squad`, payload);
  return response.data;
};

export const removeSquadMember = async (matchId: number, userId: number) => {
  const response = await api.delete(`/matches/${matchId}/squad/${userId}`);
  return response.data;
};