import React, { useCallback, useMemo, useState,useEffect } from "react";
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
import {
  AppNotification,
  getNotifications,
} from "../services/notificationService";
import HomeFeeCard from "../components/HomeFeeCard";
import { getMyFees } from "../services/feeService";
import { getEvents } from "../services/eventService";



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
type EventItem = {
  id: number;
  title: string;
  description?: string;
  location?: string;
  eventDate: string;
  myStatus?: "GOING" | "NOT_GOING" | "MAYBE";
};

const QUOTES = [
  "Play for the badge. Fight for each other.",
  "Discipline, unity, and consistency win matches.",
  "Great teams trust the process.",
  "Every match is a chance to improve.",
];

const HomeScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();

  // Menu state
  const [menuVisible, setMenuVisible] = useState(false);

  // Home data
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pinnedAnnouncement, setPinnedAnnouncement] =
    useState<Announcement | null>(null);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
const [unpaidCount, setUnpaidCount] = useState(0);
const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);

  // Local hidden matches for current session
  const [dismissedMatchIds, setDismissedMatchIds] = useState<number[]>([]);

  // Loading states
  const [loadingHome, setLoadingHome] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Role helpers
  const isAdmin = user?.role === "ADMIN";
  const isCaptain = user?.role === "CAPTAIN";
  const canManage = isAdmin || isCaptain;




const loadUnreadCount = async () => {
  try {
    const data = await getNotifications();
    const unread = data.filter((n: any) => !n.isRead).length;
    setUnreadCount(unread);
  } catch (e) {
    console.log("UNREAD COUNT ERROR:", e);
  }
};

useFocusEffect(
  useCallback(() => {
    loadUnreadCount();
  }, [])
);


  // Build readable match title
  const getMatchTitle = (match: Match) => {
    if (match.awayTeamName) {
      return `${match.homeTeamName || "Team"} vs ${match.awayTeamName}`;
    }

    return `${match.homeTeamName || "Team"} vs ${
      match.externalOpponentName || "Opponent"
    }`;
  };

  // Opponent only
  const getOpponentName = (match: Match) => {
    return match.awayTeamName || match.externalOpponentName || "Opponent";
  };

  // Load all home screen data
