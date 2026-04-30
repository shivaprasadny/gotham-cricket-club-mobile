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

import {
  forgotPassword,
  resetPassword,
} from "../services/authService";

type Props = {
  navigation: any;
};

const ForgotPasswordScreen = ({ navigation }: Props) => {
  // =========================
  // FORM FIELD STATE
  // =========================
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // =========================
  // LOADING STATES
  // =========================
  const [sendingCode, setSendingCode] = useState(false);
  const [resetting, setResetting] = useState(false);

  // =========================
  // SEND RESET CODE
  // =========================

const handleSendCode = async () => {
  if (!email.trim()) {
    Alert.alert("Error", "Please enter your email");
    return;
  }

  try {
    setSendingCode(true);

    // Backend sends reset code to email
    const response = await forgotPassword(email.trim());

    Alert.alert(
      "Code Sent",
      typeof response === "string"
        ? response
        : "Password reset code sent to your email."
    );
  } catch (error: any) {
    Alert.alert(
      "Error",
      error?.response?.data?.message || "Failed to send reset code"
    );
  } finally {
    setSendingCode(false);
  }
};
  // =========================
  // RESET PASSWORD
  // =========================
  

const handleResetPassword = async () => {
  if (!email.trim()) {
    Alert.alert("Error", "Please enter your email");
    return;
  }

  if (!code.trim()) {
    Alert.alert("Error", "Please enter reset code");
    return;
  }

  if (!newPassword.trim()) {
    Alert.alert("Error", "Please enter new password");
    return;
  }

  if (newPassword.trim() !== confirmPassword.trim()) {
    Alert.alert("Error", "Passwords do not match");
    return;
  }

  try {
    setResetting(true);

    // Backend verifies code and updates password
    const response = await resetPassword(
      email.trim(),
      code.trim(),
      newPassword.trim()
    );

    Alert.alert(
      "Success",
      typeof response === "string" ? response : "Password reset successful"
    );

    navigation.navigate("Login");
  } catch (error: any) {
    Alert.alert(
      "Error",
      error?.response?.data?.message || "Failed to reset password"
    );
  } finally {
    setResetting(false);
  }
};


  // =========================
  // DISABLE RESET BUTTON CHECK
  // =========================
  const isResetDisabled =
    resetting ||
    !email.trim() ||
    !code.trim() ||
    !newPassword.trim() ||
    !confirmPassword.trim();

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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Request a code and set a new password
          </Text>

          {/* Reset form card */}
          <View style={styles.card}>
            {/* Email input */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#7a7a7a"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />

            {/* Send reset code button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSendCode}
              disabled={sendingCode}
            >
              <Text style={styles.secondaryButtonText}>
                {sendingCode ? "Sending..." : "Send Reset Code"}
              </Text>
            </TouchableOpacity>

            {/* Reset code input */}
            <TextInput
              style={styles.input}
              placeholder="Reset Code"
              placeholderTextColor="#7a7a7a"
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* New password input */}
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#7a7a7a"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
            />

            {/* Confirm password input */}
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#7a7a7a"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              autoComplete="new-password"
            />

            {/* Reset password button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                isResetDisabled && styles.buttonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={isResetDisabled}
            >
              <Text style={styles.primaryButtonText}>
                {resetting ? "Resetting..." : "Reset Password"}
              </Text>
            </TouchableOpacity>

            {/* Back to login link */}
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.linkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  // Main screen background
  root: {
    flex: 1,
    backgroundColor: "#2b0540",
  },

  // Scroll container - extra bottom padding keeps button above keyboard
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    paddingBottom: 140,
    backgroundColor: "#2b0540",
  },

  // Club logo
  logo: {
    width: 110,
    height: 110,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 18,
  },

  // Screen title
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  // Screen subtitle
  subtitle: {
    color: "#da9306",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },

  // White form card
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },

  // Standard input field
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

  // Primary reset button
  primaryButton: {
    backgroundColor: "#da9306",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },

  // Primary reset button text
  primaryButtonText: {
    color: "#2b0540",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },

  // Send code button
  secondaryButton: {
    backgroundColor: "#2b0540",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  // Send code button text
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
  },

  // Back/login link wrapper
  linkButton: {
    marginTop: 14,
  },

  // Back/login link text
  linkText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "600",
  },

  // Disabled button style
  buttonDisabled: {
    opacity: 0.5,
  },
});