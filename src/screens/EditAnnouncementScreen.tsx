import React, { useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import {
  deleteAnnouncement,
  updateAnnouncement,
} from "../services/announcementService";

type Props = {
  route: any;
  navigation: any;
};

const EditAnnouncementScreen = ({ route, navigation }: Props) => {
  const { announcement } = route.params;

  const [title, setTitle] = useState(announcement.title || "");
  const [message, setMessage] = useState(announcement.message || "");

  const handleUpdate = async () => {
    try {
      const response = await updateAnnouncement(announcement.id, {
        title,
        message,
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Announcement updated successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update announcement"
      );
    }
  };

  const handleDelete = async () => {
    try {
      const response = await deleteAnnouncement(announcement.id);

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Announcement deleted successfully"
      );

      navigation.navigate("Announcements");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to delete announcement"
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Announcement</Text>

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

      <Button title="Update Announcement" onPress={handleUpdate} />
      <Text style={{ marginTop: 12 }} />
      <Button title="Delete Announcement" onPress={handleDelete} color="#c0392b" />
    </ScrollView>
  );
};

export default EditAnnouncementScreen;

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