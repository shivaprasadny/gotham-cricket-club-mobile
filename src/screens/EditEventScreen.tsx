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

import { updateEvent } from "../services/eventService";

type Props = {
  route: any;
  navigation: any;
};

// Converts backend date string into local Date without timezone shifting
const parseLocalDateTime = (dateString: string) => {
  if (!dateString) return new Date();

  const cleanDate = dateString.replace("Z", "").split(".")[0];

  const [datePart, timePart = "00:00:00"] = cleanDate.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hour || 0,
    minute || 0,
    second || 0
  );
};

// Sends date/time exactly as user selected, without UTC conversion
const formatLocalDateTime = (date: Date) => {
  const pad = (num: number) => String(num).padStart(2, "0");

  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":00"
  );
};

// Clean UI display format
const formatDisplayDateTime = (date: Date) => {
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const EditEventScreen = ({ route, navigation }: Props) => {
  const { event } = route.params;

  const initialEventDate = event?.eventDate
    ? parseLocalDateTime(event.eventDate)
    : null;

  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");

  const [eventDate, setEventDate] = useState<Date | null>(initialEventDate);

  // iOS inline picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempEventDate, setTempEventDate] = useState<Date>(
    initialEventDate || new Date()
  );

  const [submitting, setSubmitting] = useState(false);

  // Android-safe date + time picker
  const openDatePicker = () => {
    const baseDate = eventDate || new Date();

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: "date",
        is24Hour: false,
        onChange: (dateEvent, selectedDate) => {
          if (dateEvent.type !== "set" || !selectedDate) return;

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

              setEventDate(finalDate);
            },
          });
        },
      });

      return;
    }

    // iOS keeps inline picker
    setTempEventDate(baseDate);
    setShowDatePicker(true);
  };

  const handleDoneDate = () => {
    setEventDate(tempEventDate);
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

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

        // fixed: no UTC conversion
        eventDate: formatLocalDateTime(eventDate),
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Event updated successfully",
        [{ text: "OK", onPress: () => navigation.goBack() }]
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
        keyboardDismissMode="on-drag"
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
        <TouchableOpacity style={styles.input} onPress={openDatePicker}>
          <Text style={styles.inputText}>
            {eventDate
              ? formatDisplayDateTime(eventDate)
              : "Select event date & time"}
          </Text>
        </TouchableOpacity>

        {/* iOS only. Android uses DateTimePickerAndroid.open() */}
        {Platform.OS === "ios" && showDatePicker && (
          <View style={styles.inlinePickerCard}>
            <DateTimePicker
              value={tempEventDate}
              mode="datetime"
              display="inline"
              onChange={(eventValue, selectedDate) => {
                if (selectedDate) {
                  setTempEventDate(selectedDate);
                }
              }}
            />

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
          </View>
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
    paddingBottom: 140,
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
    fontWeight: "600",
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