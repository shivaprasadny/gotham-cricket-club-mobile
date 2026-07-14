import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getSquadByMatch } from "../services/squadService";
import { assignMatchFeeToSquad } from "../services/matchService";
import { getAllFees, getMyFees } from "../services/feeService";
import { getChatRooms } from "../chat/chatApi";
import { ChatRoom } from "../chat/types";
import { formatEnumLabel } from "../utils/formatEnumLabel";

type HubTab = "OVERVIEW" | "CHAT" | "PAYMENTS";

type SquadItem = {
  squadId: number;
  userId: number;
  fullName: string;
  nickname?: string | null;
  playerType?: string | null;
  jerseyNumber?: number | null;
  isPlayingXi: boolean;
  roleInMatch?: string | null;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isWicketKeeper?: boolean;
};

type MatchFee = {
  id?: number;
  assignmentId?: number;
  feeDefinitionId?: number;
  title: string;
  amount: number;
  dueDate: string;
  description?: string | null;
  matchId?: number | null;
  status?: string;
};

const tabs: { key: HubTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "OVERVIEW", label: "Overview", icon: "information-circle-outline" },
  { key: "CHAT", label: "Chat", icon: "chatbubbles-outline" },
  { key: "PAYMENTS", label: "Payments", icon: "card-outline" },
];

