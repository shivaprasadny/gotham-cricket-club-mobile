import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getMyProfile } from "../services/profileService";

type Props = {
  navigation: any;
};

// =========================
// PROFILE DATA TYPE
// =========================
type ProfileData = {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  status: string;

  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  joinedClubDate?: string;

  nickname?: string;
  phone?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  playerType?: string;
  jerseyNumber?: number;
};

const ProfileScreen = ({ navigation }: Props) => {
  // =========================
  // STATE
  // =========================
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD PROFILE
  // =========================
  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      console.log("PROFILE DATA:", data); // debug
      setProfile(data);
    } catch {
      alert("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // =========================
  // LOADING UI
  // =========================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.firstName?.charAt(0) || "U"}
          </Text>
        </View>

        <Text style={styles.name}>
          {profile?.firstName} {profile?.lastName}
        </Text>

        <Text style={styles.role}>{profile?.role}</Text>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ================= PERSONAL INFO ================= */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Info</Text>

        <InfoRow label="First Name" value={profile?.firstName} />
        <InfoRow label="Last Name" value={profile?.lastName} />
        <InfoRow label="Date of Birth" value={profile?.dateOfBirth} />
        <InfoRow label="Gender" value={profile?.gender} />
      </View>

      {/* ================= ACCOUNT ================= */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>

        <InfoRow label="Email" value={profile?.email} />
        <InfoRow label="Phone" value={profile?.phone} />
        <InfoRow label="Joined Club" value={profile?.joinedClubDate} />
      </View>

      {/* ================= CRICKET ================= */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cricket Profile</Text>

        <InfoRow label="Batting" value={profile?.battingStyle} />
        <InfoRow label="Bowling" value={profile?.bowlingStyle} />
        <InfoRow label="Player Type" value={profile?.playerType} />
        <InfoRow
          label="Jersey Number"
          value={profile?.jerseyNumber?.toString()}
        />
      </View>

      {/* ================= LOGOUT ================= */}
      <TouchableOpacity style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;

// =========================
// REUSABLE ROW COMPONENT
// =========================
const InfoRow = ({ label, value }: any) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "-"}</Text>
  </>
);

// =========================
// STYLES (Premium look)
// =========================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    backgroundColor: "#2b0540",
    paddingVertical: 40,
    alignItems: "center",
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#da9306",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2b0540",
  },

  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  role: {
    color: "#da9306",
    marginBottom: 12,
    fontWeight: "600",
  },

  editBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },

  editText: {
    color: "#2b0540",
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 12,
  },

  label: {
    color: "#6b7280",
    fontSize: 12,
  },

  value: {
    marginBottom: 10,
    fontWeight: "600",
    color: "#111",
  },

  logoutBtn: {
    margin: 20,
    backgroundColor: "#c0392b",
    padding: 14,
    borderRadius: 12,
  },

  logoutText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
  },
});