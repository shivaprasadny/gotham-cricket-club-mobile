import React, { useCallback, useEffect, useState } from "react";
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
import {
  getClubLeaders,
  getLeagueLeaders,
  getStatisticsFilterOptions,
} from "../services/statisticsService";
import {
  LeaderboardCategory,
  PlayerLeaderboardEntry,
  StatisticsFilterOptions,
  StatisticsFilters,
} from "../types/scorecard";
import {
  LeaderboardList,
  StatisticsFilterBar,
} from "../components/statistics/StatisticsUI";

const categories: LeaderboardCategory[] = [
  "RUNS",
  "HIGHEST_SCORE",
  "BAT_AVG",
  "STRIKE_RATE",
  "WICKETS",
  "BEST_BOWLING",
  "ECONOMY",
  "SIXES",
  "POM",
  "CATCHES",
  "FIELDING_DISMISSALS",
  "STUMPINGS",
  "RUN_OUTS",
  "CATCH_EFFICIENCY",
];

const LeaderboardScreen = ({ route, navigation }: any) => {
  const { scope = "CLUB", leagueId } = route.params || {};
  const [category, setCategory] = useState<LeaderboardCategory>("RUNS");
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<StatisticsFilters>({});
  const [filterOptions, setFilterOptions] =
    useState<StatisticsFilterOptions | null>(null);
  const [entries, setEntries] = useState<PlayerLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getStatisticsFilterOptions()
      .then(setFilterOptions)
      .catch(() => setFilterOptions(null));
  }, []);

  const load = useCallback(async () => {
    try {
      const { leagueId: _ignored, ...leaderFilters } = filters;
      const data =
        scope === "LEAGUE"
          ? await getLeagueLeaders(
              leagueId,
              category,
              limit,
              leaderFilters
            )
          : await getClubLeaders(category, limit, leaderFilters);
      // Backend returns entries already sorted correctly (wickets DESC, economy ASC tiebreaker)
      setEntries(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert(
        "Leaderboard",
        error?.response?.data?.message || "Leaderboard is unavailable"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, filters, leagueId, limit, scope]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
        />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>
          {scope === "LEAGUE" ? "League" : "Club"} Leaders
        </Text>
        <Text style={styles.heroText}>Published scorecards only</Text>
      </View>

      <StatisticsFilterBar
        options={filterOptions}
        value={filters}
        onChange={setFilters}
        includeLeague={false}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
      >
        {categories.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.category,
              category === item && styles.categorySelected,
            ]}
            onPress={() => setCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                category === item && styles.categoryTextSelected,
              ]}
            >
              {item.replaceAll("_", " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.limitRow}>
        {[5, 10, 20].map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.limit, limit === value && styles.limitSelected]}
            onPress={() => setLimit(value)}
          >
            <Text
              style={[
                styles.limitText,
                limit === value && styles.limitTextSelected,
              ]}
            >
              Top {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#da9306"
          style={{ marginTop: 30 }}
        />
      ) : entries.length ? (
        <LeaderboardList
          entries={entries}
          secondaryLabel={category === "WICKETS" ? "Econ" : undefined}
          onPlayerPress={(playerId) =>
            navigation.navigate("PlayerStatistics", {
              playerId,
              leagueId: scope === "LEAGUE" ? leagueId : filters.leagueId,
            })
          }
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No qualified players yet</Text>
          <Text style={styles.emptyText}>
            Try different filters or publish more scorecards.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default LeaderboardScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f0f7" },
  content: { padding: 16, paddingBottom: 30 },
  hero: { backgroundColor: "#2b0540", borderRadius: 20, padding: 20 },
  heroTitle: { color: "#fff", fontSize: 25, fontWeight: "900" },
  heroText: { color: "#f4b400", marginTop: 5 },
  categories: { marginVertical: 14 },
  category: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 7,
  },
  categorySelected: { backgroundColor: "#2b0540" },
  categoryText: { color: "#5c4c63", fontSize: 11, fontWeight: "800" },
  categoryTextSelected: { color: "#fff" },
  limitRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  limit: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  limitSelected: { backgroundColor: "#f4b400" },
  limitText: { color: "#65566b", fontWeight: "700" },
  limitTextSelected: { color: "#2b0540", fontWeight: "900" },
  empty: { alignItems: "center", paddingVertical: 50 },
  emptyTitle: { color: "#2b0540", fontSize: 18, fontWeight: "900" },
  emptyText: {
    color: "#7a6c80",
    marginTop: 5,
    textAlign: "center",
  },
});