const MatchSquadHubScreen = ({ route, navigation }: any) => {
  const params = route.params || {};
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";
  const [tab, setTab] = useState<HubTab>(params.initialTab || "OVERVIEW");
  const [squad, setSquad] = useState<SquadItem[]>([]);
  const [squadChat, setSquadChat] = useState<ChatRoom | null>(null);
  const [fees, setFees] = useState<MatchFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningFee, setAssigningFee] = useState(false);

  const loadHub = useCallback(async () => {
    try {
      const [squadData, roomsData, feeData] = await Promise.all([
        getSquadByMatch(params.matchId),
        getChatRooms(),
        canManage ? getAllFees() : getMyFees(),
      ]);

      setSquad(Array.isArray(squadData) ? squadData : []);
      setSquadChat(
        (Array.isArray(roomsData) ? roomsData : []).find(
          (room: ChatRoom) =>
            room.type === "MATCH" && room.referenceId === params.matchId
        ) || null
      );
      setFees(
        (Array.isArray(feeData) ? feeData : []).filter(
          (fee: MatchFee) => fee.matchId === params.matchId
        )
      );
    } catch (error: any) {
      Alert.alert(
        "Squad Hub",
        error?.response?.data?.message || "Could not load squad information."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canManage, params.matchId]);

  useFocusEffect(
    useCallback(() => {
      void loadHub();
    }, [loadHub])
  );

  const currentMember = useMemo(
    () => squad.find((member) => member.userId === user?.id),
    [squad, user?.id]
  );
  const playingXi = squad.filter((member) => member.isPlayingXi);
  const chargeablePlayers = squad.filter(
    (member) => member.isPlayingXi || member.roleInMatch === "IMPACT_PLAYER"
  );
  const reserves = squad.filter(
    (member) => !member.isPlayingXi && member.roleInMatch !== "IMPACT_PLAYER"
  );

  const openSquadEditor = () => {
    navigation.navigate("SquadSelection", params);
  };

  const assignFee = async () => {
    setAssigningFee(true);
    try {
      const response = await assignMatchFeeToSquad(params.matchId);
      Alert.alert("Match payment", String(response));
      await loadHub();
    } catch (error: any) {
      Alert.alert(
        "Could not assign payment",
        error?.response?.data?.message || "Please check the squad and match fee."
      );
    } finally {
      setAssigningFee(false);
    }
  };

  const renderOverview = () => (
    <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>MATCH SQUAD HUB</Text>
        <Text style={styles.heroTitle}>
          {params.teamName || "Gotham"} vs {params.opponentName || "Opponent"}
        </Text>
        <Text style={styles.heroText}>
          {params.matchDate ? new Date(params.matchDate).toLocaleString() : "Date not set"}
        </Text>
        <Text style={styles.heroText}>{params.venue || "Venue not set"}</Text>
        {params.locationLink ? (
          <TouchableOpacity onPress={() => Linking.openURL(params.locationLink)}>
            <Text style={[styles.heroText, styles.heroLink]}>📍 View location</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.heroText}>
          {params.homeAway === "AWAY" ? "Away match" : "Home match"}
        </Text>
      </View>
      <View style={styles.grid}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{squad.length}</Text>
          <Text style={styles.metricLabel}>Selected</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{playingXi.length}/11</Text>
          <Text style={styles.metricLabel}>Playing XI</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{fees.length}</Text>
          <Text style={styles.metricLabel}>Payment</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>My squad status</Text>
        <Text style={styles.body}>
          {currentMember
            ? currentMember.isPlayingXi
              ? "Selected in the Playing XI"
              : currentMember.roleInMatch === "IMPACT_PLAYER"
                ? "Selected as Impact Player"
                : "Selected in the squad"
            : "You are not currently selected for this match."}
        </Text>
      </View>
      {canManage ? (
        <TouchableOpacity style={styles.primaryButton} onPress={openSquadEditor}>
          <Ionicons name="create-outline" size={19} color="#fff" />
          <Text style={styles.primaryText}>
            {squad.length ? "Edit Squad Selection" : "Create Match Squad"}
          </Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          navigation.navigate("Scorecard", {
            matchId: params.matchId,
            match: {
              id: params.matchId,
              homeTeamId: params.teamId,
              homeTeamName: params.teamName,
              awayTeamId: params.awayTeamId,
              awayTeamName: params.awayTeamName,
              externalOpponentName:
                params.externalOpponentName || params.opponentName,
              matchDate: params.matchDate,
              venue: params.venue,
              locationLink: params.locationLink,
              homeAway: params.homeAway,
              matchFormat: params.matchFormat,
            },
          })
        }
      >
        <Ionicons name="document-text-outline" size={19} color="#4B1D6B" />
        <Text style={styles.secondaryText}>Open Scorecard</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Playing XI</Text>
        {playingXi.length ? (
          playingXi.map((member) => (
            <Text key={member.squadId} style={styles.listText}>
              • {member.fullName}
              {[
                member.isCaptain ? "C" : null,
                member.isViceCaptain ? "VC" : null,
                member.isWicketKeeper ? "WK" : null,
              ].filter(Boolean).length
                ? ` (${[
                    member.isCaptain ? "C" : null,
                    member.isViceCaptain ? "VC" : null,
                    member.isWicketKeeper ? "WK" : null,
                  ]
                    .filter(Boolean)
                    .join(", ")})`
                : ""}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyText}>Playing XI has not been selected.</Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Impact and reserves</Text>
        {squad.filter((member) => !member.isPlayingXi).length ? (
          squad
            .filter((member) => !member.isPlayingXi)
            .map((member) => (
              <Text key={member.squadId} style={styles.listText}>
                • {member.fullName}
                {member.roleInMatch === "IMPACT_PLAYER" ? " — Impact Player" : " — Reserve"}
              </Text>
            ))
        ) : (
          <Text style={styles.emptyText}>No impact player or reserves selected.</Text>
        )}
      </View>
    </>
  );

  const renderChat = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Squad Chat</Text>
      {squadChat ? (
        <>
          <Text style={styles.body}>
            This private room contains only the selected match squad.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("ChatRoom", { room: squadChat })}
          >
            <Ionicons name="chatbubbles-outline" size={19} color="#fff" />
            <Text style={styles.primaryText}>Open Squad Chat</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.emptyText}>
          {currentMember
            ? "Squad chat is being prepared. Refresh after the backend restarts."
            : "Squad chat is available only to selected squad members."}
        </Text>
      )}
    </View>
  );

  const renderPayments = () => (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Match Payment</Text>
        <Text style={styles.body}>
          Fee per player: {params.matchFeeAmount ? `$${params.matchFeeAmount}` : "Not configured"}
        </Text>
        <Text style={styles.body}>
          Due: {params.matchFeeDueDate
            ? new Date(params.matchFeeDueDate).toLocaleString()
            : "Not configured"}
        </Text>
        {params.matchFeeDescription ? (
          <Text style={styles.body}>{params.matchFeeDescription}</Text>
        ) : null}
        {canManage && fees.length === 0 ? (
          <TouchableOpacity
            disabled={assigningFee}
            style={styles.primaryButton}
            onPress={() => void assignFee()}
          >
            {assigningFee ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="people-outline" size={19} color="#fff" />
            )}
            <Text style={styles.primaryText}>Assign Payment to Playing XI</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {fees.map((fee) => (
        <TouchableOpacity
          key={fee.id || fee.assignmentId || fee.feeDefinitionId}
          style={styles.card}
          onPress={() =>
            canManage
              ? navigation.navigate("FeeDetails", {
                  feeId: fee.id || fee.feeDefinitionId,
                })
              : navigation.navigate("MyFees", {
                  feeAssignmentId: fee.assignmentId,
                })
          }
        >
          <Text style={styles.cardTitle}>{fee.title}</Text>
          <Text style={styles.body}>
            ${fee.amount} · {formatEnumLabel(fee.status, "Assigned")}
          </Text>
          <Text style={styles.linkText}>Open payment details</Text>
        </TouchableOpacity>
      ))}
      {!fees.length && !canManage ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>
            No match payment is assigned to you.
          </Text>
        </View>
      ) : null}
    </>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4B1D6B" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.tabs}>
        {tabs.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tab, tab === item.key && styles.activeTab]}
            onPress={() => setTab(item.key)}
          >
            <Ionicons
              name={item.icon}
              size={18}
              color={tab === item.key ? "#da9306" : "#796b80"}
            />
            <Text style={[styles.tabText, tab === item.key && styles.activeTabText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadHub();
            }}
          />
        }
      >
        {tab === "OVERVIEW" && renderOverview()}
        {tab === "CHAT" && renderChat()}
        {tab === "PAYMENTS" && renderPayments()}
      </ScrollView>
    </View>
  );
};

export default MatchSquadHubScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f4f9" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ded4e3",
  },
  tab: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 10 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#da9306" },
  tabText: { color: "#796b80", fontSize: 11, fontWeight: "700" },
  activeTabText: { color: "#4B1D6B" },
  content: { padding: 14, paddingBottom: 36 },
  hero: { backgroundColor: "#2b0540", borderRadius: 18, padding: 20, marginBottom: 14 },
  eyebrow: { color: "#da9306", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "900", marginVertical: 8 },
  heroText: { color: "#ddd2e3", marginTop: 3 },
  heroLink: { color: "#da9306", fontWeight: "800", textDecorationLine: "underline" },
  grid: { flexDirection: "row", gap: 10, marginBottom: 14 },
  metric: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, alignItems: "center" },
  metricValue: { color: "#4B1D6B", fontSize: 21, fontWeight: "900" },
  metricLabel: { color: "#796b80", fontSize: 11, marginTop: 3 },
  card: { backgroundColor: "#fff", borderRadius: 15, padding: 16, marginBottom: 12 },
  cardTitle: { color: "#2b0540", fontSize: 17, fontWeight: "900", marginBottom: 8 },
  body: { color: "#5f5365", lineHeight: 20, marginBottom: 5 },
  listText: { color: "#3b2d42", paddingVertical: 5 },
  emptyText: { color: "#7d7083", lineHeight: 20 },
  primaryButton: {
    backgroundColor: "#4B1D6B",
    borderRadius: 12,
    padding: 13,
    marginTop: 12,
    marginBottom: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#4B1D6B",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  secondaryText: { color: "#4B1D6B", fontWeight: "900" },
  primaryText: { color: "#fff", fontWeight: "800" },
  linkText: { color: "#7c3c9e", fontWeight: "800", marginTop: 8 },
});
