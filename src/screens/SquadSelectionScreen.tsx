import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getAllMembers } from "../services/memberService";
import { getAvailabilityByMatch } from "../services/availabilityService";
import { createAnnouncement } from "../services/announcementService";
import {
  addOrUpdateSquadMember,
  getSquadByMatch,
  removeSquadMember,
} from "../services/squadService";
import SquadSlotCard, {
  SquadPlayer,
} from "../components/squad/SquadSlotCard";
import PlayerPickerModal, {
  PickerPlayer,
} from "../components/squad/PlayerPickerModal";

type AvailabilityItem = {
  userId: number;
  status: string;
};

type PickerTarget =
  | { kind: "XI"; position: number; replacingUserId?: number }
  | { kind: "IMPACT"; position: 12; replacingUserId?: number }
  | { kind: "RESERVE"; position: number; replacingUserId?: number };

const squadRoleSuffix = (player?: SquadPlayer | null) => {
  if (!player) return "";
  const roles = [
    player.isCaptain ? "C" : null,
    player.isViceCaptain ? "VC" : null,
    player.isWicketKeeper ? "WK" : null,
  ].filter(Boolean);
  return roles.length ? ` (${roles.join(", ")})` : "";
};

const SquadSelectionScreen = ({ route, navigation }: any) => {
  const {
    matchId,
    opponentName,
    teamName,
    matchDate,
    venue,
    homeAway,
    matchFormat,
  } = route.params || {};

  const [players, setPlayers] = useState<PickerPlayer[]>([]);
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [announcementMessage, setAnnouncementMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [memberData, availabilityData, squadData] = await Promise.all([
        getAllMembers(),
        getAvailabilityByMatch(matchId),
        getSquadByMatch(matchId),
      ]);

      const availability = Array.isArray(availabilityData)
        ? (availabilityData as AvailabilityItem[])
        : [];
      const availabilityByUser = new Map(
        availability.map((item) => [item.userId, item.status])
      );

      const normalizedPlayers: PickerPlayer[] = (
        Array.isArray(memberData) ? memberData : []
      )
        .map((member: any) => {
          const userId = Number(member.userId ?? member.id);
          return {
            userId,
            fullName: member.fullName || "Unknown Player",
            nickname: member.nickname,
            playerType: member.playerType,
            jerseyNumber: member.jerseyNumber,
            availabilityStatus:
              availabilityByUser.get(userId) || "NO_RESPONSE",
          };
        })
        .filter(
          (member: PickerPlayer) =>
            Number.isInteger(member.userId) && member.userId > 0
        );

      const normalizedSquad: SquadPlayer[] = (
        Array.isArray(squadData) ? squadData : []
      )
        .map((member: any, index: number) => ({
          ...member,
          userId: Number(member.userId),
          // Support old rows that stored C/VC/WK in roleInMatch.
          isCaptain:
            Boolean(member.isCaptain) || member.roleInMatch === "CAPTAIN",
          isViceCaptain:
            Boolean(member.isViceCaptain) ||
            member.roleInMatch === "VICE_CAPTAIN",
          isWicketKeeper:
            Boolean(member.isWicketKeeper) ||
            member.roleInMatch === "WICKETKEEPER",
          availabilityStatus:
            availabilityByUser.get(Number(member.userId)) || "NO_RESPONSE",
          squadPosition:
            member.squadPosition ??
            (member.roleInMatch === "IMPACT_PLAYER"
              ? 12
              : member.isPlayingXi
                ? index + 1
                : 13 + index),
        }))
        .filter(
          (member: SquadPlayer) =>
            Number.isInteger(member.userId) && member.userId > 0
        );

      setPlayers(normalizedPlayers);
      setSquad(normalizedSquad);
    } catch (error: any) {
      Alert.alert(
        "Squad",
        error?.response?.data?.message || "Could not load squad editor."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [matchId]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const selectedUserIds = useMemo(
    () => squad.map((member) => member.userId),
    [squad]
  );

  const playerAt = (position: number) =>
    squad.find((member) => member.squadPosition === position) || null;

  const reserves = useMemo(
    () =>
      squad
        .filter(
          (member) =>
            !member.isPlayingXi && member.roleInMatch !== "IMPACT_PLAYER"
        )
        .sort((a, b) => (a.squadPosition || 99) - (b.squadPosition || 99)),
    [squad]
  );

 const playingXi = useMemo(
  () =>
    squad
      .filter(
        (member) =>
          member.isPlayingXi &&
          member.roleInMatch !== "IMPACT_PLAYER" &&
          Number(member.squadPosition) >= 1 &&
          Number(member.squadPosition) <= 11
      )
      .sort((a, b) => (a.squadPosition || 99) - (b.squadPosition || 99)),
  [squad]
);

  const impactPlayer = playerAt(12);
  const roleEligiblePlayers = impactPlayer
    ? [...playingXi, impactPlayer]
    : playingXi;
  const captain = roleEligiblePlayers.find((member) => member.isCaptain);
  const viceCaptain = roleEligiblePlayers.find(
    (member) => member.isViceCaptain
  );
  const wicketKeeper = roleEligiblePlayers.find(
    (member) => member.isWicketKeeper
  );

  const warnings = [
    playingXi.length !== 11
      ? `${11 - playingXi.length > 0 ? 11 - playingXi.length : 0} Playing XI slot(s) remaining`
      : null,
    !captain ? "Captain not selected" : null,
    !viceCaptain ? "Vice Captain not selected" : null,
    !wicketKeeper ? "Wicketkeeper not selected" : null,
  ].filter(Boolean) as string[];

  const savePlayer = async (
    player: PickerPlayer,
    target: PickerTarget,
    existingPlayer?: SquadPlayer
  ) => {
    if (!Number.isInteger(player.userId) || player.userId <= 0) {
      Alert.alert("Select player", "Please select a valid club member.");
      return;
    }

    setSaving(true);
    try {
      const isImpact = target.kind === "IMPACT";
      await addOrUpdateSquadMember(matchId, {
        userId: player.userId,
        replacingUserId:
          target.replacingUserId !== player.userId
            ? target.replacingUserId
            : undefined,
        isPlayingXi: target.kind === "XI",
        roleInMatch: isImpact ? "IMPACT_PLAYER" : undefined,
        isCaptain: Boolean(existingPlayer?.isCaptain),
        isViceCaptain: Boolean(existingPlayer?.isViceCaptain),
        isWicketKeeper: Boolean(existingPlayer?.isWicketKeeper),
        squadPosition: target.position,
      });
      setPickerTarget(null);
      await loadData();
    } catch (error: any) {
      Alert.alert(
        "Could not update squad",
        error?.response?.data?.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const removePlayer = async (userId: number) => {
    setSaving(true);
    try {
      await removeSquadMember(matchId, userId);
      setSquad((current) =>
        current.filter((member) => member.userId !== userId)
      );
    } catch (error: any) {
      Alert.alert(
        "Could not remove player",
        error?.response?.data?.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (player: SquadPlayer, role?: string) => {
    if (!role) return;
    const isCaptain =
      role === "CAPTAIN" ? !player.isCaptain : Boolean(player.isCaptain);
    const isViceCaptain =
      role === "VICE_CAPTAIN"
        ? !player.isViceCaptain
        : Boolean(player.isViceCaptain);
    const isWicketKeeper =
      role === "WICKETKEEPER"
        ? !player.isWicketKeeper
        : Boolean(player.isWicketKeeper);

    if (isCaptain && isViceCaptain) {
      Alert.alert(
        "Choose one leadership role",
        "A player cannot be both Captain and Vice Captain."
      );
      return;
    }

    setSaving(true);
    try {
      await addOrUpdateSquadMember(matchId, {
        userId: player.userId,
        isPlayingXi: player.isPlayingXi,
        roleInMatch:
          player.roleInMatch === "IMPACT_PLAYER"
            ? "IMPACT_PLAYER"
            : undefined,
        isCaptain,
        isViceCaptain,
        isWicketKeeper,
        squadPosition: player.squadPosition || undefined,
      });
      await loadData();
    } catch (error: any) {
      Alert.alert(
        "Could not update role",
        error?.response?.data?.message || "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const announceSquad = async () => {
    setAnnouncing(true);
    try {
      const xiText = playingXi
        .map((player, index) => {
          return `${index + 1}. ${player.fullName}${squadRoleSuffix(player)}`;
        })
        .join("\n");
      const reserveText = reserves.length
        ? reserves.map((player) => `• ${player.fullName}`).join("\n")
        : "None";

      await createAnnouncement({
        title: `${teamName || "Gotham"} vs ${opponentName || "Opponent"} Squad`,
        message:
          `${announcementMessage.trim() ? `${announcementMessage.trim()}\n\n` : ""}` +
          `Location: ${venue || "Not set"}\n\n` +
          `Playing XI:\n${xiText || "Not completed"}\n\n` +
          `Impact Player: ${
            impactPlayer
              ? `${impactPlayer.fullName}${squadRoleSuffix(impactPlayer)}`
              : "Not selected"
          }\n\n` +
          `Reserves:\n${reserveText}`,
      });
      Alert.alert("Squad announced", "The lineup was posted to announcements.", [
        {
          text: "OK",
          onPress: () =>
            navigation.popTo("MainTabs", { screen: "Announcements" }),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Could not announce squad",
        error?.response?.data?.message || "Please try again."
      );
    } finally {
      setAnnouncing(false);
    }
  };

  const targetPlayer = pickerTarget?.replacingUserId
    ? squad.find((member) => member.userId === pickerTarget.replacingUserId)
    : undefined;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4B1D6B" />
        <Text style={styles.loadingText}>Building lineup…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 16}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadData();
            }}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>LINEUP BUILDER</Text>
          <Text style={styles.title}>
            {teamName || "Gotham"} vs {opponentName || "Opponent"}
          </Text>
          <Text style={styles.heroMeta}>
            {matchDate ? new Date(matchDate).toLocaleString() : "Date not set"}
            {venue ? ` · ${venue}` : ""}
          </Text>
          <Text style={styles.heroMeta}>
            {homeAway === "AWAY" ? "Away" : "Home"} ·{" "}
            {matchFormat || "Format not set"}
          </Text>
        </View>

        <View style={styles.progressCard}>
          <View>
            <Text style={styles.progressTitle}>Playing XI</Text>
            <Text style={styles.progressText}>{playingXi.length} of 11 selected</Text>
          </View>
          {saving ? <ActivityIndicator color="#4B1D6B" /> : null}
        </View>

        <View style={styles.slotGrid}>
          {Array.from({ length: 11 }, (_, index) => {
            const position = index + 1;
            const player = playerAt(position);
            return (
              <View key={position} style={styles.slotWrap}>
                <SquadSlotCard
                  label={String(position)}
                  player={player}
                  onSelect={() =>
                    setPickerTarget({
                      kind: "XI",
                      position,
                      replacingUserId: player?.userId,
                    })
                  }
                  onRemove={
                    player ? () => void removePlayer(player.userId) : undefined
                  }
                  onRole={
                    player
                      ? (role) => void updateRole(player, role)
                      : undefined
                  }
                />
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Impact Player</Text>
        <SquadSlotCard
          label="IP"
          accent
          player={impactPlayer}
          onSelect={() =>
            setPickerTarget({
              kind: "IMPACT",
              position: 12,
              replacingUserId: impactPlayer?.userId,
            })
          }
          onRemove={
            impactPlayer
              ? () => void removePlayer(impactPlayer.userId)
              : undefined
          }
          onRole={
            impactPlayer
              ? (role) => void updateRole(impactPlayer, role)
              : undefined
          }
        />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Reserves</Text>
            <Text style={styles.sectionHelp}>Optional backup players</Text>
          </View>
          <TouchableOpacity
            style={styles.addReserve}
            onPress={() =>
              setPickerTarget({
                kind: "RESERVE",
                position:
                  Math.max(
                    12,
                    ...reserves.map((member) => member.squadPosition || 12)
                  ) + 1,
              })
            }
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addReserveText}>Add</Text>
          </TouchableOpacity>
        </View>
        {reserves.length ? (
          reserves.map((player) => (
            <TouchableOpacity
              key={player.userId}
              style={styles.reserveCard}
              onPress={() =>
                setPickerTarget({
                  kind: "RESERVE",
                  position: player.squadPosition || 13,
                  replacingUserId: player.userId,
                })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.reserveName}>{player.fullName}</Text>
                <Text style={styles.reserveMeta}>
                  {player.playerType || "Player"} · {player.availabilityStatus}
                </Text>
              </View>
              <TouchableOpacity onPress={() => void removePlayer(player.userId)}>
                <Ionicons name="trash-outline" size={20} color="#ad4040" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noReserves}>No reserves selected.</Text>
        )}

        {warnings.length ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Before confirming</Text>
            {warnings.map((warning) => (
              <Text key={warning} style={styles.warningText}>• {warning}</Text>
            ))}
          </View>
        ) : (
          <View style={styles.readyCard}>
            <Ionicons name="checkmark-circle" size={21} color="#287a43" />
            <Text style={styles.readyText}>Lineup is complete and ready.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Squad announcement</Text>
        <TextInput
          value={announcementMessage}
          onChangeText={setAnnouncementMessage}
          placeholder="Optional message for the team"
          multiline
          style={styles.messageInput}
        />
        <TouchableOpacity
          disabled={announcing || playingXi.length !== 11}
          style={[
            styles.announceButton,
            (announcing || playingXi.length !== 11) && styles.disabled,
          ]}
          onPress={() => void announceSquad()}
        >
          {announcing ? (
            <ActivityIndicator color="#2b0540" />
          ) : (
            <Ionicons name="megaphone-outline" size={19} color="#2b0540" />
          )}
          <Text style={styles.announceText}>Confirm and Announce Squad</Text>
        </TouchableOpacity>
      </ScrollView>

      <PlayerPickerModal
        visible={Boolean(pickerTarget)}
        title={
          pickerTarget?.kind === "IMPACT"
            ? "Select Impact Player"
            : pickerTarget?.kind === "RESERVE"
              ? "Select Reserve"
              : `Select Playing XI #${pickerTarget?.position || ""}`
        }
        players={players}
        selectedUserIds={selectedUserIds}
        replacingUserId={pickerTarget?.replacingUserId}
        onClose={() => setPickerTarget(null)}
        onSelect={(player) => {
          if (pickerTarget) {
            void savePlayer(
              player,
              pickerTarget,
              targetPlayer
            );
          }
        }}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SquadSelectionScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f4f9" },
  content: { padding: 14, paddingBottom: 160 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#4B1D6B", fontWeight: "800", marginTop: 10 },
  hero: { backgroundColor: "#2b0540", borderRadius: 20, padding: 20, marginBottom: 14 },
  eyebrow: { color: "#da9306", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#fff", fontSize: 23, fontWeight: "900", marginVertical: 7 },
  heroMeta: { color: "#ded2e4", marginTop: 3 },
  progressCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  progressTitle: { color: "#2b0540", fontSize: 17, fontWeight: "900" },
  progressText: { color: "#786a7e", marginTop: 3 },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  slotWrap: { width: "50%", padding: 5 },
  sectionTitle: { color: "#2b0540", fontSize: 18, fontWeight: "900", marginTop: 16, marginBottom: 9 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  sectionHelp: { color: "#7b6e81", fontSize: 12 },
  addReserve: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4B1D6B",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addReserveText: { color: "#fff", fontWeight: "800" },
  reserveCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 13,
    padding: 13,
    marginBottom: 8,
  },
  reserveName: { color: "#2d1836", fontWeight: "800" },
  reserveMeta: { color: "#796d7f", fontSize: 11, marginTop: 3 },
  noReserves: { color: "#7b6e81", backgroundColor: "#fff", borderRadius: 12, padding: 14 },
  warningCard: { backgroundColor: "#fff4dd", borderRadius: 14, padding: 14, marginTop: 16 },
  warningTitle: { color: "#8a4d08", fontWeight: "900", marginBottom: 6 },
  warningText: { color: "#8a4d08", paddingVertical: 2 },
  readyCard: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "#e9f7ee",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  readyText: { color: "#287a43", fontWeight: "800" },
  messageInput: {
    minHeight: 90,
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 13,
    textAlignVertical: "top",
  },
  announceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#da9306",
    borderRadius: 14,
    padding: 15,
    marginTop: 12,
  },
  announceText: { color: "#2b0540", fontWeight: "900" },
  disabled: { opacity: 0.45 },
});
