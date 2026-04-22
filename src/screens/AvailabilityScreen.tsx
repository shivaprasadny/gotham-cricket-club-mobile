import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import { useFocusEffect } from "@react-navigation/native";
import {
  AvailabilityStatus,
  getMyAvailabilityByMatch,
  markAvailability,
} from "../services/availabilityService";

type Props = {
  route: any;
  navigation: any;
};

// All possible availability options
const STATUS_OPTIONS: AvailabilityStatus[] = [
  "AVAILABLE",
  "MAYBE",
  "NOT_AVAILABLE",
  "INJURED",
];

const AvailabilityScreen = ({ route, navigation }: Props) => {
  const { matchId, opponentName, venue, matchDate, matchType } = route.params;

  // Stores currently selected availability status
  const [selectedStatus, setSelectedStatus] =
    useState<AvailabilityStatus>("AVAILABLE");

  // Stores optional message typed by user
  const [message, setMessage] = useState("");

  // Used while saving availability
  const [submitting, setSubmitting] = useState(false);

  // Used while loading previous saved availability
  const [loading, setLoading] = useState(true);

  // Load existing availability whenever this screen comes into focus
  const loadMyAvailability = async () => {
    try {
      setLoading(true);

      const data = await getMyAvailabilityByMatch(matchId);

      if (data) {
        setSelectedStatus(data.status ?? "AVAILABLE");
        setMessage(data.message ?? "");
      } else {
        setSelectedStatus("AVAILABLE");
        setMessage("");
      }
    } catch (error) {
      // If API fails, fall back to default values
      setSelectedStatus("AVAILABLE");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  // Reload data every time screen opens
  useFocusEffect(
    useCallback(() => {
      void loadMyAvailability();
    }, [matchId])
  );

  // Save or update availability
  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const response = await markAvailability({
        matchId,
        status: selectedStatus,
        message,
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Availability saved successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save availability";

      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Format match date safely
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Friendly label for status button
  const getStatusLabel = (status: AvailabilityStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "Available";
      case "MAYBE":
        return "Maybe";
      case "NOT_AVAILABLE":
        return "Not Available";
      case "INJURED":
        return "Injured";
      default:
        return status;
    }
  };

  // Loading state while fetching existing availability
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loaderText}>Loading your availability...</Text>
      </View>
    );
  }

  return (
    // KeyboardAvoidingView pushes content upward when keyboard opens

    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // Helps when using navigation header / status bar
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      <ScrollView
        // flexGrow + paddingBottom helps content move and remain scrollable
        contentContainerStyle={styles.container}
        // Allows taps to work even if keyboard is open
        keyboardShouldPersistTaps="handled"
        // Lets scroll behavior feel more natural with keyboard open
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Match Availability</Text>

        <View style={styles.matchCard}>
          <Text style={styles.matchTitle}>{opponentName}</Text>
          <Text style={styles.matchText}>Type: {matchType}</Text>
          <Text style={styles.matchText}>Venue: {venue}</Text>
          <Text style={styles.matchText}>Date: {formatDate(matchDate)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Select Status</Text>

        {STATUS_OPTIONS.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              selectedStatus === status && styles.selectedStatusButton,
            ]}
            onPress={() => setSelectedStatus(status)}
            disabled={submitting}
          >
            <Text
              style={[
                styles.statusButtonText,
                selectedStatus === status && styles.selectedStatusButtonText,
              ]}
            >
              {getStatusLabel(status)}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Message</Text>

        <TextInput
          style={styles.messageInput}
          placeholder="Example: Will come late / Need to leave early / Hamstring issue"
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
          editable={!submitting}
          // Makes multiline input start from top on Android
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.saveButton, submitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.saveButtonText}>
            {submitting ? "Saving..." : "Save Availability"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>

  );
};

export default AvailabilityScreen;

const styles = StyleSheet.create({
  // Full-screen wrapper for keyboard handling
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // Scroll content wrapper
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
    // Extra bottom spacing so the last input/button can scroll above keyboard
    paddingBottom: 40,
  },

  // Loader layout
  loaderContainer: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#444",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },

  matchCard: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },

  matchTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },

  matchText: {
    fontSize: 15,
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 10,
  },

  statusButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },

  selectedStatusButton: {
    backgroundColor: "#111",
    borderColor: "#111",
  },

  statusButtonText: {
    textAlign: "center",
    fontWeight: "600",
  },

  selectedStatusButtonText: {
    color: "#fff",
  },

  messageInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    minHeight: 110,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },

  saveButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});