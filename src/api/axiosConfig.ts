import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create one shared axios instance for the whole app

 

const api = axios.create({
   baseURL: "http://192.168.1.127:8080/api",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});
// =========================
// REQUEST INTERCEPTOR
// =========================
// Add JWT token to every outgoing request if token exists
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Optional debug log
      console.log("REQUEST:", config.method?.toUpperCase(), config.url);

      return config;
    } catch (error) {
      console.error("REQUEST INTERCEPTOR ERROR:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// =========================
// RESPONSE INTERCEPTOR
// =========================
// If backend says token is invalid / expired, clear saved session
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      const status = error?.response?.status;

      if (status === 401) {
        console.log("401 Unauthorized → clearing saved auth session");

        // Remove saved session from storage
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");

        // Remove default auth header if previously set anywhere
        delete api.defaults.headers.common["Authorization"];
      }
    } catch (storageError) {
      console.error("RESPONSE INTERCEPTOR CLEANUP ERROR:", storageError);
    }

    return Promise.reject(error);
  }
);

export default api;