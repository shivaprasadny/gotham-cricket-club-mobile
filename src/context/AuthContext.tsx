import * as SecureStore from "expo-secure-store";
import { logger } from "../utils/logger";
import React, { createContext, useContext, useEffect, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import {
  registerForPushNotificationsAsync,
  removeTokenFromBackend,
  savePushTokenToBackend,
} from "../services/pushNotificationService";
import { setSessionExpiredHandler } from "../api/axiosConfig";
import { loginUser } from "../services/authService";

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

 useEffect(() => {
  setSessionExpiredHandler(async () => {
    // ✅ Clear push token so device stops receiving notifications after logout
    try {
      const pushToken = await registerForPushNotificationsAsync().catch(() => null);
      if (pushToken) {
        await removeTokenFromBackend(pushToken).catch(() => {});
      }
    } catch {
      // Non-fatal
    }

    // ✅ Clear all local storage
    await SecureStore.deleteItemAsync("token").catch(() => {});
    await SecureStore.deleteItemAsync("user").catch(() => {});

    // ✅ Clear state — app will redirect to login automatically
    // because your navigation already checks user === null
    setToken(null);
    setUser(null);
  });

  return () => setSessionExpiredHandler(null);
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
      const storedToken = await SecureStore.getItemAsync("token");
      const storedUser = await SecureStore.getItemAsync("user");

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
      logger.error("Failed to load auth from storage:", error);
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

    await SecureStore.setItemAsync("token", newToken);
    await SecureStore.setItemAsync("user", JSON.stringify(newUser));
  } catch (error) {
    logger.error("Error saving auth data:", error);
    return;
  }

  // Push token should not break login
  try {
    const pushToken = await registerForPushNotificationsAsync();
    if (pushToken) {
      await savePushTokenToBackend(pushToken);
    }
  } catch {
    // Non-fatal — login still succeeds without push token
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
        promptMessage: "Sign in to Gotham Cricket",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return { success: false, message: "Biometric authentication failed" };
      }

      // Retrieve stored credentials and get a fresh JWT from the server
      const savedEmail = await SecureStore.getItemAsync("bio_email");
      const savedPassword = await SecureStore.getItemAsync("bio_password");

      if (!savedEmail || !savedPassword) {
        return {
          success: false,
          message: "No saved login found. Please login with password first.",
        };
      }

      const response = await loginUser(savedEmail, savedPassword);

      await login(response.token, {
        id: response.id,
        fullName: response.fullName,
        email: response.email,
        role: response.role,
        status: response.status,
      });

      return { success: true };
    } catch (error) {
      logger.error("BIOMETRIC ERROR:", error);
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
      // Remove push token from backend so this device stops receiving notifications
      const pushToken = await registerForPushNotificationsAsync().catch(() => null);
      if (pushToken) {
        await removeTokenFromBackend(pushToken).catch(() => {});
      }

      setToken(null);
      setUser(null);

      await SecureStore.deleteItemAsync("token").catch(() => {});
      await SecureStore.deleteItemAsync("user").catch(() => {});

      // Clear saved biometric credentials — next session requires password
      await SecureStore.deleteItemAsync("bio_email").catch(() => {});
      await SecureStore.deleteItemAsync("bio_password").catch(() => {});
    } catch (error) {
      logger.error("Error clearing auth data:", error);
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
