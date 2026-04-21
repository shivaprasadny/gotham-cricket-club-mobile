import api from "../api/axiosConfig";

/**
 * ===============================
 * PLAYER APIs
 * ===============================
 */

/**
 * Get all fees for logged-in user
 */
export const getMyFees = async () => {
  const response = await api.get("/fees/my");
  return response.data;
};

/**
 * Get fee summary (dashboard)
 */
export const getMyFeeSummary = async () => {
  const response = await api.get("/fees/my/summary");
  return response.data;
};

/**
 * Submit payment (player action)
 */
export const submitPayment = async (
  assignmentId: number,
  data: {
    paymentMethod: string;
    paymentNote: string;
  }
) => {
  const response = await api.post(
    `/fees/assignments/${assignmentId}/submit-payment`,
    data
  );
  return response.data;
};

/**
 * ===============================
 * ADMIN / CAPTAIN APIs
 * ===============================
 */

/**
 * Create fee (match / event / etc)
 */
export const createFee = async (data: any) => {
  const response = await api.post("/fees", data);
  return response.data;
};

/**
 * Get all fee definitions
 */
export const getAllFees = async () => {
  const response = await api.get("/fees");
  return response.data;
};

/**
 * Get all assignments for a fee
 */
export const getFeeAssignments = async (feeId: number) => {
  const response = await api.get(`/fees/${feeId}/assignments`);
  return response.data;
};

/**
 * Confirm payment (admin/captain)
 */
export const confirmPayment = async (assignmentId: number) => {
  const response = await api.put(
    `/fees/assignments/${assignmentId}/confirm-payment`
  );
  return response.data;
};

/**
 * Waive fee
 */
export const waiveFee = async (
  assignmentId: number,
  waiverReason?: string
) => {
  const response = await api.put(
    `/fees/assignments/${assignmentId}/waive`,
    { waiverReason }
  );
  return response.data;
};