import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  navigation: any;
  onClose: () => void;
  onLogout: () => void;
};

/**
 * Side menu modal for home screen
 */
const HomeMenuModal = ({
  visible,
  navigation,
  onClose,
  onLogout,
}: Props) => {
  /**
   * Close menu first, then navigate
   */
  const goTo = (screenName: string, params?: any) => {
    onClose();
    navigation.navigate(screenName, params);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Dark overlay */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Stop modal content click from closing */}
        <Pressable style={styles.menuBox}>
          {/* Header */}
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Menu</Text>

            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Menu items */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => goTo("Profile")}
          >
            <Ionicons name="person-outline" size={20} color="#da9306" />
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => goTo("Notifications")}
          >
            <Ionicons name="notifications-outline" size={20} color="#da9306" />
            <Text style={styles.menuText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => goTo("ChatList")}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#da9306" />
            <Text style={styles.menuText}>Chats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => goTo("MyDashboard")}
          >
            <Ionicons name="speedometer-outline" size={20} color="#da9306" />
            <Text style={styles.menuText}>My Dashboard</Text>
          </TouchableOpacity>

{/* Members */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => goTo("Members")}
>
  <Ionicons name="people-outline" size={20} color="#da9306" />
  <Text style={styles.menuText}>Members</Text>
</TouchableOpacity>


{/* Teams */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => goTo("Teams")}
>
  <Ionicons name="shield-outline" size={20} color="#da9306" />
  <Text style={styles.menuText}>Teams</Text>
</TouchableOpacity>

{/* Leagues */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => goTo("Leagues")}
>
  <Ionicons name="trophy-outline" size={20} color="#da9306" />
  <Text style={styles.menuText}>Leagues</Text>
</TouchableOpacity>


          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => goTo("MyFees")}
          >
            <Ionicons name="card-outline" size={20} color="#da9306" />
            <Text style={styles.menuText}>My Fees</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => goTo("Events")}
          >
            <Ionicons name="calendar-outline" size={20} color="#da9306" />
            <Text style={styles.menuText}>Events</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => goTo("Leaderboard", { scope: "CLUB" })}
          >
            <Ionicons name="stats-chart-outline" size={20} color="#da9306" />
            <Text style={styles.menuText}>Club Leaderboards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => goTo("Scorecards")}
          >
            <Ionicons name="document-text-outline" size={20} color="#da9306" />
            <Text style={styles.menuText}>Scorecards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => goTo("Polls")}
          >
            <Ionicons name="checkbox-outline" size={20} color="#da9306" />
            <Text style={styles.menuText}>Polls</Text>
          </TouchableOpacity>

          {/* Logout button */}
          <TouchableOpacity
            style={styles.logoutItem}
            onPress={onLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default HomeMenuModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },

  menuBox: {
    width: "78%",
    height: "100%",
    backgroundColor: "#2b0540",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  menuTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#3a0a57",
  },

  menuText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
    marginTop: 20,
  },

  logoutText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "700",
  },
});
