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
import { Ionicons } from "@expo/vector-icons";
import {
  getMyPlayerDashboard,
  getStatisticsFilterOptions,
} from "../services/statisticsService";
import {
  PlayerDashboard,
  StatisticsFilterOptions,
  StatisticsFilters,
} from "../types/scorecard";
import {
  StatGrid,
  StatisticsFilterBar,
} from "../components/statistics/StatisticsUI";
import { MatchBarChart } from "../components/statistics/SimpleCharts";

const MyDashboardScreen = ({ navigation }: any) => {
  const [dashboard, setDashboard] = useState<PlayerDashboard | null>(null);
  const [filters, setFilters] = useState<StatisticsFilters>({});
  const [options, setOptions] = useState<StatisticsFilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getStatisticsFilterOptions().then(setOptions).catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    try {
      setDashboard(await getMyPlayerDashboard(filters, 5));
    } catch (error: any) {
      Alert.alert(
        "My Dashboard",
        error?.response?.data?.message || "Dashboard is unavailable"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  if (loading && !dashboard) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
      </View>
    );
  }

  if (!dashboard) {
    return (
      <View style={styles.center}>
        <Text>Dashboard data is unavailable.</Text>
      </View>
    );
  }

  const summary = dashboard.summary;
  const nextMatch = dashboard.nextMatch;
  const fees = dashboard.pendingFees;

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
        <Text style={styles.eyebrow}>MY PERFORMANCE</Text>
        <Text style={styles.heroTitle}>{dashboard.fullName}</Text>
        <Text style={styles.heroText}>
          {summary.matches} published matches
        </Text>
      </View>

      <StatisticsFilterBar
        options={options}
        value={filters}
        onChange={setFilters}
      />

      {nextMatch ? (
        <TouchableOpacity
          style={styles.nextMatch}
          onPress={() =>
            navigation.navigate("MatchDetails", { matchId: nextMatch.matchId })
          }
        >
          <View style={styles.cardIcon}>
            <Ionicons name="calendar-outline" size={22} color="#6d28d9" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardLabel}>NEXT MATCH</Text>
            <Text style={styles.cardTitle}>vs {nextMatch.opponentName}</Text>
            <Text style={styles.cardText}>
              {new Date(nextMatch.matchDate).toLocaleString()} •{" "}
              {nextMatch.venue}
            </Text>
            <Text style={styles.badgeText}>
              {nextMatch.availability || "Availability not set"} •{" "}
              {nextMatch.squadStatus.replaceAll("_", " ")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#93849a" />
        </TouchableOpacity>
      ) : null}

      {fees && fees.count > 0 ? (
        <TouchableOpacity
          style={[styles.nextMatch, fees.overdueCount > 0 && styles.overdueCard]}
          onPress={() => navigation.navigate("MyFees")}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="card-outline" size={22} color="#b45309" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.cardLabel}>PENDING FEES</Text>
            <Text style={styles.cardTitle}>
              ${fees.totalAmount.toFixed(2)} outstanding
            </Text>
            <Text style={styles.cardText}>
              {fees.count} payment{fees.count === 1 ? "" : "s"}
              {fees.overdueCount ? ` • ${fees.overdueCount} overdue` : ""}
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.sectionTitle}>This Period</Text>
      <StatGrid
        items={[
          { label: "Runs", value: summary.totalRuns },
          { label: "Bat Average", value: summary.battingAverage.toFixed(2) },
          { label: "Wickets", value: summary.wickets },
          { label: "Economy", value: summary.economy.toFixed(2) },
          { label: "Catches", value: summary.catches },
          { label: "POM Awards", value: summary.playerOfMatchAwards },
        ]}
      />

      <MatchBarChart
        title="Recent Form — Runs & Wickets"
        secondaryLabel="Wickets"
        points={dashboard.recentForm
          .slice()
          .reverse()
          .map((item) => ({
            label: new Date(item.matchDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            }),
            value: item.runs,
            secondaryValue: item.wickets,
          }))}
      />

      <Text style={styles.sectionTitle}>Recent Matches</Text>
      {dashboard.recentForm.length ? (
        dashboard.recentForm.map((item) => (
          <TouchableOpacity
            key={item.matchId}
            style={styles.performance}
            onPress={() =>
              navigation.navigate("Scorecard", { matchId: item.matchId })
            }
          >
            <View style={styles.flex}>
              <Text style={styles.performanceTitle}>{item.matchSummary}</Text>
              <Text style={styles.cardText}>
                {item.runs}
                {item.notOut ? "*" : ""} runs • {item.wickets} wickets •{" "}
                {item.catches} catches
              </Text>
            </View>
            <Text
              style={[
                styles.result,
                item.result === "WIN" && styles.winResult,
              ]}
            >
              {item.result}
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.empty}>No published performances yet.</Text>
      )}

      <TouchableOpacity
        style={styles.fullStatsButton}
        onPress={() =>
          navigation.navigate("PlayerStatistics", {
            playerId: dashboard.playerId,
          })
        }
      >
        <Text style={styles.fullStatsText}>View Complete Statistics</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MyDashboardScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f0f7" },
  content: { padding: 16, paddingBottom: 34 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f0f7",
  },
  hero: { backgroundColor: "#2b0540", borderRadius: 22, padding: 20 },
  eyebrow: { color: "#f4b400", fontSize: 10, fontWeight: "900" },
  heroTitle: { color: "#fff", fontSize: 25, fontWeight: "900", marginTop: 4 },
  heroText: { color: "#d9cce0", marginTop: 5 },
  nextMatch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  overdueCard: { backgroundColor: "#fff7ed" },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#f2eafe",
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1 },
  cardLabel: { color: "#8a7b90", fontSize: 9, fontWeight: "900" },
  cardTitle: { color: "#2b0540", fontSize: 16, fontWeight: "900", marginTop: 2 },
  cardText: { color: "#746678", fontSize: 11, marginTop: 4 },
  badgeText: { color: "#6d28d9", fontSize: 10, fontWeight: "800", marginTop: 5 },
  sectionTitle: {
    color: "#2b0540",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 9,
  },
  performance: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 13,
    marginBottom: 8,
  },
  performanceTitle: { color: "#2b0540", fontWeight: "900" },
  result: { color: "#b45309", fontSize: 11, fontWeight: "900" },
  winResult: { color: "#15803d" },
  empty: { color: "#827487" },
  fullStatsButton: {
    backgroundColor: "#2b0540",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  fullStatsText: { color: "#fff", fontWeight: "900" },
});
