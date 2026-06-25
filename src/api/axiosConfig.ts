import axios from "axios";
import { logger } from "../utils/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

/**
 * Prevents showing many "Session Expired" alerts at the same time
 * if multiple API calls fail together.
 */
let isSessionExpiredAlertShown = false;

let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("Missing EXPO_PUBLIC_API_URL");
}
/**
 * Shared Axios instance for the whole app.
 *
 * All API calls should use this file so:
 * 1. baseURL is controlled in one place
 * 2. JWT token is added automatically
 * 3. expired/invalid token is handled globally
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * REQUEST INTERCEPTOR
 *
 * Runs before every API request.
 * It reads JWT token from AsyncStorage and attaches it to the request.
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // Get saved JWT token from phone storage
      const token = await AsyncStorage.getItem("token");

      // If token exists, attach it to Authorization header
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      logger.log("REQUEST INTERCEPTOR ERROR:", error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR
 *
 * Runs when API returns an error.
 * If backend says token is expired/invalid, remove local token
 * and show a clear login-again message.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      const status = error?.response?.status;

      // 401 means the login session is missing, invalid, or expired.
      // 403 means the user is logged in but is not allowed to perform an action,
      // so it must not log the user out.
      if (status === 401 && !isSessionExpiredAlertShown) {
        const storedToken = await AsyncStorage.getItem("token");

        // Login and other public endpoints may also return 401. Only expire a
        // session when the app actually had a saved authenticated session.
        if (!storedToken) {
          return Promise.reject(error);
        }

        isSessionExpiredAlertShown = true;

        // Clear saved login session from phone
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");

        // Remove default Authorization header if it exists
        delete api.defaults.headers.common.Authorization;

        onSessionExpired?.();

        // Show user-friendly alert
        Alert.alert(
          "Session Expired",
          "Please login again.",
          [
            {
              text: "OK",
              onPress: () => {
                // Allow alert to show again in future if needed
                isSessionExpiredAlertShown = false;
              },
            },
          ]
        );
      }

      const requestUrl = String(error?.config?.url || "");
      const isExpectedMissingScorecard =
        status === 404 && /\/matches\/\d+\/scorecard$/.test(requestUrl);

      // A missing scorecard is normal before the first draft is created.
      if (!isExpectedMissingScorecard) {
        logger.log("API ERROR STATUS:", status);
        logger.log("API ERROR DATA:", error?.response?.data);
      }
    } catch (cleanupError) {
      logger.log("RESPONSE INTERCEPTOR CLEANUP ERROR:", cleanupError);
    }

    return Promise.reject(error);
  }
);

export default api;
