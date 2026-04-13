import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  registerForPushNotificationsAsync,
  savePushTokenToBackend,
} from "../services/pushNotificationService";

type UserType = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "CAPTAIN" | "PLAYER";
  status: "PENDING" | "APPROVED" | "REJECTED";
};

type AuthContextType = {
  user: UserType | null;
  token: string | null;
  login: (token: string, user: UserType) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load auth from storage:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (newToken: string, newUser: UserType) => {
  try {
    setToken(newToken);
    setUser(newUser);

    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));

    const pushToken = await registerForPushNotificationsAsync();
    if (pushToken) {
      await savePushTokenToBackend(pushToken);
    }
  } catch (error) {
    console.error("Error saving auth or push token data:", error);
  }
};

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};