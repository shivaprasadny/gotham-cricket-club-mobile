import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

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

const FEE_TYPES: { label: string; value: FeeType }[] = [
  { label: "Match", value: "MATCH_FEE" },
  { label: "Event", value: "EVENT_FEE" },
  { label: "Net", value: "NET_PRACTICE_FEE" },
  { label: "Annual", value: "ANNUAL_MEMBERSHIP_FEE" },
  { label: "Other", value: "OTHER" },
];

const EditFeeScreen = ({ route, navigation }: Props) => {
  const { feeId } = route.params;

  // =========================
  // FORM STATE
  // =========================
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [tempDueDate, setTempDueDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [feeType, setFeeType] = useState<FeeType>("MATCH_FEE");

  // =========================
  // UI STATE
  // =========================
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // =========================
  // LOAD FEE DATA
  // =========================
  useEffect(() => {
    void loadFee();
  }, [feeId]);

  const loadFee = async () => {
    try {
      setLoading(true);

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
      setAmount(fee.amount !== null && fee.amount !== undefined ? String(fee.amount) : "");
      setDueDate(fee.dueDate ? new Date(fee.dueDate) : null);
      setTempDueDate(fee.dueDate ? new Date(fee.dueDate) : new Date());
      setDescription(fee.description || "");
      setFeeType((fee.feeType || "MATCH_FEE") as FeeType);
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

  // =========================
  // ANDROID SAFE DATE + TIME PICKER
  // =========================
  const openDatePicker = () => {
    if (Platform.OS === "android") {
      const baseDate = dueDate || new Date();

      // Step 1: Pick date
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: "date",
        is24Hour: false,
        onChange: (event, selectedDate) => {
          if (event.type !== "set" || !selectedDate) return;

          // Step 2: Pick time
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: "time",
            is24Hour: false,
            onChange: (timeEvent, selectedTime) => {
              if (timeEvent.type !== "set" || !selectedTime) return;

              const finalDate = new Date(selectedDate);
              finalDate.setHours(selectedTime.getHours());
              finalDate.setMinutes(selectedTime.getMinutes());
              finalDate.setSeconds(0);
              finalDate.setMilliseconds(0);

              setDueDate(finalDate);
            },
          });
        },
      });

      return;
    }

    // iOS uses inline picker
    setTempDueDate(dueDate || new Date());
    setShowDatePicker(true);
  };

  // =========================
  // iOS DATE ACTIONS
  // =========================
  const handleDoneDate = () => {
    setDueDate(tempDueDate);
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Select due date & time";
    return date.toLocaleString();
  };

  // =========================
  // UPDATE FEE
  // =========================
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
        assignmentType: "ALL_MEMBERS",
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Fee updated successfully",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update fee"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE FEE
  // =========================
  const handleDelete = () => {
    Alert.alert("Delete Fee", "Are you sure you want to delete this fee?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);

            const response = await deleteFeeById(feeId);

            Alert.alert(
              "Success",
              typeof response === "string"
                ? response
                : "Fee deleted successfully",
              [{ text: "OK", onPress: () => navigation.navigate("FeeList") }]
            );
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

  // =========================
  // LOADING UI
  // =========================
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading fee...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Edit Fee</Text>

          {/* =========================
              BASIC DETAILS CARD
          ========================= */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Fee Details</Text>

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
            <TouchableOpacity style={styles.input} onPress={openDatePicker}>
              <Text style={styles.inputText}>{formatDate(dueDate)}</Text>
            </TouchableOpacity>

            {/* iOS inline picker only. Android uses DateTimePickerAndroid.open() */}
            {Platform.OS === "ios" && showDatePicker && (
              <View style={styles.inlinePickerCard}>
                <DateTimePicker
                  value={tempDueDate}
                  mode="datetime"
                  display="inline"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTempDueDate(selectedDate);
                    }
                  }}
                />

                <View style={styles.dateActionRow}>
                  <TouchableOpacity
                    style={styles.dateCancelBtn}
                    onPress={handleCancelDate}
                  >
                    <Text style={styles.dateCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dateDoneBtn}
                    onPress={handleDoneDate}
                  >
                    <Text style={styles.dateDoneBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Optional description"
              placeholderTextColor="#7a7a7a"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* =========================
              FEE TYPE CARD
          ========================= */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Fee Type</Text>

            <View style={styles.row}>
              {FEE_TYPES.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.typeBtn,
                    feeType === item.value && styles.typeBtnSelected,
                  ]}
                  onPress={() => setFeeType(item.value)}
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
          </View>

          {/* =========================
              ACTION BUTTONS
          ========================= */}
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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default EditFeeScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },

  container: {
    padding: 20,
    paddingBottom: 140,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f5fb",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2b0540",
    marginBottom: 14,
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

  inlinePickerCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },

  dateActionRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  dateCancelBtn: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    paddingVertical: 10,
    borderRadius: 8,
  },

  dateCancelBtnText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#111827",
  },

  dateDoneBtn: {
    flex: 1,
    backgroundColor: "#2b0540",
    paddingVertical: 10,
    borderRadius: 8,
  },

  dateDoneBtnText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#fff",
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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