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


// Match shape used on home screen
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


// Announcement shape used on home screen
type Announcement = {
  id: number;
  title: string;
  message: string;
  createdBy?: string;
  createdAt?: string;
  pinned?: boolean;
};

// Motivational quotes for hero section
const QUOTES = [
  "Play for the badge. Fight for each other.",
  "Discipline, unity, and consistency win matches.",
  "Great teams trust the process.",
  "Every match is a chance to improve.",
];

const HomeScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();

  // Controls popup menu visibility
  const [menuVisible, setMenuVisible] = useState(false);

  // Upcoming matches preview
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);

  // Latest announcements preview
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // One pinned announcement for home screen
  const [pinnedAnnouncement, setPinnedAnnouncement] =
    useState<Announcement | null>(null);

  // Screen loading and pull-to-refresh state
  const [loadingHome, setLoadingHome] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pending members preview for admin home screen
const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);

  const isAdmin = user?.role === "ADMIN";
  const isCaptain = user?.role === "CAPTAIN";
  const canManage = isAdmin || isCaptain;

  /**
   * Builds readable match title for both:
   * 1. club vs outside opponent
   * 2. club vs club
   */
  const getMatchTitle = (match: Match) => {
    if (match.awayTeamName) {
      return `${match.homeTeamName || "Team"} vs ${match.awayTeamName}`;
    }

    return `${match.homeTeamName || "Team"} vs ${
      match.externalOpponentName || "Opponent"
    }`;
  };

  /**
   * Returns opponent name only
   * This is useful for Availability screen params
   */
  const getOpponentName = (match: Match) => {
    return match.awayTeamName || match.externalOpponentName || "Opponent";
  };

  /**
   * Load matches, announcements, and pinned announcement together.
   * Uses Promise.allSettled so one failing API does not break the whole home screen.
   */
  const loadHomeData = async () => {
    try {
      const results = await Promise.allSettled([
        getMatches(),
        getAnnouncements(),
        getPinnedAnnouncement(),
      ]);



/**
 * Load matches, announcements, pinned announcement,
 * and pending members for admin.
 */
const loadHomeData = async () => {
  try {
    const requests: Promise<any>[] = [
      getMatches(),
      getAnnouncements(),
      getPinnedAnnouncement(),
    ];

    // Only admin needs pending members
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

    // Keep only upcoming matches
    const upcoming = Array.isArray(matchesData)
      ? matchesData
          .filter((m) => (m.status || "UPCOMING") === "UPCOMING")
          .sort(
            (a, b) =>
              new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
          )
          .slice(0, 3)
      : [];

    // Show only latest few announcements
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


      const matchesData =
        results[0].status === "fulfilled" ? results[0].value : [];

      const announcementData =
        results[1].status === "fulfilled" ? results[1].value : [];

      const pinnedData =
        results[2].status === "fulfilled" ? results[2].value : null;

      // Keep only upcoming matches
      const upcoming = Array.isArray(matchesData)
        ? matchesData
            .filter((m) => (m.status || "UPCOMING") === "UPCOMING")
            .sort(
              (a, b) =>
                new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
            )
            .slice(0, 3)
        : [];

      // Show only latest few announcements
      const latestAnnouncements = Array.isArray(announcementData)
        ? announcementData.slice(0, 3)
        : [];

      setUpcomingMatches(upcoming);
      setAnnouncements(latestAnnouncements);
      setPinnedAnnouncement(pinnedData || null);
    } catch (error) {
      console.log("HOME LOAD ERROR:", error);
    } finally {
      setLoadingHome(false);
      setRefreshing(false);
    }
  };

  /**
   * Refresh home every time the screen becomes active again.
   * This fixes the issue where user had to restart app after updates.
   */
  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [])
  );

  /**
   * Pull-to-refresh handler
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
  };

  // Pick a rotating quote based on current user id
  const quote = useMemo(() => {
    const index = (user?.id || 0) % QUOTES.length;
    return QUOTES[index];
  }, [user?.id]);

  // First upcoming match is highlighted as next match
  const nextMatch = useMemo(() => {
    if (!upcomingMatches.length) return null;
    return upcomingMatches[0];
  }, [upcomingMatches]);

  // True when next match exists and current user has not marked availability yet
  const needsAvailabilityReminder = useMemo(() => {
    return !!nextMatch && !nextMatch.myAvailability;
  }, [nextMatch]);

  // Return style for availability text color
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

  // Build countdown text for next match
  const getCountdownText = (matchDate: string) => {
    const now = new Date().getTime();
    const target = new Date(matchDate).getTime();
    const diff = target - now;

    if (diff <= 0) {
      return "Match time reached";
    }

    const totalMinutes = Math.floor(diff / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `Starts in ${days}d ${hours}h ${minutes}m`;
    }

    if (hours > 0) {
      return `Starts in ${hours}h ${minutes}m`;
    }

    return `Starts in ${minutes}m`;
  };

  // Close popup menu and navigate
  const closeMenuAndNavigate = (screen: string, params?: any) => {
    setMenuVisible(false);
    navigation.navigate(screen, params);
  };

  // Logout action from popup menu
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
        {/* Top header area */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>


