import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";

import { useAuth } from "../context/AuthContext";
import {
  deleteAnnouncement,
  getAnnouncements,
  pinAnnouncement,
  unpinAnnouncement,
} from "../services/announcementService";

type Props = {
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

const AnnouncementsScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  // List of announcements shown on the screen
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Screen loading state
  const [loading, setLoading] = useState(true);

  // Pull-to-refresh loading state
  const [refreshing, setRefreshing] = useState(false);

  // Role-based permissions
  const isAdmin = user?.role === "ADMIN";
  const isCaptain = user?.role === "CAPTAIN";
  const canManage = isAdmin || isCaptain;

  // Load announcements from backend
  const loadAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.log("ANNOUNCEMENTS LOAD ERROR:", error?.response?.data || error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to load announcements"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload announcements every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      void loadAnnouncements();
    }, [])
  );

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
  };

  // Delete announcement with confirmation dialog
  const handleDelete = (announcementId: number) => {
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
              const response = await deleteAnnouncement(announcementId);

              Alert.alert(
                "Success",
                typeof response === "string"
                  ? response
                  : "Announcement deleted successfully"
              );

              await loadAnnouncements();
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
            }
          },
        },
      ]
    );
  };

  // Copy announcement title + message to clipboard
  const handleCopy = async (item: Announcement) => {
    try {
      const textToCopy = `${item.title}\n\n${item.message}`;
      await Clipboard.setStringAsync(textToCopy);
      Alert.alert("Copied", "Announcement copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy announcement");
    }
  };

  // Pin announcement
  const handlePin = async (item: Announcement) => {
    try {
      const response = await pinAnnouncement(item.id);

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Announcement pinned successfully"
      );

      await loadAnnouncements();
    } catch (error: any) {
      console.log("PIN ANNOUNCEMENT ERROR:", error?.response?.data || error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to pin announcement"
      );
    }
  };

  // Unpin announcement
  const handleUnpin = async (item: Announcement) => {
    try {
      const response = await unpinAnnouncement(item.id);

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Announcement unpinned successfully"
      );

      await loadAnnouncements();
    } catch (error: any) {
      console.log("UNPIN ANNOUNCEMENT ERROR:", error?.response?.data || error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to unpin announcement"
      );
    }
  };

  // Render each announcement card
  const renderItem = ({ item }: { item: Announcement }) => {
    return (
      <TouchableOpacity
        style={[styles.card, item.pinned && styles.pinnedCard]}
        activeOpacity={canManage ? 0.9 : 1}
        onPress={() =>
          canManage
            ? navigation.navigate("EditAnnouncement", { announcement: item })
            : undefined
        }
      >
        {/* Pinned badge */}
        {item.pinned && <Text style={styles.pinnedLabel}>📌 Pinned</Text>}

        {/* Announcement content */}
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMessage}>{item.message}</Text>

        {/* Created by and created date */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>By: {item.createdBy || "Unknown"}</Text>
          {item.createdAt ? (
            <Text style={styles.metaText}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          ) : null}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {canManage && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() =>
                  navigation.navigate("EditAnnouncement", {
                    announcement: item,
                  })
                }
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  item.pinned ? styles.unpinBtn : styles.pinBtn,
                ]}
                onPress={() =>
                  item.pinned ? handleUnpin(item) : handlePin(item)
                }
              >
                <Ionicons
                  name={item.pinned ? "bookmark-outline" : "bookmark"}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.actionText}>
                  {item.pinned ? "Unpin" : "Pin"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.copyBtn]}
            onPress={() => handleCopy(item)}
          >
            <Ionicons name="copy-outline" size={16} color="#fff" />
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>

          {canManage && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Initial loading screen
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
        <Text style={styles.loadingText}>Loading announcements...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={announcements}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={
        announcements.length === 0 ? styles.center : styles.listContainer
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      // Show create button only for admin/captain
      ListHeaderComponent={
        canManage ? (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate("CreateAnnouncement")}
          >
            <Ionicons name="add-circle-outline" size={18} color="#2b0540" />
            <Text style={styles.createBtnText}>Create Announcement</Text>
          </TouchableOpacity>
        ) : null
      }
      // Show message if no announcements exist
      ListEmptyComponent={
        <Text style={styles.emptyText}>No announcements available.</Text>
      }
    />
  );
};

export default AnnouncementsScreen;

const styles = StyleSheet.create({
  // Main list container when announcements exist
  listContainer: {
    padding: 16,
    backgroundColor: "#2b0540",
    flexGrow: 1,
  },

  // Centered layout for loading and empty states
  center: {
    flexGrow: 1,
    backgroundColor: "#2b0540",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "600",
  },

  emptyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Top create announcement button
  createBtn: {
    backgroundColor: "#da9306",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  createBtnText: {
    color: "#2b0540",
    fontWeight: "800",
    fontSize: 16,
  },

  // Individual announcement card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  // Highlight pinned announcement
  pinnedCard: {
    borderColor: "#da9306",
    borderWidth: 2,
    backgroundColor: "#fff8e8",
  },

  pinnedLabel: {
    color: "#8a5b00",
    fontWeight: "800",
    marginBottom: 8,
  },

  cardTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },

  cardMessage: {
    color: "#111827",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    marginBottom: 12,
  },

  // Metadata section
  metaRow: {
    marginBottom: 12,
  },

  metaText: {
    color: "#4b5563",
    fontSize: 12,
    marginBottom: 3,
    fontWeight: "600",
  },

  // Action buttons area
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  editBtn: {
    backgroundColor: "#2b0540",
  },

  pinBtn: {
    backgroundColor: "#da9306",
  },

  unpinBtn: {
    backgroundColor: "#92400e",
  },

  copyBtn: {
    backgroundColor: "#2563eb",
  },

  deleteBtn: {
    backgroundColor: "#b91c1c",
  },

  actionText: {
    color: "#fff",
    fontWeight: "700",
  },
});