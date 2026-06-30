import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Avatar from "../components/Avatar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getMemberById } from "../services/memberService";
import { getPlayerStatistics, getPlayerDashboard } from "../services/statisticsService";
import { createDirectChat } from "../chat/chatApi";
import { useAuth } from "../context/AuthContext";
import { PlayerStatistics, PlayerDashboard } from "../types/scorecard";

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
  profileImageUrl?: string | null;
  gender?: string;
};

// ---------------------------------------------------------------------------
// Helper: InfoRow
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helpers: formatting
// ---------------------------------------------------------------------------
const fmtNum = (n?: number | null) =>
  n == null || n === 0 ? "-" : String(n);

const fmtRate = (n?: number | null) =>
  n == null || n === 0 ? "-" : n.toFixed(1);

const fmtDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

type ResultKey = "WIN" | "LOSS" | string;

const resultChipStyle = (
  result: ResultKey
): { bg: string; text: string } => {
  if (result === "WIN") return { bg: "#dcfce7", text: "#166534" };
  if (result === "LOSS") return { bg: "#fee2e2", text: "#991b1b" };
  return { bg: "#f3f4f6", text: "#6b7280" };
};

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------
const StatCard = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statCardValue}>{value}</Text>
    <Text style={styles.statCardLabel}>{label}</Text>
  </View>
);

