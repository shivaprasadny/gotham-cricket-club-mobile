import React, { useCallback, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import { deleteLeague, getLeagueById, League } from "../services/leagueService";

type Props = {
  route: any;
  navigation: any;
};

const LeagueDetailsScreen = ({ route, navigation }: Props) => {
  const { leagueId } = route.params;
  const { user } = useAuth();

  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  /**
   * Load one league by id
   */
  const loadLeague = async () => {
    try {
      const data = await getLeagueById(leagueId);
      setLeague(data || null);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load league details"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Refresh on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      void loadLeague();
    }, [leagueId])
  );

  /**
   * Pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeague();
  };

  /**
   * Delete league
   */
  const handleDeleteLeague = () => {
    if (!league) return;

    Alert.alert(
      "Delete League",
      `Are you sure you want to delete "${league.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await deleteLeague(league.id);

              Alert.alert(
                "Success",
                typeof response === "string"
                  ? response
                  : "League deleted successfully"
              );

              navigation.goBack();
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
        <Text style={styles.loadingText}>Loading league details...</Text>
      </View>
    );
  }

  if (!league) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>League not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Hero card */}
      <View style={styles.heroCard}>
        <Text style={styles.emoji}>🏆</Text>
        <Text style={styles.title}>{league.name}</Text>
        <Text style={styles.subTitle}>Season: {league.season}</Text>

        <View
          style={[
            styles.statusBadge,
            league.active ? styles.activeBadge : styles.inactiveBadge,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              league.active ? styles.activeBadgeText : styles.inactiveBadgeText,
            ]}
          >
            {league.active ? "ACTIVE" : "INACTIVE"}
          </Text>
        </View>
      </View>

      {/* League info */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>League Info</Text>

        <Text style={styles.label}>📘 Name</Text>
        <Text style={styles.value}>{league.name}</Text>

        <Text style={styles.label}>🗓 Season</Text>
        <Text style={styles.value}>{league.season}</Text>

        <Text style={styles.label}>🎯 Type</Text>
        <Text style={styles.value}>{league.type || "Not set"}</Text>

        <Text style={styles.label}>📅 Start Date</Text>
        <Text style={styles.value}>{league.startDate || "Not set"}</Text>

        <Text style={styles.label}>🏁 End Date</Text>
        <Text style={styles.value}>{league.endDate || "Not set"}</Text>

        <Text style={styles.label}>📝 Description</Text>
        <Text style={styles.value}>
          {league.description || "No description added"}
        </Text>
      </View>

      {/* Actions */}
      {canManage && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate("EditLeague", { leagueId: league.id })}
          >
            <Ionicons name="create-outline" size={18} color="#2b0540" />
            <Text style={styles.editBtnText}>Edit League</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDeleteLeague}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.deleteBtnText}>Delete League</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default LeagueDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2b0540",
  },
  content: {
    padding: 16,
    paddingBottom: 30,
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
  heroCard: {
    backgroundColor: "#3a0a57",
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#4d1670",
  },
  emoji: {
    fontSize: 38,
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  subTitle: {
    color: "#da9306",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: "#dcfce7",
  },
  inactiveBadge: {
    backgroundColor: "#fee2e2",
  },
  statusBadgeText: {
    fontWeight: "700",
    fontSize: 12,
  },
  activeBadgeText: {
    color: "#166534",
  },
  inactiveBadgeText: {
    color: "#991b1b",
  },
  infoCard: {
    backgroundColor: "#3a0a57",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#4d1670",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  label: {
    color: "#da9306",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },
  value: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
  },
  actionRow: {
    marginTop: 16,
    gap: 12,
  },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#da9306",
  },
  deleteBtn: {
    backgroundColor: "#b91c1c",
  },
  editBtnText: {
    color: "#2b0540",
    fontWeight: "700",
    fontSize: 15,
  },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});