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
import { useAuth } from "../context/AuthContext";
import {
  deleteLeague,
  getLeagues,
  League,
} from "../services/leagueService";

type Props = {
  navigation: any;
};

const LeaguesScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  // League list data
  const [leagues, setLeagues] = useState<League[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Admin/Captain can manage leagues
  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  /**
   * Load leagues from backend
   */
  const loadLeagues = async () => {
    try {
      const data = await getLeagues();
      setLeagues(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load leagues"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Auto-refresh every time screen becomes active
   * This fixes stale data after create/edit/delete
   */
  useFocusEffect(
    useCallback(() => {
      void loadLeagues();
    }, [])
  );

  /**
   * Pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeagues();
  };

  /**
   * Delete league with confirmation
   */
  const handleDeleteLeague = (leagueId: number, leagueName: string) => {
    Alert.alert(
      "Delete League",
      `Are you sure you want to delete "${leagueName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await deleteLeague(leagueId);

              Alert.alert(
                "Success",
                typeof response === "string"
                  ? response
                  : "League deleted successfully"
              );

              await loadLeagues();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message || "Failed to delete league"
              );
            }
          },
        },
      ]
    );
  };

  /**
   * Render one league card
   */
  const renderItem = ({ item }: { item: League }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("LeagueDetails", { leagueId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>🏆 {item.name}</Text>
          <Text style={styles.cardSeason}>Season: {item.season}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            item.active ? styles.activeBadge : styles.inactiveBadge,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              item.active ? styles.activeBadgeText : styles.inactiveBadgeText,
            ]}
          >
            {item.active ? "ACTIVE" : "INACTIVE"}
          </Text>
        </View>
      </View>

      {item.type ? <Text style={styles.cardText}>Type: {item.type}</Text> : null}

      {item.description ? (
        <Text style={styles.cardText} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {(item.startDate || item.endDate) && (
        <Text style={styles.cardDate}>
          📅 {item.startDate ? item.startDate : "N/A"} →{" "}
          {item.endDate ? item.endDate : "N/A"}
        </Text>
      )}

      {canManage && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate("EditLeague", { leagueId: item.id })}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDeleteLeague(item.id, item.name)}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
        <Text style={styles.loadingText}>Loading leagues...</Text>
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
            <Ionicons name="add-circle-outline" size={18} color="#2b0540" />
            <Text style={styles.createBtnText}>Create League</Text>
          </TouchableOpacity>
        ) : null
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No leagues found.</Text>
      }
    />
  );
};

export default LeaguesScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#2b0540",
  },
  center: {
    flex: 1,
    backgroundColor: "#2b0540",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#fff",
  },
  emptyText: {
    color: "#fff",
    fontSize: 16,
  },
  createBtn: {
    backgroundColor: "#da9306",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  createBtnText: {
    color: "#2b0540",
    fontWeight: "700",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#3a0a57",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#4d1670",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardSeason: {
    color: "#da9306",
    fontSize: 14,
    fontWeight: "600",
  },
  cardText: {
    color: "#ddd",
    marginBottom: 6,
    lineHeight: 20,
  },
  cardDate: {
    color: "#ddd",
    marginTop: 4,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: "#dcfce7",
  },
  inactiveBadge: {
    backgroundColor: "#fee2e2",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  activeBadgeText: {
    color: "#166534",
  },
  inactiveBadgeText: {
    color: "#991b1b",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  editBtn: {
    backgroundColor: "#da9306",
  },
  deleteBtn: {
    backgroundColor: "#b91c1c",
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
  },
});