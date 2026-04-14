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
import { getAnnouncements, deleteAnnouncement } from "../services/announcementService";
import * as Clipboard from "expo-clipboard";

type Props = {
  navigation: any;
};

type Announcement = {
  id: number;
  title: string;
  message: string;
  createdBy: string;
  createdAt: string;
};

const AnnouncementsScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data || []);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load announcements");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
  };

  // ✅ COPY FUNCTION
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

  // ✅ DELETE FUNCTION
  const handleDelete = async (id: number) => {
    try {
      await deleteAnnouncement(id);
      Alert.alert("Success", "Announcement deleted");
      loadAnnouncements();
    } catch (error: any) {
      Alert.alert("Error", "Failed to delete announcement");
    }
  };

  const renderItem = ({ item }: { item: Announcement }) => {
    const canEdit = user?.role === "ADMIN" || user?.role === "CAPTAIN";

    return (
      <View style={styles.card}>
        {/* CONTENT */}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>

        <Text style={styles.meta}>By: {item.createdBy}</Text>
        <Text style={styles.meta}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>

        {/* ACTION BUTTONS */}
        <View style={styles.actionRow}>
          {canEdit && (
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
          )}

         {(user?.role === "ADMIN" || user?.role === "CAPTAIN") && (
  <TouchableOpacity
    style={[styles.actionBtn, styles.copyBtn]}
    onPress={() => handleCopy(item)}
  >
    <Text style={styles.actionText}>Copy</Text>
  </TouchableOpacity>
)}

          {canEdit && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading announcements...</Text>
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
      ListEmptyComponent={<Text>No announcements available.</Text>}
    />
  );
};

export default AnnouncementsScreen;
const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "#f7f7f7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 22,
  },
  meta: {
    fontSize: 12,
    color: "#666",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editBtn: {
    backgroundColor: "#111",
  },
  copyBtn: {
    backgroundColor: "#2563eb",
  },
  deleteBtn: {
    backgroundColor: "#c0392b",
  },
  actionText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
});