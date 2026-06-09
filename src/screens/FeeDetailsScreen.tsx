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
  sendFeeReminder,
} from "../services/feeService";
import * as Clipboard from "expo-clipboard";


type CopyOption = "ALL" | "UNPAID" | "SUBMITTED" | "PAID" | "WAIVED";

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
  const [copyModalVisible, setCopyModalVisible] = useState(false);

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
  const paidItems = assignments.filter((a) => a.status === "PAID");
  const unpaidItems = assignments.filter((a) => a.status === "UNPAID");
  const submittedItems = assignments.filter(
    (a) => a.status === "PAYMENT_SUBMITTED"
  );
  const waivedItems = assignments.filter((a) => a.status === "WAIVED");

  const totalAmount = assignments.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const collectedAmount = paidItems.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const pendingAmount = unpaidItems.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const submittedAmount = submittedItems.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const waivedAmount = waivedItems.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  const collectionPercent =
    totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0;

  return {
    all: assignments.length,
    unpaid: unpaidItems.length,
    submitted: submittedItems.length,
    paid: paidItems.length,
    waived: waivedItems.length,
    totalAmount,
    collectedAmount,
    pendingAmount,
    submittedAmount,
    waivedAmount,
    collectionPercent,
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


  const handleSendReminder = async () => {
  try {
    const response = await sendFeeReminder(feeId);

    Alert.alert(
      "Success",
      typeof response === "string"
        ? response
        : "Reminder sent successfully"
    );

    await loadAssignments();
  } catch (error: any) {
    Alert.alert(
      "Error",
      error?.response?.data?.message ||
        "Failed to send reminder"
    );
  }
};
  

  const getCleanStatus = (status: string) => {
  if (status === "PAYMENT_SUBMITTED") return "Submitted";
  if (status === "NOT_GOING") return "Not Going";
  return status
    .toLowerCase()
    .replace("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatCopyDate = (date?: string | null) => {
  if (!date) return "N/A";

  try {
    return new Date(date).toLocaleDateString([], {
  month: "short",
  day: "numeric",
  year: "numeric",
});
  } catch {
    return date;
  }
};

const getFeeInfo = () => {
  const first = assignments[0];

  return {
    title: first?.title || "Fee",
    description: first?.description || "",
    amount: first?.amount ? `$${first.amount.toFixed(2)} per player` : "N/A",
    dueDate: formatCopyDate(first?.dueDate),
  };
};

const buildNameList = (items: AssignmentItem[]) => {
  if (items.length === 0) return "None";

  return items
    .map((item, index) => `${index + 1}. ${item.fullName}`)
    .join("\n");
};

const buildCopyText = (option: CopyOption) => {
  const feeInfo = getFeeInfo();

  const unpaid = assignments.filter((item) => item.status === "UNPAID");
  const submitted = assignments.filter(
    (item) => item.status === "PAYMENT_SUBMITTED"
  );
  const paid = assignments.filter((item) => item.status === "PAID");
  const waived = assignments.filter((item) => item.status === "WAIVED");

  const header = [
    "🏏 Gotham Cricket Club",
    "",
    `💰 ${feeInfo.title}`,
    feeInfo.description ? "" : null,
    feeInfo.description ? "📝 Description:" : null,
    feeInfo.description ? feeInfo.description : null,
    "",
    `💵 Fee Amount: ${feeInfo.amount}`,
    `📅 Due Date: ${feeInfo.dueDate}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (option === "UNPAID") {
    return `${header}

❌ UNPAID MEMBERS (${unpaid.length})

${buildNameList(unpaid)}

⚠️ The due date has passed.
Please submit your payment as soon as possible.

Thank you.`;
  }

  if (option === "SUBMITTED") {
    return `${header}

⏳ PAYMENT SUBMITTED (${submitted.length})

${buildNameList(submitted)}

Thank you for submitting your payment.
Payment confirmation is pending.`;
  }

  if (option === "PAID") {
    return `${header}

✅ PAID MEMBERS (${paid.length})

${buildNameList(paid)}

🙏 Thank you for your payment and support.`;
  }

  if (option === "WAIVED") {
    return `${header}

⚪ WAIVED MEMBERS (${waived.length})

${buildNameList(waived)}

Fee waived by administration.`;
  }

  return `${header}

━━━━━━━━━━━━━━━━━━

❌ UNPAID (${unpaid.length})

${buildNameList(unpaid)}

⚠️ The due date has passed.
Please submit your payment as soon as possible.

━━━━━━━━━━━━━━━━━━

⏳ PAYMENT SUBMITTED (${submitted.length})

${buildNameList(submitted)}

Thank you for submitting your payment.
Payment confirmation is pending.

━━━━━━━━━━━━━━━━━━

✅ PAID (${paid.length})

${buildNameList(paid)}

🙏 Thank you for your payment and support.

━━━━━━━━━━━━━━━━━━

⚪ WAIVED (${waived.length})

${buildNameList(waived)}

Fee waived by administration.

━━━━━━━━━━━━━━━━━━

📊 Summary

Total Members: ${assignments.length}
Unpaid: ${unpaid.length}
Submitted: ${submitted.length}
Paid: ${paid.length}
Waived: ${waived.length}`;
};


const handleCopyList = async (option: CopyOption) => {
  const text = buildCopyText(option);

  await Clipboard.setStringAsync(text);

  setCopyModalVisible(false);

  Alert.alert(
    "Copied",
    "Fee list copied. You can paste it in WhatsApp or announcement."
  );
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

  <View style={styles.summaryCard}>
  <Text style={styles.summaryTitle}>Summary</Text>

  <View style={styles.summaryTopRow}>
    <View>
      <Text style={styles.summarySmallLabel}>Members</Text>
      <Text style={styles.summaryBigValue}>{counts.all}</Text>
    </View>

    <View style={{ alignItems: "flex-end" }}>
      <Text style={styles.summarySmallLabel}>Collection</Text>
      <Text style={styles.summaryBigValue}>
        {counts.collectionPercent}%
      </Text>
    </View>
  </View>

  <View style={styles.moneyGrid}>
    <View style={styles.moneyItem}>
      <Text style={styles.moneyLabel}>Collected</Text>
      <Text style={styles.moneyGreen}>
        ${counts.collectedAmount.toFixed(0)}
      </Text>
    </View>

    <View style={styles.moneyItem}>
      <Text style={styles.moneyLabel}>Pending</Text>
      <Text style={styles.moneyRed}>
        ${counts.pendingAmount.toFixed(0)}
      </Text>
    </View>

    <View style={styles.moneyItem}>
      <Text style={styles.moneyLabel}>Submitted</Text>
      <Text style={styles.moneyBlue}>
        ${counts.submittedAmount.toFixed(0)}
      </Text>
    </View>

    <View style={styles.moneyItem}>
      <Text style={styles.moneyLabel}>Waived</Text>
      <Text style={styles.moneyGray}>
        ${counts.waivedAmount.toFixed(0)}
      </Text>
    </View>
  </View>

  <Text style={styles.countLine}>
    Unpaid {counts.unpaid} • Submitted {counts.submitted} • Paid{" "}
    {counts.paid} • Waived {counts.waived}
  </Text>
</View>

</View>

<View style={styles.topActionRow}>
  <TouchableOpacity
    style={styles.reminderBtn}
    onPress={handleSendReminder}
  >
    <Text style={styles.reminderBtnText}>
      🔔 Reminder
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.copyBtn}
    onPress={() => setCopyModalVisible(true)}
  >
    <Text style={styles.copyBtnText}>
      📋 Copy List
    </Text>
  </TouchableOpacity>
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
      <Modal
  visible={copyModalVisible}
  animationType="slide"
  transparent
  onRequestClose={() => setCopyModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>Copy Fee List</Text>

      <TouchableOpacity
        style={styles.copyOptionBtn}
        onPress={() => handleCopyList("ALL")}
      >
        <Text style={styles.copyOptionText}>All</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.copyOptionBtn}
        onPress={() => handleCopyList("UNPAID")}
      >
        <Text style={styles.copyOptionText}>Unpaid Only</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.copyOptionBtn}
        onPress={() => handleCopyList("PAID")}
      >
        <Text style={styles.copyOptionText}>Paid Only</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.copyOptionBtn}
        onPress={() => handleCopyList("SUBMITTED")}
      >
<Text style={styles.copyOptionText}>Submitted Only</Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={styles.copyOptionBtn}
  onPress={() => handleCopyList("WAIVED")}
>
  <Text style={styles.copyOptionText}>Waived Only</Text>
</TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => setCopyModalVisible(false)}
      >
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
  // Main list background and padding
  list: {
    padding: 16,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
  },

  // Loading screen center layout
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

  // Page title
  screenTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2b0540",
    textAlign: "center",
    marginBottom: 16,
  },

  // Summary card wrapper
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

  // Summary top row: members + collection percentage
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  summarySmallLabel: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },

  summaryBigValue: {
    color: "#2b0540",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },

  // Money stat grid
  moneyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  moneyItem: {
    width: "48%",
    backgroundColor: "#f8f5fb",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },

  moneyLabel: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "700",
  },

  moneyGreen: {
    color: "#16a34a",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },

  moneyRed: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },

  moneyBlue: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },

  moneyGray: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },

  countLine: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  // Reminder + Copy row
  topActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  reminderBtn: {
    flex: 1,
    backgroundColor: "#da9306",
    paddingVertical: 12,
    borderRadius: 12,
  },

  reminderBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "800",
  },

  copyBtn: {
    flex: 1,
    backgroundColor: "#2b0540",
    paddingVertical: 12,
    borderRadius: 12,
  },

  copyBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },

  // Filter chips
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

  // Assignment card
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

  // Status badges
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

  // Card action buttons
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

  // Modal shared layout
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

  // Copy list modal options
  copyOptionBtn: {
    backgroundColor: "#f8f5fb",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  copyOptionText: {
    color: "#2b0540",
    fontWeight: "800",
    textAlign: "center",
  },
});
