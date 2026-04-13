import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

const KEY = "app_notifications";

export const getNotifications = async (): Promise<AppNotification[]> => {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
};

export const addNotification = async (
  notification: Omit<AppNotification, "id" | "createdAt">
) => {
  const existing = await getNotifications();

  const newNotification: AppNotification = {
    id: Date.now().toString(),
    title: notification.title,
    message: notification.message,
    createdAt: new Date().toISOString(),
  };

  const updated = [newNotification, ...existing];
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
};

export const clearNotifications = async () => {
  await AsyncStorage.removeItem(KEY);
};