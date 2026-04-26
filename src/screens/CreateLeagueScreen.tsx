import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { createLeague } from "../services/leagueService";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

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

  // Temporary controlled picker states
  const [tempStartDate, setTempStartDate] = useState<Date>(new Date());
  const [tempEndDate, setTempEndDate] = useState<Date>(new Date());

  // Date picker visibility controls
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Submit loading state
  const [submitting, setSubmitting] = useState(false);

  /**
   * Format date for UI display
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

  // Android-safe date + time picker
const openAndroidDateTimePicker = (
  currentDate: Date | null,
  onFinalDate: (date: Date) => void
) => {
  const baseDate = currentDate || new Date();

  DateTimePickerAndroid.open({
    value: baseDate,
    mode: "date",
    is24Hour: false,
    onChange: (event, selectedDate) => {
      if (event.type !== "set" || !selectedDate) return;

      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: "time",
        is24Hour: false,
        onChange: (timeEvent, selectedTime) => {
          if (timeEvent.type !== "set" || !selectedTime) return;

          const finalDate = new Date(selectedDate);
          finalDate.setHours(selectedTime.getHours());
          finalDate.setMinutes(selectedTime.getMinutes());
          finalDate.setSeconds(0);
          finalDate.setMilliseconds(0);

          onFinalDate(finalDate);
        },
      });
    },
  });
};

  return (
    // KeyboardAvoidingView keeps inputs visible above keyboard
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      {/* ScrollView lets form stay usable when keyboard opens */}
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
          textAlignVertical="top"
        />

        {/* Start date */}
        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
  if (Platform.OS === "android") {
    openAndroidDateTimePicker(startDate, setStartDate);
  } else {
    setTempStartDate(startDate || new Date());
    setShowStartDatePicker(true);
  }
}}
        >
          <Text style={styles.inputText}>{formatDate(startDate)}</Text>
        </TouchableOpacity>

        {Platform.OS === "ios" && showStartDatePicker && (
          <View style={styles.inlinePickerCard}>
            <DateTimePicker
              value={tempStartDate}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTempStartDate(selectedDate);
                }

                if (Platform.OS !== "ios" && selectedDate) {
                  setStartDate(selectedDate);
                  setShowStartDatePicker(false);
                }
              }}
            />

            {Platform.OS === "ios" && (
              <View style={styles.pickerButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowStartDatePicker(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => {
                    setStartDate(tempStartDate);
                    setShowStartDatePicker(false);
                  }}
                >
                  <Text style={styles.confirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* End date */}
        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
  if (Platform.OS === "android") {
    openAndroidDateTimePicker(endDate, setEndDate);
  } else {
    setTempEndDate(endDate || new Date());
    setShowEndDatePicker(true);
  }
}}
        >
          <Text style={styles.inputText}>{formatDate(endDate)}</Text>
        </TouchableOpacity>

      {Platform.OS === "ios" && showEndDatePicker && (
          <View style={styles.inlinePickerCard}>
            <DateTimePicker
              value={tempEndDate}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTempEndDate(selectedDate);
                }

                if (Platform.OS !== "ios" && selectedDate) {
                  setEndDate(selectedDate);
                  setShowEndDatePicker(false);
                }
              }}
            />

            {Platform.OS === "ios" && (
              <View style={styles.pickerButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowEndDatePicker(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => {
                    setEndDate(tempEndDate);
                    setShowEndDatePicker(false);
                  }}
                >
                  <Text style={styles.confirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
    </KeyboardAvoidingView>
  );
};

export default CreateLeagueScreen;

const styles = StyleSheet.create({
  // Full-screen wrapper for keyboard behavior
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },

  // Scroll content container
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f5fb",
    padding: 20,
    paddingBottom: 140,
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

  inlinePickerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  pickerButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  cancelBtn: {
    padding: 10,
  },

  cancelText: {
    color: "#888",
    fontWeight: "600",
  },

  confirmBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  confirmText: {
    color: "#2b0540",
    fontWeight: "700",
  },
});