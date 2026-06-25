import * as Notifications from "expo-notifications";
import { logger } from "../utils/logger";
import * as Device from "expo-device";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Alert, Platform } from "react-native";
import api from "../api/axiosConfig";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  try {
    if (
      Platform.OS === "android" &&
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ) {
      Alert.alert(
        "Expo Go Not Supported",
        "Android push notifications need EAS preview/development build."
      );
      return null;
    }

    if (!Device.isDevice) {
      Alert.alert("Push Error", "Push notifications require a real device.");
      return null;
    }

    // Android notification channel
if (Platform.OS === "android") {
  await Notifications.setNotificationChannelAsync("default", {
    name: "Gotham Notifications",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#da9306",
    sound: "default",
    lockscreenVisibility:
      Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const permission = await Notifications.requestPermissionsAsync();
      finalStatus = permission.status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Permission Needed", "Notification permission was not granted.");
      return null;
    }

    const projectId =
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      Alert.alert("Push Error", "Missing EAS projectId.");
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = tokenResponse.data;

    return token;
  } catch (error: any) {
    logger.log("PUSH TOKEN ERROR:", error);
    Alert.alert("Push Token Error", String(error?.message || error));
    return null;
  }
};

export const savePushTokenToBackend = async (token: string) => {
  const response = await api.post("/notifications/token", { token });
  return response.data;
};

export const removeTokenFromBackend = async (token: string) => {
  await api.delete("/notifications/token", { data: { token } });
};