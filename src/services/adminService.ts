import api from "../api/axiosConfig";

export type ApprovalRole = "PLAYER" | "CAPTAIN" | "ADMIN";

export const getPendingMembers = async () => {
  const response = await api.get("/admin/pending-members");
  return response.data;
};

export const approveMember = async (
  userId: number,
  role: ApprovalRole = "PLAYER"
) => {
  const response = await api.put(`/admin/members/${userId}/approve`, { role });
  return response.data;
};

export const rejectMember = async (userId: number) => {
  const response = await api.put(`/admin/members/${userId}/reject`);
  return response.data;
};





// Get all approved members
export const getAllMembers = async () => {
  const response = await api.get("/admin/members");
  return response.data;
};

export const updateMemberRole = async (
  userId: number,
  role: ApprovalRole
) => {
  const response = await api.put(`/admin/members/${userId}/role`, { role });
  return response.data;
};
export const deactivateMember = async (userId: number) => {
  const response = await api.put(`/admin/members/${userId}/deactivate`);
  return response.data;
};
export const activateMember = async (userId: number) => {
  const response = await api.put(`/admin/members/${userId}/activate`);
  return response.data;
};