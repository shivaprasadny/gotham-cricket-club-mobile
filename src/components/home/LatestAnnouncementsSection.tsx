import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Announcement = {
  id: number;
  title: string;
  message: string;
  pinned?: boolean;
};

type Props = {
  announcements: Announcement[];
  navigation: any;
};

const LatestAnnouncementsSection = ({ announcements, navigation }: Props) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Latest Announcements</Text>

      {announcements.length === 0 ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>No announcements right now.</Text>
        </View>
      ) : (
        announcements.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.infoCard}
            onPress={() =>
              navigation.navigate("MainTabs", { screen: "Announcements" })
            }
          >
            <Text style={styles.cardTitle}>
              {item.title} {item.pinned ? "📌" : ""}
            </Text>
            <Text style={styles.cardText} numberOfLines={3}>
              {item.message}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </>
  );
};

export default LatestAnnouncementsSection;

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: "#3a0a57",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  infoText: {
    color: "#ddd",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardText: {
    color: "#ddd",
    marginBottom: 4,
  },
});