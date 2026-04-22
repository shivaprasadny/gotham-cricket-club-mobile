import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAllMembers } from "../services/memberService";


import { getAvailabilityByMatch } from "../services/availabilityService";
import { createAnnouncement } from "../services/announcementService";
import { getTeamMembers } from "../services/teamService";
import {
  addOrUpdateSquadMember,
  getSquadByMatch,
  removeSquadMember,
} from "../services/squadService";
import { assignMatchFeeToSquad } from "../services/matchService";

type Props = {
  route: any;
  navigation: any;
};

type ClubPlayer = {
  id?: number;
  userId?: number;
  fullName?: string;
  role?: string;
  status?: string;
  playerType?: string | null;
  nickname?: string | null;
  jerseyNumber?: number | null;
};

type TeamPlayer = {
  teamMemberId?: number;
  userId: number;
  fullName: string;
  nickname?: string | null;
  playerType?: string | null;
  jerseyNumber?: number | null;
};

type AvailabilityItem = {
  id: number;
  matchId: number;
  userId: number;
  fullName: string;
  status: "AVAILABLE" | "NOT_AVAILABLE" | "MAYBE" | "INJURED";
  message?: string;
};

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

type PlayerRow = {
  userId: number;
  fullName: string;
  nickname?: string | null;
  playerType?: string | null;
  jerseyNumber?: number | null;
  source: "TEAM" | "CLUB_OTHER";
  availabilityStatus:
    | "AVAILABLE"
    | "NOT_AVAILABLE"
    | "MAYBE"
    | "INJURED"
    | "NO_RESPONSE";
  availabilityMessage?: string;
};

type SortType = "STATUS" | "NAME";
type ViewType = "TEAM" | "CLUB_OTHER" | "ADDED";

