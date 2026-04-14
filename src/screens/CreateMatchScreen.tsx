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
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createMatch } from "../services/matchService";
import { getTeams } from "../services/teamService";
import { addNotification } from "../services/notificationService";

type Props = {
  navigation: any;
};

type MatchStatus = "UPCOMING" | "COMPLETED" | "CANCELLED";

type Team = {
  id: number;
  teamName: string;
  description?: string;
  leagueName?: string;
  captainId?: number;
  captainName?: string;
};

const STATUS_OPTIONS: MatchStatus[] = ["UPCOMING", "COMPLETED", "CANCELLED"];

const CreateMatchScreen = ({ navigation }: Props) => {
  const [opponentName, setOpponentName] = useState("");
  const [venue, setVenue] = useState("");
  const [matchType, setMatchType] = useState("");
  const [notes, setNotes] = useState("");
  const [matchDate, setMatchDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState<MatchStatus>("UPCOMING");
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const data = await getTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load teams");
    }
  };

  const handleCreateMatch = async () => {
    if (!opponentName.trim() || !matchDate || !venue.trim() || !matchType.trim()) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (!selectedTeamId) {
      Alert.alert("Error", "Please select a team");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createMatch({
        opponentName: opponentName.trim(),
        matchDate: matchDate.toISOString(),
        venue: venue.trim(),
        matchType: matchType.trim(),
        notes: notes.trim(),
        status,
        teamId: selectedTeamId,
      });

      await addNotification({
        title: "Match Created",
        message: `${opponentName.trim()} match created successfully.`,
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Match created successfully"
      );

      navigation.navigate("MainTabs", { screen: "Matches" });
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create match"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Match</Text>

      <TextInput
        style={styles.input}
        placeholder="Opponent Name"
        value={opponentName}
        onChangeText={setOpponentName}
      />

      <Text style={styles.label}>Match Date</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>
          {matchDate ? matchDate.toLocaleString() : "Select Date & Time"}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={matchDate || new Date()}
          mode="datetime"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setMatchDate(selectedDate);
            }
          }}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Venue"
        value={venue}
        onChangeText={setVenue}
      />

      <TextInput
        style={styles.input}
        placeholder="Match Type (T20 / ODI / Practice)"
        value={matchType}
        onChangeText={setMatchType}
      />

      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Select Team</Text>
      {teams.length === 0 ? (
        <Text style={styles.helperText}>No teams found. Create a team first.</Text>
      ) : (
        <View style={styles.teamList}>
          {teams.map((team) => {
            const selected = selectedTeamId === team.id;

            return (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.teamBtn,
                  selected && styles.teamBtnSelected,
                ]}
                onPress={() => setSelectedTeamId(team.id)}
              >
                <Text
                  style={[
                    styles.teamBtnText,
                    selected && styles.teamBtnTextSelected,
                  ]}
                >
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
            <Text
              style={[
                styles.statusText,
                status === item && styles.statusTextSelected,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title={submitting ? "Creating..." : "Create Match"}
        onPress={handleCreateMatch}
        disabled={submitting}
      />
    </ScrollView>
  );
};

export default CreateMatchScreen;

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
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
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
  teamLeagueText: {
    textAlign: "center",
    marginTop: 4,
    fontSize: 12,
    color: "#666",
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
});