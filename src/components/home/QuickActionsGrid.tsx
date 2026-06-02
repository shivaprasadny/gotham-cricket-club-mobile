import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  isAdmin: boolean;
  canManage: boolean;
  navigation: any;
};

const QuickActionsGrid = ({ isAdmin, canManage, navigation }: Props) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate("Events")}
        >
          <Ionicons name="calendar-outline" size={22} color="#da9306" />
          <Text style={styles.quickText}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate("MyFees")}
        >
          <Ionicons name="card-outline" size={22} color="#F4B400" />
          <Text style={styles.quickText}>My Fees</Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("AdminApproval")}
          >
            <Ionicons name="checkmark-circle-outline" size={22} color="#da9306" />
            <Text style={styles.quickText}>Approvals</Text>
          </TouchableOpacity>
        )}

        {canManage && (
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate("FeeList")}
          >
            <Ionicons name="wallet-outline" size={22} color="#F4B400" />
            <Text style={styles.quickText}>Fees Admin</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

export default QuickActionsGrid;

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  quickCard: {
    width: "48%",
    backgroundColor: "#3a0a57",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  quickText: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "700",
  },
});