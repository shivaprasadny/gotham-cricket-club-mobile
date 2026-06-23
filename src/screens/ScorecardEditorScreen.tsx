import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePreventRemove } from "@react-navigation/native";
import {
  createScorecardDraft,
  updateScorecardDraft,
} from "../services/scorecardService";
import { getSquadByMatch } from "../services/squadService";
import { getAllMembers } from "../services/memberService";
import { getTeamMembers } from "../services/teamService";
import {
  BattingEntryRequest,
  BowlingEntryRequest,
  DismissalType,
  FieldingEntryRequest,
  MatchOutcome,
  SaveInningsRequest,
  SaveScorecardRequest,
  ScorecardResponse,
  TossDecision,
} from "../types/scorecard";
import {
  legalBallsToOvers,
  oversToLegalBalls,
  responseToDraft,
  validateScorecard,
} from "../utils/scorecardValidation";

type Props = { route: any; navigation: any };
type Step = 0 | 1 | 2 | 3;
type Player = {
  userId: number;
  fullName: string;
  isPlayingXi?: boolean;
  roleInMatch?: string | null;
  source: "SQUAD" | "TEAM" | "CLUB";
};
type PickerState = {
  type: "BATTER" | "BOWLER" | "FIELDER" | "POM";
  inningsIndex?: number;
  rowIndex?: number;
} | null;

const stepLabels = ["Match Setup", "First Innings", "Second Innings", "Review"];
const dismissalOptions = [
  ["Did Not Bat", "DID_NOT_BAT"],
  ["Not Out", "NOT_OUT"],
  ["Bowled", "BOWLED"],
  ["Caught", "CAUGHT"],
  ["LBW", "LBW"],
  ["Run Out", "RUN_OUT"],
  ["Stumped", "STUMPED"],
  ["Hit Wicket", "HIT_WICKET"],
  ["Retired Hurt", "RETIRED_HURT"],
  ["Other", "OTHER"],
] as const satisfies readonly (readonly [string, DismissalType])[];

const numberValue = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const numberText = (value: number) => (value === 0 ? "" : String(value));

const emptyBatting = (position: number): BattingEntryRequest => ({
  playerId: null,
  externalPlayerName: null,
  battingPosition: position,
  runs: 0,
  ballsFaced: 0,
  fours: 0,
  sixes: 0,
  dismissed: false,
  dismissalType: "DID_NOT_BAT",
  dismissalText: "Did not bat",
  didNotBat: true,
  retiredHurt: false,
});

const emptyBowling = (): BowlingEntryRequest => ({
  playerId: null,
  externalPlayerName: null,
  legalBalls: 0,
  maidens: 0,
  runsConceded: 0,
  wickets: 0,
  wides: 0,
  noBalls: 0,
  dotBalls: 0,
});

const emptyFielding = (playerId = 0): FieldingEntryRequest => ({
  playerId,
  catches: 0,
  droppedCatches: 0,
  runOuts: 0,
  stumpings: 0,
});

const moveListItem = <T,>(rows: T[], fromIndex: number, toIndex: number) => {
  if (toIndex < 0 || toIndex >= rows.length || fromIndex === toIndex) {
    return rows;
  }

  const reordered = [...rows];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  return reordered;
};

const createInnings = (
  inningsNumber: number,
  battingTeamId: number | null,
  battingTeamName: string
): SaveInningsRequest => ({
  inningsNumber,
  battingTeamId,
  battingTeamName: battingTeamId ? null : battingTeamName,
  runs: 0,
  wickets: 0,
  legalBalls: 0,
  totalExtras: 0,
  wides: 0,
  noBalls: 0,
  byes: 0,
  legByes: 0,
  penaltyRuns: 0,
  declared: false,
  allOut: false,
  battingEntries: [],
  bowlingEntries: [],
  fieldingEntries: [],
});

const Field = ({
  label,
  value,
  onChangeText,
  numeric = false,
  placeholder,
  wide = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  numeric?: boolean;
  placeholder?: string;
  wide?: boolean;
}) => (
  <View style={[styles.field, wide && styles.wideField]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      keyboardType={numeric ? "decimal-pad" : "default"}
      placeholder={placeholder}
      placeholderTextColor="#9b8ca1"
    />
  </View>
);

const OversField = ({
  label = "Overs",
  legalBalls,
  onLegalBallsChange,
}: {
  label?: string;
  legalBalls: number;
  onLegalBallsChange: (legalBalls: number) => void;
}) => {
  const [text, setText] = useState(() =>
    legalBalls === 0 ? "" : legalBallsToOvers(legalBalls)
  );

  useEffect(() => {
    setText(legalBalls === 0 ? "" : legalBallsToOvers(legalBalls));
  }, [legalBalls]);

  const commit = () => {
    if (!text.trim()) {
      onLegalBallsChange(0);
      setText("");
      return;
    }

    const parsed = oversToLegalBalls(text);
    if (parsed == null) {
      Alert.alert(
        "Invalid Overs",
        "Use cricket notation such as 4, 4.2 or 10.5. Balls after the decimal must be between 0 and 5."
      );
      setText(legalBallsToOvers(legalBalls));
      return;
    }

    onLegalBallsChange(parsed);
    setText(legalBallsToOvers(parsed));
  };

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={(value) => {
          if (/^\d*(\.[0-5]?)?$/.test(value)) {
            setText(value);
          }
        }}
        onBlur={commit}
        keyboardType="decimal-pad"
        placeholder="10.2"
        placeholderTextColor="#9b8ca1"
      />
    </View>
  );
};

