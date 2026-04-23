import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import {
  registerForPushNotificationsAsync,
  savePushTokenToBackend,
} from "../services/pushNotificationService";

type UserType = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "CAPTAIN" | "PLAYER";
  status: "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";
};

/**
 * All auth values and functions exposed through context
 */
type AuthContextType = {
  user: UserType | null;
  token: string | null;
  login: (token: string, user: UserType) => Promise<void>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<boolean>;
  biometricLogin: () => Promise<{ success: boolean; message?: string }>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider that wraps app and manages auth state
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Logged-in user
  const [user, setUser] = useState<UserType | null>(null);

  // JWT token
  const [token, setToken] = useState<string | null>(null);

  // App startup loading state
  const [loading, setLoading] = useState(true);

  /**
   * Run once on app startup
   * Restores saved session if available
   */
  useEffect(() => {
    void initializeAuth();
  }, []);

  /**
   * Startup initializer
   */
  const initializeAuth = async () => {
    try {
      await loadUserFromStorage();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load token + user from AsyncStorage
   * Returns true if session restored successfully
   */
  const loadUserFromStorage = async (): Promise<boolean> => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as UserType);
        return true;
      }

      // If either one is missing, clear local state
      setToken(null);
      setUser(null);
      return false;
    } catch (error) {
      console.error("Failed to load auth from storage:", error);
      setToken(null);
      setUser(null);
      return false;
    }
  };

  /**
   * Save session after successful login
   */
  const login = async (newToken: string, newUser: UserType) => {
    try {
      setToken(newToken);
      setUser(newUser);

      await AsyncStorage.setItem("token", newToken);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));

      /**
       * Register push notifications after successful login
       * Safe to keep here for real-device builds
       */
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        await savePushTokenToBackend(pushToken);
      }
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  };

  /**
   * Biometric login:
   * 1. Check hardware
   * 2. Check enrolled biometrics
   * 3. Authenticate
   * 4. Restore saved session
   */
  const biometricLogin = async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      if (!hasHardware) {
        return {
          success: false,
          message: "Device does not support biometrics",
        };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isEnrolled) {
        return {
          success: false,
          message: "No biometric found on device",
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Login with Face ID / Fingerprint",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return {
          success: false,
          message: "Biometric authentication failed",
        };
      }

      const loaded = await loadUserFromStorage();

      if (!loaded) {
        return {
          success: false,
          message: "No saved login found. Please login with password first.",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("BIOMETRIC ERROR:", error);
      return {
        success: false,
        message: "Something went wrong during biometric login",
      };
    }
  };

  /**
   * Clear user session on logout
   */
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
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loadUserFromStorage,
        biometricLogin,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Safe custom hook for auth context usage
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};