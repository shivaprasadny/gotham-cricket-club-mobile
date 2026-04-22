import AsyncStorage from "@react-native-async-storage/async-storage";

export type NotificationType =
  | "MATCH"
  | "ANNOUNCEMENT"
  | "FEE"
  | "TEAM"
  | "LEAGUE"
  | "MEMBER"
  | "GENERAL";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;

  // NEW
  type?: NotificationType;
  read?: boolean;
  targetScreen?: string;
  targetId?: number | null;
};

const KEY = "app_notifications";

/**
 * Get all notifications
 */
export const getNotifications = async (): Promise<AppNotification[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.log("GET NOTIFICATIONS ERROR:", error);
    return [];
  }
};

/**
 * Add notification
 */
export const addNotification = async (
  notification: Omit<AppNotification, "id" | "createdAt" | "read">
): Promise<void> => {
  try {
    const existing = await getNotifications();

    const newNotification: AppNotification = {
      id: Date.now().toString(),
      title: notification.title,
      message: notification.message,
      createdAt: new Date().toISOString(),

      // NEW fields
      type: notification.type || "GENERAL",
      targetScreen: notification.targetScreen,
      targetId: notification.targetId ?? null,
      read: false,
    };

    const updated = [newNotification, ...existing];

    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  } catch (error) {
    console.log("ADD NOTIFICATION ERROR:", error);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (id: string) => {
  try {
    const existing = await getNotifications();

    const updated = existing.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );

    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  } catch (error) {
    console.log("MARK READ ERROR:", error);
  }
};

/**
 * Clear all notifications
 */
export const clearNotifications = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (error) {
    console.log("CLEAR NOTIFICATIONS ERROR:", error);
  }
};