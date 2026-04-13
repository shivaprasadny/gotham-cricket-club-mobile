
import React, { useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import {
  requestPasswordResetCode,
  resetPassword,
} from "../services/authService";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    try {
      setLoading(true);
      const response = await requestPasswordResetCode(email);

      setGeneratedCode(response.resetCode || "");
      setStep(2);

      Alert.alert(
        "Reset Code Generated",
        `Testing code: ${response.resetCode}`
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to request reset code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !code || !newPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await resetPassword({
        email,
        code,
        newPassword,
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Password reset successful"
      );

      setEmail("");
      setCode("");
      setNewPassword("");
      setGeneratedCode("");
      setStep(1);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {step === 1 ? (
        <Button
          title={loading ? "Requesting..." : "Get Reset Code"}
          onPress={handleRequestCode}
          disabled={loading}
        />
      ) : (
        <>
          <Text style={styles.helperText}>
            Testing reset code: {generatedCode}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter Reset Code"
            value={code}
            onChangeText={setCode}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Button
            title={loading ? "Resetting..." : "Reset Password"}
            onPress={handleResetPassword}
            disabled={loading}
          />
        </>
      )}
    </ScrollView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  helperText: {
    textAlign: "center",
    marginBottom: 12,
    color: "#444",
  },
});