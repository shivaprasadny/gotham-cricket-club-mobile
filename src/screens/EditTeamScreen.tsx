import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllMembers } from "../services/adminService";
import { deleteTeam, getTeamById, updateTeam } from "../services/teamService";

type Props = {
  route: any;
  navigation: any;
};

type ClubMember = {
  id?: number;
  userId?: number;
  fullName?: string;
  email?: string;
  role?: string;
  status?: string;
};

const EditTeamScreen = ({ route, navigation }: Props) => {
  const { teamId } = route.params;

  // Team form data
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [captainId, setCaptainId] = useState<number | null>(null);

  // Members data
  const [members, setMembers] = useState<ClubMember[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCaptainCount, setVisibleCaptainCount] = useState(10);

  // Load team + members
  useEffect(() => {
    void loadData();
  }, []);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCaptainCount(10);
  }, [search]);

  // Load current team and member list
  const loadData = async () => {
    try {
      const [teamData, allMembers] = await Promise.all([
        getTeamById(teamId),
        getAllMembers(),
      ]);

      setTeamName(teamData.teamName || "");
      setDescription(teamData.description || "");
      setLeagueName(teamData.leagueName || "");
      setCaptainId(teamData.captainId || null);
      setMembers(Array.isArray(allMembers) ? allMembers : []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load team"
      );
    } finally {
      setLoading(false);
    }
  };

  // Search filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) =>
      (m.fullName || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [members, search]);

  // Limited captain list
  const visibleMembers = useMemo(() => {
    return filteredMembers.slice(0, visibleCaptainCount);
  }, [filteredMembers, visibleCaptainCount]);

  // Selected captain display
  const selectedCaptainName = useMemo(() => {
    return (
      members.find((m) => (m.userId ?? m.id) === captainId)?.fullName || ""
    );
  }, [members, captainId]);

  // Update team
  const handleUpdate = async () => {
    if (!teamName.trim()) {
      Alert.alert("Error", "Team name is required");
      return;
    }

    if (!captainId) {
      Alert.alert("Error", "Please select a captain");
      return;
    }

    try {
      setUpdating(true);

      const response = await updateTeam(teamId, {
        teamName: teamName.trim(),
        description: description.trim(),
        leagueName: leagueName.trim(),
        captainId,
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Team updated successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update team"
      );
    } finally {
      setUpdating(false);
    }
  };

  // Confirm delete
  const confirmDelete = () => {
    Alert.alert(
      "Delete Team",
      "Are you sure you want to delete this team?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void handleDelete(),
        },
      ]
    );
  };

  // Delete team
  const handleDelete = async () => {
    try {
      setDeleting(true);

      const response = await deleteTeam(teamId);

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Team deleted successfully"
      );

      navigation.navigate("MainTabs", { screen: "Teams" });
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to delete team"
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Screen title */}
        <Text style={styles.title}>Edit Team</Text>

        {/* Team name */}
        <TextInput
          style={styles.input}
          placeholder="Team Name"
          placeholderTextColor="#7a7a7a"
          value={teamName}
          onChangeText={setTeamName}
        />

        {/* Description */}
        <TextInput
          style={styles.input}
          placeholder="Description"
          placeholderTextColor="#7a7a7a"
          value={description}
          onChangeText={setDescription}
        />

        {/* League name */}
        <TextInput
          style={styles.input}
          placeholder="League Name"
          placeholderTextColor="#7a7a7a"
          value={leagueName}
          onChangeText={setLeagueName}
        />

        {/* Captain selection */}
        <Text style={styles.label}>Select Captain</Text>

        <TextInput
          style={styles.input}
          placeholder="Search player..."
          placeholderTextColor="#7a7a7a"
          value={search}
          onChangeText={setSearch}
        />

        {captainId && (
          <Text style={styles.selectedCaptainText}>
            Selected Captain: {selectedCaptainName || "Player"}
          </Text>
        )}

        <View style={styles.captainList}>
          {filteredMembers.length === 0 ? (
            <Text style={styles.emptyText}>No players found</Text>
          ) : (
            <>
              {visibleMembers.map((member) => {
                const memberId = member.userId ?? member.id ?? 0;
                const selected = captainId === memberId;

                return (
                  <TouchableOpacity
                    key={memberId}
                    style={[
                      styles.captainCard,
                      selected && styles.captainCardSelected,
                    ]}
                    onPress={() => setCaptainId(memberId)}
                  >
                    <Text
                      style={[
                        styles.captainText,
                        selected && styles.captainTextSelected,
                      ]}
                    >
                      {member.fullName || "Unknown Player"}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {filteredMembers.length > visibleCaptainCount && (
                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={() => setVisibleCaptainCount((prev) => prev + 10)}
                >
                  <Text style={styles.moreBtnText}>See More Players</Text>
                </TouchableOpacity>
              )}

              {visibleCaptainCount > 10 && (
                <TouchableOpacity
                  style={styles.lessBtn}
                  onPress={() => setVisibleCaptainCount(10)}
                >
                  <Text style={styles.lessBtnText}>Show Less</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Update button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (updating || !teamName.trim() || !captainId) &&
              styles.buttonDisabled,
          ]}
          onPress={handleUpdate}
          disabled={updating || !teamName.trim() || !captainId}
        >
          <Text style={styles.primaryButtonText}>
            {updating ? "Updating..." : "Update Team"}
          </Text>
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.buttonDisabled]}
          onPress={confirmDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteButtonText}>
            {deleting ? "Deleting..." : "Delete Team"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditTeamScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },
  container: {
    padding: 20,
    paddingBottom: 90,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f5fb",
  },
  loading: {
    textAlign: "center",
    color: "#2b0540",
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    color: "#2b0540",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
    color: "#111827",
  },
  label: {
    fontWeight: "700",
    marginBottom: 10,
    color: "#2b0540",
  },
  selectedCaptainText: {
    color: "#2b0540",
    fontWeight: "700",
    marginBottom: 10,
  },
  captainList: {
    marginBottom: 20,
  },
  captainCard: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  captainCardSelected: {
    backgroundColor: "#2b0540",
    borderColor: "#2b0540",
  },
  captainText: {
    textAlign: "center",
    color: "#111827",
    fontWeight: "600",
  },
  captainTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 12,
  },
  moreBtn: {
    backgroundColor: "#2b0540",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  moreBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  lessBtn: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  lessBtnText: {
    color: "#111827",
    textAlign: "center",
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#da9306",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#2b0540",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#c0392b",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});