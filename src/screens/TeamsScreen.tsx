import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { deleteTeam, getTeams } from "../services/teamService";
import { useFocusEffect } from "@react-navigation/native";

type Props = {
  navigation: any;
};

type Team = {
  id: number;
  teamName: string;
  description?: string;
  leagueName?: string;
  captainId?: number;
  captainName?: string;
};

const TeamsScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Role flags
  const isAdmin = user?.role === "ADMIN";
  const isCaptain = user?.role === "CAPTAIN";
  const isPlayer = user?.role === "PLAYER";

  // Admin only can manage team info
  const canManageTeamInfo = isAdmin;

  // Captain/Admin may manage team players in team details screen
  const canManagePlayers = isAdmin || isCaptain;

  // Load teams
  const loadTeams = async () => {
    try {
      const data = await getTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load teams"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      void loadTeams();
    }, [])
  );

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeams();
  };

  // Delete team
  const handleDelete = async (teamId: number) => {
    Alert.alert("Delete Team", "Are you sure you want to delete this team?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await deleteTeam(teamId);

            Alert.alert(
              "Success",
              typeof response === "string"
                ? response
                : "Team deleted successfully"
            );

            await loadTeams();
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.response?.data?.message || "Failed to delete team"
            );
          }
        },
      },
    ]);
  };

  // Render one team card
  const renderItem = ({ item }: { item: Team }) => (
    <View style={styles.card}>
      {/* Everyone can open team details */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("TeamDetails", {
            teamId: item.id,
          })
        }
      >
        <Image
          source={require("../../assets/logo.png")}
          style={styles.teamLogo}
        />

        <Text style={styles.title}>{item.teamName}</Text>

        <Text style={styles.detailText}>
          {item.description || "No description"}
        </Text>

        <Text style={styles.detailText}>
          League: {item.leagueName || "Not set"}
        </Text>

        <Text style={styles.detailText}>
          Captain: {item.captainName || "Not assigned"}
        </Text>

        {/* Helpful small note for players */}
        {!canManagePlayers ? (
          <Text style={styles.viewOnlyText}>
            View only — open to see team members
          </Text>
        ) : canManagePlayers && !canManageTeamInfo ? (
          <Text style={styles.managePlayersText}>
            You can manage players in team details
          </Text>
        ) : null}
      </TouchableOpacity>

      {/* Admin only can edit/delete team info */}
      {canManageTeamInfo && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate("EditTeam", { teamId: item.id })}
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading teams...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={teams}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={
        teams.length === 0 ? styles.center : styles.container
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      // Admin only create team
      ListHeaderComponent={
        canManageTeamInfo ? (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate("CreateTeam")}
          >
            <Text style={styles.createBtnText}>Create Team</Text>
          </TouchableOpacity>
        ) : null
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No teams found.</Text>
      }
    />
  );
};

export default TeamsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f5fb",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  teamLogo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#2b0540",
    textAlign: "center",
  },

  detailText: {
    color: "#374151",
    marginBottom: 4,
    fontWeight: "500",
  },

  viewOnlyText: {
    marginTop: 10,
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 12,
  },

  managePlayersText: {
    marginTop: 10,
    color: "#da9306",
    fontWeight: "700",
    fontSize: 12,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },

  editBtn: {
    backgroundColor: "#111",
  },

  deleteBtn: {
    backgroundColor: "#c0392b",
  },

  actionText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  createBtn: {
    backgroundColor: "#2b0540",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },

  createBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f5fb",
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    color: "#2b0540",
    fontWeight: "700",
  },

  emptyText: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "600",
  },
});