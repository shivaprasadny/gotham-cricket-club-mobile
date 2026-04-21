import React, { useState } from "react";
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
import { createFee } from "../services/feeService";

type Props = {
  navigation: any;
};

type FeeType =
  | "MATCH_FEE"
  | "EVENT_FEE"
  | "NET_PRACTICE_FEE"
  | "ANNUAL_MEMBERSHIP_FEE"
  | "OTHER";

const CreateFeeScreen = ({ navigation }: Props) => {
  const [title, setTitle] = useState(""); // fee title
  const [amount, setAmount] = useState(""); // fee amount text
  const [dueDate, setDueDate] = useState<Date | null>(null); // due date object
  const [description, setDescription] = useState(""); // optional note
  const [feeType, setFeeType] = useState<FeeType>("MATCH_FEE"); // selected fee type
  const [showDatePicker, setShowDatePicker] = useState(false); // toggle date picker
  const [submitting, setSubmitting] = useState(false); // submit loading

  // Create fee request
  const handleCreate = async () => {
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
      setSubmitting(true);

      const response = await createFee({
        title: title.trim(),
        amount: Number(amount),
        dueDate: dueDate.toISOString(),
        description: description.trim(),
        feeType,
        assignmentType: "ALL_MEMBERS", // temporary default
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Fee created successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create fee"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Format date safely
  const formatDate = (date: Date | null) => {
    if (!date) return "Select due date & time";
    return date.toLocaleString();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Fee</Text>

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
        style={styles.createBtn}
        onPress={handleCreate}
        disabled={submitting}
      >
        <Text style={styles.createBtnText}>
          {submitting ? "Creating..." : "Create Fee"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CreateFeeScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
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
  createBtn: {
    backgroundColor: "#da9306",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
  },
  createBtnText: {
    textAlign: "center",
    color: "#2b0540",
    fontWeight: "700",
    fontSize: 16,
  },
});