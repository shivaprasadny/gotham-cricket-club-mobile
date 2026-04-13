import React, { useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { registerUser } from "../services/authService";

const RegisterScreen = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [playerType, setPlayerType] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  const handleRegister = async () => {
    try {
      const response = await registerUser({
        fullName,
        email,
        password,
        nickname,
        phone,
        battingStyle,
        bowlingStyle,
        playerType,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : undefined,
      });

      Alert.alert("Success", response || "Registration successful");
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Registration failed. Please try again.";
      Alert.alert("Error", message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Nickname" value={nickname} onChangeText={setNickname} />
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} />
      <TextInput style={styles.input} placeholder="Batting Style" value={battingStyle} onChangeText={setBattingStyle} />
      <TextInput style={styles.input} placeholder="Bowling Style" value={bowlingStyle} onChangeText={setBowlingStyle} />
      <TextInput style={styles.input} placeholder="Player Type" value={playerType} onChangeText={setPlayerType} />
      <TextInput style={styles.input} placeholder="Jersey Number" value={jerseyNumber} onChangeText={setJerseyNumber} keyboardType="numeric" />

      <Button title="Register" onPress={handleRegister} />
    </ScrollView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    marginTop: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
});