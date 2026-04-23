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
  // =========================
  // NEW NAME STRUCTURE
  // =========================
  firstName: string;
  lastName: string;

  // =========================
  // AUTH FIELDS
  // =========================
  email: string;
  password: string;

  // =========================
  // OPTIONAL PROFILE
  // =========================
  nickname?: string;
  phone?: string;

  // Must match backend (LocalDate)
  dateOfBirth?: string | null;

  gender?: string;

  // =========================
  // CRICKET PROFILE
  // =========================
  battingStyle?: string;
  bowlingStyle?: string;
  playerType?: string;
  jerseyNumber?: number | null;
};