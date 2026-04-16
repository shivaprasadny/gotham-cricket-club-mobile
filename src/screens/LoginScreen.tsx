import React, { useState } from "react";
import {
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";


type Props = {
  navigation: any;
};

const LoginScreen = ({ navigation }: Props) => {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please try again.";

      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>Gotham Cricket Club</Text>
      <Text style={styles.subtitle}>Play hard. Stay united.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#ddd"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#ddd"
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

      <View style={styles.buttonWrap}>
        <Button
          title={submitting ? "Logging in..." : "Login"}
          onPress={handleLogin}
          disabled={submitting}
          color="#F4B400"
        />
      </View>

      <View style={styles.registerButton}>
        <Button
          title="Go to Register"
          onPress={() => navigation.navigate("Register")}
          color="#F4B400"
        />
      </View>

      <View style={styles.registerButton}>
        <Button
          title="Forgot Password?"
          onPress={() => navigation.navigate("ForgotPassword")}
          color="#F4B400"
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
    backgroundColor: "#4B1D6B",
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: "#fff",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#F4B400",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#7b4fa1",
    backgroundColor: "#5A257A",
    color: "#fff",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  registerButton: {
    marginTop: 14,
  },
  buttonWrap: {
    marginTop: 8,
  },
  showBtn: {
    marginBottom: 12,
  },
  showText: {
    color: "#F4B400",
    fontWeight: "600",
  },
});