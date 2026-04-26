import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getMyProfile, updateMyProfile } from "../services/profileService";

type Props = {
  navigation: any;
};

const EditProfileScreen = ({ navigation }: Props) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [playerType, setPlayerType] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  const [saving, setSaving] = useState(false);

  // DOB picker modal state
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobMonth, setDobMonth] = useState(1);
  const [dobDay, setDobDay] = useState(1);
  const [dobYear, setDobYear] = useState(2000);

  const months = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();

      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setNickname(data.nickname || "");
      setPhone(data.phone || "");
      setGender(data.gender || "");
      setDateOfBirth(data.dateOfBirth || "");

      setBattingStyle(data.battingStyle || "");
      setBowlingStyle(data.bowlingStyle || "");
      setPlayerType(data.playerType || "");
      setJerseyNumber(data.jerseyNumber ? String(data.jerseyNumber) : "");

      // Pre-fill DOB picker values from existing profile DOB
      if (data.dateOfBirth) {
        const d = new Date(data.dateOfBirth);
        setDobMonth(d.getMonth() + 1);
        setDobDay(d.getDate());
        setDobYear(d.getFullYear());
      }
    } catch {
      Alert.alert("Error", "Failed to load profile");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const formatPrettyDate = (date?: string) => {
    if (!date) return "Select Date of Birth";

    try {
      const d = new Date(date);
      const month = d.toLocaleString("en-US", { month: "long" });
      return `🎂 ${month} ${d.getDate()}, ${d.getFullYear()}`;
    } catch {
      return date;
    }
  };

  // Open DOB modal and load existing DOB into picker
  const openDobPicker = () => {
    if (dateOfBirth) {
      const d = new Date(dateOfBirth);
      setDobMonth(d.getMonth() + 1);
      setDobDay(d.getDate());
      setDobYear(d.getFullYear());
    }

    setShowDobPicker(true);
  };

  // Save DOB as YYYY-MM-DD for backend
  const handleSaveDob = () => {
    const m = String(dobMonth).padStart(2, "0");
    const d = String(dobDay).padStart(2, "0");

    setDateOfBirth(`${dobYear}-${m}-${d}`);
    setShowDobPicker(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateMyProfile({
        firstName,
        lastName,
        nickname,
        phone,
        gender,
        dateOfBirth,
        battingStyle,
        bowlingStyle,
        playerType,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
      });

      Alert.alert("Success", "Profile updated");
      navigation.goBack();
    } catch {
      Alert.alert("Error", "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.card}>
          <Label text="👤 First Name" />
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

          <Label text="👤 Last Name" />
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

          <Label text="😎 Nickname" />
          <TextInput style={styles.input} value={nickname} onChangeText={setNickname} />

          <Label text="📱 Phone" />
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} />

          <Label text="🎂 Date of Birth" />
          <TouchableOpacity style={styles.input} onPress={openDobPicker}>
            <Text style={dateOfBirth ? styles.inputText : styles.placeholder}>
              {formatPrettyDate(dateOfBirth)}
            </Text>
          </TouchableOpacity>

          <Label text="⚧️ Gender" />
          <View style={styles.genderRow}>
            {["Male", "Female", "Other"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderChip, gender === g && styles.genderChipSelected]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Label text="🏏 Batting Style" />
          <TextInput style={styles.input} value={battingStyle} onChangeText={setBattingStyle} />

          <Label text="🎯 Bowling Style" />
          <TextInput style={styles.input} value={bowlingStyle} onChangeText={setBowlingStyle} />

          <Label text="🧢 Player Type" />
          <TextInput style={styles.input} value={playerType} onChangeText={setPlayerType} />

          <Label text="🔢 Jersey Number" />
          <TextInput
            style={styles.input}
            value={jerseyNumber}
            onChangeText={setJerseyNumber}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* DOB Modal - Month / Day / Year picker */}
      <Modal visible={showDobPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Date of Birth</Text>

            <View style={styles.pickerRow}>
              <Picker
                selectedValue={dobMonth}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(value) => setDobMonth(value)}
              >
                {months.map((month) => (
                  <Picker.Item key={month.value} label={month.label} value={month.value} />
                ))}
              </Picker>

              <Picker
                selectedValue={dobDay}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(value) => setDobDay(value)}
              >
                {days.map((day) => (
                  <Picker.Item key={day} label={String(day)} value={day} />
                ))}
              </Picker>

              <Picker
                selectedValue={dobYear}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(value) => setDobYear(value)}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={String(year)} value={year} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDobPicker(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={handleSaveDob}>
                <Text style={{ fontWeight: "700", color: "#2b0540" }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

const Label = ({ text }: { text: string }) => (
  <Text style={styles.label}>{text}</Text>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#2b0540" },
  container: { padding: 20, paddingBottom: 140 },

  title: {
    color: "#fff",
    fontSize: 26,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
  },

  label: {
    fontWeight: "700",
    marginBottom: 4,
    color: "#2b0540",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  inputText: { color: "#111" },
  placeholder: { color: "#888" },

  genderRow: { flexDirection: "row", marginBottom: 14 },

  genderChip: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },

  genderChipSelected: { backgroundColor: "#2b0540" },
  genderText: { color: "#2b0540" },
  genderTextSelected: { color: "#fff" },

  saveBtn: {
    backgroundColor: "#da9306",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },

  saveText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#2b0540",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#2b0540",
  },

  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  picker: {
    flex: 1,
    height: 180,
  },

  pickerItem: {
    fontSize: 16,
    color: "#111",
  },

  modalActions: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  doneBtn: {
    flex: 1,
    backgroundColor: "#da9306",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});