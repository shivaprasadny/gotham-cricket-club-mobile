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

type MatchFilter = "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED";

const MatchesScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<MatchFilter>("ALL");

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

  const filteredMatches = useMemo(() => {
    if (filter === "ALL") return matches;
    return matches.filter((m) => (m.status || "UPCOMING") === filter);
  }, [matches, filter]);

  const handleDelete = async (id: number) => {
    try {
      const response = await deleteMatch(id);
      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Match deleted successfully"
      );
      await loadMatches();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to delete match"
      );
    }
  };

  const renderItem = ({ item }: { item: Match }) => (
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

      {item.myAvailability ? (
        <View style={styles.availabilityDone}>
          <Text style={styles.availabilityDoneText}>
            Availability Marked ✅ ({item.myAvailability})
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
  onPress={() =>
    Alert.alert(
      "Delete Match",
      "Are you sure you want to delete this match?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(item.id),
        },
      ]
    )
  }
>
  <Text style={styles.actionText}>Delete</Text>
</TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading matches...</Text>
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
        <View style={styles.filterRow}>
          {(["ALL", "UPCOMING", "COMPLETED", "CANCELLED"] as MatchFilter[]).map(
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
      }
      ListEmptyComponent={<Text>No matches found.</Text>}
    />
  );
};

export default MatchesScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#fff",
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
    borderColor: "#ccc",
    borderRadius: 20,
  },
  filterBtnSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextSelected: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  detail: {
    fontSize: 15,
    marginBottom: 4,
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
});