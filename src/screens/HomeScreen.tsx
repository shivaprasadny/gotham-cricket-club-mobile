import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getMatches } from "../services/matchService";
import {
  getAnnouncements,
  getPinnedAnnouncement,
} from "../services/announcementService";
import { getPendingMembers } from "../services/adminService";
import HomeFeeCard from "../components/HomeFeeCard";

type Props = {
  navigation: any;
};

type Match = {
  id: number;
  homeTeamId?: number | null;
  homeTeamName?: string | null;
  awayTeamId?: number | null;
  awayTeamName?: string | null;
  externalOpponentName?: string | null;
  leagueId?: number | null;
  leagueName?: string | null;
  venue: string;
  matchDate: string;
  matchType: string;
  matchFee?: number | null;
  status?: "UPCOMING" | "COMPLETED" | "CANCELLED";
  myAvailability?: "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED";
};

type PendingMember = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "CAPTAIN" | "PLAYER";
  status: "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";
};

type Announcement = {
  id: number;
  title: string;
  message: string;
  createdBy?: string;
  createdAt?: string;
  pinned?: boolean;
};

const QUOTES = [
  "Play for the badge. Fight for each other.",
  "Discipline, unity, and consistency win matches.",
  "Great teams trust the process.",
  "Every match is a chance to improve.",
];

const HomeScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();

  const [menuVisible, setMenuVisible] = useState(false);

  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pinnedAnnouncement, setPinnedAnnouncement] =
    useState<Announcement | null>(null);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);

  const [loadingHome, setLoadingHome] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const isCaptain = user?.role === "CAPTAIN";
  const canManage = isAdmin || isCaptain;

  // Build readable match title
  const getMatchTitle = (match: Match) => {
    if (match.awayTeamName) {
      return `${match.homeTeamName || "Team"} vs ${match.awayTeamName}`;
    }

    return `${match.homeTeamName || "Team"} vs ${
      match.externalOpponentName || "Opponent"
    }`;
  };

  // Get opponent name only
  const getOpponentName = (match: Match) => {
    return match.awayTeamName || match.externalOpponentName || "Opponent";
  };

  // Load home data
  const loadHomeData = async () => {
    try {
      const requests: Promise<any>[] = [
        getMatches(),
        getAnnouncements(),
        getPinnedAnnouncement(),
      ];

      if (isAdmin) {
        requests.push(getPendingMembers());
      }

      const results = await Promise.allSettled(requests);

      const matchesData =
        results[0].status === "fulfilled" ? results[0].value : [];

      const announcementData =
        results[1].status === "fulfilled" ? results[1].value : [];

      const pinnedData =
        results[2].status === "fulfilled" ? results[2].value : null;

      const pendingData =
        isAdmin && results[3] && results[3].status === "fulfilled"
          ? results[3].value
          : [];

      const upcoming = Array.isArray(matchesData)
        ? matchesData
            .filter((m) => (m.status || "UPCOMING") === "UPCOMING")
            .sort(
              (a, b) =>
                new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
            )
        : [];

      const latestAnnouncements = Array.isArray(announcementData)
        ? announcementData.slice(0, 3)
        : [];

      setUpcomingMatches(upcoming);
      setAnnouncements(latestAnnouncements);
      setPinnedAnnouncement(pinnedData || null);
      setPendingMembers(Array.isArray(pendingData) ? pendingData : []);
    } catch (error) {
      console.log("HOME LOAD ERROR:", error);
    } finally {
      setLoadingHome(false);
      setRefreshing(false);
    }
  };

  // Reload home on focus
  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [isAdmin])
  );

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
  };

  // Rotating quote
  const quote = useMemo(() => {
    const index = (user?.id || 0) % QUOTES.length;
    return QUOTES[index];
  }, [user?.id]);

  // Get current week range
  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0 sunday, 1 monday
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(now);
    start.setDate(now.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Matches of current week only
  const weeklyMatches = useMemo(() => {
    const { start, end } = getWeekRange();

    return upcomingMatches.filter((match) => {
      const matchDate = new Date(match.matchDate);
      return matchDate >= start && matchDate <= end;
    });
  }, [upcomingMatches]);

  // First match this week
  const nextWeeklyMatch = useMemo(() => {
    return weeklyMatches.length > 0 ? weeklyMatches[0] : null;
  }, [weeklyMatches]);

  // Reminder if first weekly match not marked
  const needsAvailabilityReminder = useMemo(() => {
    return !!nextWeeklyMatch && !nextWeeklyMatch.myAvailability;
  }, [nextWeeklyMatch]);

  // Availability color
  const getAvailabilityColor = (status?: string) => {
    switch (status) {
      case "AVAILABLE":
        return { color: "#22c55e" };
      case "NOT_AVAILABLE":
        return { color: "#ef4444" };
      case "MAYBE":
        return { color: "#facc15" };
      case "INJURED":
        return { color: "#9ca3af" };
      default:
        return { color: "#fff" };
    }
  };

  // Compact availability label
  const getAvailabilityText = (status?: string) => {
    return status || "Not Marked";
  };

  // Countdown for small card
  const getCountdownText = (matchDate: string) => {
    const now = new Date().getTime();
    const target = new Date(matchDate).getTime();
    const diff = target - now;

    if (diff <= 0) {
      return "Live / Started";
    }

    const totalMinutes = Math.floor(diff / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;

    return `${totalMinutes}m left`;
  };

  // Close menu and navigate
  const closeMenuAndNavigate = (screen: string, params?: any) => {
    setMenuVisible(false);
    navigation.navigate(screen, params);
  };

  // Logout
  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <HomeFeeCard navigation={navigation} />

            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.name}>{user?.fullName}</Text>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu" size={26} color="#da9306" />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Gotham Cricket Club</Text>
          <Text style={styles.heroSub}>One club. One standard.</Text>
          <Text style={styles.heroQuote}>{quote}</Text>
        </View>

        {/* Pending approvals */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>Pending Approvals</Text>

            {pendingMembers.length === 0 ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>No pending member approvals.</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.pendingCard}
                onPress={() => navigation.navigate("AdminApproval")}
              >
                <Text style={styles.pendingTitle}>
                  {pendingMembers.length} member(s) waiting for approval
                </Text>

                {pendingMembers.slice(0, 3).map((member) => (
                  <View key={member.id} style={styles.pendingMemberRow}>
                    <Text style={styles.pendingMemberName}>{member.fullName}</Text>
                    <Text style={styles.pendingMemberEmail}>{member.email}</Text>
                  </View>
                ))}

                <View style={styles.pendingBtn}>
                  <Text style={styles.pendingBtnText}>Review Approvals</Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* This week matches */}
        <Text style={styles.sectionTitle}>This Week’s Matches</Text>

        {loadingHome ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Loading home screen...</Text>
          </View>
        ) : weeklyMatches.length === 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>No matches this week.</Text>
          </View>
        ) : (
          <View style={styles.weeklyWrap}>
            {weeklyMatches.slice(0, 3).map((match) => (
              <TouchableOpacity
                key={match.id}
                style={styles.weekMatchCard}
                onPress={() =>
                  navigation.navigate("MatchDetails", {
                    matchId: match.id,
                  })
                }
              >
                <View style={styles.weekMatchTopRow}>
                  <Text style={styles.weekMatchTitle} numberOfLines={1}>
                    {getMatchTitle(match)}
                  </Text>

                  <Text style={styles.weekMatchCountdown}>
                    {getCountdownText(match.matchDate)}
                  </Text>
                </View>

                <Text style={styles.weekMatchMeta} numberOfLines={1}>
                  {new Date(match.matchDate).toLocaleString()}
                </Text>

                <Text style={styles.weekMatchMeta} numberOfLines={1}>
                  {match.venue}
                </Text>

                <View style={styles.weekMatchBottomRow}>
                  <Text style={styles.weekMatchType}>{match.matchType}</Text>

                  <TouchableOpacity
                    style={styles.weekAvailabilityBtn}
                    onPress={() =>
                      navigation.navigate("Availability", {
                        matchId: match.id,
                        opponentName: getOpponentName(match),
                        matchDate: match.matchDate,
                        venue: match.venue,
                        matchType: match.matchType,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.weekAvailabilityText,
                        getAvailabilityColor(match.myAvailability),
                      ]}
                    >
                      {getAvailabilityText(match.myAvailability)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reminder */}
        {needsAvailabilityReminder && nextWeeklyMatch && (
          <>
            <Text style={styles.sectionTitle}>Reminder</Text>

            <View style={styles.reminderCard}>
              <Text style={styles.reminderTitle}>
                You have not marked availability yet
              </Text>

              <Text style={styles.reminderText}>
                Please update your availability for this week’s match vs{" "}
                {getOpponentName(nextWeeklyMatch)}.
              </Text>

              <TouchableOpacity
                style={styles.reminderBtn}
                onPress={() =>
                  navigation.navigate("Availability", {
                    matchId: nextWeeklyMatch.id,
                    opponentName: getOpponentName(nextWeeklyMatch),
                    matchDate: nextWeeklyMatch.matchDate,
                    venue: nextWeeklyMatch.venue,
                    matchType: nextWeeklyMatch.matchType,
                  })
                }
              >
                <Text style={styles.reminderBtnText}>Mark Availability</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Pinned announcement */}
        {pinnedAnnouncement && (
          <>
            <Text style={styles.sectionTitle}>Pinned Announcement</Text>

            <TouchableOpacity
              style={styles.pinnedCard}
              onPress={() => navigation.navigate("Announcements")}
            >
              <Text style={styles.pinnedLabel}>📌 Important</Text>
              <Text style={styles.pinnedTitle}>{pinnedAnnouncement.title}</Text>
              <Text style={styles.pinnedMessage} numberOfLines={4}>
                {pinnedAnnouncement.message}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Quick actions - only unique ones, not bottom tabs */}
       {/* Quick Actions */}
<Text style={styles.sectionTitle}>Quick Actions</Text>
<View style={styles.quickGrid}>
  {/* Everyone can view members */}
  <TouchableOpacity
    style={styles.quickCard}
    onPress={() => navigation.navigate("Members")}
  >
    <Ionicons name="people-outline" size={22} color="#da9306" />
    <Text style={styles.quickText}>Members</Text>
  </TouchableOpacity>

  {/* Everyone can view leagues */}
  <TouchableOpacity
    style={styles.quickCard}
    onPress={() => navigation.navigate("Leagues")}
  >
    <Ionicons name="trophy-outline" size={22} color="#da9306" />
    <Text style={styles.quickText}>Leagues</Text>
  </TouchableOpacity>

  {/* Everyone can view announcements/notifications */}
  <TouchableOpacity
    style={styles.quickCard}
    onPress={() => navigation.navigate("Notifications")}
  >
    <Ionicons name="notifications-outline" size={22} color="#da9306" />
    <Text style={styles.quickText}>Notifications</Text>
  </TouchableOpacity>

  {/* Everyone can see own fees */}
  <TouchableOpacity
    style={styles.quickCard}
    onPress={() => navigation.navigate("MyFees")}
  >
    <Ionicons name="card-outline" size={22} color="#F4B400" />
    <Text style={styles.quickText}>My Fees</Text>
  </TouchableOpacity>

  {/* Captain/Admin can manage team players */}
  <TouchableOpacity
  style={styles.quickCard}
  onPress={() => navigation.navigate("Teams")}
>
  <Ionicons name="shield-outline" size={22} color="#da9306" />
  <Text style={styles.quickText}>Teams</Text>
</TouchableOpacity>

  {/* Admin only */}
  {isAdmin && (
    <TouchableOpacity
      style={styles.quickCard}
      onPress={() => navigation.navigate("AdminApproval")}
    >
      <Ionicons name="checkmark-circle-outline" size={22} color="#da9306" />
      <Text style={styles.quickText}>Approvals</Text>
    </TouchableOpacity>
  )}

  {/* Admin only */}
  {canManage && (
    <TouchableOpacity
      style={styles.quickCard}
      onPress={() => navigation.navigate("FeeList")}
    >
      <Ionicons name="wallet-outline" size={22} color="#F4B400" />
      <Text style={styles.quickText}>Fees Admin</Text>
    </TouchableOpacity>
  )}
</View>

        {/* Latest announcements */}
        <Text style={styles.sectionTitle}>Latest Announcements</Text>
        {announcements.length === 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>No announcements right now.</Text>
          </View>
        ) : (
          announcements.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.infoCard}
              onPress={() => navigation.navigate("Announcements")}
            >
              <Text style={styles.cardTitle}>
                {item.title} {item.pinned ? "📌" : ""}
              </Text>
              <Text style={styles.cardText} numberOfLines={3}>
                {item.message}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Burger menu - only extra items, not repeated bottom tabs */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuPanel} onPress={() => {}}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuName}>{user?.fullName}</Text>
              <Text style={styles.menuRole}>{user?.role}</Text>
            </View>

            {/* Everyone can view members */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => closeMenuAndNavigate("Members")}
>
  <Ionicons name="people-outline" size={20} color="#da9306" />
  <Text style={styles.menuItemText}>Members</Text>
</TouchableOpacity>

{/* Everyone can view leagues */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => closeMenuAndNavigate("Leagues")}
>
  <Ionicons name="trophy-outline" size={20} color="#da9306" />
  <Text style={styles.menuItemText}>Leagues</Text>
</TouchableOpacity>

{/* Everyone can view notifications */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => closeMenuAndNavigate("Notifications")}
>
  <Ionicons name="notifications-outline" size={20} color="#da9306" />
  <Text style={styles.menuItemText}>Notifications</Text>
</TouchableOpacity>

{/* Everyone can view own fees */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => closeMenuAndNavigate("MyFees")}
>
  <Ionicons name="card-outline" size={20} color="#da9306" />
  <Text style={styles.menuItemText}>My Fees</Text>
</TouchableOpacity>

{/* Captain/Admin can manage team players */}
{canManage && (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => closeMenuAndNavigate("Teams")}
  >
    <Ionicons name="shield-outline" size={20} color="#da9306" />
    <Text style={styles.menuItemText}>Teams</Text>
  </TouchableOpacity>
)}

{/* Admin only */}
{isAdmin && (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => closeMenuAndNavigate("AdminApproval")}
  >
    <Ionicons
      name="checkmark-circle-outline"
      size={20}
      color="#da9306"
    />
    <Text style={styles.menuItemText}>Approve Members</Text>
  </TouchableOpacity>
)}

{/* Admin and captain */}
{canManage && (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => closeMenuAndNavigate("FeeList")}
  >
    <Ionicons name="wallet-outline" size={20} color="#da9306" />
    <Text style={styles.menuItemText}>Fees Admin</Text>
  </TouchableOpacity>
)}
            

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutMenuText}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2b0540",
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  heading: {
    color: "#ddd",
    fontSize: 15,
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
  },
  roleText: {
    color: "#da9306",
    marginTop: 4,
    fontWeight: "600",
  },
  menuBtn: {
    backgroundColor: "#3a0a57",
    padding: 10,
    borderRadius: 14,
  },
  heroCard: {
    backgroundColor: "#3a0a57",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroSub: {
    color: "#da9306",
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "600",
  },
  heroQuote: {
    color: "#ddd",
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },
  weeklyWrap: {
    marginBottom: 18,
  },
  weekMatchCard: {
    backgroundColor: "#3a0a57",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#4d1670",
  },
  weekMatchTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  weekMatchTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  weekMatchCountdown: {
    color: "#da9306",
    fontSize: 12,
    fontWeight: "700",
  },
  weekMatchMeta: {
    color: "#d6d6d6",
    fontSize: 13,
    marginBottom: 3,
  },
  weekMatchBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  weekMatchType: {
    color: "#da9306",
    fontWeight: "700",
    fontSize: 12,
  },
  weekAvailabilityBtn: {
    backgroundColor: "#2b0540",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  weekAvailabilityText: {
    fontWeight: "700",
    fontSize: 12,
  },
  pinnedCard: {
    backgroundColor: "#3a0a57",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#da9306",
  },
  pinnedLabel: {
    color: "#da9306",
    fontWeight: "700",
    marginBottom: 8,
  },
  pinnedTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  pinnedMessage: {
    color: "#ddd",
    lineHeight: 20,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  quickCard: {
    width: "48%",
    backgroundColor: "#3a0a57",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  quickText: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: "#3a0a57",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  infoText: {
    color: "#ddd",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardText: {
    color: "#ddd",
    marginBottom: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 80,
    paddingRight: 16,
  },
  menuPanel: {
    width: 270,
    backgroundColor: "#2b0540",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#4d1670",
  },
  menuHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#4d1670",
    paddingBottom: 12,
    marginBottom: 12,
  },
  menuName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  menuRole: {
    color: "#da9306",
    marginTop: 4,
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  logoutMenuItem: {
    backgroundColor: "#8b1e3f",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  logoutMenuText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  reminderCard: {
    backgroundColor: "#fff7e6",
    borderWidth: 1,
    borderColor: "#da9306",
    padding: 16,
    borderRadius: 16,
    marginBottom: 18,
  },
  reminderTitle: {
    color: "#8a5b00",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  reminderText: {
    color: "#8a5b00",
    lineHeight: 20,
    marginBottom: 12,
  },
  reminderBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 12,
    borderRadius: 10,
  },
  reminderBtnText: {
    textAlign: "center",
    color: "#2b0540",
    fontWeight: "700",
  },
  pendingCard: {
    backgroundColor: "#fff7e6",
    borderWidth: 1,
    borderColor: "#da9306",
    padding: 16,
    borderRadius: 16,
    marginBottom: 18,
  },
  pendingTitle: {
    color: "#8a5b00",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  pendingMemberRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1d8a6",
  },
  pendingMemberName: {
    color: "#2b0540",
    fontSize: 15,
    fontWeight: "700",
  },
  pendingMemberEmail: {
    color: "#6b7280",
    fontSize: 13,
    marginTop: 2,
  },
  pendingBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  pendingBtnText: {
    textAlign: "center",
    color: "#2b0540",
    fontWeight: "700",
  },
});