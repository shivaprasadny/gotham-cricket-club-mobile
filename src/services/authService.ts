import api from "../api/axiosConfig";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "../types/auth";

/**
 * Login user
 */
export const loginUser = async (
  payload: LoginRequest
): Promise<LoginResponse> => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

/**
 * Register user
 */
export const registerUser = async (
  payload: RegisterRequest
): Promise<string> => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

/**
 * Ask backend to send reset code
 */
export const requestPasswordResetCode = async (
  email: string
): Promise<string> => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

/**
 * Reset password using email + code + new password
 */
export const forgotPassword = async (payload: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<string> => {
  const response = await api.post("/auth/reset-password", payload);
  return response.data;
};