import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  deleteEvent,
  getEventAvailability,
  submitEventAvailability,
} from "../services/eventService";

type Props = {
  route: any;
  navigation: any;
};

type EventAvailabilityItem = {
  id: number;
  userId: number;
  fullName: string;
  status: "GOING" | "NOT_GOING" | "MAYBE";
  message?: string;
};

const EventDetailsScreen = ({ route, navigation }: Props) => {
  const { user } = useAuth();
  const { event } = route.params;

  const [status, setStatus] = useState<"GOING" | "NOT_GOING" | "MAYBE">("GOING");
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState<EventAvailabilityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";
  const canViewAll = canManage;

  const loadResponses = async () => {
    if (!canViewAll) {
      setRefreshing(false);
      return;
    }

    try {
      const data = await getEventAvailability(event.id);
      setResponses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("EVENT RESPONSES ERROR:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadResponses();
    }, [event.id, canViewAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResponses();
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const response = await submitEventAvailability(event.id, {
        status,
        message,
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Event availability submitted successfully",
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
        error?.response?.data?.message || "Failed to submit response"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await deleteEvent(event.id);

              Alert.alert(
                "Success",
                typeof response === "string"
                  ? response
                  : "Event deleted successfully",
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
                error?.response?.data?.message || "Failed to delete event"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <FlatList
      data={canViewAll ? responses : []}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <View style={styles.container}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.text}>{event.description}</Text>
          <Text style={styles.text}>
            {new Date(event.eventDate).toLocaleString()}
          </Text>
          <Text style={styles.text}>Location: {event.location}</Text>

          {canManage && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() =>
                  navigation.navigate("EditEvent", {
                    event,
                  })
                }
              >
                <Text style={styles.actionBtnText}>Edit Event</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={handleDelete}
              >
                <Text style={styles.actionBtnText}>Delete Event</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionTitle}>Your Response</Text>

          <View style={styles.row}>
            {["GOING", "NOT_GOING", "MAYBE"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.statusBtn,
                  status === item && styles.statusBtnSelected,
                ]}
                onPress={() =>
                  setStatus(item as "GOING" | "NOT_GOING" | "MAYBE")
                }
              >
                <Text
                  style={[
                    styles.statusText,
                    status === item && styles.statusTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Optional message"
            placeholderTextColor="#7a7a7a"
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? "Submitting..." : "Submit Response"}
            </Text>
          </TouchableOpacity>

          {canViewAll && <Text style={styles.sectionTitle}>All Responses</Text>}
        </View>
      }
      renderItem={({ item }) =>
        canViewAll ? (
          <View style={styles.responseCard}>
            <Text style={styles.responseName}>{item.fullName}</Text>
            <Text style={styles.responseText}>Status: {item.status}</Text>
            {item.message ? (
              <Text style={styles.responseText}>Note: {item.message}</Text>
            ) : null}
          </View>
        ) : null
      }
      contentContainerStyle={styles.listContent}
    />
  );
};

export default EventDetailsScreen;

const styles = StyleSheet.create({
  listContent: {
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
  },
  container: {
    padding: 16,
    backgroundColor: "#f8f5fb",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
    color: "#2b0540",
  },
  text: {
    marginBottom: 6,
    color: "#111827",
    fontWeight: "500",
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontWeight: "700",
    fontSize: 18,
    color: "#2b0540",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d2e1",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  statusBtnSelected: {
    backgroundColor: "#2b0540",
    borderColor: "#2b0540",
  },
  statusText: {
    textAlign: "center",
    color: "#2b0540",
    fontWeight: "600",
  },
  statusTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  submitBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  editBtn: {
    backgroundColor: "#2b0540",
  },
  deleteBtn: {
    backgroundColor: "#b91c1c",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  responseCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  responseName: {
    fontWeight: "700",
    marginBottom: 4,
    color: "#111827",
  },
  responseText: {
    color: "#374151",
    marginBottom: 2,
  },
});