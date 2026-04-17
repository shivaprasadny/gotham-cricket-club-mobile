/**
 * Request body for login API
 */
export type LoginRequest = {
  email: string;
  password: string;
};

/**
 * Response returned by backend after successful login
 */
export type LoginResponse = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "CAPTAIN" | "PLAYER";
  status: "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";
  token: string;
  message?: string;
};

/**
 * Request body for register API
 */
export type RegisterRequest = {
  fullName: string;
  nickname: string;
  email: string;
  phone: string;
  password: string;
  battingStyle: string;
  bowlingStyle: string;
  playerType: string;
  jerseyNumber: number | null;
};