import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";

type Props = {
  navigation: any;
};

const LoginScreen = ({ navigation }: Props) => {
  const { login, biometricLogin } = useAuth();

  // =========================
  // INPUT STATE
  // =========================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Show/hide password
  const [showPassword, setShowPassword] = useState(false);

  // Loading states
  const [submitting, setSubmitting] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  // 1 = fingerprint, 2 = face ID
  const [biometricType, setBiometricType] = useState(1);

  // Wrong-password lockout
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0); // unix ms timestamp
  const [lockCountdown, setLockCountdown] = useState("");

  // =========================
  // LOCKOUT COUNTDOWN
  // =========================
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = lockedUntil - Date.now();
      if (remaining <= 0) {
        setLockedUntil(0);
        setFailedAttempts(0);
        setLockCountdown("");
        clearInterval(interval);
      } else {
        const totalSec = Math.ceil(remaining / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        setLockCountdown(`${mins}:${String(secs).padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // =========================
  // AUTO BIOMETRIC ON MOUNT
  // =========================
  useEffect(() => {
    const checkAndAutoPrompt = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) return;

        const savedEmail = await SecureStore.getItemAsync("bio_email");
        if (!savedEmail) return;

        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricType(types[0] ?? 1);
        setBiometricAvailable(true);

        // Short delay so the screen finishes rendering before the system prompt appears
        setTimeout(() => void triggerBiometric(), 600);
      } catch {
        // Non-fatal — fall back to password login
      }
    };

    void checkAndAutoPrompt();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-prompt on mount — shows alert if something goes wrong so it's not silent
  const triggerBiometric = async () => {
    setBiometricLoading(true);
    try {
      const result = await biometricLogin();
      if (result.success) {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } else if (result.message) {
        Alert.alert("Biometric Login", result.message);
      }
    } catch {
      Alert.alert("Biometric Login", "Could not start biometric. Please log in with password.");
    } finally {
      setBiometricLoading(false);
    }
  };

  // =========================
  // NORMAL LOGIN
  // =========================

  const handleLogin = async () => {
    // Block if currently locked out
    if (lockedUntil && Date.now() < lockedUntil) return;

    if (!email.trim()) {
      Alert.alert("Error", "Please enter email");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Please enter password");
      return;
    }

    try {
      setSubmitting(true);

      const response = await loginUser(email.trim(), password.trim());

      // Reset lockout on success
      setFailedAttempts(0);
      setLockedUntil(0);

      await login(response.token, {
        id: response.id,
        fullName: response.fullName,
        email: response.email,
        role: response.role,
        status: response.status,
      });

      // Store credentials encrypted for biometric re-auth on future sessions
      await SecureStore.setItemAsync("bio_email", email.trim()).catch(() => {});
      await SecureStore.setItemAsync("bio_password", password.trim()).catch(() => {});
    } catch (error: any) {
      const message = error?.response?.data?.message;

      // No backend / internet issue
      if (!error?.response) {
        Alert.alert("No Internet", "Check connection or server is not running");
        return;
      }

      // Email not verified yet
      if (message === "Please verify your email first") {
        Alert.alert("Verify Email", "Please verify your email first.");
        navigation.navigate("VerifyEmail", { email: email.trim() });
        return;
      }

      // Waiting admin approval
      if (message === "Waiting for admin approval") {
        Alert.alert("Pending Approval", "Your account is waiting for admin approval.");
        return;
      }

      // Track failed attempts and apply lockout after 5
      const next = failedAttempts + 1;
      setFailedAttempts(next);
      if (next >= 5) {
        const until = Date.now() + 15 * 60 * 1000;
        setLockedUntil(until);
        Alert.alert(
          "Too Many Attempts",
          "Too many failed login attempts. Please try again in 15 minutes."
        );
      } else {
        Alert.alert(
          "Login Failed",
          `${message || "Invalid email or password"} (${next}/5 attempts)`
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // BIOMETRIC LOGIN
  // =========================
 const handleBiometricLogin = async () => {
  try {
    setBiometricLoading(true);

    const result = await biometricLogin();

    if (!result.success) {
      Alert.alert("Biometric Login", result.message || "Login failed");
      return;
    }

    // ✅ Force navigation after successful biometric login
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  } catch (error) {
    Alert.alert("Error", "Biometric login failed");
  } finally {
    setBiometricLoading(false);
  }
};

  // =========================
  // UI
  // =========================
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Club logo */}
          <Image source={require("../../assets/logo.png")} style={styles.logo} />

          {/* Heading */}
          <Text style={styles.title}>Gotham Cricket Club</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Login card */}
          <View style={styles.card}>
            {/* Email input */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#7a7a7a"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />

            {/* Password input with show/hide toggle */}
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#7a7a7a"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                 autoCapitalize="none"   // ✅ FIX
  autoCorrect={false} 
              />

              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <Text style={styles.showText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email/password login button */}
            <TouchableOpacity
              style={[styles.primaryButton, (submitting || lockedUntil > 0) && { opacity: 0.5 }]}
              onPress={handleLogin}
              disabled={submitting || lockedUntil > 0}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? "Signing In..." : "Login"}
              </Text>
            </TouchableOpacity>

            {/* Lockout countdown message */}
            {lockedUntil > 0 && (
              <Text style={styles.lockText}>
                Too many failed attempts. Try again in {lockCountdown}.
              </Text>
            )}

            {/* Biometric login — shown only when hardware enrolled + credentials saved */}
            {biometricAvailable && (
              <TouchableOpacity
                style={[styles.biometricButton, (biometricLoading || submitting) && { opacity: 0.5 }]}
                onPress={handleBiometricLogin}
                disabled={biometricLoading || submitting}
              >
                <Ionicons
                  name={biometricType === 2 ? "scan-outline" : "finger-print-outline"}
                  size={26}
                  color="#F4B400"
                />
                <Text style={styles.biometricText}>
                  {biometricLoading
                    ? "Verifying..."
                    : biometricType === 2
                    ? "Sign in with Face ID"
                    : "Sign in with Fingerprint"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Forgot password link */}
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Register link */}
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.linkText}>New member? Register here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  // Main screen background
  root: {
    flex: 1,
    backgroundColor: "#2b0540",
  },

  // Scroll content wrapper
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingBottom: 140,
    backgroundColor: "#2b0540",
  },

  // Club logo image
  logo: {
    width: 110,
    height: 110,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 18,
  },

  // App title
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  // App subtitle
  subtitle: {
    color: "#da9306",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },

  // White login card
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },

  // Email input
  input: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fafafa",
  },

  // Password row wrapper
  passwordRow: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#fafafa",
    flexDirection: "row",
    alignItems: "center",
    
  },

  // Password text input
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111",
  },

  // Show/hide password text
  showText: {
    color: "#2b0540",
    fontWeight: "700",
  },

  // Primary login button
  primaryButton: {
    backgroundColor: "#da9306",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },

  primaryButtonText: {
    color: "#2b0540",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },

  // Biometric login button
  secondaryButton: {
    backgroundColor: "#2b0540",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },

  secondaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
  },

  // Link button wrapper
  linkButton: {
    marginTop: 14,
  },

  // Link text
  linkText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "600",
  },

  // Fingerprint / Face ID button
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#F4B400",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
    backgroundColor: "transparent",
  },

  biometricText: {
    color: "#F4B400",
    fontWeight: "700",
    fontSize: 15,
  },

  lockText: {
    color: "#e53935",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
});