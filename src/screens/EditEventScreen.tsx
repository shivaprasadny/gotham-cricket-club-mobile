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

const EditEventScreen = ({ route, navigation }: Props) => {
  const { event } = route.params;

  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [location, setLocation] = useState(event?.location || "");

  const [eventDate, setEventDate] = useState<Date | null>(
    event?.eventDate ? new Date(event.eventDate) : null
  );

  // iOS inline picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempEventDate, setTempEventDate] = useState<Date>(
    event?.eventDate ? new Date(event.eventDate) : new Date()
  );

  const [submitting, setSubmitting] = useState(false);

  // Android-safe date + time picker
  const openDatePicker = () => {
    const baseDate = eventDate || new Date();

    if (Platform.OS === "android") {
      // Step 1: pick date
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: "date",
        is24Hour: false,
        onChange: (dateEvent, selectedDate) => {
          if (dateEvent.type !== "set" || !selectedDate) return;

          // Step 2: pick time
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: "time",
            is24Hour: false,
            onChange: (timeEvent, selectedTime) => {
              if (timeEvent.type !== "set" || !selectedTime) return;

              // Combine selected date + selected time
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
    if (!title.trim()) return Alert.alert("Error", "Please enter title");
    if (!eventDate) return Alert.alert("Error", "Please select event date");
    if (!location.trim()) return Alert.alert("Error", "Please enter location");

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
            {eventDate ? eventDate.toLocaleString() : "Select event date & time"}
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
  screen: { flex: 1, backgroundColor: "#f8f5fb" },
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f5fb",
    padding: 20,
    paddingBottom: 100,
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
  inputText: { color: "#111827" },
  textArea: { minHeight: 110, textAlignVertical: "top" },
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
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});