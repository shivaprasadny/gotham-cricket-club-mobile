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
import { Picker } from "@react-native-picker/picker";
import { registerUser } from "../services/authService";

type Props = {
  navigation: any;
};

const RegisterScreen = ({ navigation }: Props) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [nickname, setNickname] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  // =========================
  // DOB PICKER STATE
  // =========================
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobMonth, setDobMonth] = useState(1);
  const [dobDay, setDobDay] = useState(1);
  const [dobYear, setDobYear] = useState(2000);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [playerType, setPlayerType] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // =========================
  // DOB OPTIONS
  // =========================
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

  // =========================
  // OPEN DOB MODAL
  // =========================
  const openDobPicker = () => {
    if (dateOfBirth) {
      const existingDate = new Date(dateOfBirth);
      setDobMonth(existingDate.getMonth() + 1);
      setDobDay(existingDate.getDate());
      setDobYear(existingDate.getFullYear());
    }

    setShowDobPicker(true);
  };

  // =========================
  // SAVE DOB AS YYYY-MM-DD
  // =========================
  const handleSaveDob = () => {
    const m = String(dobMonth).padStart(2, "0");
    const d = String(dobDay).padStart(2, "0");

    setDateOfBirth(`${dobYear}-${m}-${d}`);
    setShowDobPicker(false);
  };

  // =========================
// REGISTER USER HANDLER
// =========================
const handleRegister = async () => {

  // Basic validations
  if (!firstName.trim()) return Alert.alert("Error", "Enter first name");
  if (!lastName.trim()) return Alert.alert("Error", "Enter last name");
  if (!email.trim()) return Alert.alert("Error", "Enter email");
  if (!password.trim()) return Alert.alert("Error", "Enter password");

  // Password match check
  if (password !== confirmPassword) {
    return Alert.alert("Error", "Passwords do not match");
  }

  try {
    setSubmitting(true);

    // Prepare payload for backend
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

    // Call backend API
    const response = await registerUser(payload);

    // Show success message
    Alert.alert(
      "Success",
      typeof response === "string" ? response : "Registered!"
    );

    // 🔥 IMPORTANT CHANGE
    // Navigate to Verify Email screen with email
    navigation.navigate("VerifyEmail", {
      email: email.trim(),
    });

  } catch (error: any) {
    Alert.alert(
      "Error",
      error?.response?.data?.message || "Registration failed"
    );
  } finally {
    setSubmitting(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={require("../../assets/logo.png")} style={styles.logo} />

        <Text style={styles.title}>Join Gotham Cricket Club</Text>
        <Text style={styles.subtitle}>Register and wait for approval</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />

          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />

          <TextInput
            style={styles.input}
            placeholder="Nickname"
            value={nickname}
            onChangeText={setNickname}
          />

          {/* DOB FIELD */}
          <TouchableOpacity style={styles.input} onPress={openDobPicker}>
            <Text style={dateOfBirth ? styles.inputText : styles.placeholder}>
              {dateOfBirth || "Date of Birth"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {["Male", "Female", "Other"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderChip,
                  gender === g && styles.genderChipSelected,
                ]}
                onPress={() => setGender(g)}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === g && styles.genderTextSelected,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setConfirmPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Batting Style"
            value={battingStyle}
            onChangeText={setBattingStyle}
          />

          <TextInput
            style={styles.input}
            placeholder="Bowling Style"
            value={bowlingStyle}
            onChangeText={setBowlingStyle}
          />

          <TextInput
            style={styles.input}
            placeholder="Player Type"
            value={playerType}
            onChangeText={setPlayerType}
          />

          <TextInput
            style={styles.input}
            placeholder="Jersey Number"
            value={jerseyNumber}
            onChangeText={setJerseyNumber}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>
              {submitting ? "Registering..." : "Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* DOB MODAL - iPhone style Month / Day / Year picker */}
      <Modal visible={showDobPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Date of Birth</Text>

            <View style={styles.pickerRow}>
              {/* MONTH PICKER */}
              <Picker
                selectedValue={dobMonth}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(value) => setDobMonth(value)}
              >
                {months.map((month) => (
                  <Picker.Item
                    key={month.value}
                    label={month.label}
                    value={month.value}
                  />
                ))}
              </Picker>

              {/* DAY PICKER */}
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

              {/* YEAR PICKER */}
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
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDobPicker(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={handleSaveDob}>
                <Text style={{ color: "#2b0540", fontWeight: "700" }}>
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

export default RegisterScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#2b0540",
  },

  container: {
    padding: 20,
    paddingBottom: 140,
  },

  logo: {
    width: 110,
    height: 110,
    alignSelf: "center",
  },

  title: {
    color: "#fff",
    fontSize: 26,
    textAlign: "center",
    fontWeight: "700",
  },

  subtitle: {
    color: "#da9306",
    textAlign: "center",
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

  inputText: {
    color: "#111",
  },

  placeholder: {
    color: "#888",
  },

  label: {
    fontWeight: "700",
    marginBottom: 6,
  },

  genderRow: {
    flexDirection: "row",
    marginBottom: 12,
  },

  genderChip: {
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },

  genderChipSelected: {
    backgroundColor: "#2b0540",
  },

  genderText: {
    color: "#2b0540",
  },

  genderTextSelected: {
    color: "#fff",
  },

  button: {
    backgroundColor: "#da9306",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 40,
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