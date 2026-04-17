import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  forgotPassword,
  requestPasswordResetCode,
} from "../services/authService";

type Props = {
  navigation: any;
};

const ForgotPasswordScreen = ({ navigation }: Props) => {
  // Form fields
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Loading state
  const [sendingCode, setSendingCode] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Request reset code
  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    try {
      setSendingCode(true);

      const response = await requestPasswordResetCode(email.trim());

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Reset code sent successfully"
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

  // Reset password using email + code + new password
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

    try {
      setResetting(true);

      const response = await forgotPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword: newPassword.trim(),
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Password reset successful"
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

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Request a code and set a new password
        </Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#7a7a7a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSendCode}
            disabled={sendingCode}
          >
            <Text style={styles.secondaryButtonText}>
              {sendingCode ? "Sending..." : "Send Reset Code"}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Reset Code"
            placeholderTextColor="#7a7a7a"
            value={code}
            onChangeText={setCode}
          />

          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#7a7a7a"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleResetPassword}
            disabled={resetting}
          >
            <Text style={styles.primaryButtonText}>
              {resetting ? "Resetting..." : "Reset Password"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#2b0540",
  },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  logo: {
    width: 110,
    height: 110,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 18,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#da9306",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
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
  secondaryButton: {
    backgroundColor: "#2b0540",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
  },
  linkButton: {
    marginTop: 14,
  },
  linkText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "600",
  },
});