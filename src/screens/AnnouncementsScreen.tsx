import React, { useEffect, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import {
  deleteAnnouncement,
  getAnnouncements,
  pinAnnouncement,
  unpinAnnouncement,
} from "../services/announcementService";
import * as Clipboard from "expo-clipboard";

type Props = {
  navigation: any;
};

// Announcement shape
type Announcement = {
  id: number;
  title: string;
  message: string;
  createdBy: string;
  createdAt: string;
  pinned?: boolean;
};

const AnnouncementsScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  // List of announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  // Load all announcements from backend
  const loadAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load announcements");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
  };

  // Copy announcement to clipboard
  const handleCopy = async (item: Announcement) => {
    try {
      const text =
        `${item.title}\n\n${item.message}\n\n` +
        `Shared by ${item.createdBy}\n` +
        `${new Date(item.createdAt).toLocaleString()}`;

      await Clipboard.setStringAsync(text);
      Alert.alert("Copied", "Announcement copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy announcement");
    }
  };

  // Delete announcement
  const handleDelete = async (id: number) => {
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
              await deleteAnnouncement(id);
              Alert.alert("Success", "Announcement deleted");
              await loadAnnouncements();
            } catch (error: any) {
              Alert.alert("Error", "Failed to delete announcement");
            }
          },
        },
      ]
    );
  };

  // Pin announcement to show on home
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
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to pin announcement"
      );
    }
  };

  // Unpin announcement from home
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
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to unpin announcement"
      );
    }
  };

  // Render one announcement card
  const renderItem = ({ item }: { item: Announcement }) => (
    <View style={styles.card}>
      <Text style={styles.title}>
        {item.title} {item.pinned ? "📌" : ""}
      </Text>

      <Text style={styles.message}>{item.message}</Text>

      <Text style={styles.meta}>By: {item.createdBy}</Text>
      <Text style={styles.meta}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>

      {canManage && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() =>
              navigation.navigate("EditAnnouncement", {
                announcement: item,
              })
            }
          >
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.copyBtn]}
            onPress={() => handleCopy(item)}
          >
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, item.pinned ? styles.unpinBtn : styles.pinBtn]}
            onPress={() => (item.pinned ? handleUnpin(item) : handlePin(item))}
          >
            <Text style={styles.actionText}>
              {item.pinned ? "Unpin" : "Pin"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Loading UI
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
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
        announcements.length === 0 ? styles.center : styles.list
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <View>
          {canManage && (
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate("CreateAnnouncement")}
            >
              <Text style={styles.createBtnText}>+ Create Announcement</Text>
            </TouchableOpacity>
          )}
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No announcements available.</Text>
      }
    />
  );
};

export default AnnouncementsScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#4B1D6B",
  },
  createBtn: {
    backgroundColor: "#F4B400",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  createBtnText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#000",
  },
  card: {
    backgroundColor: "#5A257A",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#fff",
  },
  message: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 22,
    color: "#ddd",
  },
  meta: {
    fontSize: 12,
    color: "#ccc",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    minWidth: "22%",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  editBtn: {
    backgroundColor: "#111",
  },
  copyBtn: {
    backgroundColor: "#2563eb",
  },
  pinBtn: {
    backgroundColor: "#8e44ad",
  },
  unpinBtn: {
    backgroundColor: "#6b7280",
  },
  deleteBtn: {
    backgroundColor: "#c0392b",
  },
  actionText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  emptyText: {
    color: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4B1D6B",
    padding: 20,
  },
});