// baseURL: "http://192.168.1.127:8080/api"

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://192.168.1.127:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    console.log("TOKEN FROM STORAGE:", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("REQUEST URL:", config.url);
    console.log("REQUEST HEADERS:", config.headers);

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;