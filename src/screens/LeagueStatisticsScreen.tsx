import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getLeagueStatistics } from "../services/statisticsService";
import { LeagueStatistics } from "../types/scorecard";
import { LeaderboardList, StatGrid } from "../components/statistics/StatisticsUI";

const LeagueStatisticsScreen = ({ route, navigation }: any) => {
  const { leagueId } = route.params;
  const [stats, setStats] = useState<LeagueStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    try { setStats(await getLeagueStatistics(leagueId)); }
    catch (error: any) { Alert.alert("Statistics", error?.response?.data?.message || "League statistics are unavailable"); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useFocusEffect(useCallback(() => { void load(); }, [leagueId]));
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#da9306" /></View>;
  if (!stats) return <View style={styles.center}><Text>No published league statistics.</Text></View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
      <View style={styles.hero}><Text style={styles.heroTitle}>{stats.leagueName}</Text><Text style={styles.heroText}>League Statistics</Text></View>
      <Text style={styles.title}>Overview</Text>
      <StatGrid items={[
        { label: "Matches", value: stats.matchesPlayed }, { label: "Completed", value: stats.completedMatches },
        { label: "Runs", value: stats.totalRuns }, { label: "Wickets", value: stats.totalWickets },
        { label: "Highest Team", value: stats.highestTeamScore }, { label: "Highest Player", value: stats.highestIndividualScore },
      ]} />
      {stats.bestBowlingFigures ? <View style={styles.best}><Text style={styles.bestLabel}>Best Bowling</Text><Text style={styles.bestValue}>{stats.bestBowlingFigures}</Text></View> : null}
      <Text style={styles.title}>Leading Run Scorers</Text>
      <LeaderboardList entries={stats.leadingRunScorers || []} onPlayerPress={(playerId) => navigation.navigate("PlayerStatistics", { playerId, leagueId })} />
      <Text style={styles.title}>Leading Wicket Takers</Text>
      <LeaderboardList entries={stats.leadingWicketTakers || []} onPlayerPress={(playerId) => navigation.navigate("PlayerStatistics", { playerId, leagueId })} />
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Leaderboard", { scope: "LEAGUE", leagueId })}><Text style={styles.buttonText}>View All Leaderboards</Text></TouchableOpacity>
      {stats.teamRecords?.length ? <><Text style={styles.title}>Team Records</Text>{stats.teamRecords.map((record, index) => <View key={index} style={styles.record}><Text style={styles.recordText}>{record}</Text></View>)}</> : null}
    </ScrollView>
  );
};
export default LeagueStatisticsScreen;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f0f7" }, content: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f0f7" },
  hero: { backgroundColor: "#2b0540", borderRadius: 20, padding: 20 }, heroTitle: { color: "#fff", fontSize: 25, fontWeight: "900" }, heroText: { color: "#f4b400", marginTop: 5 },
  title: { color: "#2b0540", fontSize: 18, fontWeight: "900", marginTop: 18, marginBottom: 9 },
  best: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginTop: 12 }, bestLabel: { color: "#7a6c80", fontSize: 11 }, bestValue: { color: "#2b0540", fontWeight: "900", fontSize: 18 },
  button: { backgroundColor: "#2b0540", borderRadius: 13, paddingVertical: 14, alignItems: "center", marginTop: 14 }, buttonText: { color: "#fff", fontWeight: "900" },
  record: { backgroundColor: "#fff", borderRadius: 12, padding: 13, marginBottom: 8 }, recordText: { color: "#4f4255" },
});
