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
import { registerUser } from "../services/authService";
import { addNotification } from "../services/notificationService";

type Props = {
  navigation: any;
};

const RegisterScreen = ({ navigation }: Props) => {
  // Form fields
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [playerType, setPlayerType] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);

  // Register handler
  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter full name");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Please enter email");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Please enter password");
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert("Error", "Please confirm password");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Password and confirm password do not match");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        fullName: fullName.trim(),
        nickname: nickname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
        battingStyle: battingStyle.trim(),
        bowlingStyle: bowlingStyle.trim(),
        playerType: playerType.trim(),
        jerseyNumber: jerseyNumber.trim() ? Number(jerseyNumber) : null,
      };

      const response = await registerUser(payload);

      await addNotification({
  title: "New Join Request",
  message: `${fullName.trim()} requested to join the club`,
  type: "MEMBER",
  targetScreen: "AdminApproval",
});

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Registration submitted successfully"
      );

      navigation.navigate("Login");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Registration failed"
      );
    } finally {
      setSubmitting(false);
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

        <Text style={styles.title}>Join Gotham Cricket Club</Text>
        <Text style={styles.subtitle}>
          Register and wait for admin approval
        </Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#7a7a7a"
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            style={styles.input}
            placeholder="Nickname"
            placeholderTextColor="#7a7a7a"
            value={nickname}
            onChangeText={setNickname}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#7a7a7a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor="#7a7a7a"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#7a7a7a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#7a7a7a"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Batting Style"
            placeholderTextColor="#7a7a7a"
            value={battingStyle}
            onChangeText={setBattingStyle}
          />

          <TextInput
            style={styles.input}
            placeholder="Bowling Style"
            placeholderTextColor="#7a7a7a"
            value={bowlingStyle}
            onChangeText={setBowlingStyle}
          />

          <TextInput
            style={styles.input}
            placeholder="Player Type"
            placeholderTextColor="#7a7a7a"
            value={playerType}
            onChangeText={setPlayerType}
          />

          <TextInput
            style={styles.input}
            placeholder="Jersey Number"
            placeholderTextColor="#7a7a7a"
            value={jerseyNumber}
            onChangeText={setJerseyNumber}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            disabled={submitting}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? "Registering..." : "Register"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

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
    padding: 18,
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
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#2b0540",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
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