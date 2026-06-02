import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  pendingCount: number;
  navigation: any;
};

/**
 * Shows admin approval reminder card
 * Only visible when pendingCount > 0
 */
const PendingApprovalsSection = ({
  pendingCount,
  navigation,
}: Props) => {
  // Hide component if no pending approvals
  if (pendingCount <= 0) {
    return null;
  }

  return (
    <>
      {/* Section heading */}
      <Text style={styles.sectionTitle}>Admin Actions</Text>

      {/* Approval card */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("AdminApproval")}
      >
        {/* Left icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="checkmark-circle-outline"
            size={26}
            color="#da9306"
          />
        </View>

        {/* Right content */}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            Pending Member Approvals
          </Text>

          <Text style={styles.description}>
            {pendingCount} player(s) waiting for approval.
          </Text>

          <Text style={styles.link}>
            Tap to review requests
          </Text>
        </View>
      </TouchableOpacity>
    </>
  );
};

export default PendingApprovalsSection;

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },

  card: {
    backgroundColor: "#3a0a57",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2b0540",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },

  description: {
    color: "#ddd",
    marginBottom: 6,
  },

  link: {
    color: "#da9306",
    fontWeight: "700",
  },
});