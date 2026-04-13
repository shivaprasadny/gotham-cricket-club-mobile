export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "CAPTAIN" | "PLAYER";
  status: "PENDING" | "APPROVED" | "REJECTED";
  token: string;
  message: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  nickname?: string;
  phone?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  playerType?: string;
  jerseyNumber?: number;
};