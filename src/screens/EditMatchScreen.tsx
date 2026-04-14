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
import { deleteMatch, getMatchById, updateMatch } from "../services/matchService";
import { getTeams } from "../services/teamService";

type Props = {
  route: any;
  navigation: any;
};

type MatchStatus = "UPCOMING" | "COMPLETED" | "CANCELLED";

type Team = {
  id: number;
  teamName: string;
};

const STATUS_OPTIONS: MatchStatus[] = ["UPCOMING", "COMPLETED", "CANCELLED"];

const EditMatchScreen = ({ route, navigation }: Props) => {
  const { matchId } = route.params;

  const [opponentName, setOpponentName] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  const [matchType, setMatchType] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<MatchStatus>("UPCOMING");

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      const [matchData, teamData] = await Promise.all([
        getMatchById(matchId),
        getTeams(),
      ]);

      setTeams(Array.isArray(teamData) ? teamData : []);
      setOpponentName(matchData?.opponentName || "");
      setMatchDate(matchData?.matchDate || "");
      setVenue(matchData?.venue || "");
      setMatchType(matchData?.matchType || "");
      setNotes(matchData?.notes || "");
      setStatus((matchData?.status as MatchStatus) || "UPCOMING");
      setSelectedTeamId(matchData?.teamId || null);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to load match");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!opponentName.trim() || !matchDate.trim() || !venue.trim() || !matchType.trim()) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (!selectedTeamId) {
      Alert.alert("Error", "Please select a team");
      return;
    }

    try {
      setSaving(true);

      const response = await updateMatch(matchId, {
        opponentName: opponentName.trim(),
        matchDate: matchDate.trim(),
        venue: venue.trim(),
        matchType: matchType.trim(),
        notes: notes.trim(),
        status,
        teamId: selectedTeamId,
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Match updated successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to update match");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      const response = await deleteMatch(matchId);

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Match deleted successfully"
      );

      navigation.navigate("MainTabs", { screen: "Matches" });
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to delete match");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Match</Text>

      <TextInput
        style={styles.input}
        value={opponentName}
        onChangeText={setOpponentName}
        placeholder="Opponent Name"
      />

      <TextInput
        style={styles.input}
        value={matchDate}
        onChangeText={setMatchDate}
        placeholder="Match Date"
      />

      <TextInput
        style={styles.input}
        value={venue}
        onChangeText={setVenue}
        placeholder="Venue"
      />

      <TextInput
        style={styles.input}
        value={matchType}
        onChangeText={setMatchType}
        placeholder="Match Type"
      />

      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes"
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Assign Team</Text>
      {teams.length === 0 ? (
        <Text style={styles.helperText}>No teams found. Create a team first.</Text>
      ) : (
        <View style={styles.teamList}>
          {teams.map((team) => {
            const selected = selectedTeamId === team.id;
            return (
              <TouchableOpacity
                key={team.id}
                style={[styles.teamBtn, selected && styles.teamBtnSelected]}
                onPress={() => setSelectedTeamId(team.id)}
              >
                <Text style={[styles.teamBtnText, selected && styles.teamBtnTextSelected]}>
                  {team.teamName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.label}>Status</Text>
      <View style={styles.row}>
        {STATUS_OPTIONS.map((item, index) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.statusBtn,
              status === item && styles.statusBtnSelected,
              index === STATUS_OPTIONS.length - 1 && styles.lastStatusBtn,
            ]}
            onPress={() => setStatus(item)}
          >
            <Text style={[styles.statusText, status === item && styles.statusTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title={saving ? "Updating..." : "Update Match"}
        onPress={handleUpdate}
        disabled={saving || deleting}
      />

      <View style={styles.spacer} />

      <Button
        title={deleting ? "Deleting..." : "Delete Match"}
        onPress={handleDelete}
        color="#c0392b"
        disabled={saving || deleting}
      />
    </ScrollView>
  );
};

export default EditMatchScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  label: {
    fontWeight: "600",
    marginBottom: 8,
  },
  helperText: {
    color: "#666",
    marginBottom: 12,
  },
  teamList: {
    marginBottom: 16,
  },
  teamBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  teamBtnSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  teamBtnText: {
    textAlign: "center",
    fontWeight: "700",
  },
  teamBtnTextSelected: {
    color: "#fff",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  lastStatusBtn: {
    marginRight: 0,
  },
  statusBtnSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  statusText: {
    textAlign: "center",
  },
  statusTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  spacer: {
    marginTop: 12,
  },
});