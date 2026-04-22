import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getMyProfile, updateMyProfile } from "../services/profileService";

type ProfileData = {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  profileId?: number;
  nickname?: string;
  phone?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  playerType?: string;
  jerseyNumber?: number;
};

const ProfileScreen = () => {
  // Loading state while profile data is being fetched
  const [loading, setLoading] = useState(true);

  // Saving state while update request is being sent
  const [saving, setSaving] = useState(false);

  // Full profile data returned from backend
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Editable form fields
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [playerType, setPlayerType] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  // Load profile data from backend
  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);

      // Fill form fields with existing profile values
      setNickname(data.nickname || "");
      setPhone(data.phone || "");
      setBattingStyle(data.battingStyle || "");
      setBowlingStyle(data.bowlingStyle || "");
      setPlayerType(data.playerType || "");
      setJerseyNumber(
        data.jerseyNumber !== undefined && data.jerseyNumber !== null
          ? String(data.jerseyNumber)
          : ""
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load profile once when screen opens
  useEffect(() => {
    void loadProfile();
  }, []);

  // Save updated profile to backend
  const handleUpdate = async () => {
    try {
      setSaving(true);

      const response = await updateMyProfile({
        nickname,
        phone,
        battingStyle,
        bowlingStyle,
        playerType,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Profile updated successfully"
      );

      // Reload profile after successful update
      await loadProfile();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Update failed"
      );
    } finally {
      setSaving(false);
    }
  };

  // Reusable input field renderer
  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    keyboardType?: "default" | "phone-pad" | "numeric"
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        keyboardType={keyboardType || "default"}
      />
    </View>
  );

  // Loading state UI
  if (loading) {
    return <Text style={styles.loading}>Loading profile...</Text>;
  }

  return (
    // KeyboardAvoidingView moves content upward when keyboard opens
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      {/* ScrollView keeps lower fields visible and scrollable */}
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>My Profile</Text>

        {/* Read-only account information */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{profile?.fullName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{profile?.role}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{profile?.status}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>{profile?.userId}</Text>
          </View>
        </View>

        {/* Editable player details form */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Player Details</Text>

          {renderField("Nickname", nickname, setNickname, "Enter nickname")}
          {renderField("Phone", phone, setPhone, "Enter phone number", "phone-pad")}
          {renderField(
            "Batting Style",
            battingStyle,
            setBattingStyle,
            "Example: Right-hand bat"
          )}
          {renderField(
            "Bowling Style",
            bowlingStyle,
            setBowlingStyle,
            "Example: Right-arm medium"
          )}
          {renderField(
            "Player Type",
            playerType,
            setPlayerType,
            "Example: Batsman / Bowler / All-Rounder"
          )}
          {renderField(
            "Jersey Number",
            jerseyNumber,
            setJerseyNumber,
            "Enter jersey number",
            "numeric"
          )}

          <View style={styles.buttonWrap}>
            <Button
              title={saving ? "Saving..." : "Update Profile"}
              onPress={handleUpdate}
              disabled={saving}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  // Full-screen wrapper for keyboard behavior
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // ScrollView content container
  container: {
    padding: 16,
    backgroundColor: "#fff",
    flexGrow: 1,
    paddingBottom: 40,
  },

  loading: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },

  infoCard: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },

  formCard: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },

  infoRow: {
    marginBottom: 12,
  },

  infoLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
    fontWeight: "600",
  },

  infoValue: {
    fontSize: 16,
    color: "#111",
  },

  fieldGroup: {
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#222",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },

  buttonWrap: {
    marginTop: 8,
  },
});