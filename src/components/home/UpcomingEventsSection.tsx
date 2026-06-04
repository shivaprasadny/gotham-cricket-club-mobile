import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { submitEventAvailability } from "../../services/eventService";

type EventStatus = "GOING" | "NOT_GOING" | "MAYBE";

type EventItem = {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  myStatus?: EventStatus;
};

type Props = {
  events: EventItem[];
  navigation: any;
  onUpdated?: () => void;
};

const STATUS_OPTIONS: {
  label: string;
  value: EventStatus;
  icon: string;
}[] = [
  { label: "Going", value: "GOING", icon: "checkmark-circle" },
  { label: "Maybe", value: "MAYBE", icon: "help-circle" },
  { label: "Not Going", value: "NOT_GOING", icon: "close-circle" },
];

const UpcomingEventsSection = ({
  events,
  navigation,
  onUpdated,
}: Props) => {
  // Which event is currently expanded
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);

  // Which event is currently saving response
  const [savingEventId, setSavingEventId] = useState<number | null>(null);

  // Local response state so UI updates immediately after submit
  const [localStatuses, setLocalStatuses] = useState<
    Record<number, EventStatus>
  >({});

  // If there are no events, show empty card
  if (events.length === 0) {
    return (
      <>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No upcoming events.</Text>
        </View>
      </>
    );
  }

  // Format event date safely
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Convert status to clean label
  const getStatusLabel = (status?: EventStatus) => {
    switch (status) {
      case "GOING":
        return "Going";
      case "MAYBE":
        return "Maybe";
      case "NOT_GOING":
        return "Not Going";
      default:
        return "No response";
    }
  };

  // Submit quick response from Home
  const handleQuickResponse = async (eventId: number, status: EventStatus) => {
    try {
      setSavingEventId(eventId);

      await submitEventAvailability(eventId, {
        status,
        message: "",
      });

      // Update local status immediately
      setLocalStatuses((prev) => ({
        ...prev,
        [eventId]: status,
      }));

      // Collapse event after saving
      setExpandedEventId(null);

      // Refresh Home data if parent provides function
      onUpdated?.();
    } catch (error: any) {
      console.log("HOME EVENT RESPONSE ERROR:", error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          "Could not submit event response."
      );
    } finally {
      setSavingEventId(null);
    }
  };

  // Open full event page if user wants to add message
  const openEventDetails = (event: EventItem) => {
    navigation.navigate("EventDetails", {
      event,
    });
  };

  return (
    <View style={styles.wrapper}>
      {/* Section title */}
      <Text style={styles.sectionTitle}>Upcoming Events</Text>

      {/* Event list */}
      {events.map((event) => {
        const isExpanded = expandedEventId === event.id;
        const isSaving = savingEventId === event.id;

        // Prefer local status first, then backend status
        const currentStatus = localStatuses[event.id] || event.myStatus;

        const statusLabel = getStatusLabel(currentStatus);

        return (
          <View key={event.id} style={styles.rowCard}>
            {/* Main compact event row */}
           {/* Main compact event row */}
<TouchableOpacity
  style={styles.eventRow}
  activeOpacity={0.85}
  onPress={() => setExpandedEventId(isExpanded ? null : event.id)}
>
  <View style={styles.eventInfo}>
    <Text style={styles.title} numberOfLines={1}>
      {event.title}
    </Text>

    <Text style={styles.date} numberOfLines={1}>
      {formatDate(event.eventDate)}
    </Text>

    {!!event.location && (
      <Text style={styles.location} numberOfLines={1}>
        📍 {event.location}
      </Text>
    )}
  </View>

  <View style={styles.statusRow}>
    <Text
      style={[
        styles.responseText,
        !currentStatus && styles.noResponseText,
      ]}
    >
      {statusLabel}
    </Text>

    <Ionicons
      name={isExpanded ? "chevron-up" : "chevron-down"}
      size={22}
      color="#da9306"
    />
  </View>
</TouchableOpacity>

                

            {/* Expanded response area */}
            {isExpanded && (
              <View style={styles.expandedBox}>
                {isSaving ? (
                  <View style={styles.savingBox}>
                    <ActivityIndicator color="#da9306" />
                    <Text style={styles.savingText}>Saving...</Text>
                  </View>
                ) : (
                  <>
                    {/* Quick response buttons */}
                    <View style={styles.optionsGrid}>
                      {STATUS_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={styles.optionButton}
                          activeOpacity={0.85}
                          onPress={() =>
                            handleQuickResponse(event.id, option.value)
                          }
                        >
                       <View style={styles.statusRow}>
  <Text
    style={[
      styles.responseText,
      !currentStatus && styles.noResponseText,
    ]}
  >
    {statusLabel}
  </Text>

  <Ionicons
    name={isExpanded ? "chevron-up" : "chevron-down"}
    size={22}
    color="#da9306"
  />
</View>

                          <Text style={styles.optionText}>{option.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Open full details screen for message */}
                    <TouchableOpacity
                      style={styles.messageButton}
                      activeOpacity={0.85}
                      onPress={() => openEventDetails(event)}
                    >
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={17}
                        color="#da9306"
                      />

                      <Text style={styles.messageButtonText}>
                        Add message / more details
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default UpcomingEventsSection;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },

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

  rowCard: {
    backgroundColor: "#3a0a57",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(218,147,6,0.35)",
  },

  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },

  eventInfo: {
    flex: 1,
    paddingRight: 8,
  },

  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },

  date: {
    color: "#d1d5db",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 3,
  },

  location: {
    color: "#da9306",
    fontSize: 13,
    fontWeight: "600",
  },

  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#2b0540",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(218,147,6,0.5)",
  },

  statusBadgeText: {
    color: "#da9306",
    fontSize: 11,
    fontWeight: "800",
  },

  noResponseBadge: {
    borderColor: "rgba(209,213,219,0.35)",
  },

  noResponseText: {
    color: "#d1d5db",
  },

  expandedBox: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    padding: 12,
    backgroundColor: "#2b0540",
  },

  optionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  optionButton: {
    width: "31%",
    backgroundColor: "#3a0a57",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  optionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },

  messageButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#da9306",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  messageButtonText: {
    color: "#da9306",
    fontWeight: "800",
    marginLeft: 7,
  },

  savingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },

  savingText: {
    color: "#ddd",
    marginLeft: 10,
    fontWeight: "700",
  },
  statusRow: {
  alignItems: "center",
},

responseText: {
  color: "#da9306",
  fontWeight: "700",
  fontSize: 12,
  marginBottom: 4,
},


});