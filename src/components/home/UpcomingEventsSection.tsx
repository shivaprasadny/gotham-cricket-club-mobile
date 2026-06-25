import React, { useMemo, useState } from "react";
import { logger } from "../../utils/logger";
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
  onHideEvent?: (eventId: number) => void;
};

const STATUS_OPTIONS: {
  label: string;
  value: EventStatus;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "Going", value: "GOING", icon: "checkmark-circle" },
  { label: "Maybe", value: "MAYBE", icon: "help-circle" },
  { label: "Not Going", value: "NOT_GOING", icon: "close-circle" },
];

// Parse backend local datetime without UTC shifting
const parseLocalDateTime = (dateString: string) => {
  if (!dateString) return new Date();

  const cleanDate = dateString.replace("Z", "").split(".")[0];

  const [datePart, timePart = "00:00:00"] = cleanDate.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hour || 0,
    minute || 0,
    second || 0
  );
};

const formatDate = (dateString: string) => {
  try {
    const date = parseLocalDateTime(dateString);

    return date.toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

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

const getStatusColor = (status?: EventStatus) => {
  switch (status) {
    case "GOING":
      return "#22c55e";
    case "MAYBE":
      return "#facc15";
    case "NOT_GOING":
      return "#ef4444";
    default:
      return "#d1d5db";
  }
};

const UpcomingEventsSection = ({
  events,
  navigation,
  onUpdated,
  onHideEvent,
}: Props) => {
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [savingEventId, setSavingEventId] = useState<number | null>(null);

  // Local state keeps event visible and updates response instantly
  const [localStatuses, setLocalStatuses] = useState<Record<number, EventStatus>>(
    {}
  );

  // Count events with no response
  const notRespondedCount = useMemo(() => {
    return events.filter((event) => {
      const currentStatus = localStatuses[event.id] || event.myStatus;
      return !currentStatus;
    }).length;
  }, [events, localStatuses]);

  const handleQuickResponse = async (eventId: number, status: EventStatus) => {
    try {
      setSavingEventId(eventId);

    await submitEventAvailability(eventId, {
  status,
  message: "",
});

setLocalStatuses((prev) => ({
  ...prev,
  [eventId]: status,
}));

// Collapse event after saving
setExpandedEventId(null);

// If user selected Not Going, remove event from Home immediately
if (status === "NOT_GOING") {
  onHideEvent?.(eventId);
}

// DO NOT refresh HomeScreen
// onUpdated?.();
    } catch (error: any) {
      logger.log("HOME EVENT RESPONSE ERROR:", error);

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

  const openEventDetails = (event: EventItem) => {
    navigation.navigate("EventDetails", {
      event,
    });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>

          <Text style={styles.sectionSubTitle}>
            {notRespondedCount === 0
              ? "All events responded"
              : `${notRespondedCount} event${
                  notRespondedCount > 1 ? "s" : ""
                } need response`}
          </Text>
        </View>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No upcoming events.</Text>
        </View>
      ) : (
        events.map((event) => {
          const isExpanded = expandedEventId === event.id;
          const isSaving = savingEventId === event.id;

          const currentStatus = localStatuses[event.id] || event.myStatus;
          const statusLabel = getStatusLabel(currentStatus);
          const statusColor = getStatusColor(currentStatus);

          return (
            <View key={event.id} style={styles.rowCard}>
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

                <View style={styles.statusBox}>
                  <Text style={[styles.responseText, { color: statusColor }]}>
                    {statusLabel}
                  </Text>

                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={22}
                    color="#da9306"
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expandedBox}>
                  {isSaving ? (
                    <View style={styles.savingBox}>
                      <ActivityIndicator color="#da9306" />
                      <Text style={styles.savingText}>Saving...</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.optionsGrid}>
                        {STATUS_OPTIONS.map((option) => {
                          const isSelected = currentStatus === option.value;

                          return (
                            <TouchableOpacity
                              key={option.value}
                              style={[
                                styles.optionButton,
                                isSelected && styles.optionButtonSelected,
                              ]}
                              activeOpacity={0.85}
                              onPress={() =>
                                handleQuickResponse(event.id, option.value)
                              }
                            >
                              <Ionicons
                                name={option.icon}
                                size={22}
                                color={isSelected ? "#2b0540" : "#da9306"}
                              />

                              <Text
                                style={[
                                  styles.optionText,
                                  isSelected && styles.optionTextSelected,
                                ]}
                              >
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

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
        })
      )}
    </View>
  );
};

export default UpcomingEventsSection;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },

  headerRow: {
    marginTop: 6,
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  sectionSubTitle: {
    color: "#d1d5db",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
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
    marginBottom: 3,
  },

  location: {
    color: "#da9306",
    fontSize: 13,
    fontWeight: "600",
  },

  statusBox: {
    alignItems: "center",
    minWidth: 82,
  },

  responseText: {
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 4,
    textAlign: "center",
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
    borderWidth: 1,
    borderColor: "rgba(218,147,6,0.35)",
  },

  optionButtonSelected: {
    backgroundColor: "#da9306",
    borderColor: "#da9306",
  },

  optionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },

  optionTextSelected: {
    color: "#2b0540",
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
});