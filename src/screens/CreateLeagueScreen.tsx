import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import { createLeague } from "../services/leagueService";

type Props = {
  navigation: any;
};

type LeagueType = "LEAGUE" | "TOURNAMENT" | "FRIENDLY_SERIES";

const CreateLeagueScreen = ({ navigation }: Props) => {
  // Form fields
  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<LeagueType>("LEAGUE");
  const [active, setActive] = useState(true);

  // Dates
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Picker controls
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);

  // Submit new league
  const handleCreateLeague = async () => {
    if (!name.trim() || !season.trim()) {
      Alert.alert("Error", "Please enter league name and season");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createLeague({
        name: name.trim(),
        season: season.trim(),
        type,
        description: description.trim() || undefined,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        active,
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "League created successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create league"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create League</Text>

      {/* League name */}
      <TextInput
        style={styles.input}
        placeholder="League Name"
        value={name}
        onChangeText={setName}
      />

      {/* Season */}
      <TextInput
        style={styles.input}
        placeholder="Season (example: 2026)"
        value={season}
        onChangeText={setSeason}
      />

      {/* League type selector */}
      <Text style={styles.label}>League Type</Text>
      <View style={styles.typeRow}>
        {(["LEAGUE", "TOURNAMENT", "FRIENDLY_SERIES"] as LeagueType[]).map(
          (item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.typeBtn,
                type === item && styles.typeBtnSelected,
              ]}
              onPress={() => setType(item)}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  type === item && styles.typeBtnTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Description */}
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Start date */}
      <Text style={styles.label}>Start Date</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowStartPicker(true)}
      >
        <Text>
          {startDate
            ? startDate.toLocaleString()
            : "Select league start date"}
        </Text>
      </TouchableOpacity>

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="datetime"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {/* End date */}
      <Text style={styles.label}>End Date</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowEndPicker(true)}
      >
        <Text>
          {endDate
            ? endDate.toLocaleString()
            : "Select league end date"}
        </Text>
      </TouchableOpacity>

      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="datetime"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}

      {/* Active toggle */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Active League</Text>
        <Switch value={active} onValueChange={setActive} />
      </View>

      {/* Submit button */}
      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleCreateLeague}
        disabled={submitting}
      >
        <Text style={styles.submitBtnText}>
          {submitting ? "Creating..." : "Create League"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CreateLeagueScreen;

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
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  typeBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  typeBtnSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  typeBtnText: {
    fontWeight: "600",
  },
  typeBtnTextSelected: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  submitBtn: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  submitBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});