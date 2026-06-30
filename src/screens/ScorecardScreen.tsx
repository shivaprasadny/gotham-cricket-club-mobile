import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  deleteScorecardDraft,
  getScorecard,
  publishScorecard,
  reopenScorecard,
} from "../services/scorecardService";
import {
  BattingPerformanceResponse,
  BowlingPerformanceResponse,
  FieldingPerformanceResponse,
  ScorecardResponse,
} from "../types/scorecard";
import {
  BattingTable,
  BowlingTable,
  FieldingTable,
} from "../components/scorecard/ScorecardTable";
import { getMatchById } from "../services/matchService";
import { formatEnumLabel } from "../utils/formatEnumLabel";

type Props = {
  route: any;
  navigation: any;
};

const errorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || fallback;

// Keep the read-only view close to a traditional cricket scorecard.
const didNotBat = (row: BattingPerformanceResponse) =>
  row.dismissalType === "DID_NOT_BAT";

const hasBowlingStats = (row: BowlingPerformanceResponse) =>
  row.oversDisplay !== "0.0" ||
  row.maidens > 0 ||
  row.runsConceded > 0 ||
  row.wickets > 0 ||
  (row.dotBalls ?? 0) > 0 ||
  (row.wides ?? row.totalBowlingExtras ?? 0) > 0 ||
  (row.noBalls ?? 0) > 0;

const hasFieldingStats = (row: FieldingPerformanceResponse) =>
  row.catches > 0 ||
  row.droppedCatches > 0 ||
  row.runOuts > 0 ||
  row.stumpings > 0;

