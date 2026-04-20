import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createLeague } from "../services/leagueService";

type Props = {
  navigation: any;
};

/**
 * Match backend LeagueType enum exactly
 */
type LeagueType = "LEAGUE" | "TOURNAMENT" | "FRIENDLY";

/**
 * Fixed league type options used in UI
 */
const LEAGUE_TYPES: LeagueType[] = ["LEAGUE", "TOURNAMENT", "FRIENDLY"];

const CreateLeagueScreen = ({ navigation }: Props) => {
  // Form fields
  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [type, setType] = useState<LeagueType>("LEAGUE");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  // Start / end date states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Date picker control
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Submit loading state
  const [submitting, setSubmitting] = useState(false);

  /**
   * Format date nicely for UI display
   */
  const formatDate = (date: Date | null) => {
    if (!date) return "Select date";
    return date.toLocaleString();
  };

  /**
   * Create new league
   */
  const handleCreateLeague = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter league name");
      return;
    }

    if (!season.trim()) {
      Alert.alert("Error", "Please enter season");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createLeague({
        name: name.trim(),
        season: season.trim(),
        type,
        description: description.trim(),
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        active,
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "League created successfully",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.log("CREATE LEAGUE ERROR:", error?.response?.data || error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data ||
          error?.message ||
          "Failed to create league"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Screen title */}
      <Text style={styles.title}>Create League</Text>

      {/* League name */}
      <Text style={styles.label}>League Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter league name"
        placeholderTextColor="#7a7a7a"
        value={name}
        onChangeText={setName}
      />

      {/* Season */}
      <Text style={styles.label}>Season</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter season (example: 2026)"
        placeholderTextColor="#7a7a7a"
        value={season}
        onChangeText={setSeason}
      />

      {/* Type selection */}
      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {LEAGUE_TYPES.map((item) => (
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
        ))}
      </View>

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter description (optional)"
        placeholderTextColor="#7a7a7a"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Start date */}
      <Text style={styles.label}>Start Date</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowStartDatePicker(true)}
      >
        <Text style={styles.inputText}>{formatDate(startDate)}</Text>
      </TouchableOpacity>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="datetime"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
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
        onPress={() => setShowEndDatePicker(true)}
      >
        <Text style={styles.inputText}>{formatDate(endDate)}</Text>
      </TouchableOpacity>

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="datetime"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}

      {/* Active switch */}
      <Text style={styles.label}>Active</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>
          {active ? "League is active" : "League is inactive"}
        </Text>
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
    flexGrow: 1,
    backgroundColor: "#f8f5fb",
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    color: "#2b0540",
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 6,
  },
  inputText: {
    color: "#111",
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  typeBtn: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  typeBtnSelected: {
    backgroundColor: "#2b0540",
    borderColor: "#2b0540",
  },
  typeBtnText: {
    color: "#2b0540",
    fontWeight: "600",
  },
  typeBtnTextSelected: {
    color: "#fff",
  },
  switchRow: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchText: {
    color: "#2b0540",
    fontWeight: "600",
  },
  submitBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 10,
  },
  submitBtnText: {
    textAlign: "center",
    color: "#2b0540",
    fontWeight: "700",
    fontSize: 16,
  },
});