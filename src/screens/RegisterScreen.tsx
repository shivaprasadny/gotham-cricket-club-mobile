import React, { useState } from "react";
import {
  Alert,
  Image,
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
import { registerUser } from "../services/authService";

type Props = {
  navigation: any;
};

const RegisterScreen = ({ navigation }: Props) => {
  // =========================
  // BASIC USER INFO
  // =========================
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // =========================
  // PROFILE INFO
  // =========================
  const [nickname, setNickname] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  // DOB modal state
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [tempDob, setTempDob] = useState<Date>(new Date(2000, 0, 1));

  // =========================
  // AUTH
  // =========================
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // =========================
  // CRICKET INFO
  // =========================
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [playerType, setPlayerType] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // =========================
  // OPEN DOB PICKER
  // =========================
  const openDobPicker = () => {
    if (dateOfBirth) {
      setTempDob(new Date(dateOfBirth));
    }
    setShowDobPicker(true);
  };

  // =========================
  // SAVE DOB
  // =========================
  const handleSaveDob = () => {
    const y = tempDob.getFullYear();
    const m = String(tempDob.getMonth() + 1).padStart(2, "0");
    const d = String(tempDob.getDate()).padStart(2, "0");

    setDateOfBirth(`${y}-${m}-${d}`);
    setShowDobPicker(false);
  };

  // =========================
  // REGISTER HANDLER
  // =========================
  const handleRegister = async () => {
    if (!firstName.trim()) return Alert.alert("Error", "Enter first name");
    if (!lastName.trim()) return Alert.alert("Error", "Enter last name");
    if (!email.trim()) return Alert.alert("Error", "Enter email");
    if (!password.trim()) return Alert.alert("Error", "Enter password");

    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    try {
      setSubmitting(true);

      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim(),
        dateOfBirth: dateOfBirth || null,
        gender,
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
        battingStyle: battingStyle.trim(),
        bowlingStyle: bowlingStyle.trim(),
        playerType: playerType.trim(),
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
      };

      const response = await registerUser(payload);

      Alert.alert("Success", typeof response === "string" ? response : "Registered!");
      navigation.navigate("Login");
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* LOGO */}
        <Image source={require("../../assets/logo.png")} style={styles.logo} />

        {/* TITLE */}
        <Text style={styles.title}>Join Gotham Cricket Club</Text>
        <Text style={styles.subtitle}>Register and wait for approval</Text>

        {/* FORM CARD */}
        <View style={styles.card}>
          {/* NAME */}
          <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
          <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />

          {/* NICKNAME */}
          <TextInput style={styles.input} placeholder="Nickname" value={nickname} onChangeText={setNickname} />

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

          {/* EMAIL*/}
          

<TextInput
  style={styles.input}
  placeholder="Email"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  autoCapitalize="none"
  autoCorrect={false}
/>


  {/* PHONE */}
          <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} />

          {/* PASSWORD */}
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

          {/* CRICKET */}
          <TextInput style={styles.input} placeholder="Batting Style" value={battingStyle} onChangeText={setBattingStyle} />
          <TextInput style={styles.input} placeholder="Bowling Style" value={bowlingStyle} onChangeText={setBowlingStyle} />
          <TextInput style={styles.input} placeholder="Player Type" value={playerType} onChangeText={setPlayerType} />
          <TextInput style={styles.input} placeholder="Jersey Number" value={jerseyNumber} onChangeText={setJerseyNumber} />

          {/* BUTTON */}
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>
              {submitting ? "Registering..." : "Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* DOB MODAL — FIXED */}
      <Modal visible={showDobPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Date of Birth</Text>

            <DateTimePicker
              value={tempDob}
              mode="date"
              display="spinner"
              textColor="#000000"
              maximumDate={new Date()}
              style={styles.datePicker}
              onChange={(e, d) => d && setTempDob(d)}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDobPicker(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={handleSaveDob}>
                <Text style={{ color: "#2b0540", fontWeight: "700" }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#2b0540" },
  container: { padding: 20 },
  logo: { width: 110, height: 110, alignSelf: "center" },
  title: { color: "#fff", fontSize: 26, textAlign: "center", fontWeight: "700" },
  subtitle: { color: "#da9306", textAlign: "center", marginBottom: 20 },

  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16 },

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

  button: {
    backgroundColor: "#da9306",
    padding: 14,
    borderRadius: 10,
  },
  buttonText: {
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
  },
  datePicker: {
    width: "100%",
    height: 200,
    backgroundColor: "#fff",
  },
  modalActions: { flexDirection: "row", marginTop: 10, gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: "#eee", padding: 12, borderRadius: 10, alignItems: "center" },
  doneBtn: { flex: 1, backgroundColor: "#da9306", padding: 12, borderRadius: 10, alignItems: "center" },
});