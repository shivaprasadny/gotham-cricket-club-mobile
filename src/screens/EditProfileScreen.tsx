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
import DateTimePicker from "@react-native-community/datetimepicker";
import { getMyProfile, updateMyProfile } from "../services/profileService";

type Props = {
  navigation: any;
};

const EditProfileScreen = ({ navigation }: Props) => {
  // =========================
  // STATE
  // =========================
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

  // DOB Picker
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [tempDob, setTempDob] = useState(new Date(2000, 0, 1));

  // =========================
  // LOAD PROFILE
  // =========================
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
    } catch {
      Alert.alert("Error", "Failed to load profile");
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // =========================
  // FORMAT DOB (PRETTY)
  // =========================
  const formatPrettyDate = (date?: string) => {
    if (!date) return "Select Date of Birth";

    try {
      const d = new Date(date);
      const day = d.getDate();

      const getSuffix = (n: number) => {
        if (n >= 11 && n <= 13) return "th";
        switch (n % 10) {
          case 1: return "st";
          case 2: return "nd";
          case 3: return "rd";
          default: return "th";
        }
      };

      const month = d.toLocaleString("en-US", { month: "long" });
      const year = d.getFullYear();

      return `🎂 ${month} ${day}${getSuffix(day)}, ${year}`;
    } catch {
      return date;
    }
  };

  // =========================
  // DOB HANDLER
  // =========================
  const saveDob = () => {
    const y = tempDob.getFullYear();
    const m = String(tempDob.getMonth() + 1).padStart(2, "0");
    const d = String(tempDob.getDate()).padStart(2, "0");

    setDateOfBirth(`${y}-${m}-${d}`);
    setShowDobPicker(false);
  };

 

  // =========================
  // SAVE PROFILE
  // =========================
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

  // =========================
  // UI
  // =========================
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>

        {/* HEADER */}
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.card}>
          {/* NAME */}
          <Label text="👤 First Name" />
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

          <Label text="👤 Last Name" />
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

          {/* BASIC */}
          <Label text="😎 Nickname" />
          <TextInput style={styles.input} value={nickname} onChangeText={setNickname} />

          <Label text="📱 Phone" />
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} />

          {/* DOB */}
          <Label text="🎂 Date of Birth" />
          <TouchableOpacity style={styles.input} onPress={() => setShowDobPicker(true)}>
            <Text style={dateOfBirth ? styles.inputText : styles.placeholder}>
              {formatPrettyDate(dateOfBirth)}
            </Text>
          </TouchableOpacity>

          {/* GENDER */}
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

          {/* CRICKET */}
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

          {/* SAVE BUTTON */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* DOB MODAL */}
      <Modal visible={showDobPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <DateTimePicker
  value={tempDob}
  mode="date"
  display={Platform.OS === "ios" ? "spinner" : "default"}
  maximumDate={new Date()}
  style={Platform.OS === "ios" ? { height: 200 } : undefined}
  textColor="#000"
  onChange={(event, selectedDate) => {
    if (!selectedDate) return;

    if (Platform.OS === "android") {
      // Android → save instantly
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");

      setDateOfBirth(`${y}-${m}-${d}`);
      setShowDobPicker(false);
    } else {
      // iOS → only update temp
      setTempDob(selectedDate);
    }
  }}
/>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDobPicker(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={saveDob}>
                <Text style={{ fontWeight: "700", color: "#2b0540" }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

// =========================
// LABEL COMPONENT
// =========================
const Label = ({ text }: { text: string }) => (
  <Text style={styles.label}>{text}</Text>
);

// =========================
// STYLES
// =========================
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#2b0540" },
  container: { padding: 20 },

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
  modalCard: {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 16,
  minHeight: 300, // ⭐ IMPORTANT (prevents collapse)
},
});