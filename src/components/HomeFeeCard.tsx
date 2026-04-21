import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getMyFees } from "../services/feeService";

type Props = {
  navigation: any;
};

type MyFeeItem = {
  assignmentId: number;
  title: string;
  amount: number;
  dueDate: string;
  status: "UNPAID" | "PAYMENT_SUBMITTED" | "PAID" | "WAIVED";
};

const HomeFeeCard = ({ navigation }: Props) => {
  const [fees, setFees] = useState<MyFeeItem[]>([]); // store user fees
  const [loading, setLoading] = useState(true); // loading state

  // Load user fees
  const loadFees = async () => {
    try {
      const data = await getMyFees();
      setFees(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("HOME FEE LOAD ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  // Reload when screen is focused
  useFocusEffect(
    useCallback(() => {
      void loadFees();
    }, [])
  );

  // Filter pending fees
  const pendingFees = useMemo(
    () =>
      fees.filter(
        (f) => f.status === "UNPAID" || f.status === "PAYMENT_SUBMITTED"
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

  // Loading UI
  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color="#da9306" />
      </View>
    );
  }

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