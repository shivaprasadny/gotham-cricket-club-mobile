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
  matchFormat?: string;
  leagueId?: number | null;
  leagueName?: string | null;
  matchDate: string;
  venue: string;
  matchType: string;
  matchFee?: number | null;
  matchFeeAmount?: number | null;
matchFeeDueDate?: string | null;
matchFeeDescription?: string | null;
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


const isAdmin = user?.role === "ADMIN";
const isCaptain = user?.role === "CAPTAIN";
const canManageSquad = isAdmin || isCaptain;

  const isAdminOrCaptain =
    user?.role === "ADMIN" || user?.role === "CAPTAIN";

  // Load latest match details each time screen opens
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

  // Build readable match title
  const getMatchTitle = () => {
    if (!match) return "Match";

    if (match.awayTeamName) {
      return `${match.homeTeamName || "Team"} vs ${match.awayTeamName}`;
    }

    return `${match.homeTeamName || "Team"} vs ${
      match.externalOpponentName || "Opponent"
    }`;
  };

  // Lock availability if match time already passed
  const isAvailabilityLocked =
    match?.matchDate &&
    new Date(match.matchDate).getTime() < new Date().getTime();

  // Summary counts
  const availableCount = responses.filter((r) => r.status === "AVAILABLE").length;
  const maybeCount = responses.filter((r) => r.status === "MAYBE").length;
  const notAvailableCount = responses.filter(
    (r) => r.status === "NOT_AVAILABLE"
  ).length;
  const injuredCount = responses.filter((r) => r.status === "INJURED").length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2b0540" />
        <Text style={styles.centerText}>Loading match details...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Match not found.</Text>
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
      {/* Match information card */}
      <View style={styles.card}>
        <Text style={styles.title}>{getMatchTitle()}</Text>

        {match.leagueName ? (
          <Text style={styles.detail}>League: {match.leagueName}</Text>
        ) : null}

        <Text style={styles.detail}>Type: {match.matchType}</Text>

        
<Text style={styles.detail}>Format: {match.matchFormat || "N/A"}</Text>
        <Text style={styles.detail}>Venue: {match.venue}</Text>

<Text style={styles.detail}>
  Match Fee:{" "}
  {match.matchFeeAmount !== null && match.matchFeeAmount !== undefined
    ? `$${match.matchFeeAmount}`
    : "N/A"}
</Text>

<Text style={styles.detail}>
  Fee Due Date:{" "}
  {match.matchFeeDueDate
    ? new Date(match.matchFeeDueDate).toLocaleString()
    : "N/A"}
</Text>

{match.matchFeeDescription ? (
  <Text style={styles.detail}>Fee Note: {match.matchFeeDescription}</Text>
) : null}


        <Text style={styles.detail}>
          Date: {new Date(match.matchDate).toLocaleString()}
        </Text>
        <Text style={styles.detail}>Status: {match.status || "UPCOMING"}</Text>

        {match.notes ? (
          <Text style={styles.detail}>Notes: {match.notes}</Text>
        ) : null}
      </View>

      {/* User action card */}
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
            {match.myAvailability || "Not marked"}
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
            <Text style={styles.primaryButtonText}>
              {match.myAvailability
                ? "Update My Availability"
                : "Mark My Availability"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lockedBtn}>
            <Text style={styles.lockedBtnText}>Availability Locked</Text>
          </View>
        )}

       {canManageSquad && (
  <TouchableOpacity
    style={styles.squadBtn}
    onPress={() =>
      navigation.navigate("SquadSelection", {
        matchId: match.id,
        teamId: match.homeTeamId,
        opponentName: match.awayTeamName || match.externalOpponentName,
        teamName: match.homeTeamName,
        matchDate: match.matchDate,
        venue: match.venue,
        matchType: match.matchType,
        matchFormat: match.matchFormat,
      })
    }
  >
    <Text style={styles.squadBtnText}>Open Squad Selection</Text>
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

      {/* Response list */}
      <Text style={styles.sectionTitle}>Player Responses</Text>

      {responses.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.noDataText}>No responses yet.</Text>
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
    backgroundColor: "#f8f5fb",
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e8def1",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
    color: "#2b0540",
  },
  detail: {
    fontSize: 16,
    marginBottom: 6,
    color: "#2b0540",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
    color: "#2b0540",
  },
  primaryButton: {
    backgroundColor: "#da9306",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "#2b0540",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  lockedBtn: {
    backgroundColor: "#8f8f8f",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  lockedBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  myStatusCard: {
    backgroundColor: "#faf7fd",
    borderWidth: 1,
    borderColor: "#eadff3",
    padding: 12,
    borderRadius: 12,
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
    color: "#2b0540",
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
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  availableBox: {
    backgroundColor: "#dcfce7",
  },
  maybeBox: {
    backgroundColor: "#fef3c7",
  },
  notAvailableBox: {
    backgroundColor: "#fee2e2",
  },
  injuredBox: {
    backgroundColor: "#ede9fe",
  },
  summaryCount: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
    color: "#2b0540",
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2b0540",
  },
  totalResponses: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#2b0540",
  },
  responseCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8def1",
  },
  responseName: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
    color: "#2b0540",
  },
  responseStatus: {
    marginBottom: 4,
    color: "#2b0540",
  },
  responseMessage: {
    color: "#444",
  },
  noDataText: {
    color: "#2b0540",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f5fb",
  },
  centerText: {
    color: "#2b0540",
    fontWeight: "600",
    marginTop: 8,
  },
  squadBtn: {
  backgroundColor: "#da9306",
  paddingVertical: 12,
  borderRadius: 10,
  marginTop: 14,
},

squadBtnText: {
  textAlign: "center",
  color: "#2b0540",
  fontWeight: "700",
  fontSize: 15,
},
});