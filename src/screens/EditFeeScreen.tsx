import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { deleteFeeById, getAllFees, updateFee } from "../services/feeService";

type Props = {
  route: any;
  navigation: any;
};

type FeeType =
  | "MATCH_FEE"
  | "EVENT_FEE"
  | "NET_PRACTICE_FEE"
  | "ANNUAL_MEMBERSHIP_FEE"
  | "OTHER";

const EditFeeScreen = ({ route, navigation }: Props) => {
  const { feeId } = route.params; // selected fee id

  const [title, setTitle] = useState(""); // fee title
  const [amount, setAmount] = useState(""); // fee amount
  const [dueDate, setDueDate] = useState<Date | null>(null); // due date
  const [description, setDescription] = useState(""); // fee note
  const [feeType, setFeeType] = useState<FeeType>("MATCH_FEE"); // fee type

  const [showDatePicker, setShowDatePicker] = useState(false); // date picker
  const [loading, setLoading] = useState(true); // initial load
  const [saving, setSaving] = useState(false); // save loading
  const [deleting, setDeleting] = useState(false); // delete loading

  // Load selected fee data
  const loadFee = async () => {
    try {
      const allFees = await getAllFees();
      const fee = Array.isArray(allFees)
        ? allFees.find((item) => item.id === feeId)
        : null;

      if (!fee) {
        Alert.alert("Error", "Fee not found");
        navigation.goBack();
        return;
      }

      setTitle(fee.title || "");
      setAmount(String(fee.amount || ""));
      setDueDate(fee.dueDate ? new Date(fee.dueDate) : null);
      setDescription(fee.description || "");
      setFeeType(fee.feeType || "MATCH_FEE");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load fee"
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFee();
  }, [feeId]);

  // Save updated fee
  const handleUpdate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter fee title");
      return;
    }

    if (!amount.trim() || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!dueDate) {
      Alert.alert("Error", "Please select due date");
      return;
    }

    try {
      setSaving(true);

      const response = await updateFee(feeId, {
        title: title.trim(),
        amount: Number(amount),
        dueDate: dueDate.toISOString(),
        description: description.trim(),
        feeType,
        assignmentType: "ALL_MEMBERS", // keep current simple mode
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Fee updated successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update fee"
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete fee with confirmation
  const handleDelete = () => {
    Alert.alert("Delete Fee", "Are you sure you want to delete this fee?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);

            const response = await deleteFeeById(feeId);

            Alert.alert(
              "Success",
              typeof response === "string" ? response : "Fee deleted successfully"
            );

            navigation.navigate("FeeList");
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.response?.data?.message || "Failed to delete fee"
            );
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  // Format date safely
  const formatDate = (date: Date | null) => {
    if (!date) return "Select due date & time";
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading fee...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Fee</Text>

      <Text style={styles.label}>Fee Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter fee title"
        placeholderTextColor="#7a7a7a"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Amount</Text>
      <View style={styles.amountRow}>
        <View style={styles.dollarBox}>
          <Text style={styles.dollarText}>$</Text>
        </View>

        <TextInput
          style={styles.amountInput}
          placeholder="Enter amount"
          placeholderTextColor="#7a7a7a"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <Text style={styles.label}>Due Date</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.inputText}>{formatDate(dueDate)}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="datetime"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selectedDate) => {
            if (Platform.OS !== "ios") {
              setShowDatePicker(false);
            }

            if (selectedDate) {
              setDueDate(selectedDate);
            }
          }}
        />
      )}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        placeholder="Optional description"
        placeholderTextColor="#7a7a7a"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Fee Type</Text>
      <View style={styles.row}>
        {[
          { label: "Match", value: "MATCH_FEE" },
          { label: "Event", value: "EVENT_FEE" },
          { label: "Net", value: "NET_PRACTICE_FEE" },
          { label: "Annual", value: "ANNUAL_MEMBERSHIP_FEE" },
          { label: "Other", value: "OTHER" },
        ].map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.typeBtn,
              feeType === item.value && styles.typeBtnSelected,
            ]}
            onPress={() => setFeeType(item.value as FeeType)}
          >
            <Text
              style={[
                styles.typeText,
                feeType === item.value && styles.typeTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleUpdate}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saving ? "Saving..." : "Save Changes"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDelete}
        disabled={deleting}
      >
        <Text style={styles.deleteBtnText}>
          {deleting ? "Deleting..." : "Delete Fee"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditFeeScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
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
    color: "#2b0540",
    fontWeight: "700",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 2,
    color: "#2b0540",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  inputText: {
    color: "#111827",
    fontWeight: "500",
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 12,
  },
  dollarBox: {
    width: 48,
    backgroundColor: "#2b0540",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dollarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderLeftWidth: 0,
    padding: 12,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: "#fff",
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  typeBtnSelected: {
    backgroundColor: "#2b0540",
    borderColor: "#2b0540",
  },
  typeText: {
    color: "#2b0540",
    fontWeight: "600",
  },
  typeTextSelected: {
    color: "#fff",
  },
  saveBtn: {
    backgroundColor: "#da9306",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 12,
  },
  saveBtnText: {
    textAlign: "center",
    color: "#2b0540",
    fontWeight: "700",
    fontSize: 16,
  },
  deleteBtn: {
    backgroundColor: "#c0392b",
    padding: 14,
    borderRadius: 10,
  },
  deleteBtnText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});