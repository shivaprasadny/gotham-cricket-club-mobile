import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Get all club members from admin service
import { getAllMembers } from "../services/adminService";

// Get player availability for this match
import { getAvailabilityByMatch } from "../services/availabilityService";

// Post squad announcement
import { createAnnouncement } from "../services/announcementService";

// Squad APIs
import {
  addOrUpdateSquadMember,
  getSquadByMatch,
  removeSquadMember,
} from "../services/squadService";

type Props = {
  route: any;
};

// Club player shape from members API
type ClubPlayer = {
  id?: number;
  userId?: number;
  fullName?: string;
  role?: string;
  status?: string;
  playerType?: string;
};

// Availability row shape
type AvailabilityItem = {
  id: number;
  matchId: number;
  userId: number;
  fullName: string;
  status: "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED";
  message?: string;
};

// Squad row shape
type SquadItem = {
  squadId: number;
  userId: number;
  fullName: string;
  nickname?: string;
  playerType?: string;
  jerseyNumber?: number;
  isPlayingXi: boolean;
  roleInMatch?: string;
};

// Combined player row for UI
type PlayerRow = {
  userId: number;
  fullName: string;
  playerType?: string;
  availabilityStatus:
    | "AVAILABLE"
    | "NOT_AVAILABLE"
    | "MAYBE"
    | "INJURED"
    | "NO_RESPONSE";
  availabilityMessage?: string;
};

// Sort options
type SortType = "STATUS" | "NAME";

