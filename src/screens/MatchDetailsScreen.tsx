
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  getAvailabilityByMatch,
  getAvailabilitySummary,
} from "../services/availabilityService";
import { getSquadByMatch } from "../services/squadService";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  route: any;
  navigation: any;
};

type AvailabilityItem = {
  id: number;
  matchId: number;
  userId: number;
  fullName: string;
  status: "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED";
  message?: string;
};

type Summary = {
  matchId: number;
  availableCount: number;
  maybeCount: number;
  notAvailableCount: number;
  injuredCount: number;
  totalResponses: number;
};

type SquadItem = {
  squadId: number;
  userId: number;
  fullName: string;
  nickname?: string;
  playerType?: string;
  jerseyNumber?: number;
  isPlayingXi: boolean;
  roleInMatch?: string;
};

const MatchDetailsScreen = ({ route, navigation }: Props) => {
  const { user } = useAuth();

  const {
    matchId,
    opponentName,
    venue,
    matchDate,
    matchType,
    status,
    teamId,
    teamName,
  } = route.params;

  const [availabilityList, setAvailabilityList] = useState<AvailabilityItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [squad, setSquad] = useState<SquadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdminOrCaptain = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  const myAvailability = useMemo(
    () => availabilityList.find((item) => item.userId === user?.id),
    [availabilityList, user?.id]
  );
  const isAvailabilityLocked =
  matchDate && new Date(matchDate).getTime() < new Date().getTime();

  const playingXi = useMemo(
    () => squad.filter((item) => item.isPlayingXi),
    [squad]
  );

  const reserves = useMemo(
    () => squad.filter((item) => !item.isPlayingXi),
    [squad]
  );

  const loadData = async () => {
    try {
      const [availabilityData, summaryData, squadData] = await Promise.all([
        getAvailabilityByMatch(matchId),
        getAvailabilitySummary(matchId),
        getSquadByMatch(matchId),
      ]);

      setAvailabilityList(Array.isArray(availabilityData) ? availabilityData : []);
      setSummary(summaryData || null);
      setSquad(Array.isArray(squadData) ? squadData : []);
    } catch (error: any) {
      console.log(
        "MATCH DETAILS ERROR:",
        error?.response?.data || error?.message || error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

useFocusEffect(
  useCallback(() => {
    void loadData();
  }, [matchId])
);
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusStyle = (value: string) => {
    switch (value) {
      case "AVAILABLE":
        return styles.available;
      case "NOT_AVAILABLE":
        return styles.notAvailable;
      case "MAYBE":
        return styles.maybe;
      case "INJURED":
        return styles.injured;
      default:
        return styles.defaultStatus;
    }
  };

  const renderAvailabilityItem = ({ item }: { item: AvailabilityItem }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerHeader}>
        <Text style={styles.playerName}>{item.fullName}</Text>
        <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
          {item.status}
        </Text>
      </View>
      {item.message ? (
        <Text style={styles.playerMessage}>Note: {item.message}</Text>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading match details...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={availabilityList}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderAvailabilityItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <View style={styles.matchCard}>
            <Text style={styles.matchTitle}>{opponentName}</Text>
            <Text style={styles.matchText}>Type: {matchType}</Text>
            <Text style={styles.matchText}>Venue: {venue}</Text>
            <Text style={styles.matchText}>Date: {formatDate(matchDate)}</Text>
            <Text style={styles.matchText}>
              Team: {teamName ? teamName : "No team assigned"}
            </Text>
            <Text style={styles.matchText}>Status: {status || "UPCOMING"}</Text>
          </View>

          <View style={styles.actionPanel}>
           {isAvailabilityLocked ? (
  <View style={styles.lockedBtn}>
    <Text style={styles.lockedBtnText}>Availability Locked</Text>
  </View>
) : (
  <TouchableOpacity
    style={styles.primaryButton}
    onPress={() =>
      navigation.navigate("Availability", {
        matchId,
        opponentName,
        venue,
        matchDate,
        matchType,
      })
    }
  >
    <Text style={styles.primaryButtonText}>Mark My Availability</Text>
  </TouchableOpacity>
)}

            {isAdminOrCaptain && !!teamId ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  navigation.navigate("SquadSelection", {
                    matchId,
                    teamId,
                    opponentName,
                    matchDate,
                    venue,
                    matchType,
                    teamName,
                  })
                }
              >
                <Text style={styles.primaryButtonText}>Open Squad Selection</Text>
              </TouchableOpacity>
            ) : null}

            {isAdminOrCaptain && !teamId ? (
              <Text style={styles.warningText}>
                Please assign a team to this match first to use squad selection.
              </Text>
            ) : null}
          </View>

          {myAvailability && (
            <View style={styles.myStatusCard}>
              <Text style={styles.sectionTitle}>My Availability</Text>
              <Text style={styles.infoText}>Status: {myAvailability.status}</Text>
              {myAvailability.message ? (
                <Text style={styles.infoText}>Message: {myAvailability.message}</Text>
              ) : null}
            </View>
          )}

          <Text style={styles.sectionTitle}>Availability Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, styles.availableBox]}>
              <Text style={styles.summaryNumber}>
                {summary?.availableCount ?? 0}
              </Text>
              <Text style={styles.summaryLabel}>Available</Text>
            </View>

            <View style={[styles.summaryCard, styles.maybeBox]}>
              <Text style={styles.summaryNumber}>{summary?.maybeCount ?? 0}</Text>
              <Text style={styles.summaryLabel}>Maybe</Text>
            </View>

            <View style={[styles.summaryCard, styles.notAvailableBox]}>
              <Text style={styles.summaryNumber}>
                {summary?.notAvailableCount ?? 0}
              </Text>
              <Text style={styles.summaryLabel}>Not Available</Text>
            </View>

            <View style={[styles.summaryCard, styles.injuredBox]}>
              <Text style={styles.summaryNumber}>{summary?.injuredCount ?? 0}</Text>
              <Text style={styles.summaryLabel}>Injured</Text>
            </View>
          </View>

          <Text style={styles.totalResponses}>
            Total Responses: {summary?.totalResponses ?? 0}
          </Text>

          <Text style={styles.sectionTitle}>Playing XI</Text>
          {playingXi.length === 0 ? (
            <Text style={styles.emptyText}>No playing XI selected yet.</Text>
          ) : (
            playingXi.map((item) => (
              <View key={item.squadId} style={styles.squadCard}>
                <Text style={styles.playerName}>{item.fullName}</Text>
                <Text>{item.roleInMatch || "No role set"}</Text>
              </View>
            ))
          )}

          <Text style={styles.sectionTitle}>Reserve Players</Text>
          {reserves.length === 0 ? (
            <Text style={styles.emptyText}>No reserve players selected yet.</Text>
          ) : (
            reserves.map((item) => (
              <View key={item.squadId} style={styles.squadCard}>
                <Text style={styles.playerName}>{item.fullName}</Text>
                <Text>{item.roleInMatch || "No role set"}</Text>
              </View>
            ))
          )}

          <Text style={styles.sectionTitle}>Players Response</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No player responses yet.</Text>
      }
      contentContainerStyle={
        availabilityList.length === 0
          ? styles.emptyListContainer
          : styles.listContainer
      }
    />
  );
};

