import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const CODES = [
  { label: "🇺🇸 United States", code: "+1" },
  { label: "🇨🇦 Canada", code: "+1" },
  { label: "🇬🇧 United Kingdom", code: "+44" },
  { label: "🇦🇺 Australia", code: "+61" },
  { label: "🇳🇿 New Zealand", code: "+64" },
  { label: "🇮🇳 India", code: "+91" },
  { label: "🇵🇰 Pakistan", code: "+92" },
  { label: "🇧🇩 Bangladesh", code: "+880" },
  { label: "🇱🇰 Sri Lanka", code: "+94" },
  { label: "🇦🇪 UAE", code: "+971" },
  { label: "🇸🇬 Singapore", code: "+65" },
  { label: "🇿🇦 South Africa", code: "+27" },
  { label: "🇹🇹 Trinidad & Tobago", code: "+1868" },
  { label: "🇧🇧 Barbados", code: "+1246" },
  { label: "🇯🇲 Jamaica", code: "+1876" },
  { label: "🇬🇾 Guyana", code: "+592" },
  { label: "🇦🇬 Antigua & Barbuda", code: "+1268" },
  { label: "🇱🇨 Saint Lucia", code: "+1758" },
];

type Props = {
  value: string;
  onChange: (code: string) => void;
};

const CountryCodePicker = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const handleSelect = (code: string) => {
    onChange(code);
    setOpen(false);
    setCustomMode(false);
  };

  const handleCustomConfirm = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const normalized = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
    onChange(normalized);
    setOpen(false);
    setCustomMode(false);
    setCustomInput("");
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>{value || "+1"}</Text>
        <Ionicons name="chevron-down" size={14} color="#666" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Select Country Code</Text>

          {customMode ? (
            <View style={styles.customBox}>
              <TextInput
                style={styles.customInput}
                placeholder="e.g. +123"
                placeholderTextColor="#999"
                value={customInput}
                onChangeText={setCustomInput}
                keyboardType="phone-pad"
                autoFocus
              />
              <TouchableOpacity style={styles.customConfirm} onPress={handleCustomConfirm}>
                <Text style={styles.customConfirmText}>Use this code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.customCancel} onPress={() => setCustomMode(false)}>
                <Text style={styles.customCancelText}>Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {CODES.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.row, item.code === value && styles.rowSelected]}
                  onPress={() => handleSelect(item.code)}
                >
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={[styles.rowCode, item.code === value && styles.rowCodeSelected]}>
                    {item.code}
                  </Text>
                  {item.code === value ? (
                    <Ionicons name="checkmark" size={16} color="#2b0540" style={{ marginLeft: 4 }} />
                  ) : null}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.row} onPress={() => setCustomMode(true)}>
                <Text style={styles.rowLabel}>✏️ Custom code</Text>
                <Text style={styles.rowCode}>other</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
};

export default CountryCodePicker;

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 4,
  },
  triggerText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 15,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: "70%",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  sheetTitle: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    color: "#2b0540",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  list: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  rowSelected: {
    backgroundColor: "#f3eefa",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  rowLabel: {
    flex: 1,
    color: "#111",
    fontSize: 15,
  },
  rowCode: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  rowCodeSelected: {
    color: "#2b0540",
    fontWeight: "800",
  },
  customBox: {
    padding: 20,
    gap: 12,
  },
  customInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#111",
  },
  customConfirm: {
    backgroundColor: "#2b0540",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  customConfirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  customCancel: {
    alignItems: "center",
    padding: 10,
  },
  customCancelText: {
    color: "#666",
    fontSize: 14,
  },
});
