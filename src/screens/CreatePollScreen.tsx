import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { createPoll, updatePollDeadline } from "../services/pollService";
import { getAllMembers } from "../services/memberService";
import { PollAudienceType, PollResponse, PollType } from "../types/poll";

type Member = { userId: number; fullName: string; email: string };
type Props = {
  navigation: any;
  route: any; // optional: { poll: PollResponse } when editing deadline
};

const CreatePollScreen = ({ navigation, route }: Props) => {
  // If a poll is passed, we are in "edit deadline" mode
  const existingPoll: PollResponse | undefined = route.params?.poll;
  const isEditMode = !!existingPoll;

  // ─── Form state ──────────────────────────────────────────────────────────
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [pollType, setPollType] = useState<PollType>("SINGLE_CHOICE");
  const [audienceType, setAudienceType] = useState<PollAudienceType>("CLUB");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState<Date>(new Date(Date.now() + 7 * 86400_000)); // +7 days

  // iOS date picker
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Custom audience member picker
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [memberPickerVisible, setMemberPickerVisible] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Pre-fill deadline when editing
  useEffect(() => {
    if (isEditMode && existingPoll.deadlineAt) {
      setHasDeadline(true);
      setDeadline(new Date(existingPoll.deadlineAt));
    }
  }, []);

  // Load members for custom audience picker
  useEffect(() => {
    getAllMembers()
      .then((data: any[]) =>
        setAllMembers(
          data.map((m) => ({ userId: m.id ?? m.userId, fullName: m.fullName, email: m.email }))
        )
      )
      .catch(() => {});
  }, []);

  // ─── Date picker helpers ─────────────────────────────────────────────────

  const openDeadlinePicker = () => {
    const base = deadline || new Date();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: base,
        mode: "date",
        minimumDate: new Date(),
        onChange: (_e, date) => {
          if (!date) return;
          DateTimePickerAndroid.open({
            value: date,
            mode: "time",
            onChange: (_e2, time) => {
              if (time) setDeadline(time);
            },
          });
        },
      });
    } else {
      setShowDatePicker(true);
    }
  };

  // ─── Option helpers ──────────────────────────────────────────────────────

  const addOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  // ─── Audience helpers ────────────────────────────────────────────────────

  const toggleMember = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const visibleMembers = allMembers.filter((m) =>
    m.fullName.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // ─── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (isEditMode) {
      // Edit deadline only
      if (hasDeadline && deadline <= new Date()) {
        Alert.alert("Invalid deadline", "Deadline must be in the future");
        return;
      }
      try {
        setSubmitting(true);
        await updatePollDeadline(existingPoll.pollId, {
          deadlineAt: hasDeadline ? deadline.toISOString() : null,
        });
        Alert.alert("Done", "Deadline updated", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } catch (err: any) {
        Alert.alert("Error", err?.response?.data?.message || "Could not update deadline");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Create poll validation
    if (!question.trim()) {
      Alert.alert("Required", "Please enter a question");
      return;
    }
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      Alert.alert("Required", "Please add at least 2 options");
      return;
    }
    if (audienceType === "CUSTOM" && selectedMemberIds.length === 0) {
      Alert.alert("Required", "Select at least one member for the custom audience");
      return;
    }
    if (hasDeadline && deadline <= new Date()) {
      Alert.alert("Invalid deadline", "Deadline must be in the future");
      return;
    }

    try {
      setSubmitting(true);
      await createPoll({
        question: question.trim(),
        pollType,
        audienceType,
        audienceUserIds: audienceType === "CUSTOM" ? selectedMemberIds : undefined,
        options: cleanOptions,
        deadlineAt: hasDeadline ? deadline.toISOString() : null,
      });
      Alert.alert("Poll created", "Members have been notified.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Could not create poll");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (isEditMode) {
    return (
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>{existingPoll.question}</Text>
          <Text style={styles.hint}>You can only extend the deadline.</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Has deadline</Text>
            <Switch
              value={hasDeadline}
              onValueChange={setHasDeadline}
              trackColor={{ true: "#2b0540" }}
              thumbColor="#fff"
            />
          </View>

          {hasDeadline && (
            <TouchableOpacity style={styles.deadlineBtn} onPress={openDeadlinePicker}>
              <Ionicons name="calendar-outline" size={16} color="#2b0540" />
              <Text style={styles.deadlineBtnText}>{deadline.toLocaleString()}</Text>
            </TouchableOpacity>
          )}
          {hasDeadline && showDatePicker && Platform.OS === "ios" && (
            <DateTimePicker
              value={deadline}
              mode="datetime"
              minimumDate={new Date()}
              onChange={(_e, d) => {
                setShowDatePicker(false);
                if (d) setDeadline(d);
              }}
            />
          )}

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>{submitting ? "Saving..." : "Save Deadline"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Question */}
        <Text style={styles.sectionTitle}>Question</Text>
        <TextInput
          style={styles.questionInput}
          value={question}
          onChangeText={setQuestion}
          placeholder="e.g. When should we hold the next practice?"
          placeholderTextColor="#9b8ca1"
          multiline
          maxLength={500}
        />

        {/* Options */}
        <Text style={styles.sectionTitle}>Options</Text>
        {options.map((opt, index) => (
          <View key={index} style={styles.optionRow}>
            <TextInput
              style={styles.optionInput}
              value={opt}
              onChangeText={(v) => updateOption(index, v)}
              placeholder={`Option ${index + 1}`}
              placeholderTextColor="#9b8ca1"
              maxLength={200}
            />
            {options.length > 2 && (
              <TouchableOpacity onPress={() => removeOption(index)} style={styles.removeBtn}>
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        {options.length < 10 && (
          <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
            <Ionicons name="add-circle-outline" size={18} color="#6d28d9" />
            <Text style={styles.addOptionText}>Add Option</Text>
          </TouchableOpacity>
        )}

        {/* Poll type */}
        <Text style={styles.sectionTitle}>Poll Type</Text>
        <View style={styles.choiceRow}>
          {(["SINGLE_CHOICE", "MULTIPLE_CHOICE"] as PollType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, pollType === t && styles.chipSelected]}
              onPress={() => setPollType(t)}
            >
              <Text style={[styles.chipText, pollType === t && styles.chipTextSelected]}>
                {t === "SINGLE_CHOICE" ? "Single Choice" : "Multiple Choice"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Audience */}
        <Text style={styles.sectionTitle}>Audience</Text>
        <View style={styles.choiceRow}>
          {(["CLUB", "CUSTOM"] as PollAudienceType[]).map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.chip, audienceType === a && styles.chipSelected]}
              onPress={() => setAudienceType(a)}
            >
              <Text style={[styles.chipText, audienceType === a && styles.chipTextSelected]}>
                {a === "CLUB" ? "Whole Club" : "Custom Members"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {audienceType === "CUSTOM" && (
          <TouchableOpacity
            style={styles.memberPickerBtn}
            onPress={() => setMemberPickerVisible(true)}
          >
            <Ionicons name="people-outline" size={16} color="#6d28d9" />
            <Text style={styles.memberPickerText}>
              {selectedMemberIds.length === 0
                ? "Select members"
                : `${selectedMemberIds.length} member${selectedMemberIds.length > 1 ? "s" : ""} selected`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Deadline */}
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Set Deadline</Text>
          <Switch
            value={hasDeadline}
            onValueChange={setHasDeadline}
            trackColor={{ true: "#2b0540" }}
            thumbColor="#fff"
          />
        </View>
        {hasDeadline && (
          <TouchableOpacity style={styles.deadlineBtn} onPress={openDeadlinePicker}>
            <Ionicons name="calendar-outline" size={16} color="#2b0540" />
            <Text style={styles.deadlineBtnText}>{deadline.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        {hasDeadline && showDatePicker && Platform.OS === "ios" && (
          <DateTimePicker
            value={deadline}
            mode="datetime"
            minimumDate={new Date()}
            onChange={(_e, d) => {
              setShowDatePicker(false);
              if (d) setDeadline(d);
            }}
          />
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>{submitting ? "Creating..." : "Create Poll"}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Member picker modal */}
      <Modal
        visible={memberPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMemberPickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMemberPickerVisible(false)}>
          <Pressable style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Members</Text>
              <TouchableOpacity onPress={() => setMemberPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#2b0540" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              value={memberSearch}
              onChangeText={setMemberSearch}
              placeholder="Search name..."
              placeholderTextColor="#9b8ca1"
            />
            <ScrollView style={{ maxHeight: 350 }}>
              {visibleMembers.map((m) => {
                const selected = selectedMemberIds.includes(m.userId);
                return (
                  <TouchableOpacity
                    key={m.userId}
                    style={styles.memberRow}
                    onPress={() => toggleMember(m.userId)}
                  >
                    <Ionicons
                      name={selected ? "checkbox" : "square-outline"}
                      size={20}
                      color={selected ? "#2b0540" : "#9b8ca1"}
                    />
                    <Text style={styles.memberName}>{m.fullName}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setMemberPickerVisible(false)}
            >
              <Text style={styles.doneBtnText}>Done ({selectedMemberIds.length} selected)</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default CreatePollScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f0f7" },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 18, fontWeight: "900", color: "#2b0540", marginBottom: 6 },
  hint: { color: "#7a6c80", fontSize: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#46364d", marginTop: 18, marginBottom: 8 },
  questionInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ded4e2",
    padding: 14,
    fontSize: 15,
    color: "#2b0540",
    minHeight: 80,
    textAlignVertical: "top",
  },
  optionRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  optionInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ded4e2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2b0540",
  },
  removeBtn: { padding: 4 },
  addOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    marginBottom: 4,
  },
  addOptionText: { color: "#6d28d9", fontWeight: "700", fontSize: 14 },
  choiceRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  chip: {
    borderWidth: 1,
    borderColor: "#ded4e2",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  chipSelected: { backgroundColor: "#2b0540", borderColor: "#2b0540" },
  chipText: { color: "#604f67", fontWeight: "700", fontSize: 13 },
  chipTextSelected: { color: "#fff" },
  memberPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f3edfa",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  memberPickerText: { color: "#6d28d9", fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14, color: "#46364d", fontWeight: "700" },
  deadlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ded4e2",
    padding: 12,
    marginTop: 8,
  },
  deadlineBtnText: { color: "#2b0540", fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#2b0540",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#2b0540" },
  searchInput: {
    backgroundColor: "#f3edfa",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2b0540",
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ede9f0",
  },
  memberName: { fontSize: 14, color: "#2b0540", fontWeight: "600" },
  doneBtn: {
    backgroundColor: "#2b0540",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },
  doneBtnText: { color: "#fff", fontWeight: "900" },
});
