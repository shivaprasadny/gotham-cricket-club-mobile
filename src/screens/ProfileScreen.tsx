import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { getMyProfile } from "../services/profileService";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { formatEnumLabel } from "../utils/formatEnumLabel";

import { registerForPushNotificationsAsync } from "../services/pushNotificationService";

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

  // Biometric toggle state
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [bioPassword, setBioPassword] = useState("");
  const [bioEnabling, setBioEnabling] = useState(false);
  const [showBioPassword, setShowBioPassword] = useState(false);

  // Auth logout from context
  const { logout } = useAuth();

  // =========================
  // FORMAT DATE NICELY
  // Example: April 20th, 2026
  // =========================
  

  const formatPrettyDate = (date?: string) => {
  if (!date) return "-";

  try {
    const [year, month, day] = date.split("-").map(Number);

    if (!year || !month || !day) return date;

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

    const monthName = new Date(year, month - 1, day).toLocaleString("en-US", {
      month: "long",
    });

    return `📅 ${monthName} ${day}${getSuffix(day)}, ${year}`;
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

  // Reload profile + biometric status every time this screen opens
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadProfile();

      const checkBiometric = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(hasHardware && isEnrolled);
        const saved = await SecureStore.getItemAsync("bio_email").catch(() => null);
        setBiometricEnabled(!!saved);
      };
      void checkBiometric();
    }, [])
  );

  // =========================
  // BIOMETRIC TOGGLE HANDLERS
  // =========================
  const handleBiometricToggle = (value: boolean) => {
    if (value) {
      // Turning ON — ask for password to save credentials
      setBioPassword("");
      setShowBioPassword(false);
      setShowBioModal(true);
    } else {
      // Turning OFF — confirm then clear SecureStore
      Alert.alert(
        "Disable Biometric Login",
        "You will need to enter your password next time you log in.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              await SecureStore.deleteItemAsync("bio_email").catch(() => {});
              await SecureStore.deleteItemAsync("bio_password").catch(() => {});
              setBiometricEnabled(false);
            },
          },
        ]
      );
    }
  };

  const handleEnableBiometric = async () => {
    if (!bioPassword.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }
    if (!profile?.email) return;
    setBioEnabling(true);
    try {
      await loginUser(profile.email, bioPassword.trim());
      await SecureStore.setItemAsync("bio_email", profile.email);
      await SecureStore.setItemAsync("bio_password", bioPassword.trim());
      setBiometricEnabled(true);
      setShowBioModal(false);
      Alert.alert("Biometric Login Enabled", "You can now use fingerprint or Face ID to log in.");
    } catch {
      Alert.alert("Wrong Password", "The password you entered is incorrect.");
    } finally {
      setBioEnabling(false);
      setBioPassword("");
    }
  };

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
        <InfoRow
          label="Status"
          value={formatEnumLabel(profile?.status)}
          icon="✅"
        />
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

      {/* ================= NOTIFICATION SETTINGS ================= */}
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => navigation.navigate("NotificationSettings")}
      >
        <Text style={styles.settingsText}>Notification Settings</Text>
      </TouchableOpacity>

      {/* ================= BIOMETRIC TOGGLE ================= */}
      <View style={styles.bioRow}>
        <View style={styles.bioRowLeft}>
          <Text style={styles.bioRowTitle}>
            {Platform.OS === "ios" ? "Face ID / Touch ID Login" : "Fingerprint Login"}
          </Text>
          <Text style={styles.bioRowSub}>
            {!biometricAvailable
              ? Platform.OS === "ios"
                ? "Set up Face ID or Touch ID in iPhone Settings first"
                : "Set up fingerprint in Android Settings → Security first"
              : biometricEnabled
              ? "Tap your finger or face to log in"
              : "Enable for faster login"}
          </Text>
        </View>
        <Switch
          value={biometricEnabled}
          onValueChange={handleBiometricToggle}
          disabled={!biometricAvailable}
          trackColor={{ false: "#ccc", true: "#7c3aed" }}
          thumbColor={biometricEnabled ? "#4B1D6B" : "#f4f3f4"}
        />
      </View>

      {/* ================= LOGOUT BUTTON ================= */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* ================= ENABLE BIOMETRIC MODAL ================= */}
      <Modal
        visible={showBioModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBioModal(false)}
      >
        <View style={styles.bioOverlay}>
          <View style={styles.bioBox}>
            <Text style={styles.bioBoxTitle}>Enable Biometric Login</Text>
            <Text style={styles.bioBoxSub}>
              Enter your password to confirm. It will be stored securely on this device.
            </Text>
            <View style={styles.bioPasswordRow}>
              <TextInput
                style={styles.bioInput}
                placeholder="Your password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showBioPassword}
                value={bioPassword}
                onChangeText={setBioPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowBioPassword((v) => !v)}>
                <Text style={styles.bioShowText}>{showBioPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bioActions}>
              <TouchableOpacity onPress={() => setShowBioModal(false)}>
                <Text style={styles.bioCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void handleEnableBiometric()}
                disabled={bioEnabling}
                style={[styles.bioConfirmBtn, bioEnabling && { opacity: 0.6 }]}
              >
                <Text style={styles.bioConfirmText}>
                  {bioEnabling ? "Verifying…" : "Enable"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Notification settings button
  settingsBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  settingsText: {
    textAlign: "center",
    color: "#2b0540",
    fontWeight: "700",
    fontSize: 16,
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

  // Biometric toggle row
  bioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bioRowLeft: {
    flex: 1,
    marginRight: 12,
  },
  bioRowTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2b0540",
  },
  bioRowSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },

  // Enable-biometric modal
  bioOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  bioBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
  },
  bioBoxTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 6,
  },
  bioBoxSub: {
    fontSize: 13,
    color: "#666",
    marginBottom: 18,
    lineHeight: 19,
  },
  bioPasswordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  bioInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222",
  },
  bioShowText: {
    color: "#4B1D6B",
    fontWeight: "600",
    fontSize: 13,
    paddingLeft: 8,
  },
  bioActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 20,
  },
  bioCancelText: {
    fontSize: 15,
    color: "#888",
    fontWeight: "600",
  },
  bioConfirmBtn: {
    backgroundColor: "#4B1D6B",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bioConfirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
