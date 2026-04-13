import React, { useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

type Props = {
  navigation: any;
};

const LoginScreen = ({ navigation }: Props) => {
  const { login, biometricLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricSubmitting, setBiometricSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      setSubmitting(true);

      const response = await loginUser({ email, password });

      await login(response.token, {
        id: response.id,
        fullName: response.fullName,
        email: response.email,
        role: response.role,
        status: response.status,
      });
    } catch (error: any) {
      console.log("LOGIN ERROR FULL:", error);
      console.log("LOGIN ERROR RESPONSE:", error?.response?.data);
      console.log("LOGIN ERROR MESSAGE:", error?.message);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please try again.";

      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setBiometricSubmitting(true);

      const result = await biometricLogin();

      if (!result.success) {
        Alert.alert("Biometric Login", result.message || "Login failed");
      }
    } catch (error) {
      console.error("Biometric login error:", error);
      Alert.alert("Error", "Biometric login failed");
    } finally {
      setBiometricSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gotham Cricket Club</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={styles.showBtn}
      >
        <Text style={styles.showText}>
          {showPassword ? "Hide Password" : "Show Password"}
        </Text>
      </TouchableOpacity>

      <Button
        title={submitting ? "Logging in..." : "Login"}
        onPress={handleLogin}
        disabled={submitting || biometricSubmitting}
      />

      <View style={styles.registerButton}>
        <Button
          title={
            biometricSubmitting
              ? "Checking biometrics..."
              : "Login with Face ID / Fingerprint"
          }
          onPress={handleBiometricLogin}
          disabled={submitting || biometricSubmitting}
        />
      </View>

      <View style={styles.registerButton}>
        <Button
          title="Go to Register"
          onPress={() => navigation.navigate("Register")}
        />
      </View>

      <View style={styles.registerButton}>
        <Button
          title="Forgot Password?"
          onPress={() => navigation.navigate("ForgotPassword")}
        />
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
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
  registerButton: {
    marginTop: 16,
  },
  showBtn: {
    marginBottom: 12,
  },
  showText: {
    color: "#007AFF",
    fontWeight: "600",
  },
});