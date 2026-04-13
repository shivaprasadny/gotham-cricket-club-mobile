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