const SquadSelectionScreen = ({ route, navigation }: Props) => {
  const {
    matchId,
    teamId,
    opponentName,
    teamName,
    matchDate,
    venue,
    matchType,
    matchFormat,
    matchFeeAmount,
    matchFeeDueDate,
    matchFeeDescription,
  } = route.params || {};

  // Raw backend data
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [clubPlayers, setClubPlayers] = useState<ClubPlayer[]>([]);
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [squad, setSquad] = useState<SquadItem[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [announcing, setAnnouncing] = useState(false);

  // UI states
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("STATUS");
  const [viewType, setViewType] = useState<ViewType>("TEAM");

  // Per-player typed role input
  const [roleInputs, setRoleInputs] = useState<Record<number, string>>({});

  // Custom announcement message
  const [customMessage, setCustomMessage] = useState("");

  // Load all required data for this screen
  const loadData = async () => {
  if (!matchId || !teamId) {
    Alert.alert("Error", "Match ID or Team ID is missing");
    setLoading(false);
    setRefreshing(false);
    return;
  }

  try {
    setLoading(true);

    const teamData = await getTeamMembers(teamId);

    let allClubPlayers = [];
    let availabilityData = [];
    let squadData = [];

    try {
      allClubPlayers = await getAllMembers();
    } catch (e) {
      console.log("Members API failed (likely role issue)");
    }

    try {
      availabilityData = await getAvailabilityByMatch(matchId);
    } catch (e) {
      console.log("Availability API failed (likely role issue)");
    }

    try {
      squadData = await getSquadByMatch(matchId);
    } catch (e) {
      console.log("Squad API failed");
    }

    setTeamPlayers(Array.isArray(teamData) ? teamData : []);
    setClubPlayers(Array.isArray(allClubPlayers) ? allClubPlayers : []);
    setAvailability(Array.isArray(availabilityData) ? availabilityData : []);
    setSquad(Array.isArray(squadData) ? squadData : []);

  } catch (error: any) {
    console.log("SQUAD LOAD ERROR:", error?.response?.data || error);
    Alert.alert(
      "Error",
      error?.response?.data?.message || "Failed to load squad data"
    );
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [matchId, teamId])
  );

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Get availability status for a player
  const getAvailabilityStatus = (
    userId: number
  ): PlayerRow["availabilityStatus"] => {
    const found = availability.find((a) => a.userId === userId);
    return found?.status || "NO_RESPONSE";
  };

  // Get optional availability note for a player
  const getAvailabilityMessage = (userId: number) => {
    const found = availability.find((a) => a.userId === userId);
    return found?.message;
  };

  // Sort priority for availability status
  const getPriority = (status: PlayerRow["availabilityStatus"]) => {
    switch (status) {
      case "AVAILABLE":
        return 1;
      case "MAYBE":
        return 2;
      case "NOT_AVAILABLE":
        return 3;
      case "INJURED":
        return 4;
      case "NO_RESPONSE":
        return 5;
      default:
        return 6;
    }
  };

  // IDs already selected in squad
  const selectedUserIds = useMemo(() => squad.map((s) => s.userId), [squad]);

  // IDs belonging to current team
  const teamUserIds = useMemo(
    () => teamPlayers.map((p) => p.userId),
    [teamPlayers]
  );

  // Normalize team players into common row structure
  const normalizedTeamPlayers: PlayerRow[] = useMemo(() => {
    return teamPlayers.map((p) => ({
      userId: p.userId,
      fullName: p.fullName || "Unknown Player",
      nickname: p.nickname,
      playerType: p.playerType,
      jerseyNumber: p.jerseyNumber,
      source: "TEAM" as const,
      availabilityStatus: getAvailabilityStatus(p.userId),
      availabilityMessage: getAvailabilityMessage(p.userId),
    }));
  }, [teamPlayers, availability]);

  // Normalize other club players into same row structure
  const normalizedOtherClubPlayers: PlayerRow[] = useMemo(() => {
    return clubPlayers
      .map((p) => {
        const normalizedUserId = p.userId ?? p.id ?? 0;

        return {
          userId: normalizedUserId,
          fullName: p.fullName || "Unknown Player",
          nickname: p.nickname,
          playerType: p.playerType,
          jerseyNumber: p.jerseyNumber,
          source: "CLUB_OTHER" as const,
          availabilityStatus: getAvailabilityStatus(normalizedUserId),
          availabilityMessage: getAvailabilityMessage(normalizedUserId),
        };
      })
      .filter((p) => p.userId !== 0)
      .filter((p) => !teamUserIds.includes(p.userId));
  }, [clubPlayers, availability, teamUserIds]);

  // Playing XI excludes impact player
  const playingXi = useMemo(
    () =>
      squad.filter(
        (s) => s.isPlayingXi && s.roleInMatch !== "IMPACT_PLAYER"
      ),
    [squad]
  );

  // Only one impact player
  const impactPlayer = useMemo(
    () => squad.find((s) => s.roleInMatch === "IMPACT_PLAYER") || null,
    [squad]
  );

  // Reserve players exclude impact player
  const reserves = useMemo(
    () =>
      squad.filter(
        (s) => !s.isPlayingXi && s.roleInMatch !== "IMPACT_PLAYER"
      ),
    [squad]
  );

  // Players already added to squad, shown in ADDED view
  const addedPlayersOnly: PlayerRow[] = useMemo(() => {
    return squad.map((s) => ({
      userId: s.userId,
      fullName: s.fullName,
      nickname: s.nickname,
      playerType: s.playerType,
      jerseyNumber: s.jerseyNumber,
      source: teamUserIds.includes(s.userId) ? "TEAM" : "CLUB_OTHER",
      availabilityStatus: getAvailabilityStatus(s.userId),
      availabilityMessage: getAvailabilityMessage(s.userId),
    }));
  }, [squad, availability, teamUserIds]);

  // Get squad row for selected user
  const getSquadEntry = (userId: number) =>
    squad.find((s) => s.userId === userId);

  // Whether a player is already selected
  const isSelected = (userId: number) => selectedUserIds.includes(userId);

  // Decide which list should currently be displayed
  const currentBaseList = useMemo(() => {
    if (viewType === "TEAM") {
      return normalizedTeamPlayers.filter((p) => !isSelected(p.userId));
    }

    if (viewType === "CLUB_OTHER") {
      return normalizedOtherClubPlayers.filter((p) => !isSelected(p.userId));
    }

    return addedPlayersOnly;
  }, [
    viewType,
    normalizedTeamPlayers,
    normalizedOtherClubPlayers,
    addedPlayersOnly,
    selectedUserIds,
  ]);

  // Apply search + sort on visible player list
  const filteredAndSortedPlayers = useMemo(() => {
    let result = currentBaseList.filter((p) => {
      const text = search.trim().toLowerCase();

      if (!text) return true;

      return (
        p.fullName.toLowerCase().includes(text) ||
        (p.nickname || "").toLowerCase().includes(text) ||
        (p.playerType || "").toLowerCase().includes(text) ||
        String(p.jerseyNumber || "").includes(text)
      );
    });

    if (sortBy === "STATUS") {
      result = [...result].sort((a, b) => {
        const statusCompare =
          getPriority(a.availabilityStatus) - getPriority(b.availabilityStatus);

        if (statusCompare !== 0) return statusCompare;

        return a.fullName.localeCompare(b.fullName);
      });
    } else {
      result = [...result].sort((a, b) => a.fullName.localeCompare(b.fullName));
    }

    return result;
  }, [currentBaseList, search, sortBy]);

  // Add player to squad or update role
  const handleAdd = async (userId: number, isPlayingXi: boolean) => {
    try {
      const roleInMatch = roleInputs[userId]?.trim() || undefined;

      if (roleInMatch === "IMPACT_PLAYER") {
        const alreadyImpact = impactPlayer && impactPlayer.userId !== userId;

        if (alreadyImpact) {
          Alert.alert("Error", "Only 1 impact player allowed");
          return;
        }
      }

      await addOrUpdateSquadMember(matchId, {
        userId,
        isPlayingXi: roleInMatch === "IMPACT_PLAYER" ? false : isPlayingXi,
        roleInMatch,
      });

      // Update local squad state immediately
      const player =
        [...normalizedTeamPlayers, ...normalizedOtherClubPlayers].find(
          (p) => p.userId === userId
        );

      if (!player) return;

      setSquad((prev) => {
        const withoutOld = prev.filter((p) => p.userId !== userId);

        return [
          ...withoutOld,
          {
            squadId: Date.now(), // temporary local id until next full refresh
            userId: player.userId,
            fullName: player.fullName,
            nickname: player.nickname || undefined,
            playerType: player.playerType || undefined,
            jerseyNumber: player.jerseyNumber || undefined,
            isPlayingXi: roleInMatch === "IMPACT_PLAYER" ? false : isPlayingXi,
            roleInMatch,
          },
        ];
      });
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
      await removeSquadMember(matchId, userId);

      // Remove from local squad
      setSquad((prev) => prev.filter((player) => player.userId !== userId));

      // Clear typed role input
      setRoleInputs((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to remove player"
      );
    }
  };

  // Special role lookups inside Playing XI
  const captain = playingXi.find((p) => p.roleInMatch === "CAPTAIN");
  const viceCaptain = playingXi.find((p) => p.roleInMatch === "VICE_CAPTAIN");
  const wicketKeeper = playingXi.find((p) => p.roleInMatch === "WICKETKEEPER");

  // Validation warnings for current squad state
  const squadWarnings = useMemo(() => {
    const warnings: string[] = [];

    if (playingXi.length < 11) {
      warnings.push(`Need ${11 - playingXi.length} more player(s) in Playing XI`);
    }

    if (playingXi.length > 11) {
      warnings.push(`Playing XI has ${playingXi.length} players. Maximum is 11`);
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
  }, [playingXi, captain, viceCaptain, wicketKeeper]);

  // Badge styling by availability status
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

  // Safe date formatting
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Display short role tag
  const formatRoleTag = (role?: string) => {
    switch (role) {
      case "CAPTAIN":
        return " (C)";
      case "VICE_CAPTAIN":
        return " (VC)";
      case "WICKETKEEPER":
        return " (WK)";
      default:
        return "";
    }
  };

  // Publish squad as an announcement
  const handleAnnounceSquad = async () => {
    try {
      setAnnouncing(true);

      const playingXiText =
        playingXi.length > 0
          ? playingXi
              .map(
                (p, index) =>
                  `${index + 1}. ${p.fullName}${formatRoleTag(p.roleInMatch)}`
              )
              .join("\n")
          : "No Playing XI selected";

      const reservesText =
        reserves.length > 0
          ? reserves
              .map(
                (p, index) =>
                  `${index + 1}. ${p.fullName}${formatRoleTag(p.roleInMatch)}`
              )
              .join("\n")
          : "No reserve players";

      const title =
        teamName && opponentName
          ? `${teamName} vs ${opponentName}`
          : opponentName
          ? `Match vs ${opponentName}`
          : "Squad Announcement";

      const message =
        `${customMessage.trim() ? customMessage.trim() + "\n\n" : ""}` +
        `Team: ${teamName || "No team assigned"}\n` +
        `Opponent: ${opponentName || "Not set"}\n` +
        `Date: ${formatDate(matchDate)}\n` +
        `Venue: ${venue || "Not set"}\n` +
        `Match Type: ${matchType || "Not set"}\n` +
        `Format: ${matchFormat || "Not set"}\n\n` +
        `Playing XI:\n${playingXiText}\n\n` +
        `Impact Player:\n${impactPlayer ? impactPlayer.fullName : "Not selected"}\n\n` +
        `Reserve:\n${reservesText}`;

      const response = await createAnnouncement({
        title,
        message,
      });

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Squad announced successfully",
        [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate("MainTabs", {
                screen: "Announcements",
              }),
          },
        ]
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

  // Initial loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
        <Text style={styles.loadingText}>Loading squad...</Text>
      </View>
    );
  }

  // Assign saved match fee setup to current squad players
  const handleAssignMatchFee = async () => {
    try {
      if (!matchFeeAmount || !matchFeeDueDate) {
        Alert.alert("Error", "This match does not have fee configuration");
        return;
      }

      const response = await assignMatchFeeToSquad(matchId);

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Match fee assigned successfully"
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to assign match fee"
      );
    }
  };

  return (
    // KeyboardAvoidingView helps header inputs stay visible when keyboard opens
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      <FlatList
        data={filteredAndSortedPlayers}
        keyExtractor={(item) => item.userId.toString()}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Squad Selection</Text>

            <View style={styles.matchInfoCard}>
              <Text style={styles.matchInfoText}>Team: {teamName || "Not set"}</Text>
              <Text style={styles.matchInfoText}>
                Opponent: {opponentName || "Not set"}
              </Text>
              <Text style={styles.matchInfoText}>
                Date: {formatDate(matchDate)}
              </Text>
              <Text style={styles.matchInfoText}>Venue: {venue || "Not set"}</Text>
              <Text style={styles.matchInfoText}>
                Match Type: {matchType || "Not set"}
              </Text>
              <Text style={styles.matchInfoText}>
                Format: {matchFormat || "N/A"}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Playing XI ({playingXi.length}/11)</Text>
              {playingXi.length === 0 ? (
                <Text style={styles.summaryEmpty}>No players selected yet</Text>
              ) : (
                playingXi.map((p) => (
                  <Text key={p.squadId} style={styles.summaryName}>
                    • {p.fullName}
                    {formatRoleTag(p.roleInMatch)}
                  </Text>
                ))
              )}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Impact Player</Text>
              {impactPlayer ? (
                <Text style={styles.summaryName}>• {impactPlayer.fullName} (IP)</Text>
              ) : (
                <Text style={styles.summaryEmpty}>No impact player selected</Text>
              )}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Reserve</Text>
              {reserves.length === 0 ? (
                <Text style={styles.summaryEmpty}>No reserve players selected yet</Text>
              ) : (
                reserves.map((p) => (
                  <Text key={p.squadId} style={styles.summaryName}>
                    • {p.fullName}
                    {formatRoleTag(p.roleInMatch)}
                  </Text>
                ))
              )}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Match Fee</Text>
              <Text style={styles.summaryName}>
                Amount: {matchFeeAmount ? `$${matchFeeAmount}` : "N/A"}
              </Text>
              <Text style={styles.summaryName}>
                Due Date: {matchFeeDueDate ? new Date(matchFeeDueDate).toLocaleString() : "N/A"}
              </Text>
              {matchFeeDescription ? (
                <Text style={styles.summaryName}>Note: {matchFeeDescription}</Text>
              ) : null}

              {matchFeeAmount && matchFeeDueDate ? (
                <TouchableOpacity
                  style={styles.assignFeeBtn}
                  onPress={handleAssignMatchFee}
                >
                  <Text style={styles.assignFeeBtnText}>Assign Match Fee to Squad</Text>
                </TouchableOpacity>
              ) : null}
            </View>

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

            <TextInput
              style={styles.searchInput}
              placeholder="Search player name..."
              placeholderTextColor="#7a7a7a"
              value={search}
              onChangeText={setSearch}
            />

            <View style={styles.viewRow}>
              <TouchableOpacity
                style={[
                  styles.viewBtn,
                  viewType === "TEAM" && styles.viewBtnSelected,
                ]}
                onPress={() => setViewType("TEAM")}
              >
                <Text
                  style={[
                    styles.viewBtnText,
                    viewType === "TEAM" && styles.viewBtnTextSelected,
                  ]}
                >
                  Team Players
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.viewBtn,
                  viewType === "CLUB_OTHER" && styles.viewBtnSelected,
                ]}
                onPress={() => setViewType("CLUB_OTHER")}
              >
                <Text
                  style={[
                    styles.viewBtnText,
                    viewType === "CLUB_OTHER" && styles.viewBtnTextSelected,
                  ]}
                >
                  Other Club Players
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.viewBtn,
                  viewType === "ADDED" && styles.viewBtnSelected,
                ]}
                onPress={() => setViewType("ADDED")}
              >
                <Text
                  style={[
                    styles.viewBtnText,
                    viewType === "ADDED" && styles.viewBtnTextSelected,
                  ]}
                >
                  Added Players
                </Text>
              </TouchableOpacity>
            </View>

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
                  Status
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
                  Name
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Announcement Message</Text>
            <TextInput
              style={styles.customMessageInput}
              placeholder="Write message for squad announcement..."
              placeholderTextColor="#7a7a7a"
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.announceBtn}
              onPress={handleAnnounceSquad}
              disabled={announcing}
            >
              <Text style={styles.announceBtnText}>
                {announcing ? "Announcing..." : "Announce Squad"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>
              {viewType === "TEAM"
                ? "Team Players"
                : viewType === "CLUB_OTHER"
                ? "Other Club Players"
                : "Added Players"}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const selected = isSelected(item.userId);
          const squadEntry = getSquadEntry(item.userId);

          return (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.fullName}</Text>
                  <Text style={styles.typeText}>
                    {item.playerType || "Player"}
                    {item.jerseyNumber ? ` • Jersey ${item.jerseyNumber}` : ""}
                    {item.nickname ? ` • ${item.nickname}` : ""}
                  </Text>
                </View>

                <Text
                  style={[styles.badge, getAvailabilityStyle(item.availabilityStatus)]}
                >
                  {item.availabilityStatus}
                </Text>
              </View>

              {item.availabilityMessage ? (
                <Text style={styles.noteText}>Note: {item.availabilityMessage}</Text>
              ) : null}

              {!selected ? (
                <>
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

                    <TouchableOpacity
                      style={styles.specialRoleBtn}
                      onPress={() =>
                        setRoleInputs((prev) => ({
                          ...prev,
                          [item.userId]: "IMPACT_PLAYER",
                        }))
                      }
                    >
                      <Text style={styles.specialRoleBtnText}>IP</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.roleInput}
                    placeholder="Role in match (CAPTAIN / VICE_CAPTAIN / WICKETKEEPER / IMPACT_PLAYER)"
                    placeholderTextColor="#7a7a7a"
                    value={roleInputs[item.userId] || ""}
                    onChangeText={(text) =>
                      setRoleInputs((prev) => ({ ...prev, [item.userId]: text }))
                    }
                  />

                  <TouchableOpacity
                    style={styles.btn}
                    onPress={() => handleAdd(item.userId, true)}
                  >
                    <Text style={styles.btnText}>Add to Playing XI</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btn2}
                    onPress={() => handleAdd(item.userId, false)}
                  >
                    <Text style={styles.btnText}>Add to Reserve</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.selectedText}>
                    {squadEntry?.roleInMatch === "IMPACT_PLAYER"
                      ? "Impact Player ⭐"
                      : squadEntry?.isPlayingXi
                      ? "Playing XI ✅"
                      : "Reserve 🟡"}
                  </Text>

                  {squadEntry?.roleInMatch ? (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {squadEntry.roleInMatch === "CAPTAIN"
                          ? "C"
                          : squadEntry.roleInMatch === "VICE_CAPTAIN"
                          ? "VC"
                          : squadEntry.roleInMatch === "WICKETKEEPER"
                          ? "WK"
                          : squadEntry.roleInMatch === "IMPACT_PLAYER"
                          ? "IP"
                          : squadEntry.roleInMatch}
                      </Text>
                    </View>
                  ) : null}

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
        ListEmptyComponent={
          <Text style={styles.empty}>
            {viewType === "TEAM"
              ? "No team players left to add."
              : viewType === "CLUB_OTHER"
              ? "No other club players found."
              : "No added players yet."}
          </Text>
        }
      />
    </KeyboardAvoidingView>
  );
};

