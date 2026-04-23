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
import { createTeam } from "../services/teamService";

type Props = {
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

const CreateTeamScreen = ({ navigation }: Props) => {
  // Team form fields
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [captainId, setCaptainId] = useState<number | null>(null);

  // Members data
  const [members, setMembers] = useState<ClubMember[]>([]);

  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCaptainCount, setVisibleCaptainCount] = useState(10);

  // Load members on open
  useEffect(() => {
    void loadMembers();
  }, []);

  // Reset visible count when searching
  useEffect(() => {
    setVisibleCaptainCount(10);
  }, [search]);

  // Load all available members
  const loadMembers = async () => {
    try {
      const data = await getAllMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load members"
      );
    }
  };

  // Filter members by search
  const filteredMembers = useMemo(() => {
    return members.filter((m) =>
      (m.fullName || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [members, search]);

  // Only show a limited number initially
  const visibleMembers = useMemo(() => {
    return filteredMembers.slice(0, visibleCaptainCount);
  }, [filteredMembers, visibleCaptainCount]);

  // Find currently selected captain name
  const selectedCaptainName = useMemo(() => {
    return (
      members.find((m) => (m.userId ?? m.id) === captainId)?.fullName || ""
    );
  }, [members, captainId]);

  // Create team
  const handleCreate = async () => {
    if (!teamName.trim()) {
      Alert.alert("Error", "Team name is required");
      return;
    }

    if (!captainId) {
      Alert.alert("Error", "Please select a captain");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createTeam({
        teamName: teamName.trim(),
        description: description.trim(),
        leagueName: leagueName.trim(),
        captainId,
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Team created successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create team"
      );
    } finally {
      setSubmitting(false);
    }
  };

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
        <Text style={styles.title}>Create Team</Text>

        {/* Team name */}
        <TextInput
          style={styles.input}
          placeholder="Team Name"
          placeholderTextColor="#7a7a7a"
          value={teamName}
          onChangeText={setTeamName}
        />

        {/* Team description */}
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

        {/* Captain section heading */}
        <Text style={styles.label}>Select Captain</Text>

        {/* Search input */}
        <TextInput
          style={styles.input}
          placeholder="Search player..."
          placeholderTextColor="#7a7a7a"
          value={search}
          onChangeText={setSearch}
        />

        {/* Selected captain label */}
        {captainId && (
          <Text style={styles.selectedCaptainText}>
            Selected Captain: {selectedCaptainName || "Player"}
          </Text>
        )}

        {/* Captain list */}
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

              {/* See more button */}
              {filteredMembers.length > visibleCaptainCount && (
                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={() => setVisibleCaptainCount((prev) => prev + 10)}
                >
                  <Text style={styles.moreBtnText}>See More Players</Text>
                </TouchableOpacity>
              )}

              {/* Show less button */}
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

        {/* Create button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (submitting || !teamName.trim() || !captainId) &&
              styles.buttonDisabled,
          ]}
          onPress={handleCreate}
          disabled={submitting || !teamName.trim() || !captainId}
        >
          <Text style={styles.primaryButtonText}>
            {submitting ? "Creating..." : "Create Team"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateTeamScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },
  container: {
    padding: 20,
    paddingBottom: 80,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
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
    marginBottom: 20,
  },
  primaryButtonText: {
    color: "#2b0540",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});