import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  deleteAnnouncement,
  updateAnnouncement,
} from "../services/announcementService";

type Props = {
  route: any;
  navigation: any;
};

type Announcement = {
  id: number;
  title: string;
  message: string;
  createdBy?: string;
  createdAt?: string;
  pinned?: boolean;
};

const EditAnnouncementScreen = ({ route, navigation }: Props) => {
  const announcement: Announcement | undefined = route?.params?.announcement;

  const [title, setTitle] = useState(announcement?.title || "");
  const [message, setMessage] = useState(announcement?.message || "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!announcement) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Announcement not found</Text>
      </View>
    );
  }

  const handleUpdate = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter title");
      return;
    }

    if (!message.trim()) {
      Alert.alert("Error", "Please enter message");
      return;
    }

    try {
      setSubmitting(true);

      const response = await updateAnnouncement(announcement.id, {
        title: title.trim(),
        message: message.trim(),
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Announcement updated successfully",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.log("UPDATE ANNOUNCEMENT ERROR:", error?.response?.data || error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to update announcement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Announcement",
      "Are you sure you want to delete this announcement?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);

              const response = await deleteAnnouncement(announcement.id);

              Alert.alert(
                "Success",
                typeof response === "string"
                  ? response
                  : "Announcement deleted successfully",
                [
                  {
                    text: "OK",
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error: any) {
              console.log(
                "DELETE ANNOUNCEMENT ERROR:",
                error?.response?.data || error
              );

              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  error?.response?.data ||
                  "Failed to delete announcement"
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Announcement</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter title"
        placeholderTextColor="#7a7a7a"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Enter message"
        placeholderTextColor="#7a7a7a"
        multiline
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity
        style={styles.updateBtn}
        onPress={handleUpdate}
        disabled={submitting}
      >
        <Text style={styles.updateBtnText}>
          {submitting ? "Updating..." : "Update Announcement"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDelete}
        disabled={deleting}
      >
        <Text style={styles.deleteBtnText}>
          {deleting ? "Deleting..." : "Delete Announcement"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditAnnouncementScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
  },
  center: {
    flex: 1,
    backgroundColor: "#f8f5fb",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#2b0540",
    fontSize: 18,
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    color: "#2b0540",
  },
  label: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
    marginTop: 6,
    color: "#2b0540",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  messageInput: {
    minHeight: 140,
    textAlignVertical: "top",
  },
  updateBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  updateBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  deleteBtn: {
    backgroundColor: "#b91c1c",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  deleteBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});