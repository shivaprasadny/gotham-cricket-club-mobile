import React, { useEffect, useState, useCallback } from "react";
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

  const isAdmin = user?.role === "ADMIN";

  const loadTeams = async () => {
    try {
      const data = await getTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to load teams");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

 useFocusEffect(
  useCallback(() => {
    loadTeams();
  }, [])
);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeams();
  };

  const handleDelete = async (teamId: number) => {
    try {
      const response = await deleteTeam(teamId);
      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Team deleted successfully"
      );
      await loadTeams();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to delete team");
    }
  };

  const renderItem = ({ item }: { item: Team }) => (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => navigation.navigate("TeamDetails", { teamId: item.id })}
      >
        <Text style={styles.title}>{item.teamName}</Text>
        <Text>{item.description || "No description"}</Text>
        <Text>League: {item.leagueName || "Not set"}</Text>
        <Text>Captain: {item.captainName || "Not assigned"}</Text>
      </TouchableOpacity>

      {isAdmin && (
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
        <Text>Loading teams...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={teams}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={teams.length === 0 ? styles.center : styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        isAdmin ? (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate("CreateTeam")}
          >
            <Text style={styles.createBtnText}>Create Team</Text>
          </TouchableOpacity>
        ) : null
      }
      ListEmptyComponent={<Text>No teams found</Text>}
    />
  );
};

export default TeamsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
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
    backgroundColor: "#111",
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
    backgroundColor: "#fff",
    padding: 20,
  },
});