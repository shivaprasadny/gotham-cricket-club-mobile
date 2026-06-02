import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  AvailabilityStatus,
  markAvailability,
} from "../../services/availabilityService";

type Props = {
  matches: any[];
  navigation: any;
  getOpponentName: (match: any) => string;
  onUpdated: () => void;
};

const STATUS_OPTIONS: {
  label: string;
  value: AvailabilityStatus;
  icon: string;
}[] = [
  { label: "Available", value: "AVAILABLE", icon: "checkmark-circle" },
  { label: "Maybe", value: "MAYBE", icon: "help-circle" },
  { label: "Not Available", value: "NOT_AVAILABLE", icon: "close-circle" },
  { label: "Injured", value: "INJURED", icon: "medkit" },
];

const AvailabilityReminderCard = ({
  matches,
  navigation,
  getOpponentName,
  onUpdated,
}: Props) => {
  // Which match row is currently expanded
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  // Which match is currently saving
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null);

  // Hide full section if there are no matches needing response
  if (matches.length === 0) {
    return null;
  }

  // Save quick availability directly from home screen
  const handleQuickSelect = async (
    matchId: number,
    status: AvailabilityStatus
  ) => {
    try {
      setSavingMatchId(matchId);

      await markAvailability({
        matchId,
        status,
        message: "",
      });

      setExpandedMatchId(null);
      onUpdated();
    } catch (error: any) {
      console.log("HOME QUICK AVAILABILITY ERROR:", error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Could not update availability."
      );
    } finally {
      setSavingMatchId(null);
    }
  };

  // Open full Availability screen if user wants to leave a message
  const openAvailabilityScreen = (match: any) => {
    navigation.navigate("Availability", {
      matchId: match.id,
      homeTeamName: match.homeTeamName,
      awayTeamName: match.awayTeamName,
      externalOpponentName: match.externalOpponentName,
      venue: match.venue,
      matchDate: match.matchDate,
      matchType: match.matchType,
      matchFormat: match.matchFormat,
      matchFeeAmount: match.matchFeeAmount,
      matchFeeDueDate: match.matchFeeDueDate,
      matchFeeDescription: match.matchFeeDescription,
      status: match.status,
    });
  };

  // Simple readable date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Shows full match name: Club Team vs Opponent
const getMatchTitle = (match: any) => {
  const home = match.homeTeamName || "Gotham";
  const opponent =
    match.awayTeamName ||
    match.externalOpponentName ||
    "Opponent";

  return `${home} vs ${opponent}`;
};

// Shows league name instead of match type
const getLeagueLabel = (match: any) => {
  return match.leagueName || "League TBA";
};

  return (
    <View style={styles.wrapper}>
      {/* Section header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Availability Reminder</Text>
          <Text style={styles.sectionSubTitle}>
            {matches.length} match(es) need your response
          </Text>
        </View>
      </View>

      {/* Compact match list */}
      {matches.map((match) => {
        const isExpanded = expandedMatchId === match.id;
        const isSaving = savingMatchId === match.id;

        return (
          <View key={match.id} style={styles.rowCard}>
            {/* Collapsed row */}
            <TouchableOpacity
              style={styles.matchRow}
              activeOpacity={0.85}
              onPress={() =>
                setExpandedMatchId(isExpanded ? null : match.id)
              }
            >
              <View style={styles.matchInfo}>
              <Text style={styles.matchTitle} numberOfLines={1}>
  {getMatchTitle(match)}
</Text>

<Text style={styles.matchMeta} numberOfLines={1}>
  {getLeagueLabel(match)} •{" "}
  {match.matchFormat || match.matchType || "T20"} •{" "}
  {formatDate(match.matchDate)}
</Text>

                <Text style={styles.matchVenue} numberOfLines={1}>
                  📍 {match.venue || "Venue TBA"}
                </Text>
              </View>

              <View style={styles.selectBox}>
                <Text style={styles.selectText}>
                  {isExpanded ? "Close" : "Select"}
                </Text>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#da9306"
                />
              </View>
            </TouchableOpacity>

            {/* Expanded options */}
            {isExpanded && (
              <View style={styles.expandedBox}>
                {isSaving ? (
                  <View style={styles.savingBox}>
                    <ActivityIndicator color="#da9306" />
                    <Text style={styles.savingText}>Saving...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.optionsGrid}>
                      {STATUS_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={styles.optionButton}
                          activeOpacity={0.85}
                          onPress={() =>
                            handleQuickSelect(match.id, option.value)
                          }
                        >
                          <Ionicons
                            name={option.icon as any}
                            size={18}
                            color="#da9306"
                          />

                          <Text style={styles.optionText}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.messageButton}
                      activeOpacity={0.85}
                      onPress={() => openAvailabilityScreen(match)}
                    >
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={17}
                        color="#da9306"
                      />

                      <Text style={styles.messageButtonText}>
                        Add message / more details
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default AvailabilityReminderCard;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },

  headerRow: {
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  sectionSubTitle: {
    color: "#d1d5db",
    marginTop: 3,
    fontSize: 13,
  },

  rowCard: {
    backgroundColor: "#3a0a57",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(218,147,6,0.35)",
  },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
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

  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2b0540",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },

  selectText: {
    color: "#da9306",
    fontSize: 13,
    fontWeight: "800",
    marginRight: 4,
  },

  expandedBox: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    padding: 12,
    backgroundColor: "#2b0540",
  },

  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  optionButton: {
    width: "48%",
    backgroundColor: "#3a0a57",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 8,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  optionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },

  messageButton: {
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#da9306",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  messageButtonText: {
    color: "#da9306",
    fontWeight: "800",
    marginLeft: 7,
  },

  savingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },

  savingText: {
    color: "#ddd",
    marginLeft: 10,
    fontWeight: "700",
  },
  matchDate: {
  color: "#ffffff",
  fontSize: 13,
  fontWeight: "600",
  marginBottom: 3,
},
}); 