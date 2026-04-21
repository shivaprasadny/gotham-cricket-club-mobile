import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  confirmPayment,
  getFeeAssignments,
  waiveFee,
} from "../services/feeService";

type Props = {
  route: any;
  navigation: any;
};

type AssignmentItem = {
  assignmentId: number;
  feeDefinitionId: number;
  userId: number;
  fullName: string;
  title: string;
  feeType: string;
  amount: number;
  dueDate: string;
  description?: string;
  matchId?: number | null;
  eventId?: number | null;
  teamId?: number | null;
  season?: string | null;
  status: "UNPAID" | "PAYMENT_SUBMITTED" | "PAID" | "WAIVED";
  paymentMethod?: string | null;
  paymentNote?: string | null;
  assignedAt?: string;
  submittedAt?: string | null;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  waivedAt?: string | null;
  waiverReason?: string | null;
  lastReminderSentAt?: string | null;
  reminderCount?: number;
};

type FilterType = "ALL" | "UNPAID" | "SUBMITTED" | "PAID" | "WAIVED";

const FeeDetailsScreen = ({ route }: Props) => {
  const { feeId } = route.params; // selected fee id

  const [assignments, setAssignments] = useState<AssignmentItem[]>([]); // assigned users
  const [loading, setLoading] = useState(true); // page loading
  const [refreshing, setRefreshing] = useState(false); // pull refresh

  const [filter, setFilter] = useState<FilterType>("ALL"); // current filter

  const [waiveModalVisible, setWaiveModalVisible] = useState(false); // waive modal
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null); // selected row
  const [waiverReason, setWaiverReason] = useState(""); // waive note
  const [waiving, setWaiving] = useState(false); // waive loader

  // Load fee assignments
  const loadAssignments = async () => {
    try {
      const data = await getFeeAssignments(feeId);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.log("FEE DETAILS LOAD ERROR:", error?.response?.data || error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load fee details"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      void loadAssignments();
    }, [feeId])
  );

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssignments();
  };

  // Format date safely
  const formatDate = (date?: string | null) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  // Filter assignment rows
  const filteredAssignments = useMemo(() => {
    if (filter === "ALL") return assignments;
    if (filter === "SUBMITTED") {
      return assignments.filter((item) => item.status === "PAYMENT_SUBMITTED");
    }
    return assignments.filter((item) => item.status === filter);
  }, [assignments, filter]);

  // Summary counts
  const counts = useMemo(() => {
    return {
      all: assignments.length,
      unpaid: assignments.filter((a) => a.status === "UNPAID").length,
      submitted: assignments.filter((a) => a.status === "PAYMENT_SUBMITTED").length,
      paid: assignments.filter((a) => a.status === "PAID").length,
      waived: assignments.filter((a) => a.status === "WAIVED").length,
    };
  }, [assignments]);

  // Confirm payment action
  const handleConfirm = async (assignmentId: number) => {
    try {
      const response = await confirmPayment(assignmentId);

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Payment confirmed"
      );

      await loadAssignments();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to confirm payment"
      );
    }
  };

  // Open waive modal
  const openWaiveModal = (assignmentId: number) => {
    setSelectedAssignmentId(assignmentId);
    setWaiverReason("");
    setWaiveModalVisible(true);
  };

  // Close waive modal
  const closeWaiveModal = () => {
    setSelectedAssignmentId(null);
    setWaiverReason("");
    setWaiveModalVisible(false);
  };

  // Submit waive action
  const handleWaive = async () => {
    if (!selectedAssignmentId) return;

    try {
      setWaiving(true);

      const response = await waiveFee(selectedAssignmentId, waiverReason.trim());

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Fee waived successfully"
      );

      closeWaiveModal();
      await loadAssignments();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to waive fee"
      );
    } finally {
      setWaiving(false);
    }
  };

  // Badge style by status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "UNPAID":
        return styles.unpaidBadge;
      case "PAYMENT_SUBMITTED":
        return styles.submittedBadge;
      case "PAID":
        return styles.paidBadge;
      case "WAIVED":
        return styles.waivedBadge;
      default:
        return styles.unpaidBadge;
    }
  };

  // Card for one assigned user
  const renderItem = ({ item }: { item: AssignmentItem }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.fullName}</Text>
          <Text style={styles.cardSubText}>${item.amount?.toFixed(2)}</Text>
        </View>

        <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
          {item.status}
        </Text>
      </View>

      <Text style={styles.cardText}>Due: {formatDate(item.dueDate)}</Text>

      {item.paymentMethod ? (
        <Text style={styles.cardText}>Method: {item.paymentMethod}</Text>
      ) : null}

      {item.paymentNote ? (
        <Text style={styles.cardText}>Note: {item.paymentNote}</Text>
      ) : null}

      {item.submittedAt ? (
        <Text style={styles.cardText}>Submitted: {formatDate(item.submittedAt)}</Text>
      ) : null}

      {item.confirmedBy ? (
        <Text style={styles.cardText}>Confirmed By: {item.confirmedBy}</Text>
      ) : null}

      {item.confirmedAt ? (
        <Text style={styles.cardText}>Confirmed At: {formatDate(item.confirmedAt)}</Text>
      ) : null}

      {item.waiverReason ? (
        <Text style={styles.cardText}>Waiver Reason: {item.waiverReason}</Text>
      ) : null}

      {item.lastReminderSentAt ? (
        <Text style={styles.cardText}>
          Last Reminder: {formatDate(item.lastReminderSentAt)}
        </Text>
      ) : null}

      {item.reminderCount !== undefined ? (
        <Text style={styles.cardText}>Reminders Sent: {item.reminderCount}</Text>
      ) : null}

      <View style={styles.actionRow}>
        {item.status === "PAYMENT_SUBMITTED" && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => handleConfirm(item.assignmentId)}
          >
            <Text style={styles.actionBtnText}>Confirm Paid</Text>
          </TouchableOpacity>
        )}

        {(item.status === "UNPAID" || item.status === "PAYMENT_SUBMITTED") && (
          <TouchableOpacity
            style={styles.waiveBtn}
            onPress={() => openWaiveModal(item.assignmentId)}
          >
            <Text style={styles.actionBtnText}>Waive</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Loading UI
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
        <Text style={styles.loadingText}>Loading fee details...</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={filteredAssignments}
        keyExtractor={(item) => item.assignmentId.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.screenTitle}>Fee Assignments</Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryText}>All: {counts.all}</Text>
              <Text style={styles.summaryText}>Unpaid: {counts.unpaid}</Text>
              <Text style={styles.summaryText}>Submitted: {counts.submitted}</Text>
              <Text style={styles.summaryText}>Paid: {counts.paid}</Text>
              <Text style={styles.summaryText}>Waived: {counts.waived}</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[
                { label: "All", value: "ALL" },
                { label: "Unpaid", value: "UNPAID" },
                { label: "Submitted", value: "SUBMITTED" },
                { label: "Paid", value: "PAID" },
                { label: "Waived", value: "WAIVED" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.filterBtn,
                    filter === item.value && styles.filterBtnSelected,
                  ]}
                  onPress={() => setFilter(item.value as FilterType)}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      filter === item.value && styles.filterBtnTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No assignments found for this filter.</Text>
        }
      />

      <Modal
        visible={waiveModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeWaiveModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Waive Fee</Text>

            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Waiver reason (optional)"
              placeholderTextColor="#7a7a7a"
              value={waiverReason}
              onChangeText={setWaiverReason}
              multiline
            />

            <TouchableOpacity
              style={styles.modalWaiveBtn}
              onPress={handleWaive}
              disabled={waiving}
            >
              <Text style={styles.modalBtnText}>
                {waiving ? "Waiving..." : "Confirm Waive"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={closeWaiveModal}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default FeeDetailsScreen;

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
  screenTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2b0540",
    textAlign: "center",
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 8,
  },
  summaryText: {
    color: "#111827",
    marginBottom: 4,
    fontWeight: "600",
  },
  filterRow: {
    paddingBottom: 12,
    gap: 8,
  },
  filterBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filterBtnSelected: {
    backgroundColor: "#2b0540",
    borderColor: "#2b0540",
  },
  filterBtnText: {
    color: "#2b0540",
    fontWeight: "600",
  },
  filterBtnTextSelected: {
    color: "#fff",
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
    color: "#da9306",
    marginTop: 2,
    fontWeight: "800",
    fontSize: 18,
  },
  cardText: {
    color: "#374151",
    marginBottom: 4,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },
  unpaidBadge: {
    backgroundColor: "#facc15",
    color: "#111",
  },
  submittedBadge: {
    backgroundColor: "#2563eb",
    color: "#fff",
  },
  paidBadge: {
    backgroundColor: "#16a34a",
    color: "#fff",
  },
  waivedBadge: {
    backgroundColor: "#6b7280",
    color: "#fff",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    borderRadius: 10,
  },
  waiveBtn: {
    flex: 1,
    backgroundColor: "#c0392b",
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#6b7280",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalWaiveBtn: {
    backgroundColor: "#c0392b",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  cancelBtn: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: "#111827",
    textAlign: "center",
    fontWeight: "700",
  },
});