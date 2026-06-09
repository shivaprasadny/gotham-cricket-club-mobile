import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

/**
 * Prevents showing many "Session Expired" alerts at the same time
 * if multiple API calls fail together.
 */
let isSessionExpiredAlertShown = false;

/**
 * Shared Axios instance for the whole app.
 *
 * All API calls should use this file so:
 * 1. baseURL is controlled in one place
 * 2. JWT token is added automatically
 * 3. expired/invalid token is handled globally
 */
const api = axios.create({
  // Production backend API
 //  baseURL: "http://32.194.245.83:8080/api",



  baseURL:"https://api.shivaprasadofficial.com/api",



  //  baseURL: "http://192.168.1.127:8080/api",

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
      console.log("REQUEST INTERCEPTOR ERROR:", error);
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

      // 401 = Unauthorized / token expired
      // 403 = Forbidden / token invalid or no permission
      if ((status === 401 || status === 403) && !isSessionExpiredAlertShown) {
        isSessionExpiredAlertShown = true;

        // Clear saved login session from phone
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");

        // Remove default Authorization header if it exists
        delete api.defaults.headers.common.Authorization;

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

      // Helpful logs during testing
      console.log("API ERROR STATUS:", status);
      console.log("API ERROR DATA:", error?.response?.data);
    } catch (cleanupError) {
      console.log("RESPONSE INTERCEPTOR CLEANUP ERROR:", cleanupError);
    }

    return Promise.reject(error);
  }
);

export default api;