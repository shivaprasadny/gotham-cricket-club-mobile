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
import { updateEvent } from "../services/eventService";

type Props = {
  route: any;
  navigation: any;
};

const EditEventScreen = ({ route, navigation }: Props) => {
  // Get event from params
  const { event } = route.params;

  // Form fields
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");
  const [eventDate, setEventDate] = useState<Date | null>(
    event?.eventDate ? new Date(event.eventDate) : null
  );

  // Controlled picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempEventDate, setTempEventDate] = useState<Date>(
    event?.eventDate ? new Date(event.eventDate) : new Date()
  );

  // Submit loading
  const [submitting, setSubmitting] = useState(false);

  // Open picker
  const openDatePicker = () => {
    setTempEventDate(eventDate || new Date());
    setShowDatePicker(true);
  };

  // Save date
  const handleDoneDate = () => {
    setEventDate(tempEventDate);
    setShowDatePicker(false);
  };

  // Cancel picker
  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  // Update event
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
        {/* Title */}
        <Text style={styles.title}>Edit Event</Text>

        {/* Event title */}
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter title"
          placeholderTextColor="#7a7a7a"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
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

        {/* Date & time */}
        <Text style={styles.label}>Event Date & Time</Text>
        <TouchableOpacity style={styles.input} onPress={openDatePicker}>
          <Text style={styles.inputText}>
            {eventDate ? eventDate.toLocaleString() : "Select event date & time"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <View style={styles.inlinePickerCard}>
            <DateTimePicker
              value={tempEventDate}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(eventValue, selectedDate) => {
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

        {/* Location */}
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter location"
          placeholderTextColor="#7a7a7a"
          value={location}
          onChangeText={setLocation}
        />

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
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
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f5fb",
    padding: 20,
    paddingBottom: 60,
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