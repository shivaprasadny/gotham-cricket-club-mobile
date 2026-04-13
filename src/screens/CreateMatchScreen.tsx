import React, { useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createMatch } from "../services/matchService";
import { addNotification } from "../services/notificationService";

type Props = {
  navigation: any;
};

const CreateMatchScreen = ({ navigation }: Props) => {
  const [opponentName, setOpponentName] = useState("");
  const [venue, setVenue] = useState("");
  const [matchType, setMatchType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [matchDate, setMatchDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState<"UPCOMING" | "COMPLETED" | "CANCELLED">(
    "UPCOMING"
  );

  const handleCreateMatch = async () => {
    if (!opponentName || !matchDate || !venue || !matchType) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createMatch({
        opponentName,
        matchDate: matchDate.toISOString(),
        venue,
        matchType,
        notes,
        status,
      });

      await addNotification({
        title: "Match Created",
        message: `${opponentName} match was created successfully.`,
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Match created successfully"
      );

      setOpponentName("");
      setMatchDate(null);
      setVenue("");
      setMatchType("");
      setNotes("");
      setStatus("UPCOMING");

      navigation.navigate("Matches");
    } catch (error: any) {
      console.log("CREATE MATCH ERROR:", error?.response?.data || error?.message);
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
          {matchDate ? matchDate.toLocaleString() : "Select Match Date & Time"}
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
        multiline
        numberOfLines={4}
        value={notes}
        onChangeText={setNotes}
      />

      <Text style={styles.label}>Status</Text>
      <View style={styles.row}>
        {["UPCOMING", "COMPLETED", "CANCELLED"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.statusBtn, status === item && styles.statusBtnSelected]}
            onPress={() =>
              setStatus(item as "UPCOMING" | "COMPLETED" | "CANCELLED")
            }
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
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statusBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    borderRadius: 8,
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