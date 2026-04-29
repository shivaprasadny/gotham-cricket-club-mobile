import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

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

// =========================
// STATUS OPTIONS
// =========================
const STATUS_OPTIONS: AvailabilityStatus[] = [
  "AVAILABLE",
  "MAYBE",
  "NOT_AVAILABLE",
  "INJURED",
];

const AvailabilityScreen = ({ route, navigation }: Props) => {
  const {
  matchId,
  homeTeamName,
  awayTeamName,
  externalOpponentName,
  venue,
  matchDate,
  matchType,
  matchFormat,
  matchFeeAmount,
  matchFeeDueDate,
  matchFeeDescription,
  status,
} = route.params;

  // =========================
  // STATE
  // =========================
  const [selectedStatus, setSelectedStatus] =
    useState<AvailabilityStatus>("AVAILABLE");

  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD DATA
  // =========================
  const loadMyAvailability = async () => {
    try {
      setLoading(true);

      const data = await getMyAvailabilityByMatch(matchId);

      if (data) {
        setSelectedStatus(data.status ?? "AVAILABLE");
        setMessage(data.message ?? "");
      }
    } catch {
      setSelectedStatus("AVAILABLE");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadMyAvailability();
    }, [matchId])
  );

  // =========================
  // SAVE
  // =========================
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
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save availability"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getMatchTitle = () => {
  if (awayTeamName) {
    return `${homeTeamName || "Team"} vs ${awayTeamName}`;
  }

  return `${homeTeamName || "Team"} vs ${
    externalOpponentName || "Opponent"
  }`;
};

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // =========================
  // LABEL
  // =========================
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

  // =========================
  // LOADING UI
  // =========================
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loaderText}>Loading availability...</Text>
      </View>
    );
  }

  return (
    // 🔥 THIS FIXES EVERYTHING (Android + iOS)
    <KeyboardAwareScrollView
  contentContainerStyle={styles.container}
  keyboardShouldPersistTaps="handled"
  enableOnAndroid={true}
  extraScrollHeight={120}
  extraHeight={140} // 🔥 ADD THIS
  keyboardOpeningTime={0} // 🔥 ADD THIS (faster response)
>
      <Text style={styles.title}>Match Availability</Text>

     {/* Match information card */}
          
<View style={styles.matchCard}>
  <Text style={styles.matchTitle}>{getMatchTitle()}</Text>

  <Text style={styles.matchText}>Type: {matchType}</Text>
  <Text style={styles.matchText}>Format: {matchFormat || "N/A"}</Text>
  <Text style={styles.matchText}>Venue: {venue}</Text>

  <Text style={styles.matchText}>
    Match Fee:{" "}
    {matchFeeAmount !== null && matchFeeAmount !== undefined
      ? `$${matchFeeAmount}`
      : "N/A"}
  </Text>

  <Text style={styles.matchText}>
    Fee Due Date:{" "}
    {matchFeeDueDate
      ? new Date(matchFeeDueDate).toLocaleString()
      : "N/A"}
  </Text>

  {matchFeeDescription ? (
    <Text style={styles.matchText}>Fee Note: {matchFeeDescription}</Text>
  ) : null}

  <Text style={styles.matchText}>
    Date: {new Date(matchDate).toLocaleString()}
  </Text>

  <Text style={styles.matchText}>Status: {status || "UPCOMING"}</Text>
</View>
      {/* STATUS */}
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
              selectedStatus === status &&
                styles.selectedStatusButtonText,
            ]}
          >
            {getStatusLabel(status)}
          </Text>
        </TouchableOpacity>
      ))}

      {/* MESSAGE */}
      <Text style={styles.sectionTitle}>Message</Text>

      <TextInput
        style={styles.messageInput}
        placeholder="Example: Coming late / leaving early"
        multiline
        value={message}
        onChangeText={setMessage}
        editable={!submitting}
        textAlignVertical="top"
      />

      {/* BUTTON */}
      <TouchableOpacity
        style={[styles.saveButton, submitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.saveButtonText}>
          {submitting ? "Saving..." : "Save Availability"}
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

export default AvailabilityScreen;

// =========================
// STYLES
// =========================
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100,
    backgroundColor: "#fff",
    flexGrow: 1,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loaderText: {
    marginTop: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
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
  },

  matchText: {
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 10,
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
  },

  statusButtonText: {
    textAlign: "center",
  },

  selectedStatusButtonText: {
    color: "#fff",
  },

  messageInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    marginBottom: 20,
  },

  saveButton: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.6,
  },
});