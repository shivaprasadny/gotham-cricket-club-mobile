import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type EventItem = {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  venue?: string;
};

type Props = {
  events: EventItem[];
  navigation: any;
};

/**
 * Shows upcoming club events
 */
const UpcomingEventsSection = ({
  events,
  navigation,
}: Props) => {
  return (
    <>
      {/* Section title */}
      <Text style={styles.sectionTitle}>
        Upcoming Events
      </Text>

      {/* Empty state */}
      {events.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No upcoming events.
          </Text>
        </View>
      ) : (
        events.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("EventDetails", {
                eventId: event.id,
              })
            }
          >
            {/* Event title */}
            <Text style={styles.title}>
              {event.title}
            </Text>

            {/* Event description */}
            {!!event.description && (
              <Text
                style={styles.description}
                numberOfLines={3}
              >
                {event.description}
              </Text>
            )}

            {/* Venue */}
            {!!event.venue && (
              <Text style={styles.venue}>
                📍 {event.venue}
              </Text>
            )}

            {/* Date */}
            <Text style={styles.date}>
              {new Date(event.eventDate).toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </>
  );
};

export default UpcomingEventsSection;

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },

  emptyCard: {
    backgroundColor: "#3a0a57",
    padding: 16,
    borderRadius: 16,
    marginBottom: 18,
  },

  emptyText: {
    color: "#ddd",
  },

  card: {
    backgroundColor: "#3a0a57",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },

  title: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },

  description: {
    color: "#ddd",
    lineHeight: 20,
    marginBottom: 10,
  },

  venue: {
    color: "#da9306",
    marginBottom: 6,
    fontWeight: "600",
  },

  date: {
    color: "#fff",
    fontWeight: "700",
  },
});