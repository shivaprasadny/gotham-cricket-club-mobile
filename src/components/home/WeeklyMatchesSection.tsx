import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  matches: any[];
  navigation: any;
  getOpponentName: (match: any) => string;
  getMatchCountdown: (matchDate: string) => string;
};

type AvailabilityStatus = "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED" | undefined;

const AVAILABILITY_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  AVAILABLE:     { label: "Available",     bg: "#16a34a", color: "#fff" },
  NOT_AVAILABLE: { label: "Not Available", bg: "#dc2626", color: "#fff" },
  MAYBE:         { label: "Maybe",         bg: "#d97706", color: "#fff" },
  INJURED:       { label: "Injured",       bg: "#9333ea", color: "#fff" },
};

const getAvailabilityConfig = (status: AvailabilityStatus) =>
  status ? AVAILABILITY_CONFIG[status] : { label: "Mark", bg: "#4b5563", color: "#e5e7eb" };

const WeeklyMatchesSection = ({
  matches,
  navigation,
  getMatchCountdown,
}: Props) => {
  if (matches.length === 0) {
    return null;
  }

  const getMatchTitle = (match: any) => {
    const home = match.homeTeamName || "Gotham";
    const opponent = match.awayTeamName || match.externalOpponentName || "Opponent";
    return `${home} vs ${opponent}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const goToAvailability = (e: any, match: any) => {
    e.stopPropagation();
    navigation.navigate("Availability", {
      matchId: match.id,
      homeTeamName: match.homeTeamName,
      awayTeamName: match.awayTeamName,
      externalOpponentName: match.externalOpponentName,
      venue: match.venue,
      locationLink: match.locationLink,
      matchDate: match.matchDate,
      homeAway: match.homeAway,
      matchFormat: match.matchFormat,
      matchFeeAmount: match.matchFeeAmount,
      matchFeeDueDate: match.matchFeeDueDate,
      matchFeeDescription: match.matchFeeDescription,
      status: match.status,
    });
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>This Week Matches</Text>

      {matches.map((match) => {
        const avail = getAvailabilityConfig(match.myAvailability);

        return (
          <TouchableOpacity
            key={match.id}
            style={styles.rowCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("MatchDetails", { matchId: match.id })}
          >
            <View style={styles.matchInfo}>
              <Text style={styles.matchTitle} numberOfLines={1}>
                {getMatchTitle(match)}
              </Text>

              <Text style={styles.matchMeta} numberOfLines={1}>
                {match.homeAway === "AWAY" ? "Away" : "Home"} •{" "}
                {match.leagueName || "League TBA"} •{" "}
                {match.matchFormat || "Match"}
              </Text>

              <Text style={styles.matchDate} numberOfLines={1}>
                {formatDate(match.matchDate)}
              </Text>

              <Text style={styles.matchVenue} numberOfLines={1}>
                📍 {match.venue || "Venue TBA"}
              </Text>
            </View>

            <View style={styles.rightBox}>
              <Text style={styles.countdownText}>
                {getMatchCountdown(match.matchDate)}
              </Text>

              <TouchableOpacity
                style={[styles.availBadge, { backgroundColor: avail.bg }]}
                activeOpacity={0.8}
                onPress={(e) => goToAvailability(e, match)}
              >
                <Text style={[styles.availText, { color: avail.color }]}>
                  {avail.label}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default WeeklyMatchesSection;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },
  rowCard: {
    backgroundColor: "#3a0a57",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(218,147,6,0.25)",
  },
  matchInfo: {
    flex: 1,
    paddingRight: 10,
  },
  matchTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  matchMeta: {
    color: "#d1d5db",
    fontSize: 12,
    marginBottom: 2,
  },
  matchDate: {
    color: "#d1d5db",
    fontSize: 12,
    marginBottom: 3,
  },
  matchVenue: {
    color: "#da9306",
    fontSize: 12,
    fontWeight: "600",
  },
  rightBox: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  countdownText: {
    color: "#da9306",
    fontSize: 12,
    fontWeight: "800",
  },
  availBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 72,
    alignItems: "center",
  },
  availText: {
    fontSize: 11,
    fontWeight: "800",
  },
});
