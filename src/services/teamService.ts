import api from "../api/axiosConfig";

export const getTeams = async () => {
  const response = await api.get("/teams");
  return response.data;
};

export const getTeamById = async (teamId: number) => {
  const response = await api.get(`/teams/${teamId}`);
  return response.data;
};

export const getTeamMembers = async (teamId: number) => {
  const response = await api.get(`/teams/${teamId}/members`);
  return response.data;
};

export const createTeam = async (payload: {
  teamName: string;
  description?: string;
  leagueName?: string;
  captainId?: number | null;
}) => {
  const response = await api.post("/teams", payload);
  return response.data;
};

export const updateTeam = async (
  teamId: number,
  payload: {
    teamName: string;
    description?: string;
    leagueName?: string;
    captainId?: number | null;
  }
) => {
  const response = await api.put(`/teams/${teamId}`, payload);
  return response.data;
};

export const deleteTeam = async (teamId: number) => {
  const response = await api.delete(`/teams/${teamId}`);
  return response.data;
};

export const addMemberToTeam = async (teamId: number, userId: number) => {
  const response = await api.post(`/teams/${teamId}/members/${userId}`);
  return response.data;
};

export const removeMemberFromTeam = async (teamId: number, userId: number) => {
  const response = await api.delete(`/teams/${teamId}/members/${userId}`);
  return response.data;
};