const SquadSelectionScreen = ({ route }: Props) => {
  // Match info passed from MatchDetails screen
  const {
    matchId,
    opponentName,
    teamName,
    matchDate,
    venue,
    matchType,
  } = route.params || {};

  // All club players
  const [players, setPlayers] = useState<ClubPlayer[]>([]);

  // Availability records for this match
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);

  // Current squad for this match
  const [squad, setSquad] = useState<SquadItem[]>([]);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Announcement loading state
  const [announcing, setAnnouncing] = useState(false);

  // Search text for player list
  const [search, setSearch] = useState("");

  // Sort players by status or name
  const [sortBy, setSortBy] = useState<SortType>("STATUS");

  // Temporary input per player for role in match
  // Example:
  // { 12: "CAPTAIN", 15: "WICKETKEEPER" }
  const [roleInputs, setRoleInputs] = useState<Record<number, string>>({});

  // Optional custom message for squad announcement
  const [customMessage, setCustomMessage] = useState("");

  useEffect(() => {
    void loadData();
  }, []);

  // Load all data needed for squad screen
  const loadData = async () => {
    try {
      setLoading(true);

      const [allPlayers, availabilityData, squadData] = await Promise.all([
        getAllMembers(),
        getAvailabilityByMatch(matchId),
        getSquadByMatch(matchId),
      ]);

      setPlayers(Array.isArray(allPlayers) ? allPlayers : []);
      setAvailability(Array.isArray(availabilityData) ? availabilityData : []);
      setSquad(Array.isArray(squadData) ? squadData : []);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load squad data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Get one player's availability status for this match
  const getAvailabilityStatus = (
    userId: number
  ): PlayerRow["availabilityStatus"] => {
    const found = availability.find((a) => a.userId === userId);
    return found?.status || "NO_RESPONSE";
  };

  // Get one player's availability message/note
  const getAvailabilityMessage = (userId: number) => {
    const found = availability.find((a) => a.userId === userId);
    return found?.message;
  };

  // Priority for status sorting
  // Lower number = appears first
  const getPriority = (status: PlayerRow["availabilityStatus"]) => {
    switch (status) {
      case "AVAILABLE":
        return 1;
      case "MAYBE":
        return 2;
      case "NO_RESPONSE":
        return 3;
      case "NOT_AVAILABLE":
        return 4;
      case "INJURED":
        return 5;
      default:
        return 6;
    }
  };

  

  // Convert raw players into UI-ready rows
  const allClubPlayers: PlayerRow[] = useMemo(() => {
    return players
      .map((p) => {
        // Some APIs return id, some return userId
        const normalizedUserId = p.userId ?? p.id ?? 0;

        return {
          userId: normalizedUserId,
          fullName: p.fullName || "Unknown Player",
          playerType: p.playerType,
          availabilityStatus: getAvailabilityStatus(normalizedUserId),
          availabilityMessage: getAvailabilityMessage(normalizedUserId),
        };
      })
      .filter((p) => p.userId !== 0);
  }, [players, availability]);

  // Apply search + sorting
  const filteredAndSortedPlayers = useMemo(() => {
    let result = allClubPlayers.filter((p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === "STATUS") {
      result = [...result].sort((a, b) => {
        const statusCompare =
          getPriority(a.availabilityStatus) - getPriority(b.availabilityStatus);

        if (statusCompare !== 0) return statusCompare;

        // If same status, sort by name
        return a.fullName.localeCompare(b.fullName);
      });
    } else {
      result = [...result].sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    return result;
  }, [allClubPlayers, search, sortBy]);

  // Find one player's squad entry
  const getSquadEntry = (userId: number) => {
    return squad.find((s) => s.userId === userId);
  };

  // Check if player is already selected
  const isSelected = (userId: number) => {
    return squad.some((s) => s.userId === userId);
  };

  // Add or update player in squad
  const handleAdd = async (userId: number, isPlayingXi: boolean) => {
    try {
      // Use current role input for player if available
      const roleInMatch = roleInputs[userId]?.trim() || undefined;

      const response = await addOrUpdateSquadMember(matchId, {
        userId,
        isPlayingXi,
        roleInMatch,
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Squad updated successfully"
      );

      await loadData();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update squad"
      );
    }
  };

  // Remove player from squad
  const handleRemove = async (userId: number) => {
    try {
      const response = await removeSquadMember(matchId, userId);

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Player removed from squad"
      );

      await loadData();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to remove player"
      );
    }
  };

  // Playing XI players
  const playingXi = useMemo(
    () => squad.filter((s) => s.isPlayingXi),
    [squad]
  );

  // Reserve players
  const reserves = useMemo(
    () => squad.filter((s) => !s.isPlayingXi),
    [squad]
  );

  // Playing XI count
  const playingXiCount = useMemo(() => playingXi.length, [playingXi]);

  // Special role checks
  const captain = useMemo(
    () => playingXi.find((p) => p.roleInMatch === "CAPTAIN"),
    [playingXi]
  );

  const viceCaptain = useMemo(
    () => playingXi.find((p) => p.roleInMatch === "VICE_CAPTAIN"),
    [playingXi]
  );

  const wicketKeeper = useMemo(
    () => playingXi.find((p) => p.roleInMatch === "WICKETKEEPER"),
    [playingXi]
  );

  // Build warning messages for invalid or incomplete squad
  const squadWarnings = useMemo(() => {
    const warnings: string[] = [];

    if (playingXiCount < 11) {
      warnings.push(`Need ${11 - playingXiCount} more player(s) in Playing XI`);
    }

    if (playingXiCount > 11) {
      warnings.push(`Playing XI has ${playingXiCount} players. Maximum is 11`);
    }

    if (!captain) {
      warnings.push("No captain selected");
    }

    if (!viceCaptain) {
      warnings.push("No vice-captain selected");
    }

    if (!wicketKeeper) {
      warnings.push("No wicketkeeper selected");
    }

    return warnings;
  }, [playingXiCount, captain, viceCaptain, wicketKeeper]);

  // Pick badge color based on availability
  const getAvailabilityStyle = (status: PlayerRow["availabilityStatus"]) => {
    switch (status) {
      case "AVAILABLE":
        return styles.availableBadge;
      case "MAYBE":
        return styles.maybeBadge;
      case "NOT_AVAILABLE":
        return styles.notAvailableBadge;
      case "INJURED":
        return styles.injuredBadge;
      case "NO_RESPONSE":
        return styles.noResponseBadge;
      default:
        return styles.noResponseBadge;
    }
  };

  // Format date for announcement
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Announce squad to announcement board
  const handleAnnounceSquad = async () => {
    try {
      setAnnouncing(true);

      // Build Playing XI text with tags
      const playingXiText =
        playingXi.length > 0
          ? playingXi
              .map((p, index) => {
                const tag =
                  p.roleInMatch === "CAPTAIN"
                    ? " (C)"
                    : p.roleInMatch === "VICE_CAPTAIN"
                    ? " (VC)"
                    : p.roleInMatch === "WICKETKEEPER"
                    ? " (WK)"
                    : "";

                return `${index + 1}. ${p.fullName}${tag}`;
              })
              .join("\n")
          : "No Playing XI selected";

      // Build reserve text with tags
      const reservesText =
        reserves.length > 0
          ? reserves
              .map((p, index) => {
                const tag =
                  p.roleInMatch === "CAPTAIN"
                    ? " (C)"
                    : p.roleInMatch === "VICE_CAPTAIN"
                    ? " (VC)"
                    : p.roleInMatch === "WICKETKEEPER"
                    ? " (WK)"
                    : "";

                return `${index + 1}. ${p.fullName}${tag}`;
              })
              .join("\n")
          : "No reserve players";

      // Better title for announcement
      const title =
        teamName && opponentName
          ? `${teamName} vs ${opponentName}`
          : opponentName
          ? `Match vs ${opponentName}`
          : "Squad Announcement";

      // Full announcement body
      const message =
        `${customMessage.trim() ? customMessage.trim() + "\n\n" : ""}` +
        `Team: ${teamName || "No team assigned"}\n` +
        `Opponent: ${opponentName || "Not set"}\n` +
        `Date: ${formatDate(matchDate)}\n` +
        `Venue: ${venue || "Not set"}\n` +
        `Match Type: ${matchType || "Not set"}\n\n` +
        `Playing XI:\n${playingXiText}\n\n` +
        `Reserve:\n${reservesText}`;

      const response = await createAnnouncement({
        title,
        message,
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Squad announced successfully"
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to announce squad"
      );
    } finally {
      setAnnouncing(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading squad...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredAndSortedPlayers}
      keyExtractor={(item) => item.userId.toString()}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Squad Selection</Text>

          {/* Playing XI summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Playing XI ({playingXiCount}/11)</Text>
            {playingXi.length === 0 ? (
              <Text style={styles.summaryEmpty}>No players selected yet</Text>
            ) : (
              playingXi.map((p) => (
                <Text key={p.squadId} style={styles.summaryName}>
                  • {p.fullName}
                  {p.roleInMatch === "CAPTAIN"
                    ? " (C)"
                    : p.roleInMatch === "VICE_CAPTAIN"
                    ? " (VC)"
                    : p.roleInMatch === "WICKETKEEPER"
                    ? " (WK)"
                    : ""}
                </Text>
              ))
            )}
          </View>

          {/* Reserve summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Reserve</Text>
            {reserves.length === 0 ? (
              <Text style={styles.summaryEmpty}>No reserve players selected yet</Text>
            ) : (
              reserves.map((p) => (
                <Text key={p.squadId} style={styles.summaryName}>
                  • {p.fullName}
                  {p.roleInMatch === "CAPTAIN"
                    ? " (C)"
                    : p.roleInMatch === "VICE_CAPTAIN"
                    ? " (VC)"
                    : p.roleInMatch === "WICKETKEEPER"
                    ? " (WK)"
                    : ""}
                </Text>
              ))
            )}
          </View>

          {/* Squad warnings */}
          {squadWarnings.length > 0 && (
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Squad Warnings</Text>

              {squadWarnings.map((warning, index) => (
                <Text key={index} style={styles.warningText}>
                  ⚠ {warning}
                </Text>
              ))}
            </View>
          )}

          {/* Search player by name */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search player name..."
            value={search}
            onChangeText={setSearch}
          />

          {/* Sort options */}
          <View style={styles.sortRow}>
            <TouchableOpacity
              style={[
                styles.sortBtn,
                sortBy === "STATUS" && styles.sortBtnSelected,
              ]}
              onPress={() => setSortBy("STATUS")}
            >
              <Text
                style={[
                  styles.sortText,
                  sortBy === "STATUS" && styles.sortTextSelected,
                ]}
              >
                Sort by Status
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortBtn,
                sortBy === "NAME" && styles.sortBtnSelected,
              ]}
              onPress={() => setSortBy("NAME")}
            >
              <Text
                style={[
                  styles.sortText,
                  sortBy === "NAME" && styles.sortTextSelected,
                ]}
              >
                Sort by Name
              </Text>
            </TouchableOpacity>
          </View>

          {/* Optional custom message for squad announcement */}
          <Text style={styles.sectionTitle}>Announcement Message</Text>
          <TextInput
            style={styles.customMessageInput}
            placeholder="Write message for squad announcement..."
            value={customMessage}
            onChangeText={setCustomMessage}
            multiline
          />

          {/* Announce squad button */}
          <TouchableOpacity
            style={styles.announceBtn}
            onPress={handleAnnounceSquad}
            disabled={announcing}
          >
            <Text style={styles.announceBtnText}>
              {announcing ? "Announcing..." : "Announce Squad"}
            </Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => {
        const selected = isSelected(item.userId);
        const squadEntry = getSquadEntry(item.userId);

        return (
          <View style={styles.card}>
            {/* Top line: player name + type + availability badge */}
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.typeText}>
                  {item.playerType || "Player"}
                </Text>
              </View>

              <Text
                style={[styles.badge, getAvailabilityStyle(item.availabilityStatus)]}
              >
                {item.availabilityStatus}
              </Text>
            </View>

            {/* Optional player note */}
            {item.availabilityMessage ? (
              <Text style={styles.noteText}>Note: {item.availabilityMessage}</Text>
            ) : null}

            {!selected ? (
              <>
                {/* Quick role buttons for captain / vice-captain / wicketkeeper */}
                <View style={styles.specialRoleRow}>
                  <TouchableOpacity
                    style={styles.specialRoleBtn}
                    onPress={() =>
                      setRoleInputs((prev) => ({
                        ...prev,
                        [item.userId]: "CAPTAIN",
                      }))
                    }
                  >
                    <Text style={styles.specialRoleBtnText}>C</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.specialRoleBtn}
                    onPress={() =>
                      setRoleInputs((prev) => ({
                        ...prev,
                        [item.userId]: "VICE_CAPTAIN",
                      }))
                    }
                  >
                    <Text style={styles.specialRoleBtnText}>VC</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.specialRoleBtn}
                    onPress={() =>
                      setRoleInputs((prev) => ({
                        ...prev,
                        [item.userId]: "WICKETKEEPER",
                      }))
                    }
                  >
                    <Text style={styles.specialRoleBtnText}>WK</Text>
                  </TouchableOpacity>
                </View>

                {/* Free text role input */}
                <TextInput
                  style={styles.roleInput}
                  placeholder="Role in match (CAPTAIN / VICE_CAPTAIN / WICKETKEEPER)"
                  value={roleInputs[item.userId] || ""}
                  onChangeText={(text) =>
                    setRoleInputs((prev) => ({ ...prev, [item.userId]: text }))
                  }
                />

                {/* Add to Playing XI */}
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => handleAdd(item.userId, true)}
                >
                  <Text style={styles.btnText}>Add to Playing XI</Text>
                </TouchableOpacity>

                {/* Add to Reserve */}
                <TouchableOpacity
                  style={styles.btn2}
                  onPress={() => handleAdd(item.userId, false)}
                >
                  <Text style={styles.btnText}>Add to Reserve</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Selected state */}
                <Text style={styles.selectedText}>
                  {squadEntry?.isPlayingXi ? "Playing XI ✅" : "Reserve 🟡"}
                </Text>

                {/* Role badge if special role exists */}
                {squadEntry?.roleInMatch ? (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {squadEntry.roleInMatch === "CAPTAIN"
                        ? "C"
                        : squadEntry.roleInMatch === "VICE_CAPTAIN"
                        ? "VC"
                        : squadEntry.roleInMatch === "WICKETKEEPER"
                        ? "WK"
                        : squadEntry.roleInMatch}
                    </Text>
                  </View>
                ) : null}

                {/* Remove from squad */}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(item.userId)}
                >
                  <Text style={styles.btnText}>Remove from Squad</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );
      }}
      ListEmptyComponent={<Text style={styles.empty}>No players found.</Text>}
    />
  );
};

