import api from "../api/axiosConfig";

// Register new user
export const registerUser = async (payload: any) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

// Verify email code
export const verifyEmailCode = async (email: string, code: string) => {
  const response = await api.post("/auth/verify-email-code", {
    email,
    code,
  });
  return response.data;
};

// Resend email verification code
export const resendVerificationCode = async (email: string) => {
  const response = await api.post("/auth/resend-verification-code", {
    email,
  });
  return response.data;
};

// Login user
export const loginUser = async (email: string, password: string) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });
  return response.data;
};

// Request forgot password code
export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", {
    email,
  });
  return response.data;
};

// Reset password with code
export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
) => {
  const response = await api.post("/auth/reset-password", {
    email,
    code,
    newPassword,
  });
  return response.data;
};