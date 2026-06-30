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
  // Batting
  "RUNS",
  "HIGHEST_SCORE",
  "BAT_AVG",
  "STRIKE_RATE",
  "MOST_FOURS",
  "SIXES",
  "MOST_FIFTIES",
  "MOST_HUNDREDS",
  "MOST_DUCKS",
  "MOST_MATCHES",
  // Bowling
  "WICKETS",
  "BEST_BOWLING",
  "ECONOMY",
  "MOST_FIFERS",
  // Fielding
  "CATCHES",
  "FIELDING_DISMISSALS",
  "STUMPINGS",
  "RUN_OUTS",
  "CATCH_EFFICIENCY",
  // All-round
  "POM",
  "BEST_ALL_ROUNDER",
];

// Human-readable labels for each category
const categoryLabel: Record<LeaderboardCategory, string> = {
  RUNS: "Runs",
  HIGHEST_SCORE: "Highest Score",
  BAT_AVG: "Bat Average",
  STRIKE_RATE: "Strike Rate",
  MOST_FOURS: "Most 4s",
  SIXES: "Sixes",
  MOST_FIFTIES: "Most 50s",
  MOST_HUNDREDS: "Most 100s",
  MOST_DUCKS: "Most Ducks",
  MOST_MATCHES: "Most Matches",
  WICKETS: "Wickets",
  BEST_BOWLING: "Best Bowling",
  ECONOMY: "Economy",
  MOST_FIFERS: "5-fors",
  CATCHES: "Catches",
  FIELDING_DISMISSALS: "Fielding",
  STUMPINGS: "Stumpings",
  RUN_OUTS: "Run Outs",
  CATCH_EFFICIENCY: "Catch %",
  POM: "Player of Match",
  BEST_ALL_ROUNDER: "All-Rounder",
};

// Secondary stat label shown below the main value (e.g. economy below wickets)
const secondaryLabel: Partial<Record<LeaderboardCategory, string>> = {
  WICKETS: "Econ",
  BEST_BOWLING: "Runs",
  MOST_FIFERS: "Wkts",
  MOST_MATCHES: "Runs",
  CATCH_EFFICIENCY: "Chances",
};

const THIS_YEAR = new Date().getFullYear();

const LeaderboardScreen = ({ route, navigation }: any) => {
  const { scope = "CLUB", leagueId } = route.params || {};
  const [category, setCategory] = useState<LeaderboardCategory>("RUNS");
  const [limit, setLimit] = useState(10);
  // "career" = all time (no year filter), "year" = current calendar year only
  const [timeScope, setTimeScope] = useState<"career" | "year">("career");
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
      // Merge the Career/This Year toggle into the year filter
      const effectiveFilters: StatisticsFilters = {
        ...leaderFilters,
        year: timeScope === "year" ? THIS_YEAR : leaderFilters.year,
      };
      const data =
        scope === "LEAGUE"
          ? await getLeagueLeaders(leagueId, category, limit, effectiveFilters)
          : await getClubLeaders(category, limit, effectiveFilters);
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
  }, [category, filters, leagueId, limit, scope, timeScope]);

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

        {/* Career / This Year toggle */}
        <View style={styles.timeScopeRow}>
          {(["career", "year"] as const).map((ts) => (
            <TouchableOpacity
              key={ts}
              style={[styles.timeScopeBtn, timeScope === ts && styles.timeScopeBtnActive]}
              onPress={() => setTimeScope(ts)}
            >
              <Text style={[styles.timeScopeText, timeScope === ts && styles.timeScopeTextActive]}>
                {ts === "career" ? "Career" : `This Year (${THIS_YEAR})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
              {categoryLabel[item]}
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
          secondaryLabel={secondaryLabel[category]}
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
  timeScopeRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  timeScopeBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  timeScopeBtnActive: { backgroundColor: "#da9306" },
  timeScopeText: { color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 13 },
  timeScopeTextActive: { color: "#2b0540", fontWeight: "900" },
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
