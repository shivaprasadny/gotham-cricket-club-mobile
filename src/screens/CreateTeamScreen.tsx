import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
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
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const data = await getAllMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to load members");
    }
  };

  const handleCreate = async () => {
    if (!teamName.trim()) {
      Alert.alert("Error", "Team name is required");
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
      Alert.alert("Error", error?.response?.data?.message || "Failed to create team");
    } finally {
      setSubmitting(false);
    }
  };
  const filteredMembers = members.filter((m) =>
  (m.fullName || "")
    .toLowerCase()
    .includes(search.toLowerCase())
);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Team</Text>

      <TextInput
        style={styles.input}
        placeholder="Team Name"
        value={teamName}
        onChangeText={setTeamName}
      />

      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

      <TextInput
        style={styles.input}
        placeholder="League Name"
        value={leagueName}
        onChangeText={setLeagueName}
      />

      <Text style={styles.label}>Select Captain</Text>

<TextInput
  style={styles.input}
  placeholder="Search player..."
  value={search}
  onChangeText={setSearch}
/>

<View style={styles.captainList}>
  {filteredMembers.length === 0 ? (
    <Text>No players found</Text>
  ) : (
    filteredMembers.map((member) => {
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
            {member.fullName}
          </Text>
        </TouchableOpacity>
      );
    })
  )}
</View>

      <Button
        title={submitting ? "Creating..." : "Create Team"}
        onPress={handleCreate}
        disabled={submitting}
      />
    </ScrollView>
  );
};

export default CreateTeamScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    fontWeight: "700",
    marginBottom: 10,
  },
  captainList: {
    marginBottom: 16,
  },
  captainCard: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  captainCardSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  captainText: {
    textAlign: "center",
  },
  captainTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
});