// Load all home screen data
const loadHomeData = async () => {
  try {
  const requests: Promise<any>[] = [
  getMatches(),            // 0
  getAnnouncements(),     // 1
  getPinnedAnnouncement(),// 2
  getNotifications(),     // 3
  getMyFees(),            // 4
  getEvents(),            // 5
];

    // Admin only
    if (isAdmin) {
      requests.push(getPendingMembers()); // results[6] if admin
    }

    const results = await Promise.allSettled(requests);




    // Matches
    const matchesData =
      results[0].status === "fulfilled" ? results[0].value : [];

    // Announcements
    const announcementData =
      results[1].status === "fulfilled" ? results[1].value : [];

    // Pinned announcement
    const pinnedData =
      results[2].status === "fulfilled" ? results[2].value : null;

    // Notifications
    const notificationsData =
      results[3].status === "fulfilled" ? results[3].value : [];

    // My fees
    const feesData =
      results[4].status === "fulfilled" ? results[4].value : [];

      // event
    const eventsData =
    results[5].status === "fulfilled" ? results[5].value : [];


    

    // Pending approvals only for admin
    const pendingData =
  isAdmin && results[6] && results[6].status === "fulfilled"
    ? results[6].value
    : [];


   

    // Unread notifications count
    const unread = Array.isArray(notificationsData)
      ? notificationsData.filter((n: any) => !n.isRead).length
      : 0;

    // Unpaid fees count
    const unpaid = Array.isArray(feesData)
      ? feesData.filter((f: any) => f.status === "UNPAID").length
      : 0;


      const upcomingEventList = Array.isArray(eventsData)
  ? eventsData
      .filter((event) => new Date(event.eventDate).getTime() >= new Date().getTime())
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
      )
      .slice(0, 3)
  : [];
setUpcomingEvents(upcomingEventList);
    setUnreadCount(unread);
    setUnpaidCount(unpaid);

    // Keep only upcoming matches
    const upcoming = Array.isArray(matchesData)
      ? matchesData
          .filter((m) => (m.status || "UPCOMING") === "UPCOMING")
          .sort(
            (a, b) =>
              new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
          )
      : [];

    // Latest 3 announcements
    const latestAnnouncements = Array.isArray(announcementData)
      ? announcementData.slice(0, 3)
      : [];

    setUpcomingMatches(upcoming);
    setAnnouncements(latestAnnouncements);
    setPinnedAnnouncement(pinnedData || null);
    setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    setPendingMembers(Array.isArray(pendingData) ? pendingData : []);
  } catch (error) {
    console.log("HOME LOAD ERROR:", error);
  } finally {
    setLoadingHome(false);
    setRefreshing(false);
  }
};


  // Reload whenever screen gets focus
  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [isAdmin])
  );

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setDismissedMatchIds([]);
    await loadHomeData();
  };

  // Rotating quote
  const quote = useMemo(() => {
    const index = (user?.id || 0) % QUOTES.length;
    return QUOTES[index];
  }, [user?.id]);

  // Unread notifications count
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((item) => !item.isRead).length;
  }, [notifications]);

  // Get Monday-Sunday range
  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(now);
    start.setDate(now.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // All weekly matches
  const weeklyMatches = useMemo(() => {
    const { start, end } = getWeekRange();

    return upcomingMatches.filter((match) => {
      const matchDate = new Date(match.matchDate);
      return matchDate >= start && matchDate <= end;
    });
  }, [upcomingMatches]);

  // Only AVAILABLE and MAYBE for home section
  const possibleWeeklyMatches = useMemo(() => {
    return weeklyMatches.filter(
      (match) =>
        (match.myAvailability === "AVAILABLE" ||
          match.myAvailability === "MAYBE") &&
        !dismissedMatchIds.includes(match.id)
    );
  }, [weeklyMatches, dismissedMatchIds]);

  // First unmarked weekly match for reminder
  const nextWeeklyUnmarkedMatch = useMemo(() => {
    return (
      weeklyMatches.find(
        (match) =>
          !match.myAvailability && !dismissedMatchIds.includes(match.id)
      ) || null
    );
  }, [weeklyMatches, dismissedMatchIds]);

  // Reminder condition
  const needsAvailabilityReminder = useMemo(() => {
    return !!nextWeeklyUnmarkedMatch;
  }, [nextWeeklyUnmarkedMatch]);

  // Status text color
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
  const getEventStatusColor = (status?: string) => {
  switch (status) {
    case "GOING":
      return { color: "#22c55e" }; // green
    case "NOT_GOING":
      return { color: "#ef4444" }; // red
    case "MAYBE":
      return { color: "#facc15" }; // yellow
    default:
      return { color: "#fff" };
  }
};


  // Compact availability label
  const getAvailabilityText = (status?: string) => {
    return status || "Not Marked";
  };

  // Countdown text
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

  // Dismiss one match card locally
  const handleDismissMatch = (matchId: number) => {
    setDismissedMatchIds((prev) => [...prev, matchId]);
  };

  // Logout
  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
  };

  const getEventTimeLeft = (eventDate: string) => {
  const now = new Date().getTime();
  const target = new Date(eventDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return "Started";
  }

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
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

  <View style={styles.topRightIcons}>
    <TouchableOpacity
      style={styles.bellBtn}
      onPress={() => navigation.navigate("Notifications")}
    >
      <View>
        <Ionicons name="notifications-outline" size={24} color="#da9306" />

        {unreadNotificationCount > 0 && (
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>
              {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.menuBtn}
      onPress={() => setMenuVisible(true)}
    >
      <Ionicons name="menu" size={26} color="#da9306" />
    </TouchableOpacity>
  </View>
</View>




        {/* Hero */}
        <View style={styles.heroCard}>









          <Text style={styles.heroTitle}>Gotham Cricket Club</Text>
          <Text style={styles.heroSub}>One club. One standard.</Text>
          <Text style={styles.heroQuote}>{quote}</Text>
        </View>

        {/* Admin pending approvals */}
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

        {/* My possible matches section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Possible Matches This Week</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("MainTabs", { screen: "Matches" })}
          >
            <Text style={styles.seeAllText}>See All Matches</Text>
          </TouchableOpacity>
        </View>

        {loadingHome ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Loading home screen...</Text>
          </View>
        ) : possibleWeeklyMatches.length === 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              No available or maybe matches this week.
            </Text>

            <TouchableOpacity
              style={styles.inlineViewBtn}
              onPress={() =>
                navigation.navigate("MainTabs", { screen: "Matches" })
              }
            >
              <Text style={styles.inlineViewBtnText}>View All Matches</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.weeklyWrap}>
            {possibleWeeklyMatches.slice(0, 3).map((match) => (
              <View key={match.id} style={styles.weekMatchCard}>
                {/* Dismiss button */}
                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => handleDismissMatch(match.id)}
                >
                  <Ionicons name="close" size={16} color="#ddd" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
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
              </View>
            ))}
          </View>
        )}

        {/* Reminder card for unmarked availability */}
        {needsAvailabilityReminder && nextWeeklyUnmarkedMatch && (
          <>
            <Text style={styles.sectionTitle}>Reminder</Text>

            <View style={styles.reminderCard}>
              <View style={styles.reminderTopRow}>
                <Text style={styles.reminderTitle}>
                  You have not marked availability yet
                </Text>

                <TouchableOpacity
                  onPress={() => handleDismissMatch(nextWeeklyUnmarkedMatch.id)}
                >
                  <Ionicons name="close" size={18} color="#8a5b00" />
                </TouchableOpacity>
              </View>

              <Text style={styles.reminderText}>
                Please update your availability for this week’s match vs{" "}
                {getOpponentName(nextWeeklyUnmarkedMatch)}.
              </Text>

              <TouchableOpacity
                style={styles.reminderBtn}
                onPress={() =>
                  navigation.navigate("MatchDetails", {
  matchId: nextWeeklyUnmarkedMatch.id,
})
                }
              >
                <Text style={styles.reminderBtnText}>View Match Details</Text>
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
              onPress={() =>
                navigation.navigate("MainTabs", { screen: "Announcements" })
              }
            >
              <Text style={styles.pinnedLabel}>📌 Important</Text>
              <Text style={styles.pinnedTitle}>{pinnedAnnouncement.title}</Text>
              <Text style={styles.pinnedMessage} numberOfLines={4}>
                {pinnedAnnouncement.message}
              </Text>
            </TouchableOpacity>
          </>
        )}


  {/* events upcoming */}

