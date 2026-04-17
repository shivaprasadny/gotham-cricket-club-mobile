import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getMatchById } from "../services/matchService";
import { getAvailabilityByMatch } from "../services/availabilityService";

type Props = {
  route: any;
  navigation: any;
};

type MatchDetails = {
  id: number;
  homeTeamId?: number | null;
  homeTeamName?: string | null;
  awayTeamId?: number | null;
  awayTeamName?: string | null;
  externalOpponentName?: string | null;
  leagueId?: number | null;
  leagueName?: string | null;
  matchDate: string;
  venue: string;
  matchType: string;
  notes?: string;
  createdBy?: string;
  status?: "UPCOMING" | "COMPLETED" | "CANCELLED";
  myAvailability?: "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED";
};

type AvailabilityItem = {
  id: number;
  userId: number;
  fullName: string;
  status: "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED";
  message?: string;
};

const MatchDetailsScreen = ({ route, navigation }: Props) => {
  const { matchId } = route.params;
  const { user } = useAuth();

  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [responses, setResponses] = useState<AvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdminOrCaptain =
    user?.role === "ADMIN" || user?.role === "CAPTAIN";

  // Load fresh data whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [matchId])
  );

  const loadData = async () => {
    try {
      setLoading(true);

      const [matchData, availabilityData] = await Promise.all([
        getMatchById(matchId),
        getAvailabilityByMatch(matchId),
      ]);

      setMatch(matchData || null);
      setResponses(Array.isArray(availabilityData) ? availabilityData : []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load match details"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Build display title for match
  const getMatchTitle = () => {
    if (!match) return "Match";

    if (match.awayTeamName) {
      return `${match.homeTeamName || "Team"} vs ${match.awayTeamName}`;
    }

    return `${match.homeTeamName || "Team"} vs ${
      match.externalOpponentName || "Opponent"
    }`;
  };

  const isAvailabilityLocked =
    match?.matchDate &&
    new Date(match.matchDate).getTime() < new Date().getTime();

  // Count availability statuses
  const availableCount = responses.filter((r) => r.status === "AVAILABLE").length;
  const maybeCount = responses.filter((r) => r.status === "MAYBE").length;
  const notAvailableCount = responses.filter(
    (r) => r.status === "NOT_AVAILABLE"
  ).length;
  const injuredCount = responses.filter((r) => r.status === "INJURED").length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading match details...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.center}>
        <Text>Match not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Match info card */}
      <View style={styles.card}>
        <Text style={styles.title}>{getMatchTitle()}</Text>

        {match.leagueName ? (
          <Text style={styles.detail}>League: {match.leagueName}</Text>
        ) : null}

        <Text style={styles.detail}>Type: {match.matchType}</Text>
        <Text style={styles.detail}>Venue: {match.venue}</Text>
        <Text style={styles.detail}>
          Date: {new Date(match.matchDate).toLocaleString()}
        </Text>
        <Text style={styles.detail}>Status: {match.status || "UPCOMING"}</Text>

        {match.notes ? (
          <Text style={styles.detail}>Notes: {match.notes}</Text>
        ) : null}
      </View>

      {/* Action card */}
      <View style={styles.card}>
  <View style={styles.myStatusCard}>
    <Text style={styles.myStatusLabel}>My Availability</Text>

    <Text
      style={[
        styles.myStatusValue,
        match.myAvailability === "AVAILABLE"
          ? styles.statusAvailable
          : match.myAvailability === "NOT_AVAILABLE"
          ? styles.statusNotAvailable
          : match.myAvailability === "MAYBE"
          ? styles.statusMaybe
          : match.myAvailability === "INJURED"
          ? styles.statusInjured
          : styles.statusDefault,
      ]}
    >
    {match.myAvailability === "AVAILABLE" && "AVAILABLE ✅"}
{match.myAvailability === "NOT_AVAILABLE" && "NOT AVAILABLE ❌"}
{match.myAvailability === "MAYBE" && "MAYBE 🤔"}
{match.myAvailability === "INJURED" && "INJURED 🚑"}
{!match.myAvailability && "Not marked"}
    </Text>
  </View>

  {!isAvailabilityLocked ? (
    <TouchableOpacity
      style={styles.primaryButton}
      onPress={() =>
        navigation.navigate("Availability", {
          matchId: match.id,
          opponentName:
            match.awayTeamName || match.externalOpponentName || "Opponent",
          venue: match.venue,
          matchDate: match.matchDate,
          matchType: match.matchType,
        })
      }
    >
      <Text style={styles.primaryButtonText}>Mark My Availability</Text>
    </TouchableOpacity>
  ) : (
    <View style={styles.lockedBtn}>
      <Text style={styles.lockedBtnText}>Availability Locked</Text>
    </View>
  )}

  {isAdminOrCaptain && (
    <TouchableOpacity
      style={styles.primaryButton}
      onPress={() =>
        navigation.navigate("SquadSelection", {
          matchId: match.id,
          opponentName:
            match.awayTeamName || match.externalOpponentName || "Opponent",
          teamName: match.homeTeamName || "No team assigned",
          matchDate: match.matchDate,
          venue: match.venue,
          matchType: match.matchType,
        })
      }
    >
      <Text style={styles.primaryButtonText}>Open Squad Selection</Text>
    </TouchableOpacity>
  )}
</View>

      {/* Availability summary */}
      <Text style={styles.sectionTitle}>Availability Summary</Text>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryBox, styles.availableBox]}>
          <Text style={styles.summaryCount}>{availableCount}</Text>
          <Text style={styles.summaryLabel}>Available</Text>
        </View>

        <View style={[styles.summaryBox, styles.maybeBox]}>
          <Text style={styles.summaryCount}>{maybeCount}</Text>
          <Text style={styles.summaryLabel}>Maybe</Text>
        </View>

        <View style={[styles.summaryBox, styles.notAvailableBox]}>
          <Text style={styles.summaryCount}>{notAvailableCount}</Text>
          <Text style={styles.summaryLabel}>Not Available</Text>
        </View>

        <View style={[styles.summaryBox, styles.injuredBox]}>
          <Text style={styles.summaryCount}>{injuredCount}</Text>
          <Text style={styles.summaryLabel}>Injured</Text>
        </View>
      </View>

      <Text style={styles.totalResponses}>
        Total Responses: {responses.length}
      </Text>

      {/* Availability list */}
      <Text style={styles.sectionTitle}>Player Responses</Text>

      {responses.length === 0 ? (
        <View style={styles.card}>
          <Text>No responses yet.</Text>
        </View>
      ) : (
        responses.map((item) => (
          <View key={item.id} style={styles.responseCard}>
            <Text style={styles.responseName}>{item.fullName}</Text>
            <Text style={styles.responseStatus}>Status: {item.status}</Text>
            {item.message ? (
              <Text style={styles.responseMessage}>Note: {item.message}</Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
};

export default MatchDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },
  detail: {
    fontSize: 16,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  lockedBtn: {
    backgroundColor: "#777",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  lockedBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  currentStatusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#b91c1c",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryBox: {
    width: "48%",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
  },
  availableBox: {
    backgroundColor: "#d9fbe3",
  },
  maybeBox: {
    backgroundColor: "#fff4cc",
  },
  notAvailableBox: {
    backgroundColor: "#ffdada",
  },
  injuredBox: {
    backgroundColor: "#ece2ff",
  },
  summaryCount: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalResponses: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  responseCard: {
    backgroundColor: "#f7f7f7",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  responseName: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  responseStatus: {
    marginBottom: 4,
  },
  responseMessage: {
    color: "#444",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  myStatusCard: {
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#e5e7eb",
  padding: 12,
  borderRadius: 10,
  marginBottom: 12,
},

myStatusLabel: {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 6,
  fontWeight: "600",
},

myStatusValue: {
  fontSize: 18,
  fontWeight: "700",
},

statusAvailable: {
  color: "#16a34a",
},

statusNotAvailable: {
  color: "#dc2626",
},

statusMaybe: {
  color: "#d97706",
},

statusInjured: {
  color: "#7c3aed",
},

statusDefault: {
  color: "#111827",
},
});