import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getMemberById } from "../services/memberService";

type Props = {
  route: any;
  navigation: any;
};

type MemberProfile = {
  userId: number;
  fullName?: string;
  email?: string;
  role?: string;
  nickname?: string;
  phone?: string;
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
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact</Text>
        <InfoRow label="Email" value={profile.email} />
        <InfoRow label="Phone" value={profile.phone} />
      </View>

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
});