<HomeFeeCard navigation={navigation} />


            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.name}>{user?.fullName}</Text>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>

          {/* Burger menu button */}
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu" size={26} color="#da9306" />
          </TouchableOpacity>
        </View>

        {/* Main hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Gotham Cricket Club</Text>
          <Text style={styles.heroSub}>One club. One standard.</Text>
          <Text style={styles.heroQuote}>{quote}</Text>
        </View>



        {/* Pending approvals section for admin */}
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




        {/* Next Match section */}
        <Text style={styles.sectionTitle}>Next Match</Text>

        {loadingHome ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Loading home screen...</Text>
          </View>
        ) : !nextMatch ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>No upcoming matches right now.</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.nextMatchCard}
            onPress={() =>
              navigation.navigate("MatchDetails", {
                matchId: nextMatch.id,
              })
            }
          >
            <Text style={styles.nextMatchTitle}>{getMatchTitle(nextMatch)}</Text>

            <Text style={styles.countdownText}>
              ⏳ {getCountdownText(nextMatch.matchDate)}
            </Text>

            {nextMatch.leagueName ? (
              <Text style={styles.nextMatchDetail}>
                🏆 {nextMatch.leagueName}
              </Text>
            ) : null}

            <Text style={styles.nextMatchDetail}>📍 {nextMatch.venue}</Text>
            <Text style={styles.nextMatchDetail}>
              🗓 {new Date(nextMatch.matchDate).toLocaleString()}
            </Text>
            <Text style={styles.nextMatchDetail}>🏏 {nextMatch.matchType}</Text>

            <Text style={styles.nextMatchDetail}>
              👥 {nextMatch.homeTeamName || "No team assigned"}
            </Text>

            {nextMatch.matchFee !== null && nextMatch.matchFee !== undefined ? (
              <Text style={styles.nextMatchDetail}>
                💵 Match Fee: ${nextMatch.matchFee}
              </Text>
            ) : null}

            {/* Current user's availability */}
            <View style={styles.availabilityStatusBox}>
              <Text style={styles.availabilityStatusLabel}>
                Your Availability:
              </Text>
              <Text
                style={[
                  styles.availabilityStatusValue,
                  getAvailabilityColor(nextMatch.myAvailability),
                ]}
              >
                {nextMatch.myAvailability || "Not marked yet"}
              </Text>
            </View>

            {/* Quick CTA */}
            <TouchableOpacity
              style={styles.nextMatchButton}
              onPress={() =>
                navigation.navigate("Availability", {
                  matchId: nextMatch.id,
                  opponentName: getOpponentName(nextMatch),
                  matchDate: nextMatch.matchDate,
                  venue: nextMatch.venue,
                  matchType: nextMatch.matchType,
                })
              }
            >
              <Text style={styles.nextMatchButtonText}>
                {nextMatch.myAvailability
                  ? "Update Availability"
                  : "Mark Availability"}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Availability reminder card */}
        {needsAvailabilityReminder && nextMatch && (
          <>
            <Text style={styles.sectionTitle}>Reminder</Text>

            <View style={styles.reminderCard}>
              <Text style={styles.reminderTitle}>
                You have not marked availability yet
              </Text>

              <Text style={styles.reminderText}>
                Please update your availability for the next match vs{" "}
                {getOpponentName(nextMatch)}.
              </Text>

              <TouchableOpacity
                style={styles.reminderBtn}
                onPress={() =>
                  navigation.navigate("Availability", {
                    matchId: nextMatch.id,
                    opponentName: getOpponentName(nextMatch),
                    matchDate: nextMatch.matchDate,
                    venue: nextMatch.venue,
                    matchType: nextMatch.matchType,
                  })
                }
              >
                <Text style={styles.reminderBtnText}>Mark Availability</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Pinned Announcement section */}
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

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>


          <TouchableOpacity
  style={styles.quickCard}
  onPress={() => navigation.navigate("MyFees")}
>
  <Ionicons name="card-outline" size={22} color="#F4B400" />
  <Text style={styles.quickText}>My Fees</Text>
</TouchableOpacity>


{canManage && (
  <TouchableOpacity
    style={styles.quickCard}
    onPress={() => navigation.navigate("FeeList")}
  >
    <Ionicons name="wallet-outline" size={22} color="#F4B400" />
    <Text style={styles.quickText}>Fees Admin</Text>
  </TouchableOpacity>
)}


{isAdmin && (
  <TouchableOpacity
    style={styles.quickCard}
    onPress={() => navigation.navigate("AdminApproval")}
  >
    <Ionicons name="checkmark-circle-outline" size={22} color="#da9306" />
    <Text style={styles.quickText}>Approvals</Text>
  </TouchableOpacity>
)}



          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("Matches")}
          >
            <Ionicons name="calendar-outline" size={22} color="#da9306" />
            <Text style={styles.quickText}>Matches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("Leagues")}
          >
            <Ionicons name="trophy-outline" size={22} color="#da9306" />
            <Text style={styles.quickText}>Leagues</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("Events")}
          >
            <Ionicons name="people-circle-outline" size={22} color="#da9306" />
            <Text style={styles.quickText}>Events</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("Announcements")}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color="#da9306"
            />
            <Text style={styles.quickText}>Announcements</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person-outline" size={22} color="#da9306" />
            <Text style={styles.quickText}>Profile</Text>
          </TouchableOpacity>

          {canManage ? (
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("Teams")}
            >
              <Ionicons name="shield-outline" size={22} color="#da9306" />
              <Text style={styles.quickText}>Teams</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("Matches")}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={22}
                color="#da9306"
              />
              <Text style={styles.quickText}>Availability</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Upcoming matches preview */}
        <Text style={styles.sectionTitle}>Upcoming Matches</Text>
        {upcomingMatches.length === 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>No upcoming matches right now.</Text>
          </View>
        ) : (
          upcomingMatches.map((match) => (
            <TouchableOpacity
              key={match.id}
              style={styles.infoCard}
              onPress={() =>
                navigation.navigate("MatchDetails", {
                  matchId: match.id,
                })
              }
            >
              <Text style={styles.cardTitle}>{getMatchTitle(match)}</Text>

              {match.leagueName ? (
                <Text style={styles.cardText}>League: {match.leagueName}</Text>
              ) : null}

              <Text style={styles.cardText}>Venue: {match.venue}</Text>

              <Text style={styles.cardText}>
                Date: {new Date(match.matchDate).toLocaleString()}
              </Text>

              {match.matchFee !== null && match.matchFee !== undefined ? (
                <Text style={styles.cardText}>Match Fee: ${match.matchFee}</Text>
              ) : null}

              <Text
                style={[
                  styles.cardHighlight,
                  match.myAvailability ? getAvailabilityColor(match.myAvailability) : null,
                ]}
              >
                {match.myAvailability
                  ? `Availability: ${match.myAvailability}`
                  : "Please mark your availability"}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {/* Latest announcements preview */}
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

      {/* Popup burger menu */}
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

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Home")}
            >
              <Ionicons name="home-outline" size={20} color="#da9306" />
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Matches")}
            >
              <Ionicons name="calendar-outline" size={20} color="#da9306" />
              <Text style={styles.menuItemText}>Matches</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Announcements")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#da9306"
              />
              <Text style={styles.menuItemText}>Announcements</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Leagues")}
            >
              <Ionicons name="trophy-outline" size={20} color="#da9306" />
              <Text style={styles.menuItemText}>Leagues</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Events")}
            >
              <Ionicons
                name="people-circle-outline"
                size={20}
                color="#da9306"
              />
              <Text style={styles.menuItemText}>Events</Text>
            </TouchableOpacity>

            {canManage && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => closeMenuAndNavigate("Teams")}
              >
                <Ionicons name="shield-outline" size={20} color="#da9306" />
                <Text style={styles.menuItemText}>Teams</Text>
              </TouchableOpacity>
            )}

            {canManage && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => closeMenuAndNavigate("Members")}
              >
                <Ionicons name="people-outline" size={20} color="#da9306" />
                <Text style={styles.menuItemText}>Members</Text>
              </TouchableOpacity>
            )}

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

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Profile")}
            >
              <Ionicons name="person-outline" size={20} color="#da9306" />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

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
  nextMatchCard: {
    backgroundColor: "#3a0a57",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#4d1670",
  },
  nextMatchTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  countdownText: {
    color: "#da9306",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  nextMatchDetail: {
    color: "#ddd",
    fontSize: 14,
    marginBottom: 5,
  },
  availabilityStatusBox: {
    backgroundColor: "#2b0540",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  availabilityStatusLabel: {
    color: "#ccc",
    fontSize: 12,
    marginBottom: 4,
  },
  availabilityStatusValue: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  nextMatchButton: {
    backgroundColor: "#da9306",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  nextMatchButtonText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
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
  cardHighlight: {
    color: "#da9306",
    marginTop: 6,
    fontWeight: "700",
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