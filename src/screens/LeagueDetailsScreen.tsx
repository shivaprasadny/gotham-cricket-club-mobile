import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { getLeagueById } from "../services/leagueService";

type Props = {
  route: any;
};

const LeagueDetailsScreen = ({ route }: Props) => {
  const { leagueId } = route.params;
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadLeague = async () => {
    try {
      const data = await getLeagueById(leagueId);
      setLeague(data);
    } catch (error) {
      console.log("LEAGUE DETAILS ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeague();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!league) {
    return (
      <View style={styles.center}>
        <Text>League not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{league.name}</Text>
      <Text style={styles.text}>Season: {league.season}</Text>
      <Text style={styles.text}>Type: {league.type}</Text>
      <Text style={styles.text}>
        Status: {league.active ? "ACTIVE" : "INACTIVE"}
      </Text>
      {league.description ? (
        <Text style={styles.text}>Description: {league.description}</Text>
      ) : null}
      {league.startDate ? (
        <Text style={styles.text}>
          Start: {new Date(league.startDate).toLocaleString()}
        </Text>
      ) : null}
      {league.endDate ? (
        <Text style={styles.text}>
          End: {new Date(league.endDate).toLocaleString()}
        </Text>
      ) : null}
    </View>
  );
};

export default LeagueDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    marginBottom: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});