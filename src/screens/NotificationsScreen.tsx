import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import {
  AppNotification,
  clearNotifications,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import { getEventById } from "../services/eventService";

type Props = {
  navigation: any;
};

const NotificationsScreen = ({ navigation }: Props) => {
  // Notification list state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Load notifications from backend
  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("LOAD NOTIFICATIONS ERROR:", error);
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setRefreshing(false);
    }
  };

  // Reload every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [])
  );

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  // Clear all notifications
  const handleClear = async () => {
    Alert.alert(
      "Clear Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearNotifications();
              setNotifications([]);
              Alert.alert("Success", "Notifications cleared");
            } catch (error) {
              console.log("CLEAR NOTIFICATIONS ERROR:", error);
              Alert.alert("Error", "Failed to clear notifications");
            }
          },
        },
      ]
    );
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();

      // Update local UI immediately
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
        }))
      );
    } catch (error) {
      console.log("MARK ALL READ ERROR:", error);
      Alert.alert("Error", "Failed to mark all as read");
    }
  };
const normalizeType = (type?: string) => (type || "").toUpperCase().trim();

const isEventType = (type?: string) => {
  const t = normalizeType(type);
  return t === "EVENT" || t === "EVENT_NOTIFICATION" || t === "EVENTS";
};

const getNotificationIcon = (
  type?: string
): keyof typeof Ionicons.glyphMap => {
  if (isEventType(type)) return "calendar-outline";

  switch (normalizeType(type)) {
    case "MATCH":
      return "calendar-outline";
    case "ANNOUNCEMENT":
      return "notifications-outline";
    case "FEE":
      return "card-outline";
    case "TEAM":
      return "shield-outline";
    case "LEAGUE":
      return "trophy-outline";
    case "MEMBER":
      return "people-outline";
    default:
      console.log("UNKNOWN NOTIFICATION TYPE:", type);
      return "information-circle-outline";
  }
};

