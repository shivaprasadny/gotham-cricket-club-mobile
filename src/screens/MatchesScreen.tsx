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
  opponentName: string;
  matchDate: string;
  venue: string;
  matchType: string;
  notes?: string;
  createdBy?: string;
  status?: "UPCOMING" | "COMPLETED" | "CANCELLED";
  teamId?: number | null;
  teamName?: string | null;
  myAvailability?: "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED";
};

type MatchFilter = "UPCOMING" | "PAST" | "ALL" | "CANCELLED";

const MatchesScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // default filter = UPCOMING
  const [filter, setFilter] = useState<MatchFilter>("UPCOMING");

  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";
  
  
  



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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
  };


  // Return text color for availability state
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

      return true; // ALL
    });
  }, [matches, filter]);

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

  const renderItem = ({ item }: { item: Match }) => {

  // 🔒 Check if match is in the past
  const isAvailabilityLocked =
    new Date(item.matchDate).getTime() < new Date().getTime();

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("MatchDetails", {
            matchId: item.id,
            opponentName: item.opponentName,
            venue: item.venue,
            matchDate: item.matchDate,
            matchType: item.matchType,
            status: item.status,
            teamId: item.teamId,
            teamName: item.teamName,
          })
        }
      >
        <Text style={styles.title}>{item.opponentName}</Text>
        <Text style={styles.detail}>Venue: {item.venue}</Text>
        <Text style={styles.detail}>Type: {item.matchType}</Text>
        <Text style={styles.detail}>
          Date: {new Date(item.matchDate).toLocaleString()}
        </Text>
        <Text style={styles.detail}>
          Team: {item.teamName ? item.teamName : "No team assigned"}
        </Text>
        <Text style={styles.detail}>Status: {item.status || "UPCOMING"}</Text>
      </TouchableOpacity>

      {/* 🔽 Availability section */}
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
              opponentName: item.opponentName,
              matchDate: item.matchDate,
              venue: item.venue,
              matchType: item.matchType,
            })
          }
        >
          <Text style={styles.availabilityText}>Mark Availability</Text>
        </TouchableOpacity>
      )}

      {/* 🔽 Admin actions */}
      {canManage && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() =>
              navigation.navigate("EditMatch", { matchId: item.id })
            }
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
    color: "#15803d",
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
});