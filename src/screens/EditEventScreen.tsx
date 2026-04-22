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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { updateEvent } from "../services/eventService";

type Props = {
  route: any;
  navigation: any;
};

const EditEventScreen = ({ route, navigation }: Props) => {
  // Get selected event from navigation params
  const { event } = route.params;

  // Form field states
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");
  const [eventDate, setEventDate] = useState<Date | null>(
    event?.eventDate ? new Date(event.eventDate) : null
  );

  // Date picker visibility state
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Submit button loading state
  const [submitting, setSubmitting] = useState(false);

  // Update event handler
  const handleUpdate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter title");
      return;
    }

    if (!eventDate) {
      Alert.alert("Error", "Please select event date");
      return;
    }

    if (!location.trim()) {
      Alert.alert("Error", "Please enter location");
      return;
    }

    try {
      setSubmitting(true);

      const response = await updateEvent(event.id, {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        eventDate: eventDate.toISOString(),
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Event updated successfully",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update event"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // KeyboardAvoidingView helps move content above keyboard when typing
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      {/* ScrollView allows lower fields to remain reachable */}
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Edit Event</Text>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title"
          placeholderTextColor="#7a7a7a"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter description"
          placeholderTextColor="#7a7a7a"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Event Date & Time</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.inputText}>
            {eventDate ? eventDate.toLocaleString() : "Select event date & time"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={eventDate || new Date()}
            mode="datetime"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(eventValue, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setEventDate(selectedDate);
            }}
          />
        )}

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter location"
          placeholderTextColor="#7a7a7a"
          value={location}
          onChangeText={setLocation}
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleUpdate}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? "Updating..." : "Update Event"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditEventScreen;

const styles = StyleSheet.create({
  // Full screen wrapper for keyboard behavior
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },

  // Scroll content wrapper
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f5fb",
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#2b0540",
    marginBottom: 24,
  },

  label: {
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 8,
    marginTop: 8,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  inputText: {
    color: "#111827",
  },

  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },

  submitBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },

  submitBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});