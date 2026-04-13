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

  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

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
      Alert.alert("Error", error?.response?.data?.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
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
      Alert.alert("Error", error?.response?.data?.message || "Failed to update team");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await deleteTeam(teamId);

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Team deleted successfully"
      );

      navigation.navigate("MainTabs", { screen: "Teams" });
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to delete team");
    }
  };
  const filteredMembers = members.filter((m) =>
  (m.fullName || "")
    .toLowerCase()
    .includes(search.toLowerCase())
);

  if (loading) {
    return <Text style={styles.loading}>Loading...</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Team</Text>

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

      <Button title="Update Team" onPress={handleUpdate} />
      <View style={styles.spacer} />
      <Button title="Delete Team" onPress={handleDelete} color="#c0392b" />
    </ScrollView>
  );
};

export default EditTeamScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  loading: {
    textAlign: "center",
    marginTop: 40,
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
  spacer: {
    marginTop: 12,
  },
});