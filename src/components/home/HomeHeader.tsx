import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  user: any;
  navigation: any;
  unreadCount: number;
  onOpenMenu: () => void;
};

const HomeHeader = ({ user, navigation, unreadCount, onOpenMenu }: Props) => {
  return (
    <View style={styles.topRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.roleText}>{user?.role}</Text>
      </View>

      <View style={styles.topRightIcons}>
        <TouchableOpacity
          style={styles.iconBtn}
          accessibilityLabel="Open chats"
          onPress={() => navigation.navigate("ChatList")}
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#da9306" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("Notifications")}
        >
          <View>
            <Ionicons name="notifications-outline" size={24} color="#da9306" />

            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn} onPress={onOpenMenu}>
          <Ionicons name="menu" size={26} color="#da9306" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  heading: {
    color: "#ddd",
    fontSize: 15,
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
  },
  roleText: {
    color: "#da9306",
    marginTop: 4,
    fontWeight: "600",
  },
  topRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    backgroundColor: "#3a0a57",
    padding: 10,
    borderRadius: 14,
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#da9306",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: "#2b0540",
    fontSize: 10,
    fontWeight: "800",
  },
  menuBtn: {
    backgroundColor: "#3a0a57",
    padding: 10,
    borderRadius: 14,
  },
});