<Text style={styles.sectionTitle}>Upcoming Events</Text>

{upcomingEvents.length === 0 ? (
  <View style={styles.infoCard}>
    <Text style={styles.infoText}>No upcoming events.</Text>
  </View>
) : (
  <>
    {upcomingEvents.map((item, index) => (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.eventCard,
          index === 0 && styles.nextEventCard // highlight first
        ]}
        onPress={() =>
          navigation.navigate("EventDetails", { event: item })
        }
      >
        {index === 0 && (
          <Text style={styles.nextEventLabel}>Next Event</Text>
        )}

        <Text style={styles.eventTitle}>{item.title}</Text>

        <Text style={styles.eventCountdown}>
          {getEventTimeLeft(item.eventDate)}
        </Text>

        <Text style={styles.eventMeta}>
          {new Date(item.eventDate).toLocaleString()}
        </Text>

        <Text style={styles.eventMeta}>
          {item.location || "Location not set"}
        </Text>


<View style={styles.eventBottomRow}>
  {item.myStatus ? (
    <Text
      style={[
        styles.eventStatus,
        getEventStatusColor(item.myStatus),
      ]}
    >
      {item.myStatus}
    </Text>
  ) : (
    <TouchableOpacity
      style={styles.eventActionBtn}
      onPress={() =>
        navigation.navigate("EventDetails", { event: item })
      }
    >
      <Text style={styles.eventActionText}>Mark Response</Text>
    </TouchableOpacity>
  )}
</View>


      </TouchableOpacity>
      
      
    ))}
    <TouchableOpacity
      style={styles.seeAllBtn}
      onPress={() => navigation.navigate("Events")}
    >
      <Text style={styles.seeAllBtnText}>View All Events</Text>
    </TouchableOpacity>
  </>
)}


        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.quickGrid}>
          {/* events */}
         
          <TouchableOpacity
  style={styles.quickCard}
  onPress={() => navigation.navigate("Events")}
>
  <Ionicons name="calendar-outline" size={22} color="#da9306" />
  <Text style={styles.quickText}>Events</Text>
</TouchableOpacity>

          {/* My fees */}
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("MyFees")}
          >
            <Ionicons name="card-outline" size={22} color="#F4B400" />
            <Text style={styles.quickText}>My Fees</Text>
          </TouchableOpacity>

         

          {/* Admin only */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => navigation.navigate("AdminApproval")}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color="#da9306"
              />
              <Text style={styles.quickText}>Approvals</Text>
            </TouchableOpacity>
          )}

          {/* Admin/captain */}
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
              onPress={() =>
                navigation.navigate("MainTabs", { screen: "Announcements" })
              }
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




      

      {/* Burger menu */}
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
              onPress={() => closeMenuAndNavigate("Notifications")}
            >
              <Ionicons name="notifications-outline" size={20} color="#da9306" />
              <Text style={styles.menuItemText}>Notifications</Text>
            </TouchableOpacity>
            
            
            
            <TouchableOpacity
  style={styles.menuItem}
  onPress={() => closeMenuAndNavigate("Events")}
>
  <Ionicons name="calendar-outline" size={20} color="#da9306" />
  <Text style={styles.menuItemText}>Events</Text>
