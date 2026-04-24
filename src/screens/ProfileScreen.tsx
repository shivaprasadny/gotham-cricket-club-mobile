import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getMyProfile } from "../services/profileService";
import { useAuth } from "../context/AuthContext";

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

  // Auth logout from context
  const { logout } = useAuth();

  // =========================
  // FORMAT DATE NICELY
  // Example: April 20th, 2026
  // =========================
  const formatPrettyDate = (date?: string) => {
    if (!date) return "-";

    try {
      const d = new Date(date);

      // Make sure date is valid
      if (isNaN(d.getTime())) return date;

      const day = d.getDate();

      const getSuffix = (num: number) => {
        if (num >= 11 && num <= 13) return "th";
        switch (num % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      };

      const month = d.toLocaleString("en-US", { month: "long" });
      const year = d.getFullYear();

      return `📅 ${month} ${day}${getSuffix(day)}, ${year}`;
    } catch {
      return date;
    }
  };

  // =========================
  // LOAD PROFILE FROM BACKEND
  // =========================
  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch {
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Reload every time profile screen opens again
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadProfile();
    }, [])
  );

  // =========================
  // LOGOUT HANDLER
  // =========================
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.firstName
              ? profile.firstName.charAt(0).toUpperCase()
              : "U"}
          </Text>
        </View>

        {/* Name */}
        <Text style={styles.name}>
          {profile?.firstName || ""} {profile?.lastName || ""}
        </Text>

        {/* Email under name */}
        <Text style={styles.subText}>📧 {profile?.email || "-"}</Text>

        {/* Role pill */}
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{profile?.role || "-"}</Text>
        </View>

        {/* Edit button */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ================= PERSONAL INFO ================= */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Personal Info</Text>

        <InfoRow label="First Name" value={profile?.firstName} icon="🪪" />
        <InfoRow label="Last Name" value={profile?.lastName} icon="🪪" />
        <InfoRow
          label="Date of Birth"
          value={formatPrettyDate(profile?.dateOfBirth)}
          icon="🎂"
        />
        <InfoRow label="Gender" value={profile?.gender} icon="⚧️" />
      </View>

      {/* ================= ACCOUNT INFO ================= */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Account</Text>

        <InfoRow label="Email" value={profile?.email} icon="📧" />
        <InfoRow label="Phone" value={profile?.phone} icon="📱" />
        <InfoRow
          label="Joined Club"
          value={formatPrettyDate(profile?.joinedClubDate)}
          icon="🏏"
        />
        <InfoRow label="Status" value={profile?.status} icon="✅" />
      </View>

      {/* ================= CRICKET PROFILE ================= */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏏 Cricket Profile</Text>

        <InfoRow label="Nickname" value={profile?.nickname} icon="😎" />
        <InfoRow label="Batting Style" value={profile?.battingStyle} icon="🏏" />
        <InfoRow label="Bowling Style" value={profile?.bowlingStyle} icon="🎯" />
        <InfoRow label="Player Type" value={profile?.playerType} icon="🧢" />
        <InfoRow
          label="Jersey Number"
          value={profile?.jerseyNumber?.toString()}
          icon="🔢"
        />
      </View>

      {/* ================= LOGOUT BUTTON ================= */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;

// =========================
// REUSABLE INFO ROW
// =========================
type InfoRowProps = {
  label: string;
  value?: string;
  icon?: string;
};

const InfoRow = ({ label, value, icon }: InfoRowProps) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>
        {icon ? `${icon} ` : ""}
        {label}
      </Text>
      <Text style={styles.value}>{value || "-"}</Text>
    </View>
  );
};

// =========================
// STYLES
// =========================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },

  content: {
    paddingBottom: 30,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f5fb",
  },

  // Header area
  header: {
    backgroundColor: "#2b0540",
    paddingTop: 42,
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  // Big avatar
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#da9306",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#fff",
  },

  avatarText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#2b0540",
  },

  // Main display name
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },

  // Email under name
  subText: {
    color: "#ddd",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 10,
    textAlign: "center",
  },

  // Role pill
  rolePill: {
    backgroundColor: "#3f1260",
    borderWidth: 1,
    borderColor: "#5b2b7d",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },

  rolePillText: {
    color: "#da9306",
    fontWeight: "700",
    fontSize: 13,
  },

  // Edit button
  editBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },

  editText: {
    color: "#2b0540",
    fontWeight: "700",
  },

  // Card block
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,

    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },

    // Android shadow
    elevation: 4,
  },

  // Card title
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 12,
  },

  // Each info row
  infoRow: {
    marginBottom: 12,
  },

  label: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 3,
    fontWeight: "600",
  },

  value: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 15,
  },

  // Logout button
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 22,
    backgroundColor: "#c0392b",
    padding: 14,
    borderRadius: 12,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },

    elevation: 3,
  },

  logoutText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});