// ---------------------------------------------------------------------------
// MemberProfileScreen
// ---------------------------------------------------------------------------
const MemberProfileScreen = ({ route, navigation }: Props) => {
  const { userId } = route.params as { userId: number };
  const { user } = useAuth();

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [dashboard, setDashboard] = useState<PlayerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const isOwnProfile = userId === user?.id;

  useEffect(() => {
    // Load profile
    const loadProfile = async () => {
      try {
        const data = await getMemberById(userId);
        setProfile(data as MemberProfile);
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.response?.data?.message || "Failed to load member profile"
        );
      } finally {
        setLoading(false);
      }
    };

    // Load stats + dashboard in parallel; failures are silently swallowed
    const loadStats = async () => {
      try {
        const [statsResult, dashResult] = await Promise.allSettled([
          getPlayerStatistics(userId, {}),
          getPlayerDashboard(userId, {}, 5),
        ]);
        if (statsResult.status === "fulfilled") setStats(statsResult.value);
        if (dashResult.status === "fulfilled") setDashboard(dashResult.value);
      } finally {
        setStatsLoading(false);
      }
    };

    void loadProfile();
    void loadStats();
  }, [userId]);

  // -------------------------------------------------------------------------
  // Loading / Error states
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Contact helpers
  // -------------------------------------------------------------------------
  const fullPhone = `${profile.countryCode ?? ""}${profile.phone ?? ""}`.trim();
  const whatsAppVisible = profile.showWhatsApp !== false;

  const openWhatsApp = async () => {
    const digits = fullPhone.replace(/\D/g, "");
    const url = `https://wa.me/${digits}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Cannot open WhatsApp",
        "Make sure WhatsApp is installed and try again."
      );
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

  // -------------------------------------------------------------------------
  // Derived stat values
  // -------------------------------------------------------------------------
  const bestBowling =
    stats &&
    (stats.bestBowlingWickets > 0 || stats.bestBowlingRuns > 0)
      ? `${stats.bestBowlingWickets}/${stats.bestBowlingRuns}`
      : "-";

  // Helpers scoped to stats display
  const s = stats; // shorthand

  const recentForm = dashboard?.recentForm ?? [];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      {/* ------------------------------------------------------------------ */}
      {/* Avatar preview modal                                                */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={styles.previewOverlay}
          onPress={() => setPreviewVisible(false)}
        >
          <Pressable style={styles.previewContent} onPress={() => undefined}>
            <TouchableOpacity
              style={styles.previewClose}
              onPress={() => setPreviewVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.previewCloseText}>✕</Text>
            </TouchableOpacity>
            <Avatar
              name={profile.fullName}
              userId={profile.userId}
              imageUrl={profile.profileImageUrl}
              size={200}
            />
            <Text style={styles.previewName}>
              {profile.fullName || "Member"}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Section 1 — Header Card                                          */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setPreviewVisible(true)}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Avatar
              name={profile.fullName}
              userId={profile.userId}
              imageUrl={profile.profileImageUrl}
              size="xlarge"
            />
          </TouchableOpacity>

          <Text style={styles.name}>{profile.fullName || "Member"}</Text>

          {profile.nickname ? (
            <Text style={styles.nickname}>"{profile.nickname}"</Text>
          ) : null}

          {/* Role pill + jersey number */}
          <View style={styles.headerMeta}>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>
                {profile.role || "MEMBER"}
                {profile.jerseyNumber != null
                  ? ` • #${profile.jerseyNumber}`
                  : ""}
              </Text>
            </View>
          </View>

          {/* Player type beneath role */}
          {profile.playerType ? (
            <Text style={styles.playerTypeLabel}>{profile.playerType}</Text>
          ) : null}

          {/* Own profile → Edit Profile; other profile → Message */}
          {isOwnProfile ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Profile")}
            >
              <Ionicons name="create-outline" size={18} color="#2b0540" />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              disabled={openingChat}
              onPress={() => void openDirectMessage()}
            >
              {openingChat ? (
                <ActivityIndicator size="small" color="#2b0540" />
              ) : (
                <Ionicons name="chatbubble-outline" size={18} color="#2b0540" />
              )}
              <Text style={styles.actionButtonText}>Message Privately</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Section 2 — Contact Actions                                      */}
        {/* ---------------------------------------------------------------- */}
        {profile.email || profile.phone ? (
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

        {/* ---------------------------------------------------------------- */}
        {/* Section 3 — Cricket Info                                         */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cricket Info</Text>
          <InfoRow label="Player Type" value={profile.playerType} />
          <InfoRow label="Batting" value={profile.battingStyle} />
          <InfoRow label="Bowling" value={profile.bowlingStyle} />
          <InfoRow label="Jersey Number" value={profile.jerseyNumber} />
          <InfoRow label="Gender" value={profile.gender} />
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Section 4 — Career Summary                                       */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Career Summary</Text>

          {statsLoading ? (
            <View style={styles.statsLoadingBox}>
              <ActivityIndicator size="small" color="#da9306" />
            </View>
          ) : s == null ? (
            <Text style={styles.noDataText}>No stats yet.</Text>
          ) : (
            <View style={styles.statGrid}>
              <StatCard value={fmtNum(s.matches)}    label="Matches" />
              <StatCard value={fmtNum(s.totalRuns)}  label="Runs" />
              <StatCard value={fmtNum(s.wickets)}    label="Wickets" />
              <StatCard value={fmtNum(s.catches)}    label="Catches" />
            </View>
          )}
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Section 4b — Batting                                             */}
        {/* ---------------------------------------------------------------- */}
        {s != null && !statsLoading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Batting</Text>
            <View style={styles.statGrid}>
              <StatCard value={fmtNum(s.totalRuns)}         label="Runs" />
              <StatCard value={fmtNum(s.highestScore)}      label="Highest" />
              <StatCard value={fmtRate(s.battingAverage)}   label="Average" />
            </View>
            <View style={styles.statGrid}>
              <StatCard value={fmtRate(s.battingStrikeRate)} label="Strike Rate" />
              <StatCard value={fmtNum(s.fours)}              label="4s" />
              <StatCard value={fmtNum(s.sixes)}              label="6s" />
            </View>
            <View style={styles.statGrid}>
              <StatCard value={fmtNum(s.fifties)}   label="50s" />
              <StatCard value={fmtNum(s.hundreds)}  label="100s" />
              <StatCard value={fmtNum(s.ducks ?? 0)} label="Ducks" />
            </View>
          </View>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Section 4c — Bowling                                             */}
        {/* ---------------------------------------------------------------- */}
        {s != null && !statsLoading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bowling</Text>
            <View style={styles.statGrid}>
              <StatCard value={fmtNum(s.wickets)}           label="Wickets" />
              <StatCard value={bestBowling}                  label="Best" />
              <StatCard value={fmtRate(s.economy)}           label="Economy" />
              <StatCard value={fmtNum(s.fifers ?? 0)}        label="5-fors" />
            </View>
          </View>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Section 4d — Fielding                                            */}
        {/* ---------------------------------------------------------------- */}
        {s != null && !statsLoading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fielding</Text>
            <View style={styles.statGrid}>
              <StatCard value={fmtNum(s.catches)}            label="Catches" />
              <StatCard value={fmtNum(s.runOuts)}            label="Run Outs" />
              <StatCard value={fmtNum(s.stumpings)}          label="Stumpings" />
            </View>
            <View style={styles.statGrid}>
              <StatCard value={fmtNum(s.fieldingDismissals)} label="Dismissals" />
              <StatCard value={fmtRate(s.catchEfficiency)}   label="Catch %" />
              <View style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Section 4e — Awards                                              */}
        {/* ---------------------------------------------------------------- */}
        {s != null && !statsLoading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Awards</Text>
            <View style={styles.statGrid}>
              <StatCard value={fmtNum(s.playerOfMatchAwards)} label="Player of Match" />
              <StatCard value={fmtNum(s.allRounderPoints ?? 0)} label="All-Rounder Pts" />
              <View style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Section 5 — Recent Matches                                       */}
        {/* ---------------------------------------------------------------- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Matches</Text>

          {statsLoading ? (
            <View style={styles.statsLoadingBox}>
              <ActivityIndicator size="small" color="#da9306" />
            </View>
          ) : recentForm.length === 0 ? (
            <Text style={styles.noDataText}>No recent match stats yet.</Text>
          ) : (
            recentForm.slice(0, 5).map((perf, idx) => {
              const chip = resultChipStyle(perf.result ?? "");
              const runsDisplay = perf.runs != null
                ? `${perf.runs}${perf.notOut ? "*" : ""}${perf.ballsFaced ? ` (${perf.ballsFaced}b)` : ""}`
                : null;
              const isLast = idx === Math.min(recentForm.length, 5) - 1;

              return (
                <View
                  key={`${perf.matchId}-${idx}`}
                  style={[
                    styles.recentRow,
                    isLast && { borderBottomWidth: 0 },
                  ]}
                >
                  {/* Match name + date */}
                  <View style={styles.recentHeader}>
                    <Text style={styles.recentMatchName} numberOfLines={1}>
                      {perf.matchSummary || "Match"}
                    </Text>
                    {perf.matchDate ? (
                      <Text style={styles.recentDate}>
                        {fmtDate(perf.matchDate)}
                      </Text>
                    ) : null}
                  </View>

                  {/* Performance line + result chip */}
                  <View style={styles.recentPerfRow}>
                    <Text style={styles.recentPerf}>
                      {[
                        runsDisplay ? `🏏 ${runsDisplay}` : null,
                        perf.wickets > 0 ? `🎯 ${perf.wickets} wkts` : null,
                        perf.catches > 0 ? `🙌 ${perf.catches}` : null,
                      ]
                        .filter(Boolean)
                        .join("  ") || "Did not bat/bowl"}
                    </Text>
                    {perf.result ? (
                      <View
                        style={[
                          styles.resultChip,
                          { backgroundColor: chip.bg },
                        ]}
                      >
                        <Text
                          style={[styles.resultChipText, { color: chip.text }]}
                        >
                          {perf.result}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ---------------------------------------------------------------- */}
        {/* Section 6 — View Full Statistics button                          */}
        {/* ---------------------------------------------------------------- */}
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() =>
            navigation.navigate("PlayerStatistics", { playerId: userId })
          }
        >
          <Text style={styles.statsButtonText}>View Full Statistics →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MemberProfileScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f5fb",
  },

  // --- Header Card ---
  header: {
    alignItems: "center",
    backgroundColor: "#2b0540",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 14,
  },
  nickname: {
    color: "#ddd6fe",
    fontStyle: "italic",
    fontSize: 13,
    marginTop: 4,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  rolePill: {
    backgroundColor: "#da9306",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  playerTypeLabel: {
    color: "#c9a227",
    fontStyle: "italic",
    fontSize: 12,
    marginTop: 6,
  },
  actionButton: {
    marginTop: 16,
    minWidth: 148,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    color: "#2b0540",
    fontWeight: "800",
    fontSize: 14,
  },

  // --- Generic card ---
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

  // --- Info rows (Cricket Info) ---
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

  // --- Contact rows ---
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

  // --- Stats grid ---
  statsLoadingBox: {
    paddingVertical: 20,
    alignItems: "center",
  },
  statGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8f5fb",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    minWidth: 0,
  },
  statCardValue: {
    color: "#2b0540",
    fontSize: 20,
    fontWeight: "900",
  },
  statCardLabel: {
    color: "#7a6c80",
    fontSize: 10,
    marginTop: 3,
    textAlign: "center",
  },
  noDataText: {
    color: "#7a6c80",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 12,
  },

  // --- Recent matches ---
  recentRow: {
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e4dae7",
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  recentMatchName: {
    color: "#2b0540",
    fontWeight: "700",
    fontSize: 13,
    flex: 1,
  },
  recentDate: {
    color: "#7a6c80",
    fontSize: 11,
  },
  recentPerfRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  recentPerf: {
    color: "#5b4066",
    fontSize: 12,
    flex: 1,
  },
  resultChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  resultChipText: {
    fontSize: 10,
    fontWeight: "800",
  },

  // --- Full stats button ---
  statsButton: {
    backgroundColor: "#da9306",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  statsButtonText: {
    color: "#2b0540",
    fontWeight: "900",
    fontSize: 15,
  },

  // --- Avatar preview modal ---
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewContent: {
    alignItems: "center",
    gap: 20,
  },
  previewClose: {
    position: "absolute",
    top: -48,
    right: -12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCloseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  previewName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
});
