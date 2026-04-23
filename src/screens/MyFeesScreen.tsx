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
  getMyFeeSummary,
  getMyFees,
  submitPayment,
} from "../services/feeService";

type Props = {
  navigation: any;
};

type FeeStatus = "UNPAID" | "PAYMENT_SUBMITTED" | "PAID" | "WAIVED";

type FeeItem = {
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
  status: FeeStatus;
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

type FeeSummary = {
  totalOutstandingAmount: number;
  unpaidCount: number;
  overdueCount: number;
  paymentSubmittedCount: number;
  paidCount: number;
};

type FeeTypeFilter =
  | "ALL_TYPES"
  | "MATCH_FEE"
  | "EVENT_FEE"
  | "NET_PRACTICE_FEE"
  | "ANNUAL_MEMBERSHIP_FEE"
  | "OTHER";

// Pending = unpaid + overdue together
type FilterType = "PENDING" | "SUBMITTED" | "PAID" | "WAIVED" | "ALL";

const MyFeesScreen = ({ navigation }: Props) => {
  // All fee rows for current logged-in user
  const [fees, setFees] = useState<FeeItem[]>([]);

  // Top summary data
  const [summary, setSummary] = useState<FeeSummary | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Current status filter
  const [filter, setFilter] = useState<FilterType>("PENDING");

  // Current fee type filter
  const [feeTypeFilter, setFeeTypeFilter] =
    useState<FeeTypeFilter>("ALL_TYPES");

  // Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Load both fee list and summary together
  const loadData = async () => {
    try {
      const [feeData, summaryData] = await Promise.all([
        getMyFees(),
        getMyFeeSummary(),
      ]);

      setFees(Array.isArray(feeData) ? feeData : []);
      setSummary(summaryData || null);
    } catch (error: any) {
      console.log("MY FEES LOAD ERROR:", error?.response?.data || error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load fees"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [])
  );

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Check whether fee is overdue
  // Backend stores UNPAID, but overdue is calculated by due date
  const isOverdue = (item: FeeItem) => {
    return (
      item.status === "UNPAID" &&
      item.dueDate &&
      new Date(item.dueDate).getTime() < Date.now()
    );
  };

  // Build filtered + sorted fee list
  const filteredFees = useMemo(() => {
    let result = [...fees];

    // 1) Apply status filter
    if (filter === "PENDING") {
      // Pending = unpaid + overdue together
      result = result.filter((item) => item.status === "UNPAID");
    } else if (filter === "SUBMITTED") {
      result = result.filter((item) => item.status === "PAYMENT_SUBMITTED");
    } else if (filter === "PAID") {
      result = result.filter((item) => item.status === "PAID");
    } else if (filter === "WAIVED") {
      result = result.filter((item) => item.status === "WAIVED");
    }

    // 2) Apply fee type filter
    if (feeTypeFilter !== "ALL_TYPES") {
      result = result.filter((item) => item.feeType === feeTypeFilter);
    }

    // 3) Sort results
    result.sort((a, b) => {
      // For Pending filter:
      // overdue first, unpaid second, then nearest due date first
      if (filter === "PENDING") {
        const aOverdue = isOverdue(a);
        const bOverdue = isOverdue(b);

        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;

        return aDate - bDate;
      }

      // Submitted / Paid / Waived / All:
      // sort by newest due date first
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;

      return bDate - aDate;
    });

    return result;
  }, [fees, filter, feeTypeFilter]);

  // Show label in UI
  const getStatusLabel = (item: FeeItem) => {
    if (isOverdue(item)) return "OVERDUE";
    return item.status;
  };

  // Badge style based on real visible status
  const getStatusStyle = (item: FeeItem) => {
    if (isOverdue(item)) return styles.overdueBadge;

    switch (item.status) {
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

  // Open payment modal
  const openPaymentModal = (item: FeeItem) => {
    setSelectedFee(item);
    setPaymentMethod(item.paymentMethod || "");
    setPaymentNote(item.paymentNote || "");
    setPaymentModalVisible(true);
  };

  // Close payment modal and clear fields
  const closePaymentModal = () => {
    setPaymentModalVisible(false);
    setSelectedFee(null);
    setPaymentMethod("");
    setPaymentNote("");
  };

  // Submit payment note / update payment note
  const handleSubmitPayment = async () => {
    if (!selectedFee) return;

    if (!paymentMethod.trim()) {
      Alert.alert("Error", "Please enter payment method");
      return;
    }

    if (!paymentNote.trim()) {
      Alert.alert("Error", "Please enter payment note");
      return;
    }

    try {
      setSubmittingPayment(true);

      const response = await submitPayment(selectedFee.assignmentId, {
        paymentMethod: paymentMethod.trim(),
        paymentNote: paymentNote.trim(),
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Payment submitted successfully"
      );

      closePaymentModal();
      await loadData();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to submit payment"
      );
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Render one fee card
  const renderFeeCard = ({ item }: { item: FeeItem }) => (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubTitle}>{item.feeType}</Text>
        </View>

        <Text style={[styles.statusBadge, getStatusStyle(item)]}>
          {getStatusLabel(item)}
        </Text>
      </View>

      <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>

      <Text style={styles.cardText}>
        Due: {item.dueDate ? new Date(item.dueDate).toLocaleString() : "N/A"}
      </Text>

      {item.description ? (
        <Text style={styles.cardText}>Description: {item.description}</Text>
      ) : null}

      {item.season ? (
        <Text style={styles.cardText}>Season: {item.season}</Text>
      ) : null}

      {item.paymentMethod ? (
        <Text style={styles.cardText}>Method: {item.paymentMethod}</Text>
      ) : null}

      {item.paymentNote ? (
        <Text style={styles.cardText}>Note: {item.paymentNote}</Text>
      ) : null}

      {item.confirmedBy ? (
        <Text style={styles.cardText}>Confirmed By: {item.confirmedBy}</Text>
      ) : null}

      {item.waiverReason ? (
        <Text style={styles.cardText}>Waiver Reason: {item.waiverReason}</Text>
      ) : null}

      {item.reminderCount !== undefined && item.reminderCount > 0 ? (
        <Text style={styles.cardText}>
          Reminders Sent: {item.reminderCount}
        </Text>
      ) : null}

      {/* User can submit or update payment note if fee is unpaid/submitted */}
      {(item.status === "UNPAID" || item.status === "PAYMENT_SUBMITTED") && (
        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => openPaymentModal(item)}
        >
          <Text style={styles.payBtnText}>
            {item.status === "PAYMENT_SUBMITTED"
              ? "Update Payment Note"
              : "I Paid"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
        <Text style={styles.loadingText}>Loading fees...</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={filteredFees}
        keyExtractor={(item) => item.assignmentId.toString()}
        renderItem={renderFeeCard}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.screenTitle}>My Fees</Text>

            {/* Top summary card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Fee Summary</Text>

              <Text style={styles.summaryText}>
                Total Outstanding: $
                {summary?.totalOutstandingAmount?.toFixed(2) || "0.00"}
              </Text>

              <Text style={styles.summaryText}>
                Pending: {(summary?.unpaidCount || 0) + (summary?.overdueCount || 0)}
              </Text>

              <Text style={styles.summaryText}>
                Overdue: {summary?.overdueCount || 0}
              </Text>

              <Text style={styles.summaryText}>
                Payment Submitted: {summary?.paymentSubmittedCount || 0}
              </Text>

              <Text style={styles.summaryText}>
                Paid: {summary?.paidCount || 0}
              </Text>
            </View>

            {/* Status filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[
                { label: "Pending", value: "PENDING" },
                { label: "Submitted", value: "SUBMITTED" },
                { label: "Paid", value: "PAID" },
                { label: "Waived", value: "WAIVED" },
                { label: "All", value: "ALL" },
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

            {/* Fee type filter */}
            <Text style={styles.filterSectionTitle}>Fee Type</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[
                { label: "All Types", value: "ALL_TYPES" },
                { label: "Match", value: "MATCH_FEE" },
                { label: "Event", value: "EVENT_FEE" },
                { label: "Net", value: "NET_PRACTICE_FEE" },
                { label: "Annual", value: "ANNUAL_MEMBERSHIP_FEE" },
                { label: "Other", value: "OTHER" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.filterBtn,
                    feeTypeFilter === item.value && styles.filterBtnSelected,
                  ]}
                  onPress={() => setFeeTypeFilter(item.value as FeeTypeFilter)}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      feeTypeFilter === item.value &&
                        styles.filterBtnTextSelected,
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
          <Text style={styles.emptyText}>No fees found for this filter.</Text>
        }
      />

      {/* Submit payment modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Submit Payment</Text>

            <Text style={styles.modalFeeTitle}>
              {selectedFee?.title || "Fee"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Payment Method (Cash / Zelle / Venmo / Other)"
              placeholderTextColor="#7a7a7a"
              value={paymentMethod}
              onChangeText={setPaymentMethod}
            />

            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Write payment note"
              placeholderTextColor="#7a7a7a"
              value={paymentNote}
              onChangeText={setPaymentNote}
              multiline
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmitPayment}
              disabled={submittingPayment}
            >
              <Text style={styles.submitBtnText}>
                {submittingPayment ? "Submitting..." : "Submit Payment"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={closePaymentModal}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default MyFeesScreen;

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
    fontSize: 28,
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
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 8,
    marginTop: 4,
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
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  cardSubTitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
    fontWeight: "600",
  },
  amountText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#da9306",
    marginBottom: 8,
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
  overdueBadge: {
    backgroundColor: "#dc2626",
    color: "#fff",
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
  payBtn: {
    marginTop: 12,
    backgroundColor: "#2b0540",
    paddingVertical: 12,
    borderRadius: 10,
  },
  payBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 20,
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
    marginBottom: 8,
  },
  modalFeeTitle: {
    color: "#111827",
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  submitBtnText: {
    color: "#2b0540",
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