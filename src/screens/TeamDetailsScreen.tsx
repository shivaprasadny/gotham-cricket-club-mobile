import React, { useEffect, useState } from "react";
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
import { getAllMembers } from "../services/adminService";
import {
  addMemberToTeam,
  getTeamById,
  getTeamMembers,
  removeMemberFromTeam,
} from "../services/teamService";

type Props = {
  route: any;
};

type Team = {
  id: number;
  teamName: string;
  description?: string;
  leagueName?: string;
  captainId?: number;
  captainName?: string;
};

type TeamMember = {
  teamMemberId: number;
  userId: number;
  fullName: string;
  email: string;
  nickname?: string;
  playerType?: string;
  jerseyNumber?: number;
  joinedAt?: string;
};

type ClubMember = {
  id?: number;
  userId?: number;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
};

const TeamDetailsScreen = ({ route }: Props) => {
  const { user } = useAuth();
  const { teamId } = route.params;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const loadData = async () => {
    try {
      const [teamData, teamMembers, allMembers] = await Promise.all([
        getTeamById(teamId),
        getTeamMembers(teamId),
        getAllMembers(),
      ]);

      setTeam(teamData || null);
      setMembers(Array.isArray(teamMembers) ? teamMembers : []);
      setClubMembers(Array.isArray(allMembers) ? allMembers : []);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to load team details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleAddMember = async (userId: number) => {
    try {
      const response = await addMemberToTeam(teamId, userId);
      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Member added successfully"
      );
      await loadData();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      const response = await removeMemberFromTeam(teamId, userId);
      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Member removed successfully"
      );
      await loadData();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to remove member");
    }
  };

  const teamUserIds = members.map((m) => m.userId);
  const availableClubMembers = clubMembers.filter((m) => {
    const id = m.userId ?? m.id ?? 0;
    return !teamUserIds.includes(id);
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading team details...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.teamMemberId.toString()}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View>
          <View style={styles.headerCard}>
            <Text style={styles.teamName}>{team?.teamName}</Text>
            <Text>{team?.description || "No description"}</Text>
            <Text>League: {team?.leagueName || "Not set"}</Text>
            <Text>Captain: {team?.captainName || "Not assigned"}</Text>
          </View>

          <Text style={styles.sectionTitle}>Team Members</Text>

          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>Add Members</Text>
              {availableClubMembers.length === 0 ? (
                <Text style={styles.emptyText}>No available club members to add.</Text>
              ) : (
                availableClubMembers.map((member) => {
                  const memberId = member.userId ?? member.id ?? 0;
                  return (
                    <TouchableOpacity
                      key={memberId}
                      style={styles.addMemberCard}
                      onPress={() => handleAddMember(memberId)}
                    >
                      <Text style={styles.memberName}>{member.fullName}</Text>
                      <Text>{member.email}</Text>
                      <Text style={styles.addText}>Tap to add</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.memberCard}>
          <Text style={styles.memberName}>{item.fullName}</Text>
          <Text>{item.email}</Text>
          {item.nickname ? <Text>Nickname: {item.nickname}</Text> : null}
          {item.playerType ? <Text>Player Type: {item.playerType}</Text> : null}
          {item.jerseyNumber !== undefined && item.jerseyNumber !== null ? (
            <Text>Jersey: {item.jerseyNumber}</Text>
          ) : null}

          {isAdmin && (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemoveMember(item.userId)}
            >
              <Text style={styles.removeBtnText}>Remove from Team</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No team members found.</Text>}
      contentContainerStyle={styles.container}
    />
  );
};

export default TeamDetailsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  headerCard: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  teamName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 10,
  },
  memberCard: {
    backgroundColor: "#f7f7f7",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  addMemberCard: {
    backgroundColor: "#eef4ff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  addText: {
    marginTop: 8,
    fontWeight: "600",
    color: "#111",
  },
  removeBtn: {
    marginTop: 10,
    backgroundColor: "#c0392b",
    paddingVertical: 10,
    borderRadius: 8,
  },
  removeBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  emptyText: {
    color: "#666",
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});