export default MatchDetailsScreen;

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    backgroundColor: "#fff",
  },
  emptyListContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  headerContainer: {
    marginBottom: 16,
  },
  matchCard: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionPanel: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  myStatusCard: {
    backgroundColor: "#eef4ff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  matchTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  matchText: {
    fontSize: 15,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 6,
  },
  infoText: {
    fontSize: 15,
    marginBottom: 6,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  availableBox: {
    backgroundColor: "#d4edda",
  },
  maybeBox: {
    backgroundColor: "#fff3cd",
  },
  notAvailableBox: {
    backgroundColor: "#f8d7da",
  },
  injuredBox: {
    backgroundColor: "#e2d9f3",
  },
  totalResponses: {
    fontSize: 15,
    marginBottom: 16,
    fontWeight: "600",
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
  squadCard: {
    backgroundColor: "#f7f7f7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerCard: {
    backgroundColor: "#f7f7f7",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  playerMessage: {
    marginTop: 8,
    color: "#444",
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },
  available: {
    backgroundColor: "#28a745",
    color: "#fff",
  },
  notAvailable: {
    backgroundColor: "#dc3545",
    color: "#fff",
  },
  maybe: {
    backgroundColor: "#ffc107",
    color: "#111",
  },
  injured: {
    backgroundColor: "#6f42c1",
    color: "#fff",
  },
  defaultStatus: {
    backgroundColor: "#ccc",
    color: "#111",
  },
  emptyText: {
    color: "#666",
    marginBottom: 12,
  },
  warningText: {
    color: "red",
    marginTop: 4,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
});