const ScorecardScreen = ({ route, navigation }: Props) => {
  const { matchId, match, savedScorecard } = route.params;
  const { user } = useAuth();
  const [scorecard, setScorecard] = useState<ScorecardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [resolvedMatch, setResolvedMatch] = useState(match || null);
  const isAdmin = user?.role === "ADMIN";
  const canManage = isAdmin || user?.role === "CAPTAIN";
  const tossWinnerName =
    scorecard?.tossWinnerName ||
    (scorecard?.tossWinnerTeamId === resolvedMatch?.homeTeamId
      ? resolvedMatch?.homeTeamName
      : scorecard?.tossWinnerTeamId === resolvedMatch?.awayTeamId
      ? resolvedMatch?.awayTeamName
      : null);

  const loadScorecard = async () => {
    try {
      const data = await getScorecard(matchId);
      setScorecard(data);
      setNotFound(false);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setScorecard(null);
        setNotFound(true);
      } else {
        Alert.alert("Scorecard", errorMessage(error, "Failed to load scorecard"));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const ensureMatch = async () => {
    if (resolvedMatch) return resolvedMatch;
    try {
      const data = await getMatchById(matchId);
      setResolvedMatch(data);
      return data;
    } catch {
      return null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      void ensureMatch();
      if (savedScorecard) {
        setScorecard(savedScorecard);
        setNotFound(false);
        setLoading(false);
        navigation.setParams({ savedScorecard: undefined });
        return;
      }
      void loadScorecard();
    }, [matchId, savedScorecard, resolvedMatch])
  );

  const confirmAction = (
    title: string,
    message: string,
    actionLabel: string,
    action: () => Promise<unknown>,
    destructive = false
  ) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: actionLabel,
        style: destructive ? "destructive" : "default",
        onPress: async () => {
          try {
            await action();
            await loadScorecard();
          } catch (error: any) {
            Alert.alert("Error", errorMessage(error, `${actionLabel} failed`));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#da9306" />
        <Text style={styles.centerText}>Loading scorecard...</Text>
      </View>
    );
  }

  if (notFound || !scorecard) {
    return (
      <View style={styles.center}>
        <Ionicons name="document-text-outline" size={58} color="#9b8ca1" />
        <Text style={styles.emptyTitle}>No scorecard yet</Text>
        <Text style={styles.emptyText}>
          {canManage
            ? "Create a manual scorecard for this match."
            : "The scorecard will appear after it is published."}
        </Text>
        {canManage ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              !resolvedMatch && styles.disabledButton,
            ]}
            disabled={!resolvedMatch}
            onPress={() =>
              navigation.navigate("ScorecardEditor", {
                matchId,
                match: resolvedMatch,
              })
            }
          >
            <Text style={styles.primaryButtonText}>
              {resolvedMatch ? "Create Scorecard" : "Loading Match..."}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadScorecard();
          }}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.statusRow}>
          <Text style={styles.status}>{formatEnumLabel(scorecard.status)}</Text>
          {scorecard.publishedAt ? (
            <Text style={styles.published}>
              {new Date(scorecard.publishedAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
        <Text style={styles.matchTitle}>{scorecard.matchSummary}</Text>
        <Text style={styles.result}>{scorecard.resultSummary}</Text>
        {scorecard.officialResultNotes ? (
          <Text style={styles.officialNotes}>{scorecard.officialResultNotes}</Text>
        ) : null}
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{scorecard.firstInningsTotal ?? "-"}</Text>
            <Text style={styles.heroStatLabel}>1st Innings</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{scorecard.target ?? "-"}</Text>
            <Text style={styles.heroStatLabel}>Target</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{scorecard.chaseTotal ?? "-"}</Text>
            <Text style={styles.heroStatLabel}>Chase</Text>
          </View>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Match Summary</Text>
        <Text style={styles.summaryText}>
          Toss: {tossWinnerName || "Not recorded"}
          {scorecard.tossDecision ? ` chose to ${scorecard.tossDecision.toLowerCase()}` : ""}
        </Text>
        <Text style={styles.summaryText}>Top scorer: {scorecard.topScorer || "-"}</Text>
        <Text style={styles.summaryText}>Best bowler: {scorecard.bestBowler || "-"}</Text>
        <Text style={styles.summaryText}>
          Player of the match: {scorecard.playerOfMatchName || "-"}
        </Text>
      </View>

      {scorecard.innings.map((innings) => {
        const battingRows = innings.batting.filter((row) => !didNotBat(row));
        const didNotBatRows = innings.batting.filter(didNotBat);
        const bowlingRows = innings.bowling.filter(hasBowlingStats);
        const fieldingRows = innings.fielding.filter(hasFieldingStats);

        return (
        <View key={innings.id} style={styles.inningsCard}>
          <View style={styles.inningsHeader}>
            <View>
              <Text style={styles.inningsTitle}>
                {innings.battingTeamName || `Innings ${innings.inningsNumber}`}
              </Text>
              <Text style={styles.inningsSub}>
                Innings {innings.inningsNumber} • {innings.oversDisplay} overs
              </Text>
            </View>
            <Text style={styles.total}>
              {innings.runs}/{innings.wickets}
            </Text>
          </View>

          <Text style={styles.tableTitle}>Batting</Text>
          <BattingTable
            rows={battingRows}
            onPlayerPress={(playerId) =>
              navigation.navigate("PlayerStatistics", { playerId })
            }
          />

          {didNotBatRows.length ? (
            <View style={styles.didNotBatRow}>
              <Text style={styles.didNotBatLabel}>Did not bat</Text>
              <Text style={styles.didNotBatNames}>
                {didNotBatRows.map((row) => row.playerName).join(", ")}
              </Text>
            </View>
          ) : null}

          {bowlingRows.length ? (
            <>
              <Text style={styles.tableTitle}>Bowling</Text>
              <BowlingTable
                rows={bowlingRows}
                onPlayerPress={(playerId) =>
                  navigation.navigate("PlayerStatistics", { playerId })
                }
              />
            </>
          ) : null}

          {fieldingRows.length ? (
            <>
              <Text style={styles.tableTitle}>Fielding</Text>
              <FieldingTable
                rows={fieldingRows}
                onPlayerPress={(playerId) =>
                  navigation.navigate("PlayerStatistics", { playerId })
                }
              />
            </>
          ) : null}

          <View style={styles.extras}>
            <Text style={styles.extrasTitle}>Extras: {innings.totalExtras}</Text>
            <Text style={styles.extrasText}>
              B {innings.byes} • LB {innings.legByes} • WD {innings.wides} •
              NB {innings.noBalls} • P {innings.penaltyRuns}
            </Text>
          </View>
        </View>
        );
      })}

      {canManage ? (
        <View style={styles.actions}>
          {scorecard.status === "DRAFT" ? (
            <>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  !resolvedMatch && styles.disabledButton,
                ]}
                disabled={!resolvedMatch}
                onPress={() =>
                  navigation.navigate("ScorecardEditor", {
                    matchId,
                    match: resolvedMatch,
                    scorecard,
                  })
                }
              >
                <Text style={styles.primaryButtonText}>Edit Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.publishButton}
                onPress={() =>
                  confirmAction(
                    "Publish Scorecard",
                    "Published statistics will become visible to all members.",
                    "Publish",
                    () => publishScorecard(matchId)
                  )
                }
              >
                <Text style={styles.publishText}>Publish Scorecard</Text>
              </TouchableOpacity>
              {/* Fix 5: only ADMIN may delete a scorecard draft */}
              {isAdmin && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() =>
                    confirmAction(
                      "Delete Draft",
                      "This draft and all entered performances will be removed.",
                      "Delete",
                      () => deleteScorecardDraft(matchId),
                      true
                    )
                  }
                >
                  <Text style={styles.deleteText}>Delete Draft</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() =>
                confirmAction(
                  "Reopen Scorecard",
                  "The scorecard will return to draft and stop counting toward statistics.",
                  "Reopen",
                  () => reopenScorecard(matchId)
                )
              }
            >
              <Text style={styles.secondaryText}>Reopen for Editing</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
};

export default ScorecardScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f0f7" },
  content: { padding: 16, paddingBottom: 34 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f0f7",
    padding: 24,
  },
  centerText: { marginTop: 10, color: "#6f6274" },
  emptyTitle: { marginTop: 12, fontSize: 22, fontWeight: "800", color: "#2b0540" },
  emptyText: { color: "#75677c", textAlign: "center", marginTop: 6, marginBottom: 18 },
  hero: { backgroundColor: "#2b0540", borderRadius: 22, padding: 20, marginBottom: 14 },
  statusRow: { flexDirection: "row", justifyContent: "space-between" },
  status: { color: "#2b0540", backgroundColor: "#f4b400", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: "900" },
  published: { color: "#cbbfd1", fontSize: 12 },
  matchTitle: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 14 },
  result: { color: "#f4b400", fontSize: 15, fontWeight: "700", marginTop: 6 },
  officialNotes: { color: "#cbbfd1", fontSize: 12, marginTop: 4, fontStyle: "italic" },
  heroStats: { flexDirection: "row", gap: 8, marginTop: 18 },
  heroStat: { flex: 1, backgroundColor: "#3b1251", borderRadius: 12, padding: 10, alignItems: "center" },
  heroStatValue: { color: "#fff", fontSize: 20, fontWeight: "900" },
  heroStatLabel: { color: "#cbbfd1", fontSize: 10, marginTop: 3 },
  summaryCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14 },
  sectionTitle: { color: "#2b0540", fontSize: 18, fontWeight: "900", marginBottom: 9 },
  summaryText: { color: "#514557", marginBottom: 6 },
  inningsCard: { backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 16 },
  inningsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  inningsTitle: { color: "#2b0540", fontSize: 18, fontWeight: "900" },
  inningsSub: { color: "#827487", fontSize: 12, marginTop: 3 },
  total: { color: "#2b0540", fontSize: 25, fontWeight: "900" },
  tableTitle: { color: "#2b0540", fontSize: 14, fontWeight: "800", marginTop: 10, marginBottom: 7 },
  didNotBatRow: {
    backgroundColor: "#f8f5fa",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  didNotBatLabel: { color: "#6f6274", fontSize: 11, fontWeight: "800" },
  didNotBatNames: { color: "#2b0540", fontSize: 13, marginTop: 2 },
  extras: { backgroundColor: "#f6f0f8", borderRadius: 10, padding: 10, marginTop: 12 },
  extrasTitle: { color: "#2b0540", fontWeight: "800" },
  extrasText: { color: "#6f6274", fontSize: 12, marginTop: 3 },
  actions: { gap: 10 },
  primaryButton: { backgroundColor: "#2b0540", paddingVertical: 14, paddingHorizontal: 22, borderRadius: 13, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "900" },
  publishButton: { backgroundColor: "#15803d", paddingVertical: 14, borderRadius: 13, alignItems: "center" },
  publishText: { color: "#fff", fontWeight: "900" },
  deleteButton: { backgroundColor: "#fee2e2", paddingVertical: 14, borderRadius: 13, alignItems: "center" },
  deleteText: { color: "#b91c1c", fontWeight: "900" },
  secondaryButton: { backgroundColor: "#ede9fe", paddingVertical: 14, borderRadius: 13, alignItems: "center" },
  secondaryText: { color: "#5b21b6", fontWeight: "900" },
  disabledButton: { opacity: 0.55 },
});
