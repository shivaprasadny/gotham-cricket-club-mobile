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
import { getAllFees } from "../services/feeService";

type Props = {
  navigation: any;
};

type FeeItem = {
  id: number;
  title: string;
  feeType: string;
  amount: number;
  dueDate: string;
  description?: string;
  matchId?: number | null;
  eventId?: number | null;
  teamId?: number | null;
  season?: string | null;
  assignmentType: string;
  createdBy?: string;
  createdAt?: string;
  active: boolean;
};

const FeeListScreen = ({ navigation }: Props) => {
  const [fees, setFees] = useState<FeeItem[]>([]); // store fee definitions
  const [loading, setLoading] = useState(true); // page loading
  const [refreshing, setRefreshing] = useState(false); // pull refresh

  // Load all fee definitions
  const loadFees = async () => {
    try {
      const data = await getAllFees();
      setFees(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.log("FEE LIST LOAD ERROR:", error?.response?.data || error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load fees"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload screen on focus
  useFocusEffect(
    useCallback(() => {
      void loadFees();
    }, [])
  );

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFees();
  };

  // Format date safely
  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  // Format fee type for display
  const formatFeeType = (feeType?: string) => {
    switch (feeType) {
      case "MATCH_FEE":
        return "Match Fee";
      case "EVENT_FEE":
        return "Event Fee";
      case "NET_PRACTICE_FEE":
        return "Net Practice Fee";
      case "ANNUAL_MEMBERSHIP_FEE":
        return "Annual Membership Fee";
      case "OTHER":
        return "Other";
      default:
        return feeType || "N/A";
    }
  };

  // Format assignment type for display
  const formatAssignmentType = (assignmentType?: string) => {
    switch (assignmentType) {
      case "ALL_MEMBERS":
        return "All Members";
      case "SELECTED_USERS":
        return "Selected Users";
      case "SQUAD_PLAYERS":
        return "Squad Players";
      case "TEAM_MEMBERS":
        return "Team Members";
      case "GOING_USERS":
        return "Going Users";
      default:
        return assignmentType || "N/A";
    }
  };

  // Card for one fee definition
  const renderItem = ({ item }: { item: FeeItem }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate("FeeDetails", { feeId: item.id })}
    >
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubText}>
            {formatFeeType(item.feeType)} • {formatAssignmentType(item.assignmentType)}
          </Text>
        </View>

        <Text style={styles.amountText}>${item.amount?.toFixed(2)}</Text>
      </View>

      <Text style={styles.cardText}>Due: {formatDate(item.dueDate)}</Text>

      {item.description ? (
        <Text style={styles.cardText}>Description: {item.description}</Text>
      ) : null}

      {item.season ? (
        <Text style={styles.cardText}>Season: {item.season}</Text>
      ) : null}

      {item.createdBy ? (
        <Text style={styles.cardText}>Created By: {item.createdBy}</Text>
      ) : null}

      {item.createdAt ? (
        <Text style={styles.cardText}>Created At: {formatDate(item.createdAt)}</Text>
      ) : null}

      <View style={styles.footerRow}>
        <Text style={styles.viewText}>Tap to view assigned users</Text>
      </View>
    </TouchableOpacity>
  );

  // Loading UI
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
        <Text style={styles.loadingText}>Loading fees...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={fees}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate("CreateFee")}
        >
          <Text style={styles.createBtnText}>Create Fee</Text>
        </TouchableOpacity>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No fees created yet.</Text>
      }
    />
  );
};

export default FeeListScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
  },
  center: {
    flex: 1,
    backgroundColor: "#f8f5fb",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#2b0540",
    fontWeight: "700",
  },
  createBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  createBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubText: {
    color: "#6b7280",
    marginTop: 2,
    fontWeight: "600",
    fontSize: 13,
  },
  amountText: {
    color: "#da9306",
    fontWeight: "800",
    fontSize: 20,
  },
  cardText: {
    color: "#374151",
    marginBottom: 4,
    fontWeight: "500",
  },
  footerRow: {
    marginTop: 8,
  },
  viewText: {
    color: "#2b0540",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#6b7280",
    fontWeight: "600",
  },
});