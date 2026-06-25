import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getMyProfile, updateMyProfile } from "../services/profileService";
import CountryCodePicker from "../components/CountryCodePicker";

type Props = {
  navigation: any;
};

const EditProfileScreen = ({ navigation }: Props) => {
  // Basic profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");

  // Contact privacy toggles
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showWhatsApp, setShowWhatsApp] = useState(true);
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Cricket profile fields
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [playerType, setPlayerType] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  // Save button loading state
  const [saving, setSaving] = useState(false);

  // DOB picker modal state
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobMonth, setDobMonth] = useState(1);
  const [dobDay, setDobDay] = useState(1);
  const [dobYear, setDobYear] = useState(2000);

  // Month list for picker
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

  // Year list for picker
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

  // This gives correct number of days for selected month/year
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Day list changes based on selected month/year
  const days = Array.from(
    { length: getDaysInMonth(dobMonth, dobYear) },
    (_, i) => i + 1
  );

  // Parse DOB manually to avoid iOS timezone issue
  const parseDob = (dob: string) => {
    const [year, month, day] = dob.split("-").map(Number);

    return {
      year,
      month,
      day,
    };
  };

  // Load profile from backend
  const loadProfile = async () => {
    try {
      const data = await getMyProfile();

      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setNickname(data.nickname || "");
      setCountryCode(data.countryCode || "+1");
      setPhone(data.phone || "");
      setGender(data.gender || "");
      setShowEmail(data.showEmail !== false);
      setShowPhone(data.showPhone !== false);
      setShowWhatsApp(data.showWhatsApp !== false);
      setDateOfBirth(data.dateOfBirth || "");

      setBattingStyle(data.battingStyle || "");
      setBowlingStyle(data.bowlingStyle || "");
      setPlayerType(data.playerType || "");
      setJerseyNumber(data.jerseyNumber ? String(data.jerseyNumber) : "");

      // Pre-fill DOB picker values from backend DOB
      if (data.dateOfBirth) {
        const dob = parseDob(data.dateOfBirth);
        setDobMonth(dob.month);
        setDobDay(dob.day);
        setDobYear(dob.year);
      }
    } catch {
      Alert.alert("Error", "Failed to load profile");
    }
  };

  // Run loadProfile one time when screen opens
  useEffect(() => {
    loadProfile();
  }, []);

  // If user selects February etc., fix invalid day like Feb 31
  useEffect(() => {
    const maxDay = getDaysInMonth(dobMonth, dobYear);

    if (dobDay > maxDay) {
      setDobDay(maxDay);
    }
  }, [dobMonth, dobYear]);

  // Show DOB nicely on screen
  const formatPrettyDate = (date?: string) => {
    if (!date) return "Select Date of Birth";

    const dob = parseDob(date);
    const monthName = months.find((m) => m.value === dob.month)?.label;

    return `🎂 ${monthName} ${dob.day}, ${dob.year}`;
  };

  // Open DOB picker modal
  const openDobPicker = () => {
    if (dateOfBirth) {
      const dob = parseDob(dateOfBirth);
      setDobMonth(dob.month);
      setDobDay(dob.day);
      setDobYear(dob.year);
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

  // Save full profile
  const handleSave = async () => {
    try {
      setSaving(true);

      await updateMyProfile({
        firstName,
        lastName,
        nickname,
        countryCode: phone.trim() ? countryCode : null,
        phone: phone.trim() || null,
        gender,
        dateOfBirth,
        battingStyle,
        bowlingStyle,
        playerType,
        jerseyNumber: jerseyNumber ? Number(jerseyNumber) : null,
        showEmail,
        showPhone,
        showWhatsApp,
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

          <Label text="📱 Phone (optional)" />
          <View style={styles.phoneRow}>
            <View style={styles.countryCodeBox}>
              <CountryCodePicker value={countryCode} onChange={setCountryCode} />
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone number"
              placeholderTextColor="#7a7a7a"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

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

          <Label text="🔒 Contact Privacy" />
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Show email to teammates</Text>
            <Switch value={showEmail} onValueChange={setShowEmail} thumbColor="#da9306" trackColor={{ true: "#4a1a6a", false: "#555" }} />
          </View>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Show phone to teammates</Text>
            <Switch value={showPhone} onValueChange={setShowPhone} thumbColor="#da9306" trackColor={{ true: "#4a1a6a", false: "#555" }} />
          </View>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Allow WhatsApp contact</Text>
            <Switch value={showWhatsApp} onValueChange={setShowWhatsApp} thumbColor="#da9306" trackColor={{ true: "#4a1a6a", false: "#555" }} />
          </View>

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
                onValueChange={(value) => setDobMonth(Number(value))}
              >
                {months.map((month) => (
                  <Picker.Item key={month.value} label={month.label} value={month.value} />
                ))}
              </Picker>

              <Picker
                selectedValue={dobDay}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(value) => setDobDay(Number(value))}
              >
                {days.map((day) => (
                  <Picker.Item key={day} label={String(day)} value={day} />
                ))}
              </Picker>

              <Picker
                selectedValue={dobYear}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(value) => setDobYear(Number(value))}
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
  phoneRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  countryCodeBox: {
    width: 130,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    justifyContent: "center",
  },
  countryCodePicker: {
    color: "#111",
    height: 50,
  },
  phoneInput: {
    flex: 1,
    color: "#111",
    paddingHorizontal: 14,
    fontSize: 15,
  },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f7f3fb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  privacyLabel: {
    color: "#ccc",
    fontSize: 14,
    flex: 1,
  },
});