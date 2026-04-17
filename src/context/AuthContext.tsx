import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
// Push notification code kept commented because Expo Go can cause issues
// import {
//   registerForPushNotificationsAsync,
//   savePushTokenToBackend,
// } from "../services/pushNotificationService";

/**
 * Logged-in user shape stored in app state and AsyncStorage
 */
type UserType = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "CAPTAIN" | "PLAYER";
  status: "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";
};

/**
 * All auth functions and values available through context
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

/**
 * Create auth context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider that wraps the app and exposes auth state
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Logged-in user
  const [user, setUser] = useState<UserType | null>(null);

  // JWT token
  const [token, setToken] = useState<string | null>(null);

  // Global loading during startup
  const [loading, setLoading] = useState(true);

  /**
   * Load saved auth info once when app starts
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
   * Load token and user from AsyncStorage
   * Returns true if user session was restored
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

      return false;
    } catch (error) {
      console.error("Failed to load auth from storage:", error);
      return false;
    }
  };

  /**
   * Save login session after successful email/password login
   */
  const login = async (newToken: string, newUser: UserType) => {
    try {
      setToken(newToken);
      setUser(newUser);

      await AsyncStorage.setItem("token", newToken);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));

      /**
       * Push notification registration can be enabled later
       * when using a development build instead of Expo Go
       */
      // const pushToken = await registerForPushNotificationsAsync();
      // if (pushToken) {
      //   await savePushTokenToBackend(pushToken);
      // }
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  };

  /**
   * Biometric login:
   * 1. Check device support
   * 2. Check biometric is enrolled
   * 3. Authenticate user
   * 4. Restore saved session from AsyncStorage
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
 * Custom hook for using auth context safely
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};