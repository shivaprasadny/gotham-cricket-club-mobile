import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getMemberById } from "../services/memberService";
import { createDirectChat } from "../chat/chatApi";
import { useAuth } from "../context/AuthContext";

type Props = {
  route: any;
  navigation: any;
};

type MemberProfile = {
  userId: number;
  fullName?: string;
  email?: string;       // null when showEmail is false (backend omits it)
  role?: string;
  nickname?: string;
  countryCode?: string; // null when showPhone is false
  phone?: string;       // null when showPhone is false
  showWhatsApp?: boolean;
  battingStyle?: string;
  bowlingStyle?: string;
  playerType?: string;
  jerseyNumber?: number;
};

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => {
  if (value == null || value === "") {
    return null;
  }

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const MemberProfileScreen = ({ route, navigation }: Props) => {
  const { userId } = route.params;
  const { user } = useAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getMemberById(userId);
        setProfile(data);
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.response?.data?.message || "Failed to load member profile"
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>Member profile is unavailable.</Text>
      </View>
    );
  }

  const fullPhone = profile
    ? `${profile.countryCode ?? ""}${profile.phone ?? ""}`.trim()
    : "";

  // Treat undefined/null showWhatsApp as true (default visible)
  const whatsAppVisible = profile ? profile.showWhatsApp !== false : false;

  const openWhatsApp = async () => {
    const digits = fullPhone.replace(/\D/g, "");
    // Use wa.me link — works even when canOpenURL returns false on iOS
    // due to missing LSApplicationQueriesSchemes in older builds.
    const url = `https://wa.me/${digits}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Cannot open WhatsApp", "Make sure WhatsApp is installed and try again.");
    }
  };

  const openDirectMessage = async () => {
    if (openingChat) return;
    setOpeningChat(true);
    try {
      const room = await createDirectChat(profile.userId);
      navigation.navigate("ChatRoom", { room });
    } catch (error: any) {
      Alert.alert(
        "Could not open chat",
        error?.response?.data?.message || "Please try again."
      );
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile.fullName || "M").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile.fullName || "Member"}</Text>
        {profile.nickname ? (
          <Text style={styles.nickname}>"{profile.nickname}"</Text>
        ) : null}
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{profile.role || "MEMBER"}</Text>
        </View>
        {profile.userId !== user?.id ? (
          <TouchableOpacity
            style={styles.messageButton}
            disabled={openingChat}
            onPress={() => void openDirectMessage()}
          >
            {openingChat ? (
              <ActivityIndicator size="small" color="#2b0540" />
            ) : (
              <Ionicons name="chatbubble-outline" size={18} color="#2b0540" />
            )}
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Contact section — rows hidden when backend omits data (privacy off) */}
      {(profile.email || profile.phone) ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact</Text>

          {profile.email ? (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => void Linking.openURL(`mailto:${profile.email}`)}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#f0e6fa" }]}>
                <Ionicons name="mail-outline" size={20} color="#2b0540" />
              </View>
              <View style={styles.contactRowText}>
                <Text style={styles.contactRowLabel}>Email</Text>
                <Text style={styles.contactRowValue}>{profile.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#bbb" />
            </TouchableOpacity>
          ) : null}

          {profile.phone ? (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => void Linking.openURL(`tel:${fullPhone}`)}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#e6f0fa" }]}>
                <Ionicons name="call-outline" size={20} color="#1565c0" />
              </View>
              <View style={styles.contactRowText}>
                <Text style={styles.contactRowLabel}>Phone</Text>
                <Text style={styles.contactRowValue}>{fullPhone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#bbb" />
            </TouchableOpacity>
          ) : null}

          {profile.phone ? (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => void Linking.openURL(`sms:${fullPhone}`)}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#e6faf0" }]}>
                <Ionicons name="chatbubble-outline" size={20} color="#2e7d32" />
              </View>
              <View style={styles.contactRowText}>
                <Text style={styles.contactRowLabel}>SMS</Text>
                <Text style={styles.contactRowValue}>{fullPhone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#bbb" />
            </TouchableOpacity>
          ) : null}

          {profile.phone && whatsAppVisible ? (
            <TouchableOpacity
              style={[styles.contactRow, { borderBottomWidth: 0 }]}
              onPress={() => void openWhatsApp()}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#e6fae6" }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </View>
              <View style={styles.contactRowText}>
                <Text style={styles.contactRowLabel}>WhatsApp</Text>
                <Text style={styles.contactRowValue}>Chat on WhatsApp</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#bbb" />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cricket Profile</Text>
        <InfoRow label="Playing style" value={profile.playerType} />
        <InfoRow label="Batting" value={profile.battingStyle} />
        <InfoRow label="Bowling" value={profile.bowlingStyle} />
        <InfoRow label="Jersey number" value={profile.jerseyNumber} />
      </View>

      <TouchableOpacity
        style={styles.statsButton}
        onPress={() => navigation.navigate("PlayerStatistics", { playerId: userId })}
      >
        <Text style={styles.statsButtonText}>View Cricket Statistics</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MemberProfileScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f5fb",
  },
  header: {
    alignItems: "center",
    backgroundColor: "#2b0540",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#da9306",
    marginBottom: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  nickname: {
    color: "#ddd6fe",
    marginTop: 4,
  },
  rolePill: {
    backgroundColor: "#da9306",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
  },
  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  messageButton: {
    marginTop: 14,
    minWidth: 128,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  messageButtonText: {
    color: "#2b0540",
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    color: "#2b0540",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  infoLabel: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 3,
  },
  infoValue: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  statsButton: {
    backgroundColor: "#da9306",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  statsButtonText: {
    color: "#2b0540",
    fontWeight: "900",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contactRowText: {
    flex: 1,
  },
  contactRowLabel: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  contactRowValue: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
});
