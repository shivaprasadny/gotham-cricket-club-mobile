import api from "../api/axiosConfig";
import { LoginRequest, LoginResponse, RegisterRequest } from "../types/auth";

export const loginUser = async (
  payload: LoginRequest
): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

export const registerUser = async (
  payload: RegisterRequest
): Promise<string> => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

export const requestPasswordResetCode = async (email: string) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (payload: {
  email: string;
  code: string;
  newPassword: string;
}) => {
  const response = await api.post("/auth/reset-password", payload);
  return response.data;
};
export const getAllMembers = async () => {
  const response = await api.get("/admin/members");
  return response.data;
};