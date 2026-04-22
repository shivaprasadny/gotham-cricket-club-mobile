import api from "../api/axiosConfig";

// Notification shape coming from backend
export type AppNotification = {
  recipientId: number;
  notificationId: number;
  title: string;
  message: string;
  type: string;
  targetScreen?: string | null;
  targetId?: number | null;
  isRead: boolean;
  createdAt: string;
};

// Get current user's notifications from backend
export const getNotifications = async (): Promise<AppNotification[]> => {
  const response = await api.get("/notifications/my");
  return response.data;
};

// Mark one notification as read
export const markNotificationAsRead = async (
  recipientId: number
): Promise<string> => {
  const response = await api.put(`/notifications/${recipientId}/read`);
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<string> => {
  const response = await api.put("/notifications/read-all");
  return response.data;
};

// Clear all notifications for current user
export const clearNotifications = async (): Promise<string> => {
  const response = await api.put("/notifications/clear-all");
  return response.data;
};