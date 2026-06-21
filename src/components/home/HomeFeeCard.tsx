import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  navigation: any;
  fees: MyFeeItem[];
};

export type MyFeeItem = {
  assignmentId: number;
  title: string;
  amount: number;
  dueDate: string;
  status: "UNPAID" | "PAYMENT_SUBMITTED" | "PAID" | "WAIVED";
};

const HomeFeeCard = ({ navigation, fees }: Props) => {
  // Filter pending fees
  const pendingFees = useMemo(
    () =>
      fees.filter(
        (f) => f.status === "UNPAID" 
      ),
    [fees]
  );

  // Calculate total pending
  const totalPending = useMemo(
    () => pendingFees.reduce((sum, f) => sum + f.amount, 0),
    [pendingFees]
  );

  // Count overdue fees
  const overdueCount = useMemo(() => {
    const now = new Date();
    return pendingFees.filter((f) => new Date(f.dueDate) < now).length;
  }, [pendingFees]);

  // Hide card if no pending fees
  if (pendingFees.length === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("MyFees")}
      activeOpacity={0.85}
    >
      <Text style={styles.title}>💰 Fees Summary</Text>

      <Text style={styles.amount}>${totalPending.toFixed(2)}</Text>

      <Text style={styles.text}>
        {pendingFees.length} pending payment(s)
      </Text>

      {overdueCount > 0 && (
        <Text style={styles.warning}>
          ⚠ {overdueCount} overdue payment(s)
        </Text>
      )}

      <Text style={styles.link}>Tap to view details</Text>
    </TouchableOpacity>
  );
};

export default HomeFeeCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 6,
  },
  amount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#da9306",
    marginBottom: 4,
  },
  text: {
    color: "#374151",
    fontWeight: "600",
  },
  warning: {
    color: "#dc2626",
    marginTop: 4,
    fontWeight: "700",
  },
  link: {
    marginTop: 8,
    color: "#2b0540",
    fontWeight: "700",
  },
});