const Choice = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.choice, selected && styles.choiceSelected]}
    onPress={onPress}
  >
    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ScorecardEditorScreen = ({ route, navigation }: Props) => {
  const { matchId, match, scorecard } = route.params as {
    matchId: number;
    match: any;
    scorecard?: ScorecardResponse;
  };
  const ourTeamId = match?.homeTeamId ?? null;
  const ourTeamName = match?.homeTeamName || "Gotham";
  const opponentTeamId = match?.awayTeamId ?? null;
  const opponentName =
    match?.awayTeamName || match?.externalOpponentName || "Opponent";
  const isIntraClub = Boolean(ourTeamId && opponentTeamId);

  const initialPayload = useMemo<SaveScorecardRequest>(() => {
    if (scorecard) return responseToDraft(scorecard);
    return {
      tossWinnerTeamId: ourTeamId,
      tossWinnerName: null,
      tossDecision: "BAT",
      outcome: "TIE",
      winningTeamId: null,
      winningTeamName: null,
      winningMarginRuns: null,
      winningMarginWickets: null,
      resultSummary: "",
      playerOfMatchId: null,
      innings: [
        createInnings(1, ourTeamId, ourTeamName),
        createInnings(2, opponentTeamId, opponentName),
      ],
    };
  }, [matchId, scorecard?.scorecardId]);

  const [payload, setPayload] = useState(initialPayload);
  const [step, setStep] = useState<Step>(0);
  const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);
  const [clubPlayers, setClubPlayers] = useState<Player[]>([]);
  const [playerSource, setPlayerSource] = useState("Loading players...");
  const [picker, setPicker] = useState<PickerState>(null);
  const [showAllClubMembers, setShowAllClubMembers] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>(
    {}
  );

  usePreventRemove(dirty && !saving, ({ data }) => {
    Alert.alert(
      "Leave Scorecard?",
      "Your unsaved changes will be lost.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => {
            setDirty(false);
            requestAnimationFrame(() => navigation.dispatch(data.action));
          },
        },
      ]
    );
  });

  useEffect(() => {
    const loadPlayers = async () => {
      const [squadResult, teamResult, clubResult] = await Promise.allSettled([
        getSquadByMatch(matchId),
        ourTeamId ? getTeamMembers(ourTeamId) : Promise.resolve([]),
        getAllMembers(),
      ]);

      const squad =
        squadResult.status === "fulfilled" && Array.isArray(squadResult.value)
          ? squadResult.value
          : [];
      const team =
        teamResult.status === "fulfilled" && Array.isArray(teamResult.value)
          ? teamResult.value
          : [];
      const club =
        clubResult.status === "fulfilled" && Array.isArray(clubResult.value)
          ? clubResult.value
          : [];

      const normalize = (row: any, source: Player["source"]): Player => ({
        userId: row.userId ?? row.id,
        fullName: row.fullName || "Club Player",
        isPlayingXi: row.isPlayingXi,
        roleInMatch: row.roleInMatch,
        source,
      });

      const preferred = squad.length
        ? squad.map((row: any) => normalize(row, "SQUAD"))
        : team.map((row: any) => normalize(row, "TEAM"));

      setSquadPlayers(
        preferred.sort((a, b) => {
          if (a.isPlayingXi !== b.isPlayingXi) return a.isPlayingXi ? -1 : 1;
          const aImpact = a.roleInMatch === "IMPACT_PLAYER";
          const bImpact = b.roleInMatch === "IMPACT_PLAYER";
          if (aImpact !== bImpact) return aImpact ? -1 : 1;
          return a.fullName.localeCompare(b.fullName);
        })
      );
      setClubPlayers(
        club
          .map((row: any) => normalize(row, "CLUB"))
          .sort((a: Player, b: Player) => a.fullName.localeCompare(b.fullName))
      );
      setPlayerSource(
        squad.length
          ? `${squad.length} players loaded from the match squad`
          : `${team.length} players loaded from ${ourTeamName}`
      );

      // For a new scorecard, pre-load selected match players into the editable
      // batting, bowling and fielding cards. Managers may still add/remove rows.
      if (!scorecard && preferred.length) {
        const selected = preferred.filter(
          (player) =>
            player.isPlayingXi || player.roleInMatch === "IMPACT_PLAYER"
        );
        setPayload((current) => ({
          ...current,
          innings: current.innings.map((innings) => {
            const ours = innings.battingTeamId === ourTeamId;
            return {
              ...innings,
              battingEntries:
                ours && innings.battingEntries.length === 0
                  ? selected.slice(0, 11).map((player, index) => ({
                      ...emptyBatting(index + 1),
                      playerId: player.userId,
                    }))
                  : innings.battingEntries,
              bowlingEntries:
                !ours && innings.bowlingEntries.length === 0
                  ? selected.slice(0, 11).map((player) => ({
                      ...emptyBowling(),
                      playerId: player.userId,
                    }))
                  : innings.bowlingEntries,
              fieldingEntries:
                !ours && innings.fieldingEntries.length === 0
                  ? selected.slice(0, 12).map((player) =>
                      emptyFielding(player.userId)
                    )
                  : innings.fieldingEntries,
            };
          }),
        }));
      }
    };
    void loadPlayers();
  }, [matchId, ourTeamId]);

  const changePayload = (
    updater: (current: SaveScorecardRequest) => SaveScorecardRequest
  ) => {
    setDirty(true);
    setPayload(updater);
  };

  const updateInnings = (
    index: number,
    changes: Partial<SaveInningsRequest>
  ) => {
    changePayload((current) => ({
      ...current,
      innings: current.innings.map((innings, inningsIndex) =>
        inningsIndex === index ? { ...innings, ...changes } : innings
      ),
    }));
  };

  const updateBatter = (
    inningsIndex: number,
    rowIndex: number,
    changes: Partial<BattingEntryRequest>
  ) => {
    const rows = payload.innings[inningsIndex].battingEntries.map((row, index) =>
      index === rowIndex ? { ...row, ...changes } : row
    );
    updateInnings(inningsIndex, { battingEntries: rows });
  };

  const updateBowler = (
    inningsIndex: number,
    rowIndex: number,
    changes: Partial<BowlingEntryRequest>
  ) => {
    const rows = payload.innings[inningsIndex].bowlingEntries.map((row, index) =>
      index === rowIndex ? { ...row, ...changes } : row
    );
    updateInnings(inningsIndex, { bowlingEntries: rows });
  };

  const moveBatter = (
    inningsIndex: number,
    rowIndex: number,
    direction: -1 | 1
  ) => {
    const reordered = moveListItem(
      payload.innings[inningsIndex].battingEntries,
      rowIndex,
      rowIndex + direction
    ).map((row, index) => ({ ...row, battingPosition: index + 1 }));
    updateInnings(inningsIndex, { battingEntries: reordered });
  };

  const moveBowler = (
    inningsIndex: number,
    rowIndex: number,
    direction: -1 | 1
  ) => {
    const reordered = moveListItem(
      payload.innings[inningsIndex].bowlingEntries,
      rowIndex,
      rowIndex + direction
    );
    updateInnings(inningsIndex, { bowlingEntries: reordered });
  };

  const updateFielder = (
    inningsIndex: number,
    rowIndex: number,
    changes: Partial<FieldingEntryRequest>
  ) => {
    const rows = payload.innings[inningsIndex].fieldingEntries.map(
      (row, index) => (index === rowIndex ? { ...row, ...changes } : row)
    );
    updateInnings(inningsIndex, { fieldingEntries: rows });
  };

  const setDismissal = (
    inningsIndex: number,
    rowIndex: number,
    dismissalType: DismissalType
  ) => {
    if (dismissalType === "NOT_OUT") {
      const notOutCount = payload.innings[inningsIndex].battingEntries.filter(
        (row, index) =>
          index !== rowIndex && currentDismissal(row) === "NOT_OUT"
      ).length;
      if (notOutCount >= 2) {
        Alert.alert(
          "Not Out limit",
          "Only 2 batters can be marked Not Out in one innings."
        );
        return;
      }
    }

    if (dismissalType === "DID_NOT_BAT") {
      updateBatter(inningsIndex, rowIndex, {
        dismissed: false,
        dismissalType,
        dismissalText: "Did not bat",
        didNotBat: true,
        retiredHurt: false,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
      });
      return;
    }

    if (dismissalType === "RETIRED_HURT") {
      updateBatter(inningsIndex, rowIndex, {
        dismissed: false,
        dismissalType,
        dismissalText: "Retired hurt",
        didNotBat: false,
        retiredHurt: true,
      });
      return;
    }

    if (dismissalType === "NOT_OUT") {
      updateBatter(inningsIndex, rowIndex, {
        dismissed: false,
        dismissalType,
        dismissalText: "",
        didNotBat: false,
        retiredHurt: false,
      });
      return;
    }

    updateBatter(inningsIndex, rowIndex, {
      dismissed: true,
      dismissalType,
      dismissalText: dismissalType.replace("_", " "),
      didNotBat: false,
      retiredHurt: false,
    });
  };

  const currentDismissal = (row: BattingEntryRequest) => {
    return row.dismissalType || "DID_NOT_BAT";
  };

  const entryKey = (
    type: "BATTER" | "BOWLER" | "FIELDER",
    inningsIndex: number,
    rowIndex: number
  ) => `${type}-${inningsIndex}-${rowIndex}`;

  const toggleEntry = (
    type: "BATTER" | "BOWLER" | "FIELDER",
    inningsIndex: number,
    rowIndex: number
  ) => {
    const key = entryKey(type, inningsIndex, rowIndex);
    setExpandedEntry((current) => (current === key ? null : key));
  };

  const toggleList = (key: string) => {
    setExpandedLists((current) => ({ ...current, [key]: !current[key] }));
  };

  const battingSummary = (row: BattingEntryRequest) => {
    const hasInput =
      row.runs > 0 || row.ballsFaced > 0 || row.fours > 0 || row.sixes > 0;
    if (!hasInput) return "Did Not Bat";
    return `${row.runs} (${row.ballsFaced}) · ${
      currentDismissal(row) === "NOT_OUT"
        ? "Not Out"
        : currentDismissal(row).replaceAll("_", " ")
    }`;
  };

  const bowlingSummary = (row: BowlingEntryRequest) => {
    const hasInput =
      row.legalBalls > 0 ||
      row.maidens > 0 ||
      row.runsConceded > 0 ||
      row.wickets > 0 ||
      row.wides > 0 ||
      row.noBalls > 0 ||
      row.dotBalls > 0;
    return hasInput
      ? `${row.wickets}/${row.runsConceded} · ${legalBallsToOvers(
          row.legalBalls
        )} ov · ${row.dotBalls} dots`
      : "Did Not Bowl";
  };

  const fieldingSummary = (row: FieldingEntryRequest) => {
    const total =
      row.catches + row.droppedCatches + row.runOuts + row.stumpings;
    return total
      ? `C ${row.catches} · RO ${row.runOuts} · St ${row.stumpings}`
      : "No Fielding Stats";
  };

  const isOurInnings = (innings: SaveInningsRequest) =>
    innings.battingTeamId === ourTeamId;

  const deriveBattingOrder = (
    current: SaveScorecardRequest,
    tossWinnerIsOurs: boolean,
    decision: TossDecision
  ) => {
    const ourTeamBatsFirst =
      (tossWinnerIsOurs && decision === "BAT") ||
      (!tossWinnerIsOurs && decision === "BOWL");
    const ourInnings =
      current.innings.find((innings) => isOurInnings(innings)) ||
      createInnings(1, ourTeamId, ourTeamName);
    const opponentInnings =
      current.innings.find((innings) => !isOurInnings(innings)) ||
      createInnings(2, opponentTeamId, opponentName);
    const ordered = ourTeamBatsFirst
      ? [ourInnings, opponentInnings]
      : [opponentInnings, ourInnings];
    return {
      ...current,
      innings: ordered.map((innings, index) => ({
        ...innings,
        inningsNumber: index + 1,
      })),
    };
  };

  const updateExtra = (
    inningsIndex: number,
    key: "wides" | "noBalls" | "byes" | "legByes" | "penaltyRuns",
    value: string
  ) => {
    const updated = {
      ...payload.innings[inningsIndex],
      [key]: numberValue(value),
    };
    updateInnings(inningsIndex, {
      [key]: updated[key],
      totalExtras:
        updated.wides +
        updated.noBalls +
        updated.byes +
        updated.legByes +
        updated.penaltyRuns,
    });
  };

  const selectedPlayerName = (playerId: number | null) =>
    [...squadPlayers, ...clubPlayers].find(
      (player) => player.userId === playerId
    )?.fullName || "Select player";

  const selectPlayer = (player: Player) => {
    if (!picker) return;
    if (picker.type === "POM") {
      changePayload((current) => ({
        ...current,
        playerOfMatchId: player.userId,
      }));
    } else if (picker.type === "BATTER") {
      updateBatter(picker.inningsIndex!, picker.rowIndex!, {
        playerId: player.userId,
        externalPlayerName: null,
      });
    } else if (picker.type === "BOWLER") {
      updateBowler(picker.inningsIndex!, picker.rowIndex!, {
        playerId: player.userId,
        externalPlayerName: null,
      });
    } else {
      updateFielder(picker.inningsIndex!, picker.rowIndex!, {
        playerId: player.userId,
      });
    }
    setPicker(null);
    setShowAllClubMembers(false);
    setPlayerSearch("");
  };

  const applyCalculatedResult = (current: SaveScorecardRequest) => {
    if (current.innings.length < 2) return current;
    const first = current.innings[0];
    const second = current.innings[1];
    const ourInnings = isOurInnings(first) ? first : second;
    const opponentInnings = isOurInnings(first) ? second : first;

    let outcome: MatchOutcome = "TIE";
    let winningTeamId: number | null = null;
    let winningTeamName: string | null = null;
    let winningMarginRuns: number | null = null;
    let winningMarginWickets: number | null = null;
    let resultSummary = "Match tied";

    if (ourInnings.runs > opponentInnings.runs) {
      outcome = "WIN";
      winningTeamId = ourTeamId;
      winningTeamName = ourTeamId ? null : ourTeamName;
      if (isOurInnings(second)) {
        winningMarginWickets = Math.max(0, 10 - ourInnings.wickets);
        resultSummary = `${ourTeamName} won by ${winningMarginWickets} wickets`;
      } else {
        winningMarginRuns = ourInnings.runs - opponentInnings.runs;
        resultSummary = `${ourTeamName} won by ${winningMarginRuns} runs`;
      }
    } else if (ourInnings.runs < opponentInnings.runs) {
      outcome = "LOSS";
      winningTeamId = opponentTeamId;
      winningTeamName = opponentTeamId ? null : opponentName;
      if (!isOurInnings(second)) {
        winningMarginWickets = Math.max(0, 10 - opponentInnings.wickets);
        resultSummary = `${opponentName} won by ${winningMarginWickets} wickets`;
      } else {
        winningMarginRuns = opponentInnings.runs - ourInnings.runs;
        resultSummary = `${opponentName} won by ${winningMarginRuns} runs`;
      }
    }

    return {
      ...current,
      outcome,
      winningTeamId,
      winningTeamName,
      winningMarginRuns,
      winningMarginWickets,
      resultSummary,
    };
  };

  const normalizeEmptyBatters = (current: SaveScorecardRequest) => ({
    ...current,
    innings: current.innings.map((innings) => ({
      ...innings,
      battingEntries: innings.battingEntries.map((row, index) => {
        const hasBattingInput =
          row.runs > 0 || row.ballsFaced > 0 || row.fours > 0 || row.sixes > 0;
        return hasBattingInput
          ? { ...row, battingPosition: index + 1 }
          : {
              ...row,
              battingPosition: index + 1,
              dismissed: false,
              dismissalType: "DID_NOT_BAT" as DismissalType,
              dismissalText: "Did not bat",
              didNotBat: true,
              retiredHurt: false,
            };
      }),
    })),
  });

  const goNext = () => {
    if (step === 0 && isIntraClub) {
      Alert.alert(
        "Intra-club matches",
        "This simplified editor currently supports Gotham versus an external opponent. Intra-club scorecards will be added later."
      );
      return;
    }
    if (step === 2) {
      changePayload((current) => applyCalculatedResult(current));
    }
    setStep((current) => Math.min(3, current + 1) as Step);
  };

  const saveDraft = async () => {
    const calculated = applyCalculatedResult(normalizeEmptyBatters(payload));
    const validation = validateScorecard(calculated);
    if (validation) {
      Alert.alert("Check Scorecard", validation);
      return;
    }
    try {
      setSaving(true);
      const saved = scorecard
        ? await updateScorecardDraft(matchId, calculated)
        : await createScorecardDraft(matchId, calculated);
      setDirty(false);
      navigation.popTo("Scorecard", {
        matchId,
        match,
        savedScorecard: saved,
      });
    } catch (error: any) {
      Alert.alert(
        "Could not save",
        error?.response?.data?.message || "Failed to save scorecard"
      );
    } finally {
      setSaving(false);
    }
  };

  const renderTeamBanner = () => (
    <View style={styles.teamBanner}>
      <View style={[styles.teamBox, styles.ourTeamBox]}>
        <Text style={styles.teamEyebrow}>OUR TEAM</Text>
        <Text style={styles.ourTeamName}>{ourTeamName}</Text>
      </View>
      <Text style={styles.versus}>VS</Text>
      <View style={[styles.teamBox, styles.opponentBox]}>
        <Text style={styles.opponentEyebrow}>OPPONENT</Text>
        <Text style={styles.opponentName}>{opponentName}</Text>
      </View>
    </View>
  );

  const renderProgress = () => (
    <View style={styles.progress}>
      {stepLabels.map((label, index) => (
        <View key={label} style={styles.progressItem}>
          <View
            style={[
              styles.progressCircle,
              index <= step && styles.progressCircleActive,
            ]}
          >
            <Text
              style={[
                styles.progressNumber,
                index <= step && styles.progressNumberActive,
              ]}
            >
              {index + 1}
            </Text>
          </View>
          <Text
            style={[
              styles.progressLabel,
              index === step && styles.progressLabelActive,
            ]}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderSetup = () => {
    return (
      <View style={styles.card}>
        <Text style={styles.stepTitle}>Match and Toss</Text>
        <Text style={styles.helpText}>
          Batting order is calculated automatically from the toss decision.
        </Text>

        <Text style={styles.sectionLabel}>Who won the toss?</Text>
        <View style={styles.choiceRow}>
          <Choice
            label={ourTeamName}
            selected={payload.tossWinnerTeamId === ourTeamId}
            onPress={() =>
              changePayload((current) =>
                deriveBattingOrder(
                  {
                    ...current,
                    tossWinnerTeamId: ourTeamId,
                    tossWinnerName: null,
                  },
                  true,
                  current.tossDecision || "BAT"
                )
              )
            }
          />
          <Choice
            label={opponentName}
            selected={payload.tossWinnerName === opponentName}
            onPress={() =>
              changePayload((current) =>
                deriveBattingOrder(
                  {
                    ...current,
                    tossWinnerTeamId: null,
                    tossWinnerName: opponentName,
                  },
                  false,
                  current.tossDecision || "BAT"
                )
              )
            }
          />
        </View>

        <Text style={styles.sectionLabel}>Toss decision</Text>
        <View style={styles.choiceRow}>
          {(["BAT", "BOWL"] as TossDecision[]).map((decision) => (
            <Choice
              key={decision}
              label={decision === "BAT" ? "Bat First" : "Bowl First"}
              selected={payload.tossDecision === decision}
              onPress={() =>
                changePayload((current) =>
                  deriveBattingOrder(
                    { ...current, tossDecision: decision },
                    current.tossWinnerTeamId === ourTeamId,
                    decision
                  )
                )
              }
            />
          ))}
        </View>

        <View style={styles.sourceCard}>
          <Ionicons name="people-outline" size={20} color="#6d28d9" />
          <View style={styles.sourceTextWrap}>
            <Text style={styles.sourceTitle}>Gotham players</Text>
            <Text style={styles.sourceText}>{playerSource}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderInnings = (inningsIndex: number) => {
    const innings = payload.innings[inningsIndex];
    const ours = isOurInnings(innings);
    const target =
      inningsIndex === 1 ? payload.innings[0].runs + 1 : null;
    const battingListKey = `BATTING-${inningsIndex}`;
    const bowlingListKey = `BOWLING-${inningsIndex}`;
    const fieldingListKey = `FIELDING-${inningsIndex}`;
    const visibleBattingEntries = innings.battingEntries
      .map((row, rowIndex) => ({ row, rowIndex }))
      .slice(0, expandedLists[battingListKey] ? undefined : 5);
    const visibleBowlingEntries = innings.bowlingEntries
      .map((row, rowIndex) => ({ row, rowIndex }))
      .slice(0, expandedLists[bowlingListKey] ? undefined : 5);
    const visibleFieldingEntries = innings.fieldingEntries
      .map((row, rowIndex) => ({ row, rowIndex }))
      .slice(0, expandedLists[fieldingListKey] ? undefined : 5);

    return (
      <View style={styles.card}>
        <View style={styles.inningsHeading}>
          <View>
            <Text style={styles.stepTitle}>
              {inningsIndex === 0 ? "First Innings" : "Second Innings"}
            </Text>
            <Text
              style={[
                styles.battingTeamHeading,
                ours ? styles.ourHeading : styles.opponentHeading,
              ]}
            >
              {ours ? ourTeamName : opponentName} Batting
            </Text>
          </View>
          {target ? (
            <View style={styles.targetBadge}>
              <Text style={styles.targetLabel}>TARGET</Text>
              <Text style={styles.targetValue}>{target}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.scoreFields}>
          <Field
            label="Runs"
            value={numberText(innings.runs)}
            placeholder="Runs"
            numeric
            onChangeText={(value) =>
              updateInnings(inningsIndex, { runs: numberValue(value) })
            }
          />
          <Field
            label="Wickets"
            value={numberText(innings.wickets)}
            placeholder="Wickets"
            numeric
            onChangeText={(value) =>
              updateInnings(inningsIndex, { wickets: numberValue(value) })
            }
          />
          <OversField
            legalBalls={innings.legalBalls}
            onLegalBallsChange={(legalBalls) =>
              updateInnings(inningsIndex, { legalBalls })
            }
          />
        </View>

        <Text style={styles.sectionLabel}>
          Extras breakdown · Total {innings.totalExtras}
        </Text>
        <View style={styles.scoreFields}>
          {([
            ["Wides", "wides"],
            ["No Balls", "noBalls"],
            ["Byes", "byes"],
            ["Leg Byes", "legByes"],
            ["Penalty", "penaltyRuns"],
          ] as const).map(([label, key]) => (
            <Field
              key={key}
              label={label}
              value={numberText(innings[key])}
              placeholder="0"
              numeric
              onChangeText={(value) => updateExtra(inningsIndex, key, value)}
            />
          ))}
        </View>

        <View style={styles.optionalRow}>
          <Text style={styles.optionalText}>
            Total extras is calculated from the five fields above.
          </Text>
          <View style={styles.switchWrap}>
            <Text style={styles.switchLabel}>All out</Text>
            <Switch
              value={innings.allOut}
              onValueChange={(allOut) =>
                updateInnings(inningsIndex, { allOut })
              }
            />
          </View>
        </View>

        {ours ? (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Gotham Batting</Text>
                <Text style={styles.sectionHint}>
                  Enter statistics only for Gotham batters.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  updateInnings(inningsIndex, {
                    battingEntries: [
                      ...innings.battingEntries,
                      emptyBatting(innings.battingEntries.length + 1),
                    ],
                  })
                }
              >
                <Text style={styles.addButtonText}>+ Add Batter</Text>
              </TouchableOpacity>
            </View>
            {visibleBattingEntries.map(({ row, rowIndex }) => (
              <View key={rowIndex} style={styles.playerEntry}>
                <View style={styles.playerEntryHeader}>
                  <TouchableOpacity
                    style={styles.compactPlayerHeader}
                    onPress={() => toggleEntry("BATTER", inningsIndex, rowIndex)}
                  >
                    <Text style={styles.orderNumber}>#{rowIndex + 1}</Text>
                    <Ionicons name="person-circle-outline" size={22} color="#6d28d9" />
                    <View style={styles.compactPlayerText}>
                      <Text style={styles.playerSelectorText}>
                        {selectedPlayerName(row.playerId)}
                      </Text>
                      <Text style={styles.entrySummary}>{battingSummary(row)}</Text>
                    </View>
                    <Ionicons
                      name={
                        expandedEntry === entryKey("BATTER", inningsIndex, rowIndex)
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={18}
                      color="#796b80"
                    />
                  </TouchableOpacity>
                  <View style={styles.orderActions}>
                    <TouchableOpacity
                      disabled={rowIndex === 0}
                      style={rowIndex === 0 && styles.orderActionDisabled}
                      onPress={() => moveBatter(inningsIndex, rowIndex, -1)}
                    >
                      <Ionicons name="arrow-up" size={18} color="#4B1D6B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={rowIndex === innings.battingEntries.length - 1}
                      style={
                        rowIndex === innings.battingEntries.length - 1 &&
                        styles.orderActionDisabled
                      }
                      onPress={() => moveBatter(inningsIndex, rowIndex, 1)}
                    >
                      <Ionicons name="arrow-down" size={18} color="#4B1D6B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        updateInnings(inningsIndex, {
                          battingEntries: innings.battingEntries
                            .filter((_, index) => index !== rowIndex)
                            .map((entry, index) => ({
                              ...entry,
                              battingPosition: index + 1,
                            })),
                        })
                      }
                    >
                      <Ionicons name="trash-outline" size={19} color="#b91c1c" />
                    </TouchableOpacity>
                  </View>
                </View>
                {expandedEntry ===
                entryKey("BATTER", inningsIndex, rowIndex) ? (
                <View style={styles.expandedStats}>
                  <TouchableOpacity
                    style={styles.changePlayerButton}
                    onPress={() =>
                      setPicker({ type: "BATTER", inningsIndex, rowIndex })
                    }
                  >
                    <Text style={styles.changePlayerText}>Change player</Text>
                  </TouchableOpacity>
                <View style={styles.scoreFields}>
                  {([
                    ["Runs", "runs"],
                    ["Balls", "ballsFaced"],
                    ["4s", "fours"],
                    ["6s", "sixes"],
                  ] as const).map(([label, key]) => (
                    <Field
                      key={key}
                      label={label}
                      value={numberText(row[key])}
                      placeholder={label}
                      numeric
                      onChangeText={(value) =>
                        updateBatter(inningsIndex, rowIndex, {
                          [key]: numberValue(value),
                        })
                      }
                    />
                  ))}
                </View>
                <View style={styles.dismissalSection}>
                  <Text style={styles.dismissalLabel}>How was the batter dismissed?</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dismissalOptions}
                  >
                    {dismissalOptions.map(([label, dismissalType]) => {
                      const selected =
                        currentDismissal(row) === dismissalType;
                      return (
                        <TouchableOpacity
                          key={dismissalType}
                          style={[
                            styles.dismissalChoice,
                            selected && styles.dismissalChoiceSelected,
                          ]}
                          onPress={() =>
                            setDismissal(
                              inningsIndex,
                              rowIndex,
                              dismissalType
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.dismissalChoiceText,
                              selected && styles.dismissalChoiceTextSelected,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  {currentDismissal(row) === "OTHER" ? (
                    <Field
                      label="Dismissal details"
                      value={row.dismissalText}
                      placeholder="Example: obstructing the field"
                      wide
                      onChangeText={(dismissalText) =>
                        updateBatter(inningsIndex, rowIndex, {
                          dismissalText,
                        })
                      }
                    />
                  ) : null}
                </View>
                </View>
                ) : null}
              </View>
            ))}
            {innings.battingEntries.length > 5 ? (
              <TouchableOpacity
                style={styles.seeMoreButton}
                onPress={() => toggleList(battingListKey)}
              >
                <Text style={styles.seeMoreText}>
                  {expandedLists[battingListKey] ? "See Less" : "See More"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Gotham Bowling</Text>
                <Text style={styles.sectionHint}>
                  Opponent player names are not required.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  updateInnings(inningsIndex, {
                    bowlingEntries: [
                      ...innings.bowlingEntries,
                      emptyBowling(),
                    ],
                  })
                }
              >
                <Text style={styles.addButtonText}>+ Add Bowler</Text>
              </TouchableOpacity>
            </View>
            {visibleBowlingEntries.map(({ row, rowIndex }) => (
              <View key={rowIndex} style={styles.playerEntry}>
                <View style={styles.playerEntryHeader}>
                  <TouchableOpacity
                    style={styles.compactPlayerHeader}
                    onPress={() => toggleEntry("BOWLER", inningsIndex, rowIndex)}
                  >
                    <Text style={styles.orderNumber}>#{rowIndex + 1}</Text>
                    <Ionicons name="person-circle-outline" size={22} color="#6d28d9" />
                    <View style={styles.compactPlayerText}>
                      <Text style={styles.playerSelectorText}>
                        {selectedPlayerName(row.playerId)}
                      </Text>
                      <Text style={styles.entrySummary}>{bowlingSummary(row)}</Text>
                    </View>
                    <Ionicons
                      name={
                        expandedEntry === entryKey("BOWLER", inningsIndex, rowIndex)
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={18}
                      color="#796b80"
                    />
                  </TouchableOpacity>
                  <View style={styles.orderActions}>
                    <TouchableOpacity
                      disabled={rowIndex === 0}
                      style={rowIndex === 0 && styles.orderActionDisabled}
                      onPress={() => moveBowler(inningsIndex, rowIndex, -1)}
                    >
                      <Ionicons name="arrow-up" size={18} color="#4B1D6B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={rowIndex === innings.bowlingEntries.length - 1}
                      style={
                        rowIndex === innings.bowlingEntries.length - 1 &&
                        styles.orderActionDisabled
                      }
                      onPress={() => moveBowler(inningsIndex, rowIndex, 1)}
                    >
                      <Ionicons name="arrow-down" size={18} color="#4B1D6B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        updateInnings(inningsIndex, {
                          bowlingEntries: innings.bowlingEntries.filter(
                            (_, index) => index !== rowIndex
                          ),
                        })
                      }
                    >
                      <Ionicons name="trash-outline" size={19} color="#b91c1c" />
                    </TouchableOpacity>
                  </View>
                </View>
                {expandedEntry ===
                entryKey("BOWLER", inningsIndex, rowIndex) ? (
                <View style={styles.expandedStats}>
                  <TouchableOpacity
                    style={styles.changePlayerButton}
                    onPress={() =>
                      setPicker({ type: "BOWLER", inningsIndex, rowIndex })
                    }
                  >
                    <Text style={styles.changePlayerText}>Change player</Text>
                  </TouchableOpacity>
                <View style={styles.scoreFields}>
                  <OversField
                    legalBalls={row.legalBalls}
                    onLegalBallsChange={(legalBalls) =>
                      updateBowler(inningsIndex, rowIndex, { legalBalls })
                    }
                  />
                  {([
                    ["M", "maidens"],
                    ["Runs", "runsConceded"],
                    ["W", "wickets"],
                    ["WD", "wides"],
                    ["NB", "noBalls"],
                    ["Dot", "dotBalls"],
                  ] as const).map(([label, key]) => (
                    <Field
                      key={key}
                      label={label}
                      value={numberText(row[key])}
                      placeholder={label}
                      numeric
                      onChangeText={(value) =>
                        updateBowler(inningsIndex, rowIndex, {
                          [key]: numberValue(value),
                        })
                      }
                    />
                  ))}
                </View>
                <Text style={styles.calculatedText}>
                  Economy:{" "}
                  {row.legalBalls
                    ? ((row.runsConceded * 6) / row.legalBalls).toFixed(2)
                    : "0.00"}
                </Text>
                </View>
                ) : null}
              </View>
            ))}
            {innings.bowlingEntries.length > 5 ? (
              <TouchableOpacity
                style={styles.seeMoreButton}
                onPress={() => toggleList(bowlingListKey)}
              >
                <Text style={styles.seeMoreText}>
                  {expandedLists[bowlingListKey] ? "See Less" : "See More"}
                </Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Gotham Fielding</Text>
                <Text style={styles.sectionHint}>
                  Record catches, drops, run-outs and keeper stumpings.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  updateInnings(inningsIndex, {
                    fieldingEntries: [
                      ...innings.fieldingEntries,
                      emptyFielding(),
                    ],
                  })
                }
              >
                <Text style={styles.addButtonText}>+ Add Fielder</Text>
              </TouchableOpacity>
            </View>
            {visibleFieldingEntries.map(({ row, rowIndex }) => (
              <View key={rowIndex} style={styles.playerEntry}>
                <View style={styles.playerEntryHeader}>
                  <TouchableOpacity
                    style={styles.compactPlayerHeader}
                    onPress={() => toggleEntry("FIELDER", inningsIndex, rowIndex)}
                  >
                    <Ionicons
                      name="hand-left-outline"
                      size={21}
                      color="#6d28d9"
                    />
                    <View style={styles.compactPlayerText}>
                      <Text style={styles.playerSelectorText}>
                        {row.playerId
                          ? selectedPlayerName(row.playerId)
                          : "Select fielder"}
                      </Text>
                      <Text style={styles.entrySummary}>{fieldingSummary(row)}</Text>
                    </View>
                    <Ionicons
                      name={
                        expandedEntry === entryKey("FIELDER", inningsIndex, rowIndex)
                          ? "chevron-up"
                          : "chevron-down"
                      }
                      size={18}
                      color="#796b80"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      updateInnings(inningsIndex, {
                        fieldingEntries: innings.fieldingEntries.filter(
                          (_, index) => index !== rowIndex
                        ),
                      })
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={19}
                      color="#b91c1c"
                    />
                  </TouchableOpacity>
                </View>
                {expandedEntry ===
                entryKey("FIELDER", inningsIndex, rowIndex) ? (
                <View style={styles.expandedStats}>
                  <TouchableOpacity
                    style={styles.changePlayerButton}
                    onPress={() =>
                      setPicker({ type: "FIELDER", inningsIndex, rowIndex })
                    }
                  >
                    <Text style={styles.changePlayerText}>Change player</Text>
                  </TouchableOpacity>
                <View style={styles.scoreFields}>
                  {([
                    ["Catches", "catches"],
                    ["Drops", "droppedCatches"],
                    ["Run Outs", "runOuts"],
                    ["Stumpings", "stumpings"],
                  ] as const).map(([label, key]) => (
                    <Field
                      key={key}
                      label={label}
                      value={numberText(row[key])}
                      placeholder={label}
                      numeric
                      onChangeText={(value) =>
                        updateFielder(inningsIndex, rowIndex, {
                          [key]: numberValue(value),
                        })
                      }
                    />
                  ))}
                </View>
                </View>
                ) : null}
              </View>
            ))}
            {innings.fieldingEntries.length > 5 ? (
              <TouchableOpacity
                style={styles.seeMoreButton}
                onPress={() => toggleList(fieldingListKey)}
              >
                <Text style={styles.seeMoreText}>
                  {expandedLists[fieldingListKey] ? "See Less" : "See More"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>
    );
  };

  const renderReview = () => {
    const calculated = applyCalculatedResult(payload);
    const first = calculated.innings[0];
    const second = calculated.innings[1];
    return (
      <View style={styles.card}>
        <Text style={styles.stepTitle}>Review and Save</Text>
        <Text style={styles.helpText}>
          Check the result before saving the draft.
        </Text>

        <View style={styles.reviewScore}>
          <View style={styles.reviewTeamRow}>
            <Text style={styles.reviewTeam}>{first.battingTeamName}</Text>
            <Text style={styles.reviewTotal}>
              {first.runs}/{first.wickets} ({legalBallsToOvers(first.legalBalls)})
            </Text>
          </View>
          <View style={styles.reviewTeamRow}>
            <Text style={styles.reviewTeam}>{second.battingTeamName}</Text>
            <Text style={styles.reviewTotal}>
              {second.runs}/{second.wickets} ({legalBallsToOvers(second.legalBalls)})
            </Text>
          </View>
          <Text style={styles.resultText}>{calculated.resultSummary}</Text>
        </View>

        <TouchableOpacity
          style={styles.pomPicker}
          onPress={() => setPicker({ type: "POM" })}
        >
          <Text style={styles.sectionLabel}>Player of the Match</Text>
          <Text style={styles.pomName}>
            {selectedPlayerName(payload.playerOfMatchId)}
          </Text>
        </TouchableOpacity>

        <Text style={styles.reviewHint}>
          Saving creates or updates a draft. Publish it from the scorecard page
          after reviewing the full tables.
        </Text>
      </View>
    );
  };

  const visiblePlayers = (showAllClubMembers ? clubPlayers : squadPlayers).filter(
    (player) =>
      player.fullName.toLowerCase().includes(playerSearch.trim().toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {renderTeamBanner()}
        {renderProgress()}
        {step === 0
          ? renderSetup()
          : step === 1
          ? renderInnings(0)
          : step === 2
          ? renderInnings(1)
          : renderReview()}

        <View style={styles.navigationRow}>
          {step > 0 ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                setStep((current) => Math.max(0, current - 1) as Step)
              }
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navigationSpacer} />
          )}
          {step < 3 ? (
            <TouchableOpacity style={styles.nextButton} onPress={goNext}>
              <Text style={styles.nextButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveDraft}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Saving..." : "Save Draft"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={picker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPicker(null)}
        >
          <Pressable style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {showAllClubMembers
                    ? "All Approved Club Members"
                    : "Match Players"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {showAllClubMembers ? "Last-minute selection" : playerSource}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPicker(null)}>
                <Ionicons name="close" size={24} color="#2b0540" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color="#897b8e" />
              <TextInput
                style={styles.searchInput}
                value={playerSearch}
                onChangeText={setPlayerSearch}
                placeholder="Search player name"
                placeholderTextColor="#9b8ca1"
              />
            </View>

            <ScrollView style={styles.playerList}>
              {visiblePlayers.map((player) => (
                <TouchableOpacity
                  key={`${player.source}-${player.userId}`}
                  style={styles.playerRow}
                  onPress={() => selectPlayer(player)}
                >
                  <View>
                    <Text style={styles.playerName}>{player.fullName}</Text>
                    <Text style={styles.playerMeta}>
                      {player.isPlayingXi
                        ? "Playing XI"
                        : player.roleInMatch === "IMPACT_PLAYER"
                        ? "Impact Player"
                        : player.source === "SQUAD"
                        ? "Squad / Reserve"
                        : player.source === "TEAM"
                        ? `${ourTeamName} member`
                        : "Club member"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9b8ca1" />
                </TouchableOpacity>
              ))}
              {!visiblePlayers.length ? (
                <Text style={styles.noPlayers}>No players found.</Text>
              ) : null}
            </ScrollView>

            <TouchableOpacity
              style={styles.clubToggle}
              onPress={() => {
                setShowAllClubMembers((current) => !current);
                setPlayerSearch("");
              }}
            >
              <Text style={styles.clubToggleText}>
                {showAllClubMembers
                  ? "Back to Match Players"
                  : "Add Any Club Member"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default ScorecardEditorScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f0f7" },
  content: { padding: 14, paddingBottom: 38 },
  teamBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  teamBox: { flex: 1, borderRadius: 16, padding: 14, minHeight: 86 },
  ourTeamBox: { backgroundColor: "#2b0540" },
  opponentBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ded4e2",
  },
  teamEyebrow: {
    color: "#f4b400",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  opponentEyebrow: {
    color: "#7a6c80",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  ourTeamName: { color: "#fff", fontSize: 17, fontWeight: "900", marginTop: 7 },
  opponentName: {
    color: "#2f2433",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 7,
  },
  versus: { color: "#da9306", fontSize: 12, fontWeight: "900" },
  progress: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  progressItem: { flex: 1, alignItems: "center" },
  progressCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ddd2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  progressCircleActive: { backgroundColor: "#2b0540" },
  progressNumber: { color: "#75677c", fontWeight: "900" },
  progressNumberActive: { color: "#fff" },
  progressLabel: {
    color: "#8b7d90",
    fontSize: 9,
    textAlign: "center",
    marginTop: 5,
  },
  progressLabelActive: { color: "#2b0540", fontWeight: "900" },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16 },
  stepTitle: { color: "#2b0540", fontSize: 22, fontWeight: "900" },
  helpText: { color: "#7b6d80", fontSize: 13, marginTop: 4, marginBottom: 18 },
  sectionLabel: {
    color: "#46364d",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 5,
  },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 15 },
  choice: {
    borderWidth: 1,
    borderColor: "#d8cddd",
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  choiceSelected: { backgroundColor: "#2b0540", borderColor: "#2b0540" },
  choiceText: { color: "#604f67", fontSize: 12, fontWeight: "800" },
  choiceTextSelected: { color: "#fff" },
  sourceCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "#f3edfa",
    borderRadius: 13,
    padding: 12,
  },
  sourceTextWrap: { flex: 1 },
  sourceTitle: { color: "#5b21b6", fontWeight: "900" },
  sourceText: { color: "#776981", fontSize: 11, marginTop: 2 },
  inningsHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  battingTeamHeading: { fontSize: 16, fontWeight: "900", marginTop: 5 },
  ourHeading: { color: "#6d28d9" },
  opponentHeading: { color: "#6b7280" },
  targetBadge: {
    backgroundColor: "#f4b400",
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 8,
    alignItems: "center",
  },
  targetLabel: { color: "#2b0540", fontSize: 9, fontWeight: "900" },
  targetValue: { color: "#2b0540", fontSize: 20, fontWeight: "900" },
  scoreFields: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  field: { width: "22%", minWidth: 68, flexGrow: 1, marginBottom: 9 },
  wideField: { width: "100%" },
  fieldLabel: { color: "#65566b", fontSize: 10, fontWeight: "800", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ded4e2",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 9,
    color: "#241b28",
    backgroundColor: "#fcf9fd",
  },
  optionalRow: {
    backgroundColor: "#faf7fb",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  optionalText: { color: "#887a8d", fontSize: 10, marginBottom: 6 },
  switchWrap: { flexDirection: "row", alignItems: "center", gap: 5 },
  switchLabel: { color: "#55465c", fontSize: 11, fontWeight: "800" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: { color: "#2b0540", fontSize: 16, fontWeight: "900" },
  sectionHint: { color: "#847688", fontSize: 10, marginTop: 2 },
  addButton: {
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  addButtonText: { color: "#15803d", fontSize: 11, fontWeight: "900" },
  playerEntry: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e3d8e8",
    borderRadius: 14,
    padding: 10,
    marginBottom: 7,
  },
  playerEntryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  compactPlayerHeader: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactPlayerText: { flex: 1 },
  orderNumber: {
    minWidth: 22,
    color: "#4B1D6B",
    fontSize: 11,
    fontWeight: "900",
  },
  orderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  orderActionDisabled: { opacity: 0.25 },
  entrySummary: { color: "#817287", fontSize: 10, marginTop: 2 },
  expandedStats: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e6dce9",
    marginTop: 8,
    paddingTop: 10,
  },
  changePlayerButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f1ebf4",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 9,
  },
  changePlayerText: { color: "#4B1D6B", fontSize: 10, fontWeight: "900" },
  seeMoreButton: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginBottom: 7,
  },
  seeMoreText: { color: "#4B1D6B", fontSize: 12, fontWeight: "900" },
  playerSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 40,
  },
  playerSelectorText: { color: "#5b21b6", fontWeight: "900" },
  dismissalSection: {
    marginTop: 3,
  },
  dismissalLabel: {
    color: "#55465c",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 7,
  },
  dismissalOptions: {
    gap: 6,
    paddingRight: 8,
  },
  dismissalChoice: {
    borderWidth: 1,
    borderColor: "#d8cddd",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#fff",
  },
  dismissalChoiceSelected: {
    backgroundColor: "#6d28d9",
    borderColor: "#6d28d9",
  },
  dismissalChoiceText: {
    color: "#65566b",
    fontSize: 10,
    fontWeight: "800",
  },
  dismissalChoiceTextSelected: {
    color: "#fff",
  },
  calculatedText: { color: "#2b0540", fontSize: 11, fontWeight: "800" },
  reviewScore: {
    backgroundColor: "#2b0540",
    borderRadius: 16,
    padding: 15,
    marginBottom: 16,
  },
  reviewTeamRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  reviewTeam: { color: "#fff", fontWeight: "800", flex: 1 },
  reviewTotal: { color: "#f4b400", fontWeight: "900" },
  resultText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#745486",
    paddingTop: 11,
  },
  pomPicker: {
    borderWidth: 1,
    borderColor: "#ded4e2",
    borderRadius: 14,
    padding: 13,
  },
  pomName: { color: "#6d28d9", fontWeight: "900" },
  reviewHint: { color: "#817386", fontSize: 11, marginTop: 12 },
  navigationRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  navigationSpacer: { flex: 1 },
  backButton: {
    flex: 1,
    backgroundColor: "#e9e0ed",
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: "center",
  },
  backButtonText: { color: "#503d59", fontWeight: "900" },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#2b0540",
    borderRadius: 13,
    paddingVertical: 14,
  },
  nextButtonText: { color: "#fff", fontWeight: "900" },
  saveButton: {
    flex: 1,
    backgroundColor: "#15803d",
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    maxHeight: "78%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: { color: "#2b0540", fontSize: 19, fontWeight: "900" },
  modalSubtitle: { color: "#817386", fontSize: 11, marginTop: 2 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f7f2f9",
    borderRadius: 12,
    paddingHorizontal: 11,
    marginVertical: 9,
  },
  searchInput: {
    flex: 1,
    color: "#2f2433",
    paddingVertical: 11,
  },
  playerList: { maxHeight: 410 },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ded4e2",
  },
  playerName: { color: "#2f2433", fontWeight: "800" },
  playerMeta: { color: "#897b8e", fontSize: 10, marginTop: 2 },
  noPlayers: { color: "#817386", textAlign: "center", paddingVertical: 25 },
  clubToggle: {
    backgroundColor: "#f4b400",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
  },
  clubToggleText: { color: "#2b0540", fontWeight: "900" },
});
