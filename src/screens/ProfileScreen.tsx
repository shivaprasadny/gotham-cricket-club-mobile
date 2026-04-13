import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { getMyProfile, updateMyProfile } from "../services/profileService";

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);

  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [playerType, setPlayerType] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();

      setNickname(data.nickname || "");
      setPhone(data.phone || "");
      setBattingStyle(data.battingStyle || "");
      setBowlingStyle(data.bowlingStyle || "");
      setPlayerType(data.playerType || "");
      setJerseyNumber(data.jerseyNumber ? String(data.jerseyNumber) : "");
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateMyProfile({
        nickname,
        phone,
        battingStyle,
        bowlingStyle,
        playerType,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
      });

      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Update failed"
      );
    }
  };

  if (loading) {
    return <Text style={{ textAlign: "center", marginTop: 50 }}>Loading...</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      <TextInput style={styles.input} placeholder="Nickname" value={nickname} onChangeText={setNickname} />
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} />
      <TextInput style={styles.input} placeholder="Batting Style" value={battingStyle} onChangeText={setBattingStyle} />
      <TextInput style={styles.input} placeholder="Bowling Style" value={bowlingStyle} onChangeText={setBowlingStyle} />
      <TextInput style={styles.input} placeholder="Player Type" value={playerType} onChangeText={setPlayerType} />
      <TextInput style={styles.input} placeholder="Jersey Number" value={jerseyNumber} onChangeText={setJerseyNumber} keyboardType="numeric" />

      <Button title="Update Profile" onPress={handleUpdate} />
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
});