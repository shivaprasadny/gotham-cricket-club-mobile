
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { markAvailability } from "../services/availabilityService";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";

type Props = {
  route: any;
  navigation: any;
};

const STATUS_OPTIONS = [
  "AVAILABLE",
  "MAYBE",
  "NOT_AVAILABLE",
  "INJURED",
] as const;

const AvailabilityScreen = ({ route, navigation }: Props) => {
  const { matchId, opponentName, venue, matchDate, matchType } = route.params;

  const [selectedStatus, setSelectedStatus] =
    useState<"AVAILABLE" | "MAYBE" | "NOT_AVAILABLE" | "INJURED">("AVAILABLE");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

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
        typeof response === "string" ? response : "Availability saved successfully"
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };



  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        >
          <Text
            style={[
              styles.statusButtonText,
              selectedStatus === status && styles.selectedStatusButtonText,
            ]}
          >
            {status}
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
      />

      <Button
        title={submitting ? "Saving..." : "Save Availability"}
        onPress={handleSubmit}
        disabled={submitting}
      />
    </ScrollView>
  );
};

export default AvailabilityScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
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
    textAlignVertical: "top",
    minHeight: 110,
  },
});