const getNotificationIconColor = (type?: string) => {
  if (isEventType(type)) return "#06b6d4";

  switch (normalizeType(type)) {
    case "MATCH":
      return "#22c55e";
    case "ANNOUNCEMENT":
      return "#da9306";
    case "FEE":
      return "#2563eb";
    case "TEAM":
      return "#8b5cf6";
    case "LEAGUE":
      return "#f59e0b";
    case "MEMBER":
      return "#ec4899";
    default:
      return "#6b7280";
  }
};

  // Open the correct screen when notification is pressed
  const handleNotificationPress = async (item: AppNotification) => {
    try {
      // Mark one notification as read first
      if (!item.isRead) {
        await markNotificationAsRead(item.recipientId);

        // Update local UI immediately
        setNotifications((prev) =>
          prev.map((n) =>
            n.recipientId === item.recipientId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.log("MARK READ ERROR:", error);
    }

   // Handle event notifications first
if (isEventType(item.type) && item.targetId) {
  try {
    console.log("EVENT NOTIFICATION CLICKED:", item);

    const fullEvent = await getEventById(item.targetId);
    console.log("FULL EVENT FROM API:", fullEvent);

    navigation.navigate("EventDetails", {
      event: fullEvent,
    });
  } catch (error) {
    console.log("FETCH EVENT ERROR:", error);
    navigation.navigate("MainTabs", { screen: "Events" });
  }

  return;
}

    // Direct navigation using targetScreen
    if (item.targetScreen === "Events") {
      navigation.navigate("MainTabs", { screen: "Events" });
      return;
    }

    if (item.targetScreen === "MatchDetails") {
      if (item.targetId) {
        navigation.navigate("MatchDetails", { matchId: item.targetId });
      } else {
        navigation.navigate("MainTabs", { screen: "Matches" });
      }
      return;
    }

    // Tab screens
    if (item.targetScreen === "Announcements") {
      navigation.navigate("MainTabs", { screen: "Announcements" });
      return;
    }

    if (item.targetScreen === "Matches") {
      navigation.navigate("MainTabs", { screen: "Matches" });
      return;
    }

    if (item.targetScreen === "Home") {
      navigation.navigate("MainTabs", { screen: "Home" });
      return;
    }

    if (item.targetScreen === "Profile") {
      navigation.navigate("MainTabs", { screen: "Profile" });
      return;
    }

    if (item.targetScreen === "Members") {
      navigation.navigate("MainTabs", { screen: "Members" });
      return;
    }

    if (item.targetScreen === "Teams") {
      navigation.navigate("MainTabs", { screen: "Teams" });
      return;
    }

    // Stack screens
    if (item.targetScreen === "MyFees") {
      navigation.navigate("MyFees");
      return;
    }

    if (item.targetScreen === "Leagues") {
      navigation.navigate("Leagues");
      return;
    }

    if (item.targetScreen === "AdminApproval") {
      navigation.navigate("AdminApproval");
      return;
    }

    if (item.targetScreen === "Notifications") {
      navigation.navigate("Notifications");
      return;
    }

    // Fallback by type if targetScreen is missing
    switch (normalizeType(item.type)) {
      case "MATCH":
        if (item.targetId) {
          navigation.navigate("MatchDetails", { matchId: item.targetId });
        } else {
          navigation.navigate("MainTabs", { screen: "Matches" });
        }
        return;

      case "ANNOUNCEMENT":
        navigation.navigate("MainTabs", { screen: "Announcements" });
        return;

      case "FEE":
        navigation.navigate("MyFees");
        return;

      case "TEAM":
        navigation.navigate("MainTabs", { screen: "Teams" });
        return;

      case "LEAGUE":
        navigation.navigate("Leagues");
        return;

      case "MEMBER":
        navigation.navigate("AdminApproval");
        return;

      case "EVENT":
      case "EVENT_NOTIFICATION":
      case "EVENTS":
        navigation.navigate("MainTabs", { screen: "Events" });
        return;

      default:
        navigation.navigate("MainTabs", { screen: "Home" });
        return;
    }
  };

  // Format backend timestamp
  const formatTime = (createdAt?: string) => {
    if (!createdAt) return "";

    try {
      return new Date(createdAt).toLocaleString();
    } catch {
      return createdAt;
    }
  };

  // Render one notification card
  const renderItem: ListRenderItem<AppNotification> = ({ item }) => {
    const iconName = getNotificationIcon(item.type);
    const iconColor = getNotificationIconColor(item.type);

    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.cardRow}>
          {/* Left icon */}
          <View style={styles.iconWrap}>
            <Ionicons name={iconName} size={22} color={iconColor} />
          </View>

          {/* Text content */}
          <View style={styles.textWrap}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMessage}>{item.message}</Text>
            <Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header actions */}
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Notifications</Text>

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.smallBtn} onPress={handleMarkAllRead}>
            <Text style={styles.smallBtnText}>Read All</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification list */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.recipientId.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons
              name="notifications-off-outline"
              size={42}
              color="#9ca3af"
            />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              Match updates, fee alerts, announcements, and club activity will
              appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  // Main screen wrapper
  container: {
    flex: 1,
    backgroundColor: "#f8f5fb",
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Header row
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  // Screen title
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2b0540",
  },

  // Header action group
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },

  // Read all button
  smallBtn: {
    backgroundColor: "#4b5563",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  smallBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  // Clear all button
  clearBtn: {
    backgroundColor: "#2b0540",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  clearBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  // List wrapper
  list: {
    paddingBottom: 20,
  },

  // Notification card
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d9d2e1",
    backgroundColor: "#ffffff",
  },

  // Highlight unread card
  unreadCard: {
    borderColor: "#da9306",
    backgroundColor: "#fffdf7",
  },

  // Card content row
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  // Icon wrapper
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },

  // Text content wrapper
  textWrap: {
    flex: 1,
  },

  // Notification title
  cardTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },

  // Notification message
  cardMessage: {
    color: "#374151",
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 18,
  },

  // Notification time
  cardTime: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
  },

  // Empty container
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },

  // Empty card
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  // Empty title
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#2b0540",
  },

  // Empty text
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});