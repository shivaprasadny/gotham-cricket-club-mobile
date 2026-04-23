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
import DateTimePicker from "@react-native-community/datetimepicker";
import { createEvent } from "../services/eventService";

type Props = {
  navigation: any;
};

const CreateEventScreen = ({ navigation }: Props) => {
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);

  // Controlled date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempEventDate, setTempEventDate] = useState<Date>(new Date());

  // Loading state
  const [submitting, setSubmitting] = useState(false);

  // Open date picker
  const openDatePicker = () => {
    setTempEventDate(eventDate || new Date());
    setShowDatePicker(true);
  };

  // Save picked date
  const handleDoneDate = () => {
    setEventDate(tempEventDate);
    setShowDatePicker(false);
  };

  // Cancel picked date
  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  // Create event
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

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Screen title */}
        <Text style={styles.title}>Create Event</Text>

        {/* Event title */}
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Event Title"
          placeholderTextColor="#7a7a7a"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Description"
          placeholderTextColor="#7a7a7a"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Location"
          placeholderTextColor="#7a7a7a"
          value={location}
          onChangeText={setLocation}
        />

        {/* Event date picker button */}
        <Text style={styles.label}>Event Date & Time</Text>
        <TouchableOpacity style={styles.input} onPress={openDatePicker}>
          <Text style={styles.inputText}>
            {eventDate ? eventDate.toLocaleString() : "Select Event Date & Time"}
          </Text>
        </TouchableOpacity>

        {/* Controlled date picker */}
        {showDatePicker && (
          <View style={styles.inlinePickerCard}>
            <DateTimePicker
              value={tempEventDate}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTempEventDate(selectedDate);
                }

                // Android auto-save on select
                if (Platform.OS !== "ios" && selectedDate) {
                  setEventDate(selectedDate);
                  setShowDatePicker(false);
                }
              }}
            />

            {Platform.OS === "ios" && (
              <View style={styles.dateActionRow}>
                <TouchableOpacity
                  style={styles.dateCancelBtn}
                  onPress={handleCancelDate}
                >
                  <Text style={styles.dateCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateDoneBtn}
                  onPress={handleDoneDate}
                >
                  <Text style={styles.dateDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Create button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
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
  screen: {
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
    marginBottom: 24,
    textAlign: "center",
    color: "#2b0540",
  },
  label: {
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 8,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  inputText: {
    color: "#111827",
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  inlinePickerCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  dateActionRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  dateCancelBtn: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    paddingVertical: 10,
    borderRadius: 8,
  },
  dateCancelBtnText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#111827",
  },
  dateDoneBtn: {
    flex: 1,
    backgroundColor: "#2b0540",
    paddingVertical: 10,
    borderRadius: 8,
  },
  dateDoneBtnText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#fff",
  },
  submitBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});