export default SquadSelectionScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: "#f7f7f7",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  summaryEmpty: {
    color: "#666",
  },
  summaryName: {
    fontSize: 14,
    marginBottom: 4,
  },
  warningCard: {
    backgroundColor: "#fff4e5",
    borderWidth: 1,
    borderColor: "#f59e0b",
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  warningTitle: {
    color: "#92400e",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  warningText: {
    color: "#92400e",
    marginBottom: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  customMessageInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  sortBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    borderRadius: 8,
  },
  sortBtnSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  sortText: {
    textAlign: "center",
    fontWeight: "600",
  },
  sortTextSelected: {
    color: "#fff",
  },
  announceBtn: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  announceBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#f7f7f7",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },
  typeText: {
    color: "#555",
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },
  availableBadge: {
    backgroundColor: "#28a745",
    color: "#fff",
  },
  maybeBadge: {
    backgroundColor: "#ffc107",
    color: "#111",
  },
  notAvailableBadge: {
    backgroundColor: "#dc3545",
    color: "#fff",
  },
  injuredBadge: {
    backgroundColor: "#6f42c1",
    color: "#fff",
  },
  noResponseBadge: {
    backgroundColor: "#6c757d",
    color: "#fff",
  },
  noteText: {
    marginTop: 8,
    color: "#444",
    fontSize: 13,
  },
  specialRoleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  specialRoleBtn: {
    backgroundColor: "#6A2C91",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  specialRoleBtnText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
  roleInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  btn: {
    backgroundColor: "green",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  btn2: {
    backgroundColor: "orange",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  removeBtn: {
    backgroundColor: "#c0392b",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  selectedText: {
    marginTop: 10,
    fontWeight: "700",
  },
  roleBadge: {
    backgroundColor: "#F4B400",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  roleBadgeText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 12,
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});