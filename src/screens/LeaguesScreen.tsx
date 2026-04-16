import React, { useEffect, useState } from "react";
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
import { getLeagues } from "../services/leagueService";

type Props = {
  navigation: any;
};

// League shape from backend
type League = {
  id: number;
  name: string;
  season: string;
  type: "LEAGUE" | "TOURNAMENT" | "FRIENDLY_SERIES";
  description?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
};

const LeaguesScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  // Store leagues
  const [leagues, setLeagues] = useState<League[]>([]);

  // Loading flags
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Only admin/captain can create leagues
  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  // Load leagues from backend
  const loadLeagues = async () => {
    try {
      const data = await getLeagues();
      setLeagues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("LEAGUES LOAD ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadLeagues();
  }, []);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeagues();
  };

  // One league card
  const renderItem = ({ item }: { item: League }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("LeagueDetails", {
          leagueId: item.id,
        })
      }
    >
      <View style={styles.cardTop}>
        <Text style={styles.title}>{item.name}</Text>

        <Text
          style={[
            styles.statusBadge,
            item.active ? styles.activeBadge : styles.inactiveBadge,
          ]}
        >
          {item.active ? "ACTIVE" : "INACTIVE"}
        </Text>
      </View>

      <Text style={styles.meta}>Season: {item.season}</Text>
      <Text style={styles.meta}>Type: {item.type}</Text>

      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {item.startDate ? (
        <Text style={styles.meta}>
          Start: {new Date(item.startDate).toLocaleDateString()}
        </Text>
      ) : null}

      {item.endDate ? (
        <Text style={styles.meta}>
          End: {new Date(item.endDate).toLocaleDateString()}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  // Loading UI
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.centerText}>Loading leagues...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={leagues}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={leagues.length === 0 ? styles.center : styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        canManage ? (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate("CreateLeague")}
          >
            <Text style={styles.createBtnText}>+ Create League</Text>
          </TouchableOpacity>
        ) : null
      }
      ListEmptyComponent={
        <Text style={styles.centerText}>No leagues found.</Text>
      }
    />
  );
};

export default LeaguesScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#4B1D6B",
  },
  card: {
    backgroundColor: "#5A257A",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  meta: {
    color: "#ddd",
    marginBottom: 4,
  },
  description: {
    color: "#ddd",
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
    fontSize: 11,
    fontWeight: "700",
  },
  activeBadge: {
    backgroundColor: "#22c55e",
    color: "#fff",
  },
  inactiveBadge: {
    backgroundColor: "#6b7280",
    color: "#fff",
  },
  createBtn: {
    backgroundColor: "#F4B400",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  createBtnText: {
    textAlign: "center",
    color: "#000",
    fontWeight: "700",
  },
  center: {
    flex: 1,
    backgroundColor: "#4B1D6B",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centerText: {
    color: "#fff",
  },
});