import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load league once when screen opens
  useEffect(() => {
    void loadLeague();
  }, []);

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
      setStartDate(data?.startDate || "");
      setEndDate(data?.endDate || "");
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
        startDate: startDate.trim() || null,
        endDate: endDate.trim() || null,
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
    // KeyboardAvoidingView keeps fields visible when keyboard opens
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      {/* ScrollView allows lower inputs to remain reachable */}
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Edit League</Text>

        <Text style={styles.label}>League Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter league name"
          placeholderTextColor="#7a7a7a"
        />

        <Text style={styles.label}>Season</Text>
        <TextInput
          style={styles.input}
          value={season}
          onChangeText={setSeason}
          placeholder="Enter season"
          placeholderTextColor="#7a7a7a"
        />

        <Text style={styles.label}>Type</Text>
        <TextInput
          style={styles.input}
          value={type}
          onChangeText={setType}
          placeholder="League / Tournament / Friendly"
          placeholderTextColor="#7a7a7a"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description"
          placeholderTextColor="#7a7a7a"
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Start Date</Text>
        <TextInput
          style={styles.input}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#7a7a7a"
        />

        <Text style={styles.label}>End Date</Text>
        <TextInput
          style={styles.input}
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#7a7a7a"
        />

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
  // Full-screen wrapper for keyboard handling
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },

  // Scrollable content container
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

  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
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
});