import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getLeagueById, updateLeague } from "../services/leagueService";

type Props = {
  route: any;
  navigation: any;
};

const EditLeagueScreen = ({ route, navigation }: Props) => {
  const { leagueId } = route.params;

  // Form state
  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Temporary controlled picker state
  const [tempStartDate, setTempStartDate] = useState<Date>(new Date());
  const [tempEndDate, setTempEndDate] = useState<Date>(new Date());

  // Picker visibility
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Load league once when screen opens
  useEffect(() => {
    void loadLeague();
  }, []);

  /**
   * Format date for UI display
   */
  const formatDate = (date: Date | null) => {
    if (!date) return "Select date";
    return date.toLocaleString();
  };

  /**
   * Load existing league data
   */
  const loadLeague = async () => {
    try {
      const data = await getLeagueById(leagueId);

      setName(data?.name || "");
      setSeason(data?.season || "");
      setType(data?.type || "");
      setDescription(data?.description || "");
      setStartDate(data?.startDate ? new Date(data.startDate) : null);
      setEndDate(data?.endDate ? new Date(data.endDate) : null);
      setActive(!!data?.active);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load league"
      );
    }
  };

  /**
   * Save updated league
   */
  const handleUpdateLeague = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter league name");
      return;
    }

    if (!season.trim()) {
      Alert.alert("Error", "Please enter season");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        season: season.trim(),
        type: type.trim(),
        description: description.trim(),
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        active,
      };

      const response = await updateLeague(leagueId, payload);

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "League updated successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update league"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Edit League</Text>

        <Text style={styles.label}>League Name</Text>
        <TouchableOpacity style={styles.fakeInput} activeOpacity={1}>
          <Text style={styles.valueText}>{name || "Enter league name"}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Season</Text>
        <TouchableOpacity style={styles.fakeInput} activeOpacity={1}>
          <Text style={styles.valueText}>{season || "Enter season"}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Type</Text>
        <TouchableOpacity style={styles.fakeInput} activeOpacity={1}>
          <Text style={styles.valueText}>
            {type || "League / Tournament / Friendly"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Description</Text>
        <TouchableOpacity style={[styles.fakeInput, styles.textArea]} activeOpacity={1}>
          <Text style={styles.valueText}>{description || "Enter description"}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            setTempStartDate(startDate || new Date());
            setShowStartDatePicker(true);
          }}
        >
          <Text style={styles.inputText}>{formatDate(startDate)}</Text>
        </TouchableOpacity>

        {showStartDatePicker && (
          <View style={styles.inlinePickerCard}>
            <DateTimePicker
              value={tempStartDate}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTempStartDate(selectedDate);
                }

                if (Platform.OS !== "ios" && selectedDate) {
                  setStartDate(selectedDate);
                  setShowStartDatePicker(false);
                }
              }}
            />

            {Platform.OS === "ios" && (
              <View style={styles.pickerButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowStartDatePicker(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => {
                    setStartDate(tempStartDate);
                    setShowStartDatePicker(false);
                  }}
                >
                  <Text style={styles.confirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            setTempEndDate(endDate || new Date());
            setShowEndDatePicker(true);
          }}
        >
          <Text style={styles.inputText}>{formatDate(endDate)}</Text>
        </TouchableOpacity>

        {showEndDatePicker && (
          <View style={styles.inlinePickerCard}>
            <DateTimePicker
              value={tempEndDate}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setTempEndDate(selectedDate);
                }

                if (Platform.OS !== "ios" && selectedDate) {
                  setEndDate(selectedDate);
                  setShowEndDatePicker(false);
                }
              }}
            />

            {Platform.OS === "ios" && (
              <View style={styles.pickerButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowEndDatePicker(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => {
                    setEndDate(tempEndDate);
                    setShowEndDatePicker(false);
                  }}
                >
                  <Text style={styles.confirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <Text style={styles.label}>Active</Text>
        <Switch value={active} onValueChange={setActive} />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleUpdateLeague}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? "Updating..." : "Update League"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditLeagueScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },
  container: {
    flexGrow: 1,
    backgroundColor: "#f8f5fb",
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#2b0540",
    marginBottom: 24,
  },
  label: {
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  inputText: {
    color: "#111",
    fontWeight: "500",
  },
  fakeInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9d2e1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  valueText: {
    color: "#111",
  },
  textArea: {
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  submitBtnText: {
    textAlign: "center",
    color: "#2b0540",
    fontWeight: "700",
    fontSize: 16,
  },
  inlinePickerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  pickerButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelBtn: {
    padding: 10,
  },
  cancelText: {
    color: "#888",
    fontWeight: "600",
  },
  confirmBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmText: {
    color: "#2b0540",
    fontWeight: "700",
  },
});