</TouchableOpacity>



            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("MyFees")}
            >
              <Ionicons name="card-outline" size={20} color="#da9306" />
              <Text style={styles.menuItemText}>My Fees</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Teams")}
            >
              <Ionicons name="shield-outline" size={20} color="#da9306" />
              <Text style={styles.menuItemText}>Teams</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Members")}
            >
              <Ionicons name="people-outline" size={20} color="#da9306" />
              <Text style={styles.menuItemText}>Members</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => closeMenuAndNavigate("Leagues")}
            >
              <Ionicons name="trophy-outline" size={20} color="#da9306" />
              <Text style={styles.menuItemText}>Leagues</Text>
            </TouchableOpacity>

            {canManage && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => closeMenuAndNavigate("FeeList")}
              >
                <Ionicons name="wallet-outline" size={20} color="#da9306" />
                <Text style={styles.menuItemText}>Fees Admin</Text>
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
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAllText: {
    color: "#da9306",
    fontWeight: "700",
    fontSize: 13,
    marginTop: 10,
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
    position: "relative",
  },
  dismissBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 4,
  },
  weekMatchTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
    paddingRight: 20,
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
  quickIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgePill: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "#da9306",
    alignItems: "center",
    justifyContent: "center",
  },
  badgePillText: {
    color: "#2b0540",
    fontWeight: "800",
    fontSize: 11,
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
  inlineViewBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  inlineViewBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
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
  reminderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  reminderTitle: {
    flex: 1,
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
  statusStrip: {
  backgroundColor: "#3a0a57",
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 14,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: "#4d1670",
  alignItems: "center",
},

statusText: {
  color: "#da9306",
  fontWeight: "700",
  fontSize: 13,
},
statusRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 18,
  gap: 10,
},

statusPill: {
  flex: 1,
  backgroundColor: "#3a0a57",
  borderWidth: 1,
  borderColor: "#4d1670",
  borderRadius: 16,
  paddingVertical: 12,
  paddingHorizontal: 10,
  alignItems: "center",
},

statusPillActive: {
  borderColor: "#da9306",
  backgroundColor: "#4a1268",
},

statusPillWarning: {
  borderColor: "#f59e0b",
  backgroundColor: "#4a1268",
},

statusPillCount: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "800",
  marginBottom: 2,
},

statusPillCountActive: {
  color: "#da9306",
},

statusPillCountWarning: {
  color: "#f59e0b",
},

statusPillLabel: {
  color: "#d6d6d6",
  fontSize: 12,
  fontWeight: "700",
},

statusPillLabelActive: {
  color: "#fff",
},

statusPillLabelWarning: {
  color: "#fff7e6",
},
eventCard: {
  backgroundColor: "#3a0a57",
  padding: 16,
  borderRadius: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#4d1670",
},

eventTitle: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "700",
  marginBottom: 6,
},

eventMeta: {
  color: "#da9306",
  fontSize: 13,
  fontWeight: "600",
  marginBottom: 4,
},

eventDesc: {
  color: "#ddd",
  marginTop: 6,
  lineHeight: 19,
},


nextEventCard: {
  borderColor: "#da9306",
  borderWidth: 2,
},

nextEventLabel: {
  color: "#da9306",
  fontWeight: "700",
  marginBottom: 6,
},



eventCountdown: {
  color: "#F4B400",
  fontSize: 13,
  fontWeight: "700",
  marginVertical: 6,
},
seeAllBtn: {
  backgroundColor: "#2b0540",
  paddingVertical: 12,
  borderRadius: 10,
  marginTop: 4,
  marginBottom: 18,
},

seeAllBtnText: {
  color: "#fff",
  textAlign: "center",
  fontWeight: "700",
},
eventBottomRow: {
  marginTop: 10,
  flexDirection: "row",
  justifyContent: "flex-end",
},

eventStatus: {
  fontWeight: "700",
  fontSize: 13,
},

eventActionBtn: {
  backgroundColor: "#da9306",
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
},

eventActionText: {
  color: "#2b0540",
  fontWeight: "700",
  fontSize: 12,
},
badge: {
  position: "absolute",
  top: -4,
  right: -6,
  backgroundColor: "#da9306",
  borderRadius: 10,
  minWidth: 16,
  height: 16,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 4,
},

badgeText: {
  color: "#fff",
  fontSize: 10,
  fontWeight: "700",
},
topRightIcons: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},

bellBtn: {
  backgroundColor: "#3a0a57",
  padding: 10,
  borderRadius: 14,
},

bellBadge: {
  position: "absolute",
  top: -4,
  right: -6,
  backgroundColor: "#da9306",
  borderRadius: 10,
  minWidth: 16,
  height: 16,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 4,
},

bellBadgeText: {
  color: "#2b0540",
  fontSize: 10,
  fontWeight: "800",
},

});