export default SquadSelectionScreen;

const styles = StyleSheet.create({
  // Full-screen wrapper for keyboard support
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },

  // FlatList content wrapper
  list: {
    padding: 16,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
    paddingBottom: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    color: "#2b0540",
  },

  matchInfoCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  matchInfoText: {
    color: "#111827",
    fontWeight: "600",
    marginBottom: 4,
  },

  summaryCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#2b0540",
  },

  summaryEmpty: {
    color: "#6b7280",
  },

  summaryName: {
    fontSize: 14,
    marginBottom: 4,
    color: "#111827",
    fontWeight: "600",
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
    borderColor: "#d9d2e1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  customMessageInput: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },

  viewRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },

  viewBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d2e1",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    minWidth: "30%",
  },

  viewBtnSelected: {
    backgroundColor: "#2b0540",
    borderColor: "#2b0540",
  },

  viewBtnText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#2b0540",
    fontSize: 12,
  },

  viewBtnTextSelected: {
    color: "#fff",
  },

  sortRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  sortBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d2e1",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  sortBtnSelected: {
    backgroundColor: "#2b0540",
    borderColor: "#2b0540",
  },

  sortText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#2b0540",
  },

  sortTextSelected: {
    color: "#fff",
  },

  announceBtn: {
    backgroundColor: "#da9306",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },

  announceBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
  },

  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  name: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
    color: "#111827",
  },

  typeText: {
    color: "#4b5563",
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
    flexWrap: "wrap",
  },

  specialRoleBtn: {
    backgroundColor: "#2b0540",
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
    borderColor: "#d9d2e1",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "#fff",
  },

  btn: {
    backgroundColor: "#2b8a3e",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
  },

  btn2: {
    backgroundColor: "#da9306",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
  },

  removeBtn: {
    backgroundColor: "#c0392b",
    padding: 12,
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
    color: "#111827",
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
    color: "#6b7280",
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f5fb",
  },

  loadingText: {
    marginTop: 10,
    color: "#2b0540",
    fontWeight: "700",
  },

  assignFeeBtn: {
    backgroundColor: "#2b0540",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  assignFeeBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
});