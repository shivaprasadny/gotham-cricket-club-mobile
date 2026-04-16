import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  getEventAvailability,
  submitEventAvailability,
} from "../services/eventService";

type Props = {
  route: any;
};

type EventAvailabilityItem = {
  id: number;
  userId: number;
  fullName: string;
  status: "GOING" | "NOT_GOING" | "MAYBE";
  message?: string;
};

const EventDetailsScreen = ({ route }: Props) => {
  const { user } = useAuth();
  const { event } = route.params;

  const [status, setStatus] = useState<"GOING" | "NOT_GOING" | "MAYBE">("GOING");
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState<EventAvailabilityItem[]>([]);

  const canViewAll = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  const loadResponses = async () => {
    if (!canViewAll) return;
    try {
      const data = await getEventAvailability(event.id);
      setResponses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("EVENT RESPONSES ERROR:", error);
    }
  };

  useEffect(() => {
    void loadResponses();
  }, []);

  const handleSubmit = async () => {
    try {
      const response = await submitEventAvailability(event.id, {
        status,
        message,
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Event availability submitted successfully"
      );

      await loadResponses();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to submit response"
      );
    }
  };

  return (
    <FlatList
      data={responses}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={
        <View style={styles.container}>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.text}>{event.description}</Text>
          <Text style={styles.text}>
            {new Date(event.eventDate).toLocaleString()}
          </Text>
          <Text style={styles.text}>Location: {event.location}</Text>

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
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit Response</Text>
          </TouchableOpacity>

          {canViewAll && <Text style={styles.sectionTitle}>All Responses</Text>}
        </View>
      }
      renderItem={({ item }) =>
        canViewAll ? (
          <View style={styles.responseCard}>
            <Text style={styles.responseName}>{item.fullName}</Text>
            <Text>Status: {item.status}</Text>
            {item.message ? <Text>Note: {item.message}</Text> : null}
          </View>
        ) : null
      }
    />
  );
};

export default EventDetailsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  text: {
    marginBottom: 6,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontWeight: "700",
    fontSize: 18,
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
    borderColor: "#ccc",
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusBtnSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  statusText: {
    textAlign: "center",
  },
  statusTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  responseCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
  },
  responseName: {
    fontWeight: "700",
    marginBottom: 4,
  },
});