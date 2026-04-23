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
  // BASIC INFO
  // =========================
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // =========================
  // PROFILE INFO
  // =========================
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // DOB picker state
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [tempDob, setTempDob] = useState(new Date(2000, 0, 1));

  // =========================
  // CRICKET INFO
  // =========================
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [playerType, setPlayerType] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  const [saving, setSaving] = useState(false);

  // =========================
  // LOAD PROFILE DATA
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
  // DOB HANDLERS
  // =========================
  const openDobPicker = () => {
    if (dateOfBirth) {
      setTempDob(new Date(dateOfBirth));
    }
    setShowDobPicker(true);
  };

  const saveDob = () => {
    const y = tempDob.getFullYear();
    const m = String(tempDob.getMonth() + 1).padStart(2, "0");
    const d = String(tempDob.getDate()).padStart(2, "0");

    setDateOfBirth(`${y}-${m}-${d}`);
    setShowDobPicker(false);
  };

  // =========================
  // UPDATE PROFILE
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

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.card}>
          {/* NAME */}
          <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
          <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />

          {/* BASIC */}
          <TextInput style={styles.input} placeholder="Nickname" value={nickname} onChangeText={setNickname} />
          <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} />

          {/* DOB */}
          <TouchableOpacity style={styles.input} onPress={openDobPicker}>
            <Text style={dateOfBirth ? styles.inputText : styles.placeholder}>
              {dateOfBirth || "Date of Birth"}
            </Text>
          </TouchableOpacity>

          {/* GENDER */}
          <Text style={styles.label}>Gender</Text>
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
          <TextInput style={styles.input} placeholder="Batting Style" value={battingStyle} onChangeText={setBattingStyle} />
          <TextInput style={styles.input} placeholder="Bowling Style" value={bowlingStyle} onChangeText={setBowlingStyle} />
          <TextInput style={styles.input} placeholder="Player Type" value={playerType} onChangeText={setPlayerType} />
          <TextInput style={styles.input} placeholder="Jersey Number" value={jerseyNumber} onChangeText={setJerseyNumber} />

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
            <Text style={styles.modalTitle}>Select Date of Birth</Text>

            <DateTimePicker
              value={tempDob}
              mode="date"
              display="spinner"
              textColor="#000"
              maximumDate={new Date()}
              onChange={(e, d) => d && setTempDob(d)}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDobPicker(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={saveDob}>
                <Text style={{ color: "#2b0540", fontWeight: "700" }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

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
    padding: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  inputText: { color: "#111" },
  placeholder: { color: "#888" },

  label: { fontWeight: "700", marginBottom: 6 },

  genderRow: { flexDirection: "row", marginBottom: 12 },
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
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 10,
  },
  modalActions: { flexDirection: "row", marginTop: 10, gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: "#eee", padding: 12, borderRadius: 10, alignItems: "center" },
  doneBtn: { flex: 1, backgroundColor: "#da9306", padding: 12, borderRadius: 10, alignItems: "center" },
});