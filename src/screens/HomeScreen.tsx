import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import { getMyFees } from "../services/feeService";
import { getEvents } from "../services/eventService";

// Home components
import HomeHeader from "../components/home/HomeHeader";
import HomeHeroCard from "../components/home/HomeHeroCard";
import PendingApprovalsSection from "../components/home/PendingApprovalsSection";
import WeeklyMatchesSection from "../components/home/WeeklyMatchesSection";
import AvailabilityReminderCard from "../components/home/AvailabilityReminderCard";
import PinnedAnnouncementCard from "../components/home/PinnedAnnouncementCard";
import UpcomingEventsSection from "../components/home/UpcomingEventsSection";
import QuickActionsGrid from "../components/home/QuickActionsGrid";
import LatestAnnouncementsSection from "../components/home/LatestAnnouncementsSection";
import HomeMenuModal from "../components/home/HomeMenuModal";

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

  // Home data states
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pinnedAnnouncement, setPinnedAnnouncement] =
    useState<Announcement | null>(null);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);

  // UI loading states
  const [loadingHome, setLoadingHome] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hide dismissed match cards only for current session
  const [dismissedMatchIds, setDismissedMatchIds] = useState<number[]>([]);

  // Role helpers
  const isAdmin = user?.role === "ADMIN";
  const isCaptain = user?.role === "CAPTAIN";
  const canManage = isAdmin || isCaptain;

  // Get opponent name only
  const getOpponentName = (match: Match) => {
    return match.awayTeamName || match.externalOpponentName || "Opponent";
  };

  // Get readable match title
  const getMatchTitle = (match: Match) => {
    if (match.awayTeamName) {
      return `${match.homeTeamName || "Team"} vs ${match.awayTeamName}`;
    }

    return `${match.homeTeamName || "Team"} vs ${
      match.externalOpponentName || "Opponent"
    }`;
  };

  // Countdown for match cards
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

  // Load all home screen data
  const loadHomeData = async () => {
    try {
      setLoadingHome(true);

      const requests: Promise<any>[] = [
        getMatches(),
        getAnnouncements(),
        getPinnedAnnouncement(),
        getNotifications(),
        getMyFees(),
        getEvents(),
      ];

      // Admin only API
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

      const notificationsData =
        results[3].status === "fulfilled" ? results[3].value : [];

      const eventsData =
        results[5].status === "fulfilled" ? results[5].value : [];

      const pendingData =
        isAdmin && results[6] && results[6].status === "fulfilled"
          ? results[6].value
          : [];

      // Upcoming matches only
      const upcoming = Array.isArray(matchesData)
        ? matchesData
            .filter((m) => (m.status || "UPCOMING") === "UPCOMING")
            .sort(
              (a, b) =>
                new Date(a.matchDate).getTime() -
                new Date(b.matchDate).getTime()
            )
        : [];

      // Latest 3 announcements
      const latestAnnouncements = Array.isArray(announcementData)
        ? announcementData.slice(0, 3)
        : [];

      // Upcoming 3 events
      const upcomingEventList = Array.isArray(eventsData)
        ? eventsData
            .filter(
              (event) =>
                new Date(event.eventDate).getTime() >= new Date().getTime()
            )
            .sort(
              (a, b) =>
                new Date(a.eventDate).getTime() -
                new Date(b.eventDate).getTime()
            )
            .slice(0, 3)
        : [];

      setUpcomingMatches(upcoming);
      setAnnouncements(latestAnnouncements);
      setPinnedAnnouncement(pinnedData || null);
      setNotifications(
        Array.isArray(notificationsData) ? notificationsData : []
      );
      setPendingMembers(Array.isArray(pendingData) ? pendingData : []);
      setUpcomingEvents(upcomingEventList);
    } catch (error) {
      console.log("HOME LOAD ERROR:", error);
    } finally {
      setLoadingHome(false);
      setRefreshing(false);
    }
  };

  // Reload home data every time screen focuses
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

  // Random-looking quote based on user id
  const quote = useMemo(() => {
    const index = (user?.id || 0) % QUOTES.length;
    return QUOTES[index];
  }, [user?.id]);

  // Notification badge count
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((item) => !item.isRead).length;
  }, [notifications]);

  // Get current week Monday to Sunday
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

  // Matches for current week
  const weeklyMatches = useMemo(() => {
    const { start, end } = getWeekRange();

    return upcomingMatches.filter((match) => {
      const matchDate = new Date(match.matchDate);
      return matchDate >= start && matchDate <= end;
    });
  }, [upcomingMatches]);

  // Show only AVAILABLE or MAYBE matches
 const possibleWeeklyMatches = useMemo(() => {
  return weeklyMatches.filter(
    (match) =>
      match.myAvailability === "AVAILABLE" &&
      !dismissedMatchIds.includes(match.id)
  );
}, [weeklyMatches, dismissedMatchIds]);

  // First weekly match where user has not marked availability
const weeklyUnmarkedMatches = useMemo(() => {
  return weeklyMatches.filter(
    (match) =>
      !match.myAvailability &&
      !dismissedMatchIds.includes(match.id)
  );
}, [weeklyMatches, dismissedMatchIds]);
  // Logout handler
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
        {/* Top header */}
        <HomeHeader
          user={user}
          navigation={navigation}
          unreadCount={unreadNotificationCount}
          onOpenMenu={() => setMenuVisible(true)}
        />

        {/* Hero card */}
        {/* <HomeHeroCard quote={quote} /> */}

        {/* Admin approvals */}
        {isAdmin && (
          <PendingApprovalsSection
            pendingCount={pendingMembers.length}
            navigation={navigation}
          />
        )}

        {/* Loading state */}
        {loadingHome ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Loading home screen...</Text>
          </View>
        ) : (
          <>

                   {/* Availability reminder */}
      <AvailabilityReminderCard
  matches={weeklyUnmarkedMatches}
  navigation={navigation}
  getOpponentName={getOpponentName}
  onUpdated={loadHomeData}
/>
            
            {/* Weekly matches */}
            <WeeklyMatchesSection
              matches={possibleWeeklyMatches.slice(0, 3)}
              navigation={navigation}
              getOpponentName={getMatchTitle}
              getMatchCountdown={getCountdownText}
            />

   

            {/* Pinned announcement */}
            <PinnedAnnouncementCard
              announcement={pinnedAnnouncement}
              navigation={navigation}
            />

            {/* Upcoming events */}
            <UpcomingEventsSection
              events={upcomingEvents.map((event) => ({
                ...event,
                venue: event.location,
              }))}
              navigation={navigation}
            />

            {/* Quick actions */}
            <QuickActionsGrid
              isAdmin={isAdmin}
              canManage={canManage}
              navigation={navigation}
            />

            {/* Latest announcements */}
            <LatestAnnouncementsSection
              announcements={announcements}
              navigation={navigation}
            />
          </>
        )}
      </ScrollView>

      {/* Burger menu */}
      <HomeMenuModal
        visible={menuVisible}
        navigation={navigation}
        onClose={() => setMenuVisible(false)}
        onLogout={handleLogout}
      />
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

  infoCard: {
    backgroundColor: "#3a0a57",
    padding: 16,
    borderRadius: 16,
    marginBottom: 18,
  },

  infoText: {
    color: "#ddd",
  },
});