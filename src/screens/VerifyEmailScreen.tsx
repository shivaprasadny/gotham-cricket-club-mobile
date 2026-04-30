import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  resendVerificationCode,
  verifyEmailCode,
} from "../services/authService";

type Props = {
  route: any;
  navigation: any;
};

const VerifyEmailScreen = ({ route, navigation }: Props) => {
  // Email comes from RegisterScreen
  const email = route.params?.email || "";

  // User enters 6-digit code
  const [code, setCode] = useState("");

  // Loading states
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // Verify email code
  const handleVerify = async () => {
    if (!code.trim()) {
      return Alert.alert("Error", "Enter verification code");
    }

    try {
      setVerifying(true);

      const response = await verifyEmailCode(email, code.trim());

      Alert.alert(
        "Email Verified",
        typeof response === "string"
          ? response
          : "Email verified. Waiting for admin approval."
      );

      navigation.navigate("Login");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Verification failed"
      );
    } finally {
      setVerifying(false);
    }
  };

  // Resend verification code
  const handleResend = async () => {
    try {
      setResending(true);

      const response = await resendVerificationCode(email);

      Alert.alert(
        "Code Sent",
        typeof response === "string"
          ? response
          : "Verification code resent successfully."
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to resend code"
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Verify Email</Text>

        <Text style={styles.subtitle}>
          We sent a 6-digit verification code to:
        </Text>

        {/* Email is shown but not editable */}
        <View style={styles.emailBox}>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleVerify}
          disabled={verifying}
        >
          {verifying ? (
            <ActivityIndicator color="#2b0540" />
          ) : (
            <Text style={styles.buttonText}>Verify Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={resending}
        >
          <Text style={styles.resendText}>
            {resending ? "Sending..." : "Resend Code"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default VerifyEmailScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#2b0540",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2b0540",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 12,
  },
  emailBox: {
    backgroundColor: "#f3edf7",
    borderWidth: 1,
    borderColor: "#e1d5ea",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  emailText: {
    color: "#2b0540",
    fontWeight: "700",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 4,
  },
  button: {
    backgroundColor: "#da9306",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  buttonText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
  },
  resendButton: {
    marginBottom: 14,
  },
  resendText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
  },
  loginText: {
    color: "#777",
    textAlign: "center",
  },
});