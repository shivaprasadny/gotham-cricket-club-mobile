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
import { getMatches } from "../services/matchService";
import { useAuth } from "../context/AuthContext";

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
};

const MatchesScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatches = async () => {
    try {
      const data = await getMatches();
      setMatches(data || []);
    } catch (error: any) {
      console.log("MATCHES ERROR:", error?.response?.data || error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const renderItem = ({ item }: { item: Match }) => {
    const canEdit = user?.role === "ADMIN" || user?.role === "CAPTAIN";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("MatchDetails", {
            matchId: item.id,
            opponentName: item.opponentName,
            venue: item.venue,
            matchDate: item.matchDate,
            matchType: item.matchType,
          })
        }
        onLongPress={() => {
          if (canEdit) {
            navigation.navigate("EditMatch", { matchId: item.id });
          }
        }}
      >
        <Text style={styles.title}>{item.opponentName}</Text>
        <Text style={styles.detail}>Type: {item.matchType}</Text>
        <Text style={styles.detail}>Venue: {item.venue}</Text>
        <Text style={styles.detail}>Date: {formatDate(item.matchDate)}</Text>
        {!!item.notes && <Text style={styles.notes}>Notes: {item.notes}</Text>}

        <View style={styles.buttonBox}>
          <Text style={styles.buttonText}>Tap to view details</Text>
        </View>

        {canEdit && (
          <Text style={styles.editHint}>Long press to edit match</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={matches}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={matches.length === 0 ? styles.center : styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={<Text>No matches available.</Text>}
    />
  );
};

export default MatchesScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 10,
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
  notes: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 12,
    color: "#444",
  },
  buttonBox: {
    marginTop: 10,
    backgroundColor: "#111",
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  editHint: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#111",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
  },
});