import React, { useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { createAnnouncement } from "../services/announcementService";
import { addNotification } from "../services/notificationService";

type Props = {
  navigation: any;
};

const CreateAnnouncementScreen = ({ navigation }: Props) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createAnnouncement({
        title: title.trim(),
        message: message.trim(),
      });

      await addNotification({
        title: "Announcement Created",
        message: `${title.trim()} was posted successfully.`,
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Announcement created successfully"
      );

      setTitle("");
      setMessage("");

      navigation.navigate("MainTabs", { screen: "Announcements" });
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to create announcement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Announcement</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Message"
        multiline
        numberOfLines={5}
        value={message}
        onChangeText={setMessage}
      />

      <Button
        title={submitting ? "Creating..." : "Create Announcement"}
        onPress={handleCreate}
        disabled={submitting}
      />
    </ScrollView>
  );
};

export default CreateAnnouncementScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
});