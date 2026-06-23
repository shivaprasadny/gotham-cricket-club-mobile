import React, { useCallback, useMemo, useRef, useState } from "react";
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
import { getEvents } from "../services/eventService";
import { getMyFees } from "../services/feeService";

// Home components
import HomeHeader from "../components/home/HomeHeader";
import PendingApprovalsSection from "../components/home/PendingApprovalsSection";
import WeeklyMatchesSection from "../components/home/WeeklyMatchesSection";
import AvailabilityReminderCard from "../components/home/AvailabilityReminderCard";
import PinnedAnnouncementCard from "../components/home/PinnedAnnouncementCard";
import UpcomingEventsSection from "../components/home/UpcomingEventsSection";
import QuickActionsGrid from "../components/home/QuickActionsGrid";
import LatestAnnouncementsSection from "../components/home/LatestAnnouncementsSection";
import HomeMenuModal from "../components/home/HomeMenuModal";
import HomeFeeCard, {
  MyFeeItem,
} from "../components/home/HomeFeeCard";

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
  homeAway?: "HOME" | "AWAY";
  matchFormat?: string | null;
  matchFeeAmount?: number | null;
  matchFeeDueDate?: string | null;
  matchFeeDescription?: string | null;
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

const HomeScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();

  // =========================
  // UI STATE
  // =========================

  // Burger menu open/close
  const [menuVisible, setMenuVisible] = useState(false);

  // Main loading state
  const [loadingHome, setLoadingHome] = useState(true);

  // Pull-to-refresh loading state
  const [refreshing, setRefreshing] = useState(false);

  // Keep existing Home content visible while refreshing in the background.
  const hasLoadedHomeRef = useRef(false);
  const homeRequestRef = useRef<Promise<void> | null>(null);

  // =========================
  // DATA STATE
  // =========================

  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pinnedAnnouncement, setPinnedAnnouncement] =
    useState<Announcement | null>(null);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [fees, setFees] = useState<MyFeeItem[]>([]);

  // =========================
  // LOCAL HIDE STATE
  // =========================

  // Hide dismissed matches only for the current app session
  const [dismissedMatchIds, setDismissedMatchIds] = useState<number[]>([]);

  // Hide events from Home only for the current app session
  // Event still exists in Events screen
  const [hiddenEventIds, setHiddenEventIds] = useState<number[]>([]);

  // =========================
  // ROLE HELPERS
  // =========================

  const isAdmin = user?.role === "ADMIN";
  const isCaptain = user?.role === "CAPTAIN";
  const canManage = isAdmin || isCaptain;

  // =========================
  // MATCH HELPERS
  // =========================

  // Opponent name only
  const getOpponentName = (match: Match) => {
    return match.awayTeamName || match.externalOpponentName || "Opponent";
  };

  // Full match title: club/team vs opponent
  const getMatchTitle = (match: Match) => {
    const home = match.homeTeamName || "Team";
    const opponent =
      match.awayTeamName || match.externalOpponentName || "Opponent";

    return `${home} vs ${opponent}`;
  };

  // Countdown text for weekly matches
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

  // Current week range: Monday to Sunday
  const getWeekRange = () => {
    const now = new Date();

    // JS: Sunday = 0, Monday = 1
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

  // =========================
  // LOAD HOME DATA
  // =========================

  const loadHomeData = useCallback(async (showLoader = false) => {
    if (homeRequestRef.current) {
      return homeRequestRef.current;
    }

    const request = (async () => {
      try {
        if (showLoader && !hasLoadedHomeRef.current) {
          setLoadingHome(true);
        }

      const requests: Promise<any>[] = [
        getMatches(),
        getAnnouncements(),
        getPinnedAnnouncement(),
        getNotifications(),
        getEvents(),
        getMyFees(),
      ];

      // Only Admin needs pending member requests
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
        results[4].status === "fulfilled" ? results[4].value : [];

      const feesData =
        results[5].status === "fulfilled" ? results[5].value : [];

      const pendingData =
        isAdmin && results[6] && results[6].status === "fulfilled"
          ? results[6].value
          : [];

      // Upcoming matches only
      const upcomingMatchList = Array.isArray(matchesData)
        ? matchesData
            .filter((match) => (match.status || "UPCOMING") === "UPCOMING")
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

      // Upcoming events only
      // Passed events disappear automatically
      // Hidden events disappear only from Home for this session
      const upcomingEventList = Array.isArray(eventsData)
  ? eventsData
      .filter((event) => {
        const eventDate = new Date(event.eventDate);

        const isUpcoming = eventDate.getTime() >= new Date().getTime();

        const isNotGoing = event.myStatus === "NOT_GOING";

        return isUpcoming && !isNotGoing;
      })
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() -
          new Date(b.eventDate).getTime()
      )
  : [];

      setUpcomingMatches(upcomingMatchList);
      setAnnouncements(latestAnnouncements);
      setPinnedAnnouncement(pinnedData || null);
      setNotifications(
        Array.isArray(notificationsData) ? notificationsData : []
      );
      setPendingMembers(Array.isArray(pendingData) ? pendingData : []);
      setUpcomingEvents(upcomingEventList);
      setFees(Array.isArray(feesData) ? feesData : []);
        hasLoadedHomeRef.current = true;
      } catch (error) {
        console.log("HOME LOAD ERROR:", error);
      } finally {
        setLoadingHome(false);
        setRefreshing(false);
        homeRequestRef.current = null;
      }
    })();

    homeRequestRef.current = request;
    return request;
  }, [isAdmin]);

  // Refresh in the background whenever Home regains focus. Existing content
  // remains visible instead of flashing a full-page loading state.
  useFocusEffect(
    useCallback(() => {
      void loadHomeData(!hasLoadedHomeRef.current);
    }, [loadHomeData])
  );

  // =========================
  // REFRESH
  // =========================

  const onRefresh = async () => {
    setRefreshing(true);

    // Reset hidden/dismissed session-only items when user refreshes
    setDismissedMatchIds([]);
    setHiddenEventIds([]);

    await loadHomeData(false);
  };

  // =========================
  // DERIVED DATA
  // =========================

  // Unread notification badge count
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((item) => !item.isRead).length;
  }, [notifications]);

  // Matches from Monday to Sunday
  const weeklyMatches = useMemo(() => {
    const { start, end } = getWeekRange();

    return upcomingMatches.filter((match) => {
      const matchDate = new Date(match.matchDate);
      return matchDate >= start && matchDate <= end;
    });
  }, [upcomingMatches]);

  // Weekly matches where user said AVAILABLE only
  const possibleWeeklyMatches = useMemo(() => {
    return weeklyMatches.filter(
      (match) =>
        match.myAvailability === "AVAILABLE" &&
        !dismissedMatchIds.includes(match.id)
    );
  }, [weeklyMatches, dismissedMatchIds]);

  // Weekly matches where user has not marked availability yet
  const weeklyUnmarkedMatches = useMemo(() => {
    return weeklyMatches.filter(
      (match) => !match.myAvailability && !dismissedMatchIds.includes(match.id)
    );
  }, [weeklyMatches, dismissedMatchIds]);

  const visibleUpcomingEvents = useMemo(() => {
    return upcomingEvents.filter(
      (event) => !hiddenEventIds.includes(event.id)
    );
  }, [upcomingEvents, hiddenEventIds]);

  // =========================
  // HANDLERS
  // =========================

  const handleHideEvent = (eventId: number) => {
    setHiddenEventIds((prev) =>
      prev.includes(eventId) ? prev : [...prev, eventId]
    );
  };

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
        {/* Top header with greeting, fees, notifications, burger menu */}
        <HomeHeader
          user={user}
          navigation={navigation}
          unreadCount={unreadNotificationCount}
          onOpenMenu={() => setMenuVisible(true)}
        />

        {/* Admin pending approval reminder */}
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
            <HomeFeeCard navigation={navigation} fees={fees} />

            {/* Inline weekly availability quick response */}
            <AvailabilityReminderCard
              matches={weeklyUnmarkedMatches}
              navigation={navigation}
              getOpponentName={getOpponentName}
              onUpdated={() => loadHomeData(false)}
            />

            {/* Weekly matches where user marked Available */}
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

            {/* Upcoming events with quick response and hide button */}
            <UpcomingEventsSection
  events={visibleUpcomingEvents}
  navigation={navigation}
  onUpdated={() => loadHomeData(false)}
  onHideEvent={handleHideEvent}
/>

            {/* Shortcut buttons */}
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
  rightIcons: {
  flexDirection: "row",
  alignItems: "center",
},

hideButton: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: "#2b0540",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 8,
},
});
