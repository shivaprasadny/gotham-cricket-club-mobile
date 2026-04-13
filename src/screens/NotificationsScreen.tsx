import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AppNotification,
  clearNotifications,
  getNotifications,
} from "../services/notificationService";

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const handleClear = async () => {
    await clearNotifications();
    setNotifications([]);
    Alert.alert("Success", "Notifications cleared");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
        <Text style={styles.clearBtnText}>Clear All</Text>
      </TouchableOpacity>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
      />
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  clearBtn: {
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  clearBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#f7f7f7",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
  },
});