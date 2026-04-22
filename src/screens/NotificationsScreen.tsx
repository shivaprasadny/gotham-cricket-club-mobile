import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
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
} from "../services/notificationService";

type Props = {
  navigation: any;
};

const NotificationsScreen = ({ navigation }: Props) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load notifications
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

  // Reload on screen focus
  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [])
  );

  // Pull to refresh
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

  // Pick icon by simple type
  const getNotificationIcon = (type?: string) => {
    switch (type) {
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
        return "information-circle-outline";
    }
  };

  // Pick icon color by simple type
  const getNotificationIconColor = (type?: string) => {
    switch (type) {
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

  // Open related screen when user taps notification
  const handleNotificationPress = (item: AppNotification) => {
  // Match details direct route
  if (item.targetScreen === "MatchDetails") {
    if (item.targetId) {
      navigation.navigate("MatchDetails", { matchId: item.targetId });
    } else {
      navigation.navigate("MainTabs", { screen: "Matches" });
    }
    return;
  }

  // Tab screens must go through MainTabs
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

  // Stack screens
  if (item.targetScreen === "MyFees") {
    navigation.navigate("MyFees");
    return;
  }

  if (item.targetScreen === "Members") {
    navigation.navigate("Members");
    return;
  }

  if (item.targetScreen === "Teams") {
    navigation.navigate("Teams");
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

  // Fallback by type
  switch (item.type) {
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
      navigation.navigate("Teams");
      return;

    case "LEAGUE":
      navigation.navigate("Leagues");
      return;

    case "MEMBER":
      navigation.navigate("Members");
      return;

    default:
      navigation.navigate("MainTabs", { screen: "Home" });
      return;
  }
};

  // Format time
  const formatTime = (createdAt?: string) => {
    if (!createdAt) return "";

    try {
      return new Date(createdAt).toLocaleString();
    } catch {
      return createdAt;
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const iconName = getNotificationIcon(item.type);
    const iconColor = getNotificationIconColor(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.cardRow}>
          <View style={styles.iconWrap}>
            <Ionicons name={iconName as any} size={22} color={iconColor} />
          </View>

          <View style={styles.textWrap}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Notifications</Text>

        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item, index) => item.id || `${index}`}
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
              Match updates, fee alerts, announcements, and club activity will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f5fb",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2b0540",
  },
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
  list: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d9d2e1",
    backgroundColor: "#ffffff",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#2b0540",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});