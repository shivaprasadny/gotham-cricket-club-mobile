import React, { useState } from "react";
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
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
  // Announcement title input
  const [title, setTitle] = useState("");

  // Announcement message input
  const [message, setMessage] = useState("");

  // Used to disable button while request is in progress
  const [submitting, setSubmitting] = useState(false);

  // Create announcement handler
  const handleCreate = async () => {
    // Validate required fields
    if (!title.trim() || !message.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setSubmitting(true);

      // Create announcement in backend
      const response = await createAnnouncement({
        title: title.trim(),
        message: message.trim(),
      });

      // Also add app notification after successful announcement
    await addNotification({
  title: "New Announcement",
  message: title.trim(),
  type: "ANNOUNCEMENT",
  targetScreen: "Announcements",
});

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Announcement created successfully"
      );

      // Reset form fields after success
      setTitle("");
      setMessage("");

      // Navigate back to announcements tab
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
    // KeyboardAvoidingView moves content up when keyboard opens
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      {/* ScrollView allows screen to scroll when keyboard is open */}
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create Announcement</Text>

        {/* Title input */}
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />

        {/* Message input */}
        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder="Message"
          multiline
          numberOfLines={5}
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
        />

        {/* Submit button */}
        <Button
          title={submitting ? "Creating..." : "Create Announcement"}
          onPress={handleCreate}
          disabled={submitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateAnnouncementScreen;

const styles = StyleSheet.create({
  // Main screen wrapper
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // Scroll content wrapper
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
    paddingBottom: 40,
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
    backgroundColor: "#fff",
  },

  messageInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
});