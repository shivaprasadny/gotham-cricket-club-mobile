import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "../Avatar";

type Props = {
  user: any;
  navigation: any;
  unreadCount: number;
  unreadChatCount: number;
  onOpenMenu: () => void;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning 🌤️";
  if (hour >= 12 && hour < 17) return "Good Afternoon ☀️";
  if (hour >= 17 && hour < 21) return "Good Evening 🌆";
  return "Good Night 🌙";
}

const HomeHeader = ({ user, navigation, unreadCount, unreadChatCount, onOpenMenu }: Props) => {
  const [previewVisible, setPreviewVisible] = useState(false);

  const roleLabel =
    user?.role === "ADMIN"
      ? "Admin"
      : user?.role === "CAPTAIN"
      ? "Captain"
      : "Player";

  return (
    <>
      {/* Large avatar preview modal — same pattern as MemberProfileScreen */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewVisible(false)}>
          <Pressable style={styles.previewContent} onPress={() => undefined}>
            <TouchableOpacity
              style={styles.previewClose}
              onPress={() => setPreviewVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.previewCloseText}>✕</Text>
            </TouchableOpacity>
            <Avatar name={user?.fullName} userId={user?.id} imageUrl={user?.profileImageUrl} size={200} />
            <Text style={styles.previewName}>{user?.fullName ?? "Member"}</Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Compact header card */}
      <View style={styles.card}>
        {/* Top row: greeting (left) + icons (right) */}
        <View style={styles.topRow}>
          <Text style={styles.greeting}>{getGreeting()}</Text>

          <View style={styles.icons}>
            <TouchableOpacity
              style={styles.iconBtn}
              accessibilityLabel="Open chats"
              onPress={() => navigation.navigate("ChatList")}
            >
              <Ionicons name="chatbubbles-outline" size={22} color="#da9306" />
              {unreadChatCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadChatCount > 9 ? "9+" : unreadChatCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Ionicons name="notifications-outline" size={22} color="#da9306" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={onOpenMenu}>
              <Ionicons name="menu" size={24} color="#da9306" />
            </TouchableOpacity>
          </View>
        </View>

        {/* User row: avatar (left) + name + role (right) */}
        <View style={styles.userRow}>
          {/* Tap avatar to open large preview */}
          <TouchableOpacity onPress={() => setPreviewVisible(true)} activeOpacity={0.8}>
            <Avatar name={user?.fullName} userId={user?.id} imageUrl={user?.profileImageUrl} size={46} />
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Text style={styles.name} numberOfLines={1}>{user?.fullName ?? "Member"}</Text>
            <Text style={styles.role}>{roleLabel}</Text>
          </View>
        </View>
      </View>
    </>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#3a0a57",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },

  // — Top row —
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    color: "#e9d8f7",
    fontSize: 16,
    fontWeight: "700",
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#da9306",
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#2b0540",
    fontSize: 9,
    fontWeight: "900",
  },

  // — User row —
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  role: {
    color: "#da9306",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // — Avatar preview modal —
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewContent: {
    alignItems: "center",
    gap: 20,
  },
  previewClose: {
    position: "absolute",
    top: -48,
    right: -12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCloseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  previewName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
});
