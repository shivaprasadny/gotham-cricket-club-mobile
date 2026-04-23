import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  addMemberToTeam,
  getAvailableMembers,
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
  nickname?: string | null;
  playerType?: string | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  jerseyNumber?: number | null;
  joinedAt?: string;
};

type ClubMember = {
  userId: number;
  fullName?: string;
  role?: string;
  status?: string;
  nickname?: string | null;
  playerType?: string | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
  jerseyNumber?: number | null;
};

type ViewMode = "ADDED" | "AVAILABLE" | "ALL";

const TeamDetailsScreen = ({ route }: Props) => {
  const { user } = useAuth();
  const { teamId } = route.params;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("ALL");
  const [searchText, setSearchText] = useState("");
  const isAdmin = user?.role === "ADMIN";
const isCaptain = user?.role === "CAPTAIN";
const isPlayer = user?.role === "PLAYER";

const canManagePlayers = isAdmin || isCaptain;
const canManageTeamInfo = isAdmin;

  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        getTeamById(teamId),
        getTeamMembers(teamId),
        getAvailableMembers(teamId),
      ]);

      const teamData =
        results[0].status === "fulfilled" ? results[0].value : null;

      const teamMembers =
        results[1].status === "fulfilled" ? results[1].value : [];

      const availableMembers =
        results[2].status === "fulfilled" ? results[2].value : [];

      setTeam(teamData || null);
      setMembers(Array.isArray(teamMembers) ? teamMembers : []);
      setClubMembers(Array.isArray(availableMembers) ? availableMembers : []);
    } catch (error: any) {
      console.log("TEAM DETAILS ERROR:", error?.response?.data || error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to load team details"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [teamId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleAddMember = async (userId: number) => {
    try {
      const response = await addMemberToTeam(teamId, userId);

    

      await loadData();
    } catch (error: any) {
      console.log("ADD TEAM MEMBER ERROR:", error?.response?.data || error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to add member"
      );
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      const response = await removeMemberFromTeam(teamId, userId);

     

      await loadData();
    } catch (error: any) {
      console.log("REMOVE TEAM MEMBER ERROR:", error?.response?.data || error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to remove member"
      );
    }
  };

  // Available members already come filtered from backend
  const availableClubMembers = useMemo(() => {
    return Array.isArray(clubMembers) ? clubMembers : [];
  }, [clubMembers]);

  // Filter added members
  const filteredMembers = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) return members;

    return members.filter((member) => {
      return (
        member.fullName?.toLowerCase().includes(search) ||
        member.nickname?.toLowerCase().includes(search) ||
        member.playerType?.toLowerCase().includes(search) ||
        member.battingStyle?.toLowerCase().includes(search) ||
        member.bowlingStyle?.toLowerCase().includes(search) ||
        String(member.jerseyNumber || "").includes(search)
      );
    });
  }, [members, searchText]);

  // Filter available members
  const filteredAvailableClubMembers = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) return availableClubMembers;

    return availableClubMembers.filter((member) => {
      return (
        member.fullName?.toLowerCase().includes(search) ||
        member.nickname?.toLowerCase().includes(search) ||
        member.playerType?.toLowerCase().includes(search) ||
        member.battingStyle?.toLowerCase().includes(search) ||
        member.bowlingStyle?.toLowerCase().includes(search) ||
        String(member.jerseyNumber || "").includes(search)
      );
    });
  }, [availableClubMembers, searchText]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
        <Text style={styles.loadingText}>Loading team details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.headerCard}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.teamLogo}
        />

        <Text style={styles.teamName}>{team?.teamName || "Team"}</Text>

        <Text style={styles.teamDescription}>
          {team?.description || "No description"}
        </Text>

        <Text style={styles.teamInfo}>
          League: {team?.leagueName || "Not assigned"}
        </Text>

        <Text style={styles.teamInfo}>
          Captain: {team?.captainName || "Not assigned"}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Search Players</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name, nickname, type, batting, bowling, jersey"
        placeholderTextColor="#6b7280"
        value={searchText}
        onChangeText={setSearchText}
      />

      <Text style={styles.sectionTitle}>View</Text>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            viewMode === "ADDED" && styles.filterBtnActive,
          ]}
          onPress={() => setViewMode("ADDED")}
        >
          <Text
            style={[
              styles.filterBtnText,
              viewMode === "ADDED" && styles.filterBtnTextActive,
            ]}
          >
            Added Members
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            viewMode === "AVAILABLE" && styles.filterBtnActive,
          ]}
          onPress={() => setViewMode("AVAILABLE")}
        >
          <Text
            style={[
              styles.filterBtnText,
              viewMode === "AVAILABLE" && styles.filterBtnTextActive,
            ]}
          >
            Available Members
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            viewMode === "ALL" && styles.filterBtnActive,
          ]}
          onPress={() => setViewMode("ALL")}
        >
          <Text
            style={[
              styles.filterBtnText,
              viewMode === "ALL" && styles.filterBtnTextActive,
            ]}
          >
            Show All
          </Text>
        </TouchableOpacity>
      </View>

      {(viewMode === "ADDED" || viewMode === "ALL") && (
        <>
          <Text style={styles.sectionTitle}>
            Added Members ({filteredMembers.length})
          </Text>

          {filteredMembers.length === 0 ? (
            <Text style={styles.emptyText}>No team members found.</Text>
          ) : (
            filteredMembers.map((item) => (
              <View key={item.teamMemberId} style={styles.memberCard}>
                <Text style={styles.memberNameDark}>{item.fullName}</Text>

                {item.nickname ? (
                  <Text style={styles.memberSubText}>
                    Nickname: {item.nickname}
                  </Text>
                ) : null}

                <Text style={styles.playerMeta}>
                  🏏 Batting: {item.battingStyle || "N/A"}
                </Text>
                <Text style={styles.playerMeta}>
                  🎯 Bowling: {item.bowlingStyle || "N/A"}
                </Text>
                <Text style={styles.playerMeta}>
                  🔥 Type: {item.playerType || "N/A"}
                </Text>

                {item.jerseyNumber !== undefined &&
                item.jerseyNumber !== null ? (
                  <Text style={styles.playerMeta}>
                    👕 Jersey: {item.jerseyNumber}
                  </Text>
                ) : null}

                {canManage && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveMember(item.userId)}
                  >
                    <Text style={styles.removeBtnText}>Remove from Team</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </>
      )}

      {canManage && (viewMode === "AVAILABLE" || viewMode === "ALL") && (
        <>
          <Text style={styles.sectionTitle}>
            Available Members ({filteredAvailableClubMembers.length})
          </Text>

          {filteredAvailableClubMembers.length === 0 ? (
            <Text style={styles.emptyText}>
              All players are already in the team
            </Text>
          ) : (
            filteredAvailableClubMembers.map((member) => {
              const memberId = member.userId;

              return (
                <TouchableOpacity
                  key={memberId}
                  style={styles.addMemberCard}
                  onPress={() => handleAddMember(memberId)}
                >
                  <Text style={styles.memberNameLight}>
                    {member.fullName || "Unknown Member"}
                  </Text>

                  {member.nickname ? (
                    <Text style={styles.playerMetaLight}>
                      Nickname: {member.nickname}
                    </Text>
                  ) : null}

                  <Text style={styles.playerMetaLight}>
                    🏏 Batting: {member.battingStyle || "N/A"}
                  </Text>
                  <Text style={styles.playerMetaLight}>
                    🎯 Bowling: {member.bowlingStyle || "N/A"}
                  </Text>
                  <Text style={styles.playerMetaLight}>
                    🔥 Type: {member.playerType || "N/A"}
                  </Text>

                  {member.jerseyNumber !== undefined &&
                  member.jerseyNumber !== null ? (
                    <Text style={styles.playerMetaLight}>
                      👕 Jersey: {member.jerseyNumber}
                    </Text>
                  ) : null}

                  <Text style={styles.addText}>Tap to add</Text>
                </TouchableOpacity>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
};

export default TeamDetailsScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#2b0540",
  },
  container: {
    padding: 16,
    paddingBottom: 28,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2b0540",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "600",
  },
  headerCard: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  teamLogo: {
    width: 72,
    height: 72,
    resizeMode: "contain",
    marginBottom: 10,
  },
  teamName: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    color: "#111827",
    textAlign: "center",
  },
  teamDescription: {
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 20,
    fontWeight: "500",
  },
  teamInfo: {
    color: "#2b0540",
    fontWeight: "700",
    marginTop: 4,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 10,
    color: "#ffffff",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  filterBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filterBtnActive: {
    backgroundColor: "#da9306",
    borderColor: "#da9306",
  },
  filterBtnText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 13,
  },
  filterBtnTextActive: {
    color: "#2b0540",
    fontWeight: "800",
  },
  memberCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  memberNameDark: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
    color: "#111827",
  },
  memberSubText: {
    color: "#111827",
    marginBottom: 4,
    fontWeight: "700",
  },
  playerMeta: {
    color: "#111827",
    fontSize: 14,
    marginTop: 5,
    fontWeight: "700",
  },
  addMemberCard: {
    backgroundColor: "#fff8e8",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#da9306",
  },
  memberNameLight: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
    color: "#111827",
  },
  playerMetaLight: {
    color: "#111827",
    fontSize: 14,
    marginTop: 5,
    fontWeight: "700",
  },
  addText: {
    marginTop: 10,
    fontWeight: "800",
    color: "#8a5b00",
    fontSize: 14,
  },
  removeBtn: {
    marginTop: 12,
    backgroundColor: "#b91c1c",
    paddingVertical: 11,
    borderRadius: 10,
  },
  removeBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
  emptyText: {
    color: "#ffffff",
    marginBottom: 12,
    fontWeight: "600",
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
});