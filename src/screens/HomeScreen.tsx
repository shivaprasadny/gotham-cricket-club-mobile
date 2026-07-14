import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logger } from "../utils/logger";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import { getActivePolls } from "../services/pollService";
import { getChatRooms } from "../chat/chatApi";
// Fix 1: fetch published scorecard summaries for recent results
import { getScorecard } from "../services/scorecardService";
import { ScorecardResponse } from "../types/scorecard";
import { chatStompClient } from "../chat/stompClient";
import { PollResponse } from "../types/poll";
import PollCard from "../components/polls/PollCard";

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
  locationLink?: string | null;
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
  const [recentResults, setRecentResults] = useState<Match[]>([]);
  // Fix 1: published scorecard summaries keyed by matchId
  const [recentScorecards, setRecentScorecards] = useState<Record<number, ScorecardResponse>>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pinnedAnnouncement, setPinnedAnnouncement] =
    useState<Announcement | null>(null);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [fees, setFees] = useState<MyFeeItem[]>([]);
  const [activePolls, setActivePolls] = useState<PollResponse[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const chatRoomSubRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Subscribe to /user/queue/chat/rooms — the backend pushes here (per-member)
  // whenever a new message is sent to any room the user belongs to.
  useEffect(() => {
    const refreshCount = async () => {
      try {
        const rooms = await getChatRooms();
        setUnreadChatCount(
          Array.isArray(rooms)
            ? rooms.reduce((sum: number, r: any) => sum + (r.unreadCount || 0), 0)
            : 0
        );
      } catch {}
    };

    const unsub = chatStompClient.addStatusListener((s) => {
      if (s === "CONNECTED" && !chatRoomSubRef.current) {
        try {
          chatRoomSubRef.current = chatStompClient.subscribeToUserRoomList(() => {
            void refreshCount();
          });
        } catch {}
      } else if (s !== "CONNECTED") {
        chatRoomSubRef.current?.unsubscribe();
        chatRoomSubRef.current = null;
      }
    });

    return () => {
      unsub();
      chatRoomSubRef.current?.unsubscribe();
      chatRoomSubRef.current = null;
    };
  }, []);

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

  // Current week range: Monday to Sunday as YYYY-MM-DD strings.
  // String comparison avoids iOS (JavaScriptCore) vs Android (V8) timezone
  // parsing differences when calling new Date() on backend date strings.
  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon…
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const toLocalDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };

    return { start: toLocalDateStr(monday), end: toLocalDateStr(sunday) };
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
        getChatRooms(),
        getActivePolls(),
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

      const chatRoomsData =
        results[6].status === "fulfilled" ? results[6].value : [];

      const pollsData =
        results[7].status === "fulfilled" ? results[7].value : [];

      const pendingData =
        isAdmin && results[8] && results[8].status === "fulfilled"
          ? results[8].value
          : [];

      // Current week start (Monday 00:00) for match visibility — matches stay on the
      // upcoming list until Sunday midnight even after their time passes (issue 10).
      const nowDate = new Date();
      const dayOfWeek = nowDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const currentWeekStart = new Date(nowDate);
      currentWeekStart.setDate(nowDate.getDate() + diffToMonday);
      currentWeekStart.setHours(0, 0, 0, 0);

      // Last week start (Monday of the previous week)
      const lastWeekStart = new Date(currentWeekStart);
      lastWeekStart.setDate(currentWeekStart.getDate() - 7);

      // Upcoming: UPCOMING status, plus COMPLETED matches from this week so they
      // remain visible in weekly sections until Sunday 23:59 (issue 10).
      const upcomingMatchList = Array.isArray(matchesData)
        ? matchesData
            .filter((match) => {
              const status = match.status || "UPCOMING";
              if (status === "CANCELLED") return false;
              if (status === "UPCOMING") return true;
              // Include COMPLETED matches still within the current week
              return new Date(match.matchDate) >= currentWeekStart;
            })
            .sort(
              (a, b) =>
                new Date(a.matchDate).getTime() -
                new Date(b.matchDate).getTime()
            )
        : [];

      // Recent results: COMPLETED matches from this week or last week, newest first
      const recentResultList = Array.isArray(matchesData)
        ? matchesData
            .filter((match) => {
              if (match.status !== "COMPLETED") return false;
              const matchDate = new Date(match.matchDate);
              return matchDate >= lastWeekStart;
            })
            .sort(
              (a, b) =>
                new Date(b.matchDate).getTime() -
                new Date(a.matchDate).getTime()
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
      setRecentResults(recentResultList);

      // Fix 1: fetch published scorecards for recent completed matches (fire-and-forget,
      // silently skip matches whose scorecard is still a draft or doesn't exist yet)
      if (recentResultList.length > 0) {
        const scorecardEntries = await Promise.allSettled(
          recentResultList.map((m) =>
            getScorecard(m.id).then((sc) => ({ matchId: m.id, sc }))
          )
        );
        const map: Record<number, ScorecardResponse> = {};
        for (const result of scorecardEntries) {
          if (
            result.status === "fulfilled" &&
            result.value.sc.status === "PUBLISHED"
          ) {
            map[result.value.matchId] = result.value.sc;
          }
        }
        setRecentScorecards(map);
      } else {
        setRecentScorecards({});
      }
      setAnnouncements(latestAnnouncements);
      setPinnedAnnouncement(pinnedData || null);
      setNotifications(
        Array.isArray(notificationsData) ? notificationsData : []
      );
      setPendingMembers(Array.isArray(pendingData) ? pendingData : []);
      setUpcomingEvents(upcomingEventList);
      setFees(Array.isArray(feesData) ? feesData : []);
      setActivePolls(Array.isArray(pollsData) ? pollsData : []);
      setUnreadChatCount(
        Array.isArray(chatRoomsData)
          ? chatRoomsData.reduce((sum: number, r: any) => sum + (r.unreadCount || 0), 0)
          : 0
      );
        hasLoadedHomeRef.current = true;
      } catch (error) {
        logger.log("HOME LOAD ERROR:", error);
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

      // Poll both badge counts every 10s while the screen is focused.
      // This works regardless of WebSocket/STOMP connectivity.
      const pollBadges = async () => {
        try {
          const [notifs, rooms] = await Promise.all([
            getNotifications(),
            getChatRooms(),
          ]);
          if (Array.isArray(notifs)) setNotifications(notifs);
          if (Array.isArray(rooms)) {
            setUnreadChatCount(
              rooms.reduce((sum: number, r: any) => sum + (r.unreadCount || 0), 0)
            );
          }
        } catch {}
      };
      const interval = setInterval(() => void pollBadges(), 10000);
      return () => clearInterval(interval);
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

  // All matches this week (Mon–Sun), regardless of availability status
  const weeklyMatches = useMemo(() => {
    const { start, end } = getWeekRange();
    return upcomingMatches.filter((match) => {
      // Compare only the date portion of the ISO string — avoids iOS/Android
      // timezone differences when constructing Date objects from backend strings
      const dateKey = (match.matchDate as string).substring(0, 10);
      return dateKey >= start && dateKey <= end;
    });
  }, [upcomingMatches]);

  // "This Week Matches" — only games where user said AVAILABLE or MAYBE
  const possibleWeeklyMatches = useMemo(() => {
    return weeklyMatches.filter(
      (match) =>
        match.myAvailability === "AVAILABLE" ||
        match.myAvailability === "MAYBE"
    );
  }, [weeklyMatches]);

  // "Availability Reminder" — games this week with no response yet (not dismissed)
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
          unreadChatCount={unreadChatCount}
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

            {/* Matches this week where user is AVAILABLE or MAYBE */}
            <WeeklyMatchesSection
              matches={possibleWeeklyMatches}
              navigation={navigation}
              getOpponentName={getMatchTitle}
              getMatchCountdown={getCountdownText}
            />

            {/* Pinned announcement */}
            <PinnedAnnouncementCard
              announcement={pinnedAnnouncement}
              navigation={navigation}
            />

            {/* Active polls */}
            {activePolls.length > 0 && (
              <View style={styles.pollsSection}>
                <View style={styles.pollsSectionHeader}>
                  <Text style={styles.pollsSectionTitle}>Active Polls</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Polls")}>
                    <Text style={styles.pollsSeeAll}>See all</Text>
                  </TouchableOpacity>
                </View>
                {activePolls.map((poll) => (
                  <PollCard
                    key={poll.pollId}
                    poll={poll}
                    compact
                    onUpdated={(updated) =>
                      setActivePolls((prev) =>
                        prev.map((p) => (p.pollId === updated.pollId ? updated : p))
                      )
                    }
                    onDeleted={(id) =>
                      setActivePolls((prev) => prev.filter((p) => p.pollId !== id))
                    }
                  />
                ))}
              </View>
            )}

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

            {/* Recent Results — all completed matches this week + last week, most recent first.
                Shows both team names, win/loss by runs or wickets, and date.
                Green border = win, red = loss. Result text from published scorecard when available. */}
            {recentResults.length > 0 && (
              <View style={styles.recentResultsCard}>
                <Text style={styles.recentResultsTitle}>Recent Results</Text>
                {recentResults.map((match) => {
                    const sc = recentScorecards[match.id];
                    const home = match.homeTeamName || "Gotham CC";
                    const opponent = match.awayTeamName || match.externalOpponentName || "Opponent";
                    const dateStr = new Date(match.matchDate).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    });

                    const isWin = sc?.outcome === "WIN";
                    const isLoss = sc?.outcome === "LOSS";
                    const resultColor = isWin ? "#22c55e" : isLoss ? "#ef4444" : "#da9306";
                    const cardBorder = isWin
                      ? styles.recentResultRowWin
                      : isLoss
                      ? styles.recentResultRowLoss
                      : undefined;

                    // Full text e.g. "Won by 25 runs" / "Lost by 4 wickets"; fallback if no published scorecard
                    const resultText = sc?.resultSummary ?? (sc ? sc.outcome : "Result pending");

                    return (
                      <TouchableOpacity
                        key={match.id}
                        style={[styles.recentResultRow, cardBorder]}
                        onPress={() =>
                          navigation.navigate("Scorecard", { matchId: match.id, match })
                        }
                      >
                        <View style={styles.recentResultMain}>
                          <Text style={styles.recentResultMatch} numberOfLines={1}>
                            {home} vs {opponent}
                          </Text>
                          <Text style={styles.recentResultDate}>{dateStr}</Text>
                          {/* Result on its own line below the date so it never overlaps the team names */}
                          <Text style={[styles.recentResultOutcome, { color: resultColor }]} numberOfLines={2}>
                            {resultText}
                          </Text>
                        </View>
                        <Text style={styles.recentResultChevron}>›</Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}
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
recentResultsCard: {
  backgroundColor: "#3a0a57",
  borderRadius: 16,
  padding: 14,
  marginBottom: 18,
},
recentResultsTitle: {
  color: "#da9306",
  fontSize: 14,
  fontWeight: "800",
  marginBottom: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
},
recentResultRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 8,
  borderTopWidth: 1,
  borderTopColor: "#4a1568",
},
recentResultMain: { flex: 1 },
recentResultMatch: { color: "#fff", fontSize: 14, fontWeight: "700" },
recentResultDate: { color: "#b09bbf", fontSize: 12, marginTop: 2 },
recentResultChevron: { color: "#da9306", fontSize: 20, marginLeft: 8 },
// Fix 1: new styles for score, result text and win/loss row accents
recentResultScore: { color: "#d8c9e8", fontSize: 12, marginTop: 3 },
recentResultOutcome: { fontSize: 12, fontWeight: "700", marginTop: 2 },
recentResultRowWin: { borderLeftWidth: 3, borderLeftColor: "#22c55e" },
recentResultRowLoss: { borderLeftWidth: 3, borderLeftColor: "#ef4444" },
pollsSection: {
  marginBottom: 18,
},
pollsSectionHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
},
pollsSectionTitle: {
  color: "#da9306",
  fontSize: 14,
  fontWeight: "800",
  textTransform: "uppercase",
  letterSpacing: 0.5,
},
pollsSeeAll: {
  color: "#c4b7cc",
  fontSize: 12,
  fontWeight: "700",
},
});
