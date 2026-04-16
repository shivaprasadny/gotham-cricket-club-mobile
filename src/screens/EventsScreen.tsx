import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { getEvents } from "../services/eventService";

type Props = {
  navigation: any;
};

type EventItem = {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  createdBy: string;
  createdAt: string;
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
    } catch (error) {
      console.log("EVENT LOAD ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
  };

  const renderItem = ({ item }: { item: EventItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("EventDetails", { event: item })}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.description}</Text>
      <Text style={styles.text}>
        {new Date(item.eventDate).toLocaleString()}
      </Text>
      <Text style={styles.text}>Location: {item.location}</Text>
      <Text style={styles.status}>
        Your Status: {item.myStatus || "Not responded"}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ color: "#fff" }}>Loading events...</Text>
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
            <Text style={styles.createBtnText}>+ Create Event</Text>
          </TouchableOpacity>
        ) : null
      }
      ListEmptyComponent={<Text style={{ color: "#fff" }}>No events found.</Text>}
    />
  );
};

export default EventsScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#4B1D6B",
  },
  card: {
    backgroundColor: "#5A257A",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  text: {
    color: "#ddd",
    marginBottom: 4,
  },
  status: {
    color: "#F4B400",
    marginTop: 6,
    fontWeight: "700",
  },
  createBtn: {
    backgroundColor: "#F4B400",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  createBtnText: {
    color: "#000",
    textAlign: "center",
    fontWeight: "700",
  },
  center: {
    flex: 1,
    backgroundColor: "#4B1D6B",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});