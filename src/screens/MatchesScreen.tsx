import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { deleteMatch, getMatches } from "../services/matchService";

type Props = {
  navigation: any;
};

type Match = {
  id: number;
  homeTeamId?: number | null;
  homeTeamName?: string | null;
  awayTeamId?: number | null;
  awayTeamName?: string | null;
  externalOpponentName?: string | null;
  leagueId?: number | null;
  leagueName?: string | null;
  matchDate: string;
  venue: string;
  matchType: string;
  matchFeeAmount?: number | null;
  matchFeeDueDate?: string | null;
  matchFeeDescription?: string | null;
  matchFormat?: string;
  notes?: string;
  createdBy?: string;
  status?: "UPCOMING" | "COMPLETED" | "CANCELLED";
  myAvailability?: "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED";
};

type MatchFilter = "UPCOMING" | "PAST" | "ALL" | "CANCELLED";
type TeamFilter = "ALL_TEAMS" | string;
type LeagueFilter = "ALL_LEAGUES" | string;
type PickerType = "STATUS" | "TEAM" | "LEAGUE" | null;

const MatchesScreen = ({ navigation }: Props) => {
  const { user } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState<MatchFilter>("UPCOMING");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("ALL_TEAMS");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("ALL_LEAGUES");

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<PickerType>(null);

  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  // Load matches
  const loadMatches = async () => {
    try {
      const data = await getMatches();
      setMatches(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load matches"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload when screen opens
  useFocusEffect(
    useCallback(() => {
      void loadMatches();
    }, [])
  );

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
  };

  // Build title
  const getMatchTitle = (item: Match) => {
    if (item.awayTeamName) {
      return `${item.homeTeamName || "Team"} vs ${item.awayTeamName}`;
    }

    return `${item.homeTeamName || "Team"} vs ${
      item.externalOpponentName || "Opponent"
    }`;
  };

  // Team options
  const teamOptions = useMemo(() => {
    const teams = new Set<string>();

    matches.forEach((match) => {
      if (match.homeTeamName) teams.add(match.homeTeamName);
      if (match.awayTeamName) teams.add(match.awayTeamName);
    });

    return ["ALL_TEAMS", ...Array.from(teams)];
  }, [matches]);

  // League options
  const leagueOptions = useMemo(() => {
    const leagues = new Set<string>();

    matches.forEach((match) => {
      if (match.leagueName) leagues.add(match.leagueName);
    });

    return ["ALL_LEAGUES", ...Array.from(leagues)];
  }, [matches]);

  // Apply filters
  const filteredMatches = useMemo(() => {
    const now = new Date();

    return matches.filter((match) => {
      const matchDate = new Date(match.matchDate);
      const isPast = matchDate < now;
      const isCancelled = match.status === "CANCELLED";

      if (filter === "UPCOMING" && (isPast || isCancelled)) return false;
      if (filter === "PAST" && (!isPast || isCancelled)) return false;
      if (filter === "CANCELLED" && !isCancelled) return false;

      if (teamFilter !== "ALL_TEAMS") {
        const teamMatch =
          match.homeTeamName === teamFilter || match.awayTeamName === teamFilter;

        if (!teamMatch) return false;
      }

      if (leagueFilter !== "ALL_LEAGUES" && match.leagueName !== leagueFilter) {
        return false;
      }

      return true;
    });
  }, [matches, filter, teamFilter, leagueFilter]);

  // Availability color
  const getAvailabilityColor = (status?: string) => {
    switch (status) {
      case "AVAILABLE":
        return { color: "#22c55e" };
      case "NOT_AVAILABLE":
        return { color: "#ef4444" };
      case "MAYBE":
        return { color: "#facc15" };
      case "INJURED":
        return { color: "#9ca3af" };
      default:
        return { color: "#d1d5db" };
    }
  };

  // Availability text
  const getAvailabilityText = (status?: string) => {
    return status || "NOT MARKED";
  };

  // Delete match
  const handleDelete = async (id: number) => {
    Alert.alert("Delete Match", "Are you sure you want to delete this match?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await deleteMatch(id);

            Alert.alert(
              "Success",
              typeof response === "string"
                ? response
                : "Match deleted successfully"
            );

            await loadMatches();
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.response?.data?.message || "Failed to delete match"
            );
          }
        },
      },
    ]);
  };

  // Open popup filter
  const openPicker = (type: PickerType) => {
    setPickerType(type);
    setPickerVisible(true);
  };

  // Close popup filter
  const closePicker = () => {
    setPickerVisible(false);
    setPickerType(null);
  };

  // Modal title
  const getPickerTitle = () => {
    if (pickerType === "STATUS") return "Select Match Filter";
    if (pickerType === "TEAM") return "Select Team";
    if (pickerType === "LEAGUE") return "Select League";
    return "Select";
  };

  // Modal options
  const pickerOptions = useMemo(() => {
    if (pickerType === "STATUS") {
      return ["UPCOMING", "PAST", "ALL", "CANCELLED"];
    }

    if (pickerType === "TEAM") {
      return teamOptions;
    }

    if (pickerType === "LEAGUE") {
      return leagueOptions;
    }

    return [];
  }, [pickerType, teamOptions, leagueOptions]);

  // Current selected value
  const getCurrentSelectedValue = () => {
    if (pickerType === "STATUS") return filter;
    if (pickerType === "TEAM") return teamFilter;
    if (pickerType === "LEAGUE") return leagueFilter;
    return "";
  };

  // Apply picker value
  const handlePickerSelect = (value: string) => {
    if (pickerType === "STATUS") setFilter(value as MatchFilter);
    if (pickerType === "TEAM") setTeamFilter(value);
    if (pickerType === "LEAGUE") setLeagueFilter(value);

    closePicker();
  };

  const teamButtonLabel =
    teamFilter === "ALL_TEAMS" ? "All Teams" : teamFilter;

  const leagueButtonLabel =
    leagueFilter === "ALL_LEAGUES" ? "All Leagues" : leagueFilter;

  // Compact match card
  const renderItem = ({ item }: { item: Match }) => {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("MatchDetails", {
            matchId: item.id,
          })
        }
      >
        {/* Line 1 */}
        <View style={styles.lineOne}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {getMatchTitle(item)}
          </Text>

          <Text style={styles.compactStatus}>{item.status || "UPCOMING"}</Text>
        </View>

        {/* Line 2 */}
        <Text style={styles.compactMeta} numberOfLines={1}>
          {new Date(item.matchDate).toLocaleString()}
        </Text>

        {/* Line 3 */}
        <View style={styles.lineThree}>
          <Text style={styles.compactMetaSmall} numberOfLines={1}>
            {item.venue}
          </Text>

          <Text
            style={[styles.compactAvailability, getAvailabilityColor(item.myAvailability)]}
            numberOfLines={1}
          >
            {getAvailabilityText(item.myAvailability)}
          </Text>
        </View>

        {/* Small admin/captain actions */}
        {canManage && (
          <View style={styles.smallActionRow}>
            <TouchableOpacity
              style={[styles.smallActionBtn, styles.editBtn]}
              onPress={() =>
                navigation.navigate("EditMatch", { matchId: item.id })
              }
            >
              <Text style={styles.smallActionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallActionBtn, styles.deleteBtn]}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.smallActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={
          filteredMatches.length === 0 ? styles.center : styles.list
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            {canManage && (
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate("CreateMatch")}
              >
                <Text style={styles.createBtnText}>+ Create Match</Text>
              </TouchableOpacity>
            )}

            <View style={styles.topFilterRow}>
              <TouchableOpacity
                style={styles.topFilterBtn}
                onPress={() => openPicker("STATUS")}
              >
                <Text style={styles.topFilterBtnText}>{filter}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.topFilterBtn}
                onPress={() => openPicker("TEAM")}
              >
                <Text style={styles.topFilterBtnText}>{teamButtonLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.topFilterBtn}
                onPress={() => openPicker("LEAGUE")}
              >
                <Text style={styles.topFilterBtnText}>{leagueButtonLabel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setFilter("UPCOMING");
                  setTeamFilter("ALL_TEAMS");
                  setLeagueFilter("ALL_LEAGUES");
                }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {filter === "UPCOMING"
              ? "No upcoming matches found."
              : filter === "PAST"
              ? "No past matches found."
              : filter === "CANCELLED"
              ? "No cancelled matches found."
              : "No matches found."}
          </Text>
        }
      />

      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={closePicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{getPickerTitle()}</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalList}
            >
              {pickerOptions.map((option) => {
                const isSelected = getCurrentSelectedValue() === option;

                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOptionBtn,
                      isSelected && styles.modalOptionBtnSelected,
                    ]}
                    onPress={() => handlePickerSelect(option)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option === "ALL_TEAMS"
                        ? "All Teams"
                        : option === "ALL_LEAGUES"
                        ? "All Leagues"
                        : option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.closeModalBtn} onPress={closePicker}>
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default MatchesScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#4B1D6B",
  },

  topFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  topFilterBtn: {
    flex: 1,
    backgroundColor: "#5A257A",
    borderWidth: 1,
    borderColor: "#b89ad1",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  topFilterBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
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

  resetBtn: {
    backgroundColor: "#F4B400",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  resetBtnText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#000",
    fontSize: 12,
  },

  compactCard: {
    backgroundColor: "#5A257A",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#6d3890",
  },
  lineOne: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  compactTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  compactStatus: {
    color: "#F4B400",
    fontSize: 10,
    fontWeight: "700",
  },
  compactMeta: {
    color: "#ddd",
    fontSize: 12,
    marginBottom: 4,
  },
  lineThree: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  compactMetaSmall: {
    flex: 1,
    color: "#d1d5db",
    fontSize: 12,
  },
  compactAvailability: {
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
  },

  smallActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  smallActionBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 70,
  },
  smallActionText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 11,
  },
  editBtn: {
    backgroundColor: "#111",
  },
  deleteBtn: {
    backgroundColor: "#c0392b",
  },

  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  emptyText: {
    color: "#fff",
    textAlign: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4B1D6B",
    padding: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#4B1D6B",
    borderRadius: 16,
    padding: 18,
    maxHeight: "75%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F4B400",
    marginBottom: 14,
    textAlign: "center",
  },
  modalList: {
    gap: 8,
    paddingBottom: 12,
  },
  modalOptionBtn: {
    backgroundColor: "#5A257A",
    borderWidth: 1,
    borderColor: "#b89ad1",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalOptionBtnSelected: {
    backgroundColor: "#F4B400",
    borderColor: "#F4B400",
  },
  modalOptionText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
  modalOptionTextSelected: {
    color: "#000",
  },
  closeModalBtn: {
    backgroundColor: "#F4B400",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  closeModalBtnText: {
    color: "#000",
    textAlign: "center",
    fontWeight: "700",
  },
});