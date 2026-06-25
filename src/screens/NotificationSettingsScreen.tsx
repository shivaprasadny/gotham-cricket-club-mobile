import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { logger } from "../utils/logger";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  NotificationPreferences,
} from "../services/notificationPreferencesService";

const NotificationSettingsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);

  const loadPrefs = async () => {
    try {
      const data = await getNotificationPreferences();
      setPrefs(data);
    } catch (error) {
      logger.error("LOAD NOTIFICATION PREFS ERROR:", error);
      Alert.alert("Error", "Could not load notification settings.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadPrefs();
    }, [])
  );

  const handleToggle = async (field: keyof Omit<NotificationPreferences, "id">, value: boolean) => {
    if (!prefs) return;

    const updated = { ...prefs, [field]: value };
    setPrefs(updated);

    setSaving(true);
    try {
      await updateNotificationPreferences({
        pushEnabled: updated.pushEnabled,
        muteAllChats: updated.muteAllChats,
        muteGroupChats: updated.muteGroupChats,
        muteMatchChats: updated.muteMatchChats,
        muteEventChats: updated.muteEventChats,
      });
    } catch (error) {
      logger.error("SAVE NOTIFICATION PREF ERROR:", error);
      setPrefs(prefs);
      Alert.alert("Error", "Could not save notification setting. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
      </View>
    );
  }

  if (!prefs) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load settings.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
      {saving && (
        <View style={styles.savingBar}>
          <Text style={styles.savingText}>Saving…</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Push Notifications</Text>
        <SettingRow
          label="Push Notifications"
          description="Receive push alerts for new activity"
          value={prefs.pushEnabled}
          onToggle={(v) => handleToggle("pushEnabled", v)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Chat Notifications</Text>
        <SettingRow
          label="Mute All Chats"
          description="Silence notifications from every chat room"
          value={prefs.muteAllChats}
          onToggle={(v) => handleToggle("muteAllChats", v)}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Mute Group Chats"
          description="Silence group and anonymous chat rooms"
          value={prefs.muteGroupChats}
          onToggle={(v) => handleToggle("muteGroupChats", v)}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Mute Match Chats"
          description="Silence notifications from match rooms"
          value={prefs.muteMatchChats}
          onToggle={(v) => handleToggle("muteMatchChats", v)}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Mute Event Chats"
          description="Silence notifications from event rooms"
          value={prefs.muteEventChats}
          onToggle={(v) => handleToggle("muteEventChats", v)}
        />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationSettingsScreen;

// =========================
// SETTING ROW
// =========================
type SettingRowProps = {
  label: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
};

const SettingRow = ({ label, description, value, onToggle }: SettingRowProps) => (
  <View style={styles.row}>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: "#d1d5db", true: "#da9306" }}
      thumbColor={value ? "#2b0540" : "#f9fafb"}
    />
  </View>
);

// =========================
// STYLES
// =========================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },
  content: {
    paddingBottom: 30,
    paddingTop: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f5fb",
  },
  errorText: {
    color: "#6b7280",
    fontSize: 15,
  },
  savingBar: {
    backgroundColor: "#2b0540",
    paddingVertical: 8,
    alignItems: "center",
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  savingText: {
    color: "#da9306",
    fontWeight: "600",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  rowDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
});
