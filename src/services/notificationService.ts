import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

const KEY = "app_notifications";

export const getNotifications = async (): Promise<AppNotification[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.log("GET NOTIFICATIONS ERROR:", error);
    return [];
  }
};

export const addNotification = async (
  notification: Omit<AppNotification, "id" | "createdAt">
): Promise<void> => {
  try {
    const existing = await getNotifications();

    const newNotification: AppNotification = {
      id: Date.now().toString(),
      title: notification.title,
      message: notification.message,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotification, ...existing];
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  } catch (error) {
    console.log("ADD NOTIFICATION ERROR:", error);
  }
};

export const clearNotifications = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (error) {
    console.log("CLEAR NOTIFICATIONS ERROR:", error);
  }
};