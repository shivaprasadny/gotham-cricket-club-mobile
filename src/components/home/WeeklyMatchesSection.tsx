import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  matches: any[];
  navigation: any;
  getOpponentName: (match: any) => string;
  getMatchCountdown: (matchDate: string) => string;
};

const WeeklyMatchesSection = ({
  matches,
  navigation,
  getOpponentName,
  getMatchCountdown,
}: Props) => {
  if (matches.length === 0) {
    return null;
  }

  const getMatchTitle = (match: any) => {
    const home = match.homeTeamName || "Gotham";
    const opponent =
      match.awayTeamName ||
      match.externalOpponentName ||
      "Opponent";

    return `${home} vs ${opponent}`;
  };

  const getLeagueLabel = (match: any) => {
    return match.leagueName || "League TBA";
  };

  const getFormatLabel = (match: any) => {
    return match.matchFormat || "Match";
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>This Week Matches</Text>

      {matches.map((match) => (
        <TouchableOpacity
          key={match.id}
          style={styles.rowCard}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate("MatchDetails", {
              matchId: match.id,
            })
          }
        >
          <View style={styles.matchInfo}>
            <Text style={styles.matchTitle} numberOfLines={1}>
              {getMatchTitle(match)}
            </Text>

            <Text style={styles.matchMeta} numberOfLines={1}>
              {match.homeAway === "AWAY" ? "Away" : "Home"} •{" "}
              {getLeagueLabel(match)} • {getFormatLabel(match)} •{" "}
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
              style={styles.smallButton}
              activeOpacity={0.85}
              onPress={(e) => {
                e.stopPropagation();

                navigation.navigate("Availability", {
                  matchId: match.id,
                  homeTeamName: match.homeTeamName,
                  awayTeamName: match.awayTeamName,
                  externalOpponentName: match.externalOpponentName,
                  venue: match.venue,
                  matchDate: match.matchDate,
                  homeAway: match.homeAway,
                  matchFormat: match.matchFormat,
                  matchFeeAmount: match.matchFeeAmount,
                  matchFeeDueDate: match.matchFeeDueDate,
                  matchFeeDescription: match.matchFeeDescription,
                  status: match.status,
                });
              }}
            >
              <Ionicons
                name="create-outline"
                size={14}
                color="#2b0540"
              />
              <Text style={styles.smallButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
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
    fontSize: 13,
    marginBottom: 3,
  },

  matchVenue: {
    color: "#da9306",
    fontSize: 13,
    fontWeight: "600",
  },

  rightBox: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  countdownText: {
    color: "#da9306",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },

  smallButton: {
    backgroundColor: "#da9306",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },

  smallButtonText: {
    color: "#2b0540",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 4,
  },
});
