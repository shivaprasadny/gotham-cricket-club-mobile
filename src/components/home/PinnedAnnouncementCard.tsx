import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Announcement = {
  id: number;
  title: string;
  message: string;
  pinned?: boolean;
};

type Props = {
  announcement: Announcement | null;
  navigation: any;
};

const PinnedAnnouncementCard = ({ announcement, navigation }: Props) => {
  if (!announcement) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>Pinned Announcement</Text>

      <TouchableOpacity
        style={styles.pinnedCard}
        onPress={() =>
          navigation.navigate("MainTabs", { screen: "Announcements" })
        }
      >
        <Text style={styles.pinnedLabel}>📌 Important</Text>
        <Text style={styles.pinnedTitle}>{announcement.title}</Text>
        <Text style={styles.pinnedMessage} numberOfLines={4}>
          {announcement.message}
        </Text>
      </TouchableOpacity>
    </>
  );
};

export default PinnedAnnouncementCard;

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },
  pinnedCard: {
    backgroundColor: "#3a0a57",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#da9306",
  },
  pinnedLabel: {
    color: "#da9306",
    fontWeight: "700",
    marginBottom: 8,
  },
  pinnedTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  pinnedMessage: {
    color: "#ddd",
    lineHeight: 20,
  },
});