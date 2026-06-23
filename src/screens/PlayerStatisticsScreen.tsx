import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  getPlayerStatistics,
  getPlayerCharts,
  getStatisticsFilterOptions,
} from "../services/statisticsService";
import {
  PlayerStatistics,
  PlayerCharts,
  StatisticsFilterOptions,
  StatisticsFilters,
} from "../types/scorecard";
import {
  StatGrid,
  StatisticsFilterBar,
} from "../components/statistics/StatisticsUI";
import { formatEnumLabel } from "../utils/formatEnumLabel";
import {
  DistributionBars,
  MatchBarChart,
} from "../components/statistics/SimpleCharts";

const PlayerStatisticsScreen = ({ route }: any) => {
  const { playerId, leagueId } = route.params;
  const [filters, setFilters] = useState<StatisticsFilters>(
    leagueId ? { leagueId } : {}
  );
  const [filterOptions, setFilterOptions] =
    useState<StatisticsFilterOptions | null>(null);
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [charts, setCharts] = useState<PlayerCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getStatisticsFilterOptions()
      .then(setFilterOptions)
      .catch(() => setFilterOptions(null));
  }, []);

  const load = useCallback(async () => {
    try {
      const [statistics, chartData] = await Promise.all([
        getPlayerStatistics(playerId, filters),
        getPlayerCharts(playerId, filters, 10),
      ]);
      setStats(statistics);
      setCharts(chartData);
    } catch (error: any) {
      Alert.alert(
        "Statistics",
        error?.response?.data?.message || "Player statistics are unavailable"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [playerId, filters]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  if (loading && !stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.center}>
        <Text>No published statistics yet.</Text>
      </View>
    );
  }

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
        <Text style={styles.heroTitle}>{stats.fullName}</Text>
        <Text style={styles.heroText}>{stats.matches} published matches</Text>
      </View>

      <StatisticsFilterBar
        options={filterOptions}
        value={filters}
        onChange={setFilters}
      />

      {loading ? (
        <ActivityIndicator color="#da9306" style={styles.filterLoading} />
      ) : null}

      {charts ? (
        <>
          <Text style={styles.title}>Performance Trends</Text>
          <MatchBarChart
            title="Runs by Match"
            points={charts.matchPerformance.map((item) => ({
              label: item.label,
              value: item.runs,
            }))}
          />
          <MatchBarChart
            title="Wickets & Catches"
            secondaryLabel="Catches"
            color="#15803d"
            points={charts.matchPerformance.map((item) => ({
              label: item.label,
              value: item.wickets,
              secondaryValue: item.catches,
            }))}
          />
          <DistributionBars
            title="How Dismissals Happened"
            items={charts.dismissalBreakdown.map((item) => ({
              label: formatEnumLabel(item.type),
              value: item.count,
            }))}
          />
        </>
      ) : null}

      <Text style={styles.title}>Batting</Text>
      <StatGrid
        items={[
          { label: "Runs", value: stats.totalRuns },
          { label: "Average", value: stats.battingAverage.toFixed(2) },
          { label: "Strike Rate", value: stats.battingStrikeRate.toFixed(2) },
          { label: "Highest", value: stats.highestScore },
          { label: "50s / 100s", value: `${stats.fifties} / ${stats.hundreds}` },
          { label: "4s / 6s", value: `${stats.fours} / ${stats.sixes}` },
        ]}
      />

      <Text style={styles.title}>Bowling</Text>
      <StatGrid
        items={[
          { label: "Wickets", value: stats.wickets },
          { label: "Economy", value: stats.economy.toFixed(2) },
          { label: "Average", value: stats.bowlingAverage.toFixed(2) },
          { label: "Strike Rate", value: stats.bowlingStrikeRate.toFixed(2) },
          {
            label: "Best",
            value: `${stats.bestBowlingWickets}/${stats.bestBowlingRuns}`,
          },
          { label: "Overs", value: stats.oversDisplay },
          { label: "Wides", value: stats.wides || 0 },
          { label: "No Balls", value: stats.noBalls || 0 },
          { label: "Dot Balls", value: stats.dotBalls || 0 },
        ]}
      />

      <Text style={styles.title}>Fielding</Text>
      <StatGrid
        items={[
          { label: "Catches", value: stats.catches },
          { label: "Dropped", value: stats.droppedCatches },
          { label: "Run Outs", value: stats.runOuts },
          { label: "Stumpings", value: stats.stumpings },
          { label: "Dismissals", value: stats.fieldingDismissals },
          {
            label: "Catch Efficiency",
            value: `${stats.catchEfficiency.toFixed(2)}%`,
          },
        ]}
      />

      <Text style={styles.title}>Dismissal Breakdown</Text>
      <StatGrid
        items={[
          { label: "Bowled", value: stats.bowledDismissals },
          { label: "Caught", value: stats.caughtDismissals },
          { label: "LBW", value: stats.lbwDismissals },
          { label: "Run Out", value: stats.runOutDismissals },
          { label: "Stumped", value: stats.stumpedDismissals },
          { label: "Hit Wicket", value: stats.hitWicketDismissals },
          { label: "Other", value: stats.otherDismissals },
        ]}
      />

      <Text style={styles.title}>Awards</Text>
      <StatGrid
        items={[
          { label: "Player of Match", value: stats.playerOfMatchAwards },
          { label: "Maidens", value: stats.maidens },
          { label: "Not Outs", value: stats.notOuts },
        ]}
      />

      <Text style={styles.title}>Recent Performances</Text>
      {stats.recentPerformances?.length ? (
        stats.recentPerformances.map((item) => (
          <View key={item.matchId} style={styles.recent}>
            <Text style={styles.recentTitle}>{item.matchSummary}</Text>
            <Text style={styles.recentText}>Batting: {item.batting || "-"}</Text>
            <Text style={styles.recentText}>Bowling: {item.bowling || "-"}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No performances for these filters.</Text>
      )}
    </ScrollView>
  );
};

export default PlayerStatisticsScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f0f7" },
  content: { padding: 16, paddingBottom: 30 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f0f7",
  },
  hero: { backgroundColor: "#2b0540", borderRadius: 20, padding: 20 },
  heroTitle: { color: "#fff", fontSize: 25, fontWeight: "900" },
  heroText: { color: "#f4b400", marginTop: 5 },
  filterLoading: { marginTop: 10 },
  title: {
    color: "#2b0540",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 9,
  },
  recent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 9,
  },
  recentTitle: { color: "#2b0540", fontWeight: "900" },
  recentText: { color: "#6f6274", marginTop: 4 },
  empty: { color: "#7a6c80" },
});
