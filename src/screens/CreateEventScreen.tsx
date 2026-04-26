import React, { useState } from "react";
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

import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

import { createEvent } from "../services/eventService";

type Props = {
  navigation: any;
};

const CreateEventScreen = ({ navigation }: Props) => {
  // =========================
  // STATE
  // =========================
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [eventDate, setEventDate] = useState<Date | null>(null);

  // iOS picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempEventDate, setTempEventDate] = useState(new Date());

  const [submitting, setSubmitting] = useState(false);

  // =========================
  // ANDROID + IOS PICKER FIX
  // =========================
  const openDatePicker = () => {
    const baseDate = eventDate || new Date();

    // ANDROID → separate date + time (BEST UX)
    if (Platform.OS === "android") {
      // STEP 1: Pick Date
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: "date",
        onChange: (event, selectedDate) => {
          if (event.type !== "set" || !selectedDate) return;

          // STEP 2: Pick Time
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: "time",
            onChange: (timeEvent, selectedTime) => {
              if (timeEvent.type !== "set" || !selectedTime) return;

              // Combine date + time
              const finalDate = new Date(selectedDate);
              finalDate.setHours(selectedTime.getHours());
              finalDate.setMinutes(selectedTime.getMinutes());
              finalDate.setSeconds(0);

              setEventDate(finalDate);
            },
          });
        },
      });
    }
    // IOS → keep inline picker
    else {
      setTempEventDate(baseDate);
      setShowDatePicker(true);
    }
  };

  // Save for iOS
  const handleDoneDate = () => {
    setEventDate(tempEventDate);
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  // =========================
  // CREATE EVENT
  // =========================
  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter event title");
      return;
    }

    if (!location.trim()) {
      Alert.alert("Error", "Please enter location");
      return;
    }

    if (!eventDate) {
      Alert.alert("Error", "Please select event date and time");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createEvent({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        eventDate: eventDate.toISOString(),
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Event created successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create event"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Event</Text>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Event Title"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />

        {/* DATE PICKER BUTTON */}
        <Text style={styles.label}>Event Date & Time</Text>
        <TouchableOpacity style={styles.input} onPress={openDatePicker}>
          <Text style={styles.inputText}>
            {eventDate
              ? eventDate.toLocaleString()
              : "Select Event Date & Time"}
          </Text>
        </TouchableOpacity>

        {/* IOS PICKER ONLY */}
        {Platform.OS === "ios" && showDatePicker && (
          <View style={styles.inlinePickerCard}>
            <DateTimePicker
              value={tempEventDate}
              mode="datetime"
              display="inline"
              onChange={(e, d) => d && setTempEventDate(d)}
            />

            <View style={styles.dateActionRow}>
              <TouchableOpacity
                style={styles.dateCancelBtn}
                onPress={handleCancelDate}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateDoneBtn}
                onPress={handleDoneDate}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleCreate}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? "Creating..." : "Create Event"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateEventScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8f5fb" },
  container: { padding: 20 },

  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#2b0540",
  },

  label: {
    fontWeight: "700",
    marginBottom: 6,
    color: "#2b0540",
  },

  input: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  inputText: { color: "#111" },

  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  inlinePickerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
  },

  dateActionRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },

  dateCancelBtn: {
    flex: 1,
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  dateDoneBtn: {
    flex: 1,
    backgroundColor: "#2b0540",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  submitBtn: {
    backgroundColor: "#da9306",
    padding: 14,
    borderRadius: 10,
  },

  submitBtnText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#2b0540",
  },
});