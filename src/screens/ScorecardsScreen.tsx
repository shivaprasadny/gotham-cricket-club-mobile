import React, { useCallback, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getMatches } from "../services/matchService";

type Props = { navigation: any };

type Match = {
  id: number;
  homeTeamName?: string | null;
  awayTeamName?: string | null;
  externalOpponentName?: string | null;
  leagueName?: string | null;
  matchDate: string;
  venue?: string;
  locationLink?: string | null;
  status?: "UPCOMING" | "COMPLETED" | "CANCELLED";
};

const ScorecardsScreen = ({ navigation }: Props) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = async () => {
    try {
      const data = await getMatches();
      // Show completed matches only, newest first
      const completed: Match[] = Array.isArray(data)
        ? [...data]
            .filter((m) => m.status === "COMPLETED")
            .sort(
              (a, b) =>
                new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
            )
        : [];
      setMatches(completed);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to load matches");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadMatches();
    }, [])
  );

  const getMatchTitle = (item: Match) => {
    const home = item.homeTeamName || "Team";
    const away = item.awayTeamName || item.externalOpponentName || "Opponent";
    return `${home} vs ${away}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={matches.length === 0 ? styles.emptyContent : styles.content}
      data={matches}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadMatches();
          }}
        />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={52} color="#9b8ca1" />
          <Text style={styles.emptyTitle}>No scorecards yet</Text>
          <Text style={styles.emptyText}>
            Completed matches with published scorecards will appear here.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate("Scorecard", { matchId: item.id, match: item })
          }
        >
          <View style={styles.cardRow}>
            <View style={styles.cardMain}>
              <Text style={styles.title} numberOfLines={1}>
                {getMatchTitle(item)}
              </Text>
              <Text style={styles.meta}>
                {formatDate(item.matchDate)}
                {item.leagueName ? ` · ${item.leagueName}` : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9b8ca1" />
          </View>
        </TouchableOpacity>
      )}
    />
  );
};

export default ScorecardsScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f0f7" },
  content: { padding: 16, paddingBottom: 30 },
  emptyContent: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f5f0f7" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyTitle: { marginTop: 12, fontSize: 20, fontWeight: "800", color: "#2b0540" },
  emptyText: { color: "#75677c", textAlign: "center", marginTop: 6, paddingHorizontal: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardMain: { flex: 1 },
  title: { color: "#2b0540", fontSize: 15, fontWeight: "800" },
  meta: { color: "#7a6482", fontSize: 12, marginTop: 3 },
});
