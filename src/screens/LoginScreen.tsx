import React, { useState } from "react";
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

  // =========================
  // NORMAL LOGIN
  // =========================

  const handleLogin = async () => {
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

    // Call backend login API
    const response = await loginUser(email.trim(), password.trim());

    // Save token and user in AuthContext
    await login(response.token, {
      id: response.id,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
      status: response.status,
    });
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

    Alert.alert("Login Failed", message || "Invalid email or password");
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
      }
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
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? "Signing In..." : "Login"}
              </Text>
            </TouchableOpacity>

            {/* Biometric login button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBiometricLogin}
              disabled={biometricLoading}
            >
              <Text style={styles.secondaryButtonText}>
                {biometricLoading ? "Checking..." : "Login with Biometrics"}
              </Text>
            </TouchableOpacity>

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
});