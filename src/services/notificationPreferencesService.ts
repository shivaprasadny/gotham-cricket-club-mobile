import api from "../api/axiosConfig";

export type NotificationPreferences = {
  id: number;
  pushEnabled: boolean;
  muteAllChats: boolean;
  muteGroupChats: boolean;
  muteMatchChats: boolean;
  muteEventChats: boolean;
};

export type UpdateNotificationPreferencesPayload = {
  pushEnabled: boolean;
  muteAllChats: boolean;
  muteGroupChats: boolean;
  muteMatchChats: boolean;
  muteEventChats: boolean;
};

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get<NotificationPreferences>("/notification-preferences/me");
  return response.data;
};

export const updateNotificationPreferences = async (
  payload: UpdateNotificationPreferencesPayload
): Promise<NotificationPreferences> => {
  const response = await api.put<NotificationPreferences>("/notification-preferences/me", payload);
  return response.data;
};
