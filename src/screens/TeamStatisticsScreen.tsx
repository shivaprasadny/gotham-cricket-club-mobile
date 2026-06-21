import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getTeamStatistics } from "../services/statisticsService";
import { TeamStatistics } from "../types/scorecard";
import { StatGrid } from "../components/statistics/StatisticsUI";

const TeamStatisticsScreen = ({ route, navigation }: any) => {
  const { teamId, leagueId } = route.params;
  const [stats, setStats] = useState<TeamStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    try { setStats(await getTeamStatistics(teamId, leagueId)); }
    catch (error: any) { Alert.alert("Statistics", error?.response?.data?.message || "Team statistics are unavailable"); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useFocusEffect(useCallback(() => { void load(); }, [teamId, leagueId]));
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#da9306" /></View>;
  if (!stats) return <View style={styles.center}><Text>No published team statistics.</Text></View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
      <View style={styles.hero}><Text style={styles.heroTitle}>{stats.teamName}</Text><Text style={styles.heroText}>{stats.winPercentage.toFixed(1)}% win rate</Text></View>
      <Text style={styles.title}>Record</Text>
      <StatGrid items={[
        { label: "Played", value: stats.matchesPlayed }, { label: "Won", value: stats.wins },
        { label: "Lost", value: stats.losses }, { label: "Tied", value: stats.ties },
        { label: "No Result", value: stats.noResults }, { label: "Win %", value: stats.winPercentage.toFixed(1) },
      ]} />
      <Text style={styles.title}>Team Totals</Text>
      <StatGrid items={[
        { label: "Runs Scored", value: stats.totalRunsScored }, { label: "Runs Conceded", value: stats.totalRunsConceded },
        { label: "Wickets Taken", value: stats.totalWicketsTaken }, { label: "Wickets Lost", value: stats.totalWicketsLost },
        { label: "Highest", value: stats.highestTeamScore }, { label: "Lowest", value: stats.lowestTeamScore },
      ]} />
      <Text style={styles.title}>Leaders</Text>
      {stats.leadingRunScorer ? <TouchableOpacity style={styles.leader} onPress={() => stats.leadingRunScorerId && navigation.navigate("PlayerStatistics", { playerId: stats.leadingRunScorerId })}><Text style={styles.leaderLabel}>Leading Run Scorer</Text><Text style={styles.leaderName}>{stats.leadingRunScorer}</Text></TouchableOpacity> : null}
      {stats.leadingWicketTaker ? <TouchableOpacity style={styles.leader} onPress={() => stats.leadingWicketTakerId && navigation.navigate("PlayerStatistics", { playerId: stats.leadingWicketTakerId })}><Text style={styles.leaderLabel}>Leading Wicket Taker</Text><Text style={styles.leaderName}>{stats.leadingWicketTaker}</Text></TouchableOpacity> : null}
      <Text style={styles.title}>Recent Results</Text>
      {stats.recentResults?.map((result, index) => <View key={index} style={styles.result}><Text style={styles.resultText}>{result}</Text></View>)}
    </ScrollView>
  );
};
export default TeamStatisticsScreen;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f0f7" }, content: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f0f7" },
  hero: { backgroundColor: "#2b0540", borderRadius: 20, padding: 20 }, heroTitle: { color: "#fff", fontSize: 25, fontWeight: "900" }, heroText: { color: "#f4b400", marginTop: 5 },
  title: { color: "#2b0540", fontSize: 18, fontWeight: "900", marginTop: 18, marginBottom: 9 },
  leader: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 9 },
  leaderLabel: { color: "#7a6c80", fontSize: 11 }, leaderName: { color: "#6d28d9", fontSize: 16, fontWeight: "900", marginTop: 4 },
  result: { backgroundColor: "#fff", borderRadius: 12, padding: 13, marginBottom: 8 }, resultText: { color: "#4f4255", fontWeight: "600" },
});
