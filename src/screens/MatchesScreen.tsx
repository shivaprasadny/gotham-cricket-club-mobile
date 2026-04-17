import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { deleteMatch, getMatches } from "../services/matchService";

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
  matchDate: string;
  venue: string;
  matchType: string;
  matchFee?: number | null;
  notes?: string;
  createdBy?: string;
  status?: "UPCOMING" | "COMPLETED" | "CANCELLED";
  myAvailability?: "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED";
};

type MatchFilter = "UPCOMING" | "PAST" | "ALL" | "CANCELLED";

const MatchesScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  // All matches from backend
  const [matches, setMatches] = useState<Match[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Default filter = upcoming only
  const [filter, setFilter] = useState<MatchFilter>("UPCOMING");

  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  // Load matches from backend
  const loadMatches = async () => {
    try {
      const data = await getMatches();
      setMatches(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load matches"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadMatches();
  }, []);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
  };

  // Build readable match title
  const getMatchTitle = (item: Match) => {
    if (item.awayTeamName) {
      return `${item.homeTeamName || "Team"} vs ${item.awayTeamName}`;
    }

    return `${item.homeTeamName || "Team"} vs ${
      item.externalOpponentName || "Opponent"
    }`;
  };

  // Filter matches by date and cancelled state
  const filteredMatches = useMemo(() => {
    const now = new Date();

    return matches.filter((match) => {
      const matchDate = new Date(match.matchDate);
      const isPast = matchDate < now;
      const isCancelled = match.status === "CANCELLED";

      if (filter === "UPCOMING") {
        return !isPast && !isCancelled;
      }

      if (filter === "PAST") {
        return isPast && !isCancelled;
      }

      if (filter === "CANCELLED") {
        return isCancelled;
      }

      return true;
    });
  }, [matches, filter]);

  // Color availability text
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
        return { color: "#15803d" };
    }
  };

  // Delete match
  const handleDelete = async (id: number) => {
    Alert.alert("Delete Match", "Are you sure you want to delete this match?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await deleteMatch(id);
            Alert.alert(
              "Success",
              typeof response === "string"
                ? response
                : "Match deleted successfully"
            );
            await loadMatches();
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.response?.data?.message || "Failed to delete match"
            );
          }
        },
      },
    ]);
  };

  // Render one match card
  const renderItem = ({ item }: { item: Match }) => {
    const isAvailabilityLocked =
      new Date(item.matchDate).getTime() < new Date().getTime();

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("MatchDetails", {
              matchId: item.id,
            })
          }
        >
          <Text style={styles.title}>{getMatchTitle(item)}</Text>

          {item.leagueName ? (
            <Text style={styles.detail}>League: {item.leagueName}</Text>
          ) : null}

          <Text style={styles.detail}>Type: {item.matchType}</Text>
          {item.matchFee !== null && item.matchFee !== undefined ? (
  <Text style={styles.detail}>Match Fee: ${item.matchFee}</Text>
) : null}
          <Text style={styles.detail}>Venue: {item.venue}</Text>
          <Text style={styles.detail}>
            Date: {new Date(item.matchDate).toLocaleString()}
          </Text>
          <Text style={styles.detail}>Status: {item.status || "UPCOMING"}</Text>
        </TouchableOpacity>

        {item.myAvailability ? (
          <View style={styles.availabilityDone}>
            <Text
              style={[
                styles.availabilityDoneText,
                getAvailabilityColor(item.myAvailability),
              ]}
            >
              Availability Marked ✅ ({item.myAvailability})
            </Text>
          </View>
        ) : isAvailabilityLocked ? (
          <View style={styles.availabilityLocked}>
            <Text style={styles.availabilityLockedText}>
              Availability Locked
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.availabilityBtn}
            onPress={() =>
              navigation.navigate("Availability", {
                matchId: item.id,
                opponentName: item.awayTeamName || item.externalOpponentName,
                matchDate: item.matchDate,
                venue: item.venue,
                matchType: item.matchType,
              })
            }
          >
            <Text style={styles.availabilityText}>Mark Availability</Text>
          </TouchableOpacity>
        )}

        {canManage && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => navigation.navigate("EditMatch", { matchId: item.id })}
            >
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredMatches}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={
        filteredMatches.length === 0 ? styles.center : styles.list
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <View>
          {canManage && (
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate("CreateMatch")}
            >
              <Text style={styles.createBtnText}>+ Create Match</Text>
            </TouchableOpacity>
          )}

          <View style={styles.filterRow}>
            {(["UPCOMING", "PAST", "ALL", "CANCELLED"] as MatchFilter[]).map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.filterBtn,
                    filter === item && styles.filterBtnSelected,
                  ]}
                  onPress={() => setFilter(item)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === item && styles.filterTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          {filter === "UPCOMING"
            ? "No upcoming matches found."
            : filter === "PAST"
            ? "No past matches found."
            : filter === "CANCELLED"
            ? "No cancelled matches found."
            : "No matches found."}
        </Text>
      }
    />
  );
};

export default MatchesScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#4B1D6B",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#b89ad1",
    borderRadius: 20,
    backgroundColor: "#5A257A",
  },
  filterBtnSelected: {
    backgroundColor: "#F4B400",
    borderColor: "#F4B400",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  filterTextSelected: {
    color: "#000",
  },
  createBtn: {
    backgroundColor: "#F4B400",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  createBtnText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#000",
  },
  card: {
    backgroundColor: "#5A257A",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#fff",
  },
  detail: {
    fontSize: 15,
    marginBottom: 4,
    color: "#ddd",
  },
  availabilityBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  availabilityText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  availabilityDone: {
    backgroundColor: "#e6f9ed",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  availabilityDoneText: {
    textAlign: "center",
    fontWeight: "700",
  },
  availabilityLocked: {
    backgroundColor: "#6b7280",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  availabilityLockedText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editBtn: {
    backgroundColor: "#111",
  },
  deleteBtn: {
    backgroundColor: "#c0392b",
  },
  actionText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  emptyText: {
    color: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4B1D6B",
    padding: 20,
  },
});