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
import { useLayoutEffect } from "react";
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

useLayoutEffect(() => {
  navigation.setOptions({
    headerLeft: () => (
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginLeft: 12 }}
      >
        <Text style={{ fontSize: 16, color: "#2b0540", fontWeight: "700" }}>
          ← Back
        </Text>
      </TouchableOpacity>
    ),
    title: "Teams",
  });
}, [navigation]);

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
}

export default TeamsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#2b0540",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2b0540",
    padding: 20,
  },

  loadingText: {
    marginTop: 10,
    color: "#fff",
    fontWeight: "700",
  },

  emptyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  createBtn: {
    backgroundColor: "#da9306",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  createBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "800",
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

  teamLogo: {
    width: 64,
    height: 64,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    color: "#fff",
    textAlign: "center",
  },

  detailText: {
    color: "#ddd",
    marginBottom: 6,
    fontWeight: "500",
    lineHeight: 20,
  },

  viewOnlyText: {
    marginTop: 10,
    color: "#ddd",
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
    marginTop: 14,
  },

  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
  },

  editBtn: {
    backgroundColor: "#da9306",
  },

  deleteBtn: {
    backgroundColor: "#b91c1c",
  },

  actionText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});