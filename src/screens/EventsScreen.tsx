import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { deleteEvent, getEvents } from "../services/eventService";

type Props = {
  navigation: any;
};

type EventItem = {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  createdBy?: string;
  createdAt?: string;
  myStatus?: "GOING" | "NOT_GOING" | "MAYBE";
};

const EventsScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.log("EVENTS LOAD ERROR:", error?.response?.data || error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load events"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadEvents();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
  };

  const handleDeleteEvent = (eventId: number) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await deleteEvent(eventId);

            Alert.alert(
              "Success",
              typeof response === "string"
                ? response
                : "Event deleted successfully"
            );

            await loadEvents();
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.response?.data?.message || "Failed to delete event"
            );
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: EventItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("EventDetails", { event: item })}
    >
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardText}>{item.description}</Text>
      <Text style={styles.cardText}>
        {new Date(item.eventDate).toLocaleString()}
      </Text>
      <Text style={styles.cardText}>Location: {item.location}</Text>
      {item.myStatus ? (
        <Text style={styles.statusText}>Your Response: {item.myStatus}</Text>
      ) : null}

      {canManage && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate("EditEvent", { event: item })}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDeleteEvent(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={events.length === 0 ? styles.center : styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        canManage ? (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate("CreateEvent")}
          >
            <Ionicons name="add-circle-outline" size={18} color="#2b0540" />
            <Text style={styles.createBtnText}>Create Event</Text>
          </TouchableOpacity>
        ) : null
      }
      ListEmptyComponent={<Text style={styles.emptyText}>No events found.</Text>}
    />
  );
};

export default EventsScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#2b0540",
    flexGrow: 1,
  },
  center: {
    flexGrow: 1,
    backgroundColor: "#2b0540",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  emptyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  createBtn: {
    backgroundColor: "#da9306",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  createBtnText: {
    color: "#2b0540",
    fontWeight: "800",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  cardText: {
    color: "#374151",
    marginBottom: 4,
    fontWeight: "500",
  },
  statusText: {
    color: "#2b0540",
    fontWeight: "700",
    marginTop: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  editBtn: {
    backgroundColor: "#2b0540",
  },
  deleteBtn: {
    backgroundColor: "#b91c1c",
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
  },
});