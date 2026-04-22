import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getMatchById, updateMatch } from "../services/matchService";
import { getTeams } from "../services/teamService";
import { getLeagues } from "../services/leagueService";
import { addNotification } from "../services/notificationService";

type Props = {
  route: any;
  navigation: any;
};

type Team = {
  id: number;
  teamName: string;
};

type League = {
  id: number;
  name: string;
  season: string;
  active: boolean;
};

type MatchStatus = "UPCOMING" | "COMPLETED" | "CANCELLED";

type MatchType =
  | "LEAGUE"
  | "FRIENDLY"
  | "PRACTICE"
  | "INTRA_CLUB"
  | "TOURNAMENT";

type MatchFormat =
  | "T20"
  | "T25"
  | "T30"
  | "T40"
  | "ODI"
  | "TEST"
  | "CUSTOM";

const MATCH_TYPES: MatchType[] = [
  "LEAGUE",
  "FRIENDLY",
  "PRACTICE",
  "INTRA_CLUB",
  "TOURNAMENT",
];

const MATCH_FORMATS: MatchFormat[] = [
  "T20",
  "T25",
  "T30",
  "T40",
  "ODI",
  "TEST",
  "CUSTOM",
];

const PRESET_FORMAT_VALUES = ["T20", "T25", "T30", "T40", "ODI", "TEST"];

const EditMatchScreen = ({ route, navigation }: Props) => {
  const { matchId } = route.params;

  const [teams, setTeams] = useState<Team[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);

  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null);
  const [externalOpponentName, setExternalOpponentName] = useState("");
  const [leagueId, setLeagueId] = useState<number | null>(null);
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [matchDate, setMatchDate] = useState<Date | null>(null);

  const [matchType, setMatchType] = useState<MatchType>("LEAGUE");
  const [matchFormat, setMatchFormat] = useState<MatchFormat>("T20");
  const [customFormat, setCustomFormat] = useState("");
  const [status, setStatus] = useState<MatchStatus>("UPCOMING");

  const [matchFeeAmount, setMatchFeeAmount] = useState("");
  const [matchFeeDueDate, setMatchFeeDueDate] = useState<Date | null>(null);
  const [matchFeeDescription, setMatchFeeDescription] = useState("");

  const [opponentMode, setOpponentMode] = useState<"EXTERNAL" | "CLUB">(
    "EXTERNAL"
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFeeDueDatePicker, setShowFeeDueDatePicker] = useState(false);
  const [showLeaguePicker, setShowLeaguePicker] = useState(false);
  const [showHomeTeamPicker, setShowHomeTeamPicker] = useState(false);
  const [showAwayTeamPicker, setShowAwayTeamPicker] = useState(false);
  const [showFormatPicker, setShowFormatPicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load teams, leagues, match details
  useEffect(() => {
    void loadEditData();
  }, []);

  const loadEditData = async () => {
    try {
      const [teamData, leagueData, matchData] = await Promise.all([
        getTeams(),
        getLeagues(),
        getMatchById(matchId),
      ]);

      setTeams(Array.isArray(teamData) ? teamData : []);
      setLeagues(Array.isArray(leagueData) ? leagueData : []);

      setHomeTeamId(matchData?.homeTeamId ?? null);
      setAwayTeamId(matchData?.awayTeamId ?? null);
      setExternalOpponentName(matchData?.externalOpponentName || "");
      setLeagueId(matchData?.leagueId ?? null);
      setVenue(matchData?.venue || "");
      setNotes(matchData?.notes || "");
      setMatchDate(matchData?.matchDate ? new Date(matchData.matchDate) : null);

      setMatchFeeAmount(
        matchData?.matchFeeAmount !== null &&
          matchData?.matchFeeAmount !== undefined
          ? String(matchData.matchFeeAmount)
          : ""
      );

      setMatchFeeDueDate(
        matchData?.matchFeeDueDate ? new Date(matchData.matchFeeDueDate) : null
      );

      setMatchFeeDescription(matchData?.matchFeeDescription || "");

      const loadedType = (matchData?.matchType || "LEAGUE").toUpperCase();
      if (MATCH_TYPES.includes(loadedType as MatchType)) {
        setMatchType(loadedType as MatchType);
      }

      const loadedFormat = (matchData?.matchFormat || "T20").toUpperCase();
      if (PRESET_FORMAT_VALUES.includes(loadedFormat)) {
        setMatchFormat(loadedFormat as MatchFormat);
        setCustomFormat("");
      } else {
        setMatchFormat("CUSTOM");
        setCustomFormat(matchData?.matchFormat || "");
      }

      setStatus((matchData?.status || "UPCOMING") as MatchStatus);

      if (matchData?.awayTeamId) {
        setOpponentMode("CLUB");
      } else {
        setOpponentMode("EXTERNAL");
      }
    } catch (error: any) {
      console.log("EDIT MATCH LOAD ERROR:", error?.response?.data || error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to load match details"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedLeagueName = useMemo(() => {
    if (leagueId === null) return "None";

    return (
      leagues.find((league) => league.id === leagueId)?.name || "Select league"
    );
  }, [leagueId, leagues]);

  const selectedHomeTeamName = useMemo(() => {
    return (
      teams.find((team) => team.id === homeTeamId)?.teamName ||
      "Select home team"
    );
  }, [homeTeamId, teams]);

  const selectedAwayTeamName = useMemo(() => {
    return (
      teams.find((team) => team.id === awayTeamId)?.teamName ||
      "Select away team"
    );
  }, [awayTeamId, teams]);

  const finalMatchFormat =
    matchFormat === "CUSTOM" ? customFormat.trim() : matchFormat;

  const handleUpdateMatch = async () => {
    if (!homeTeamId) {
      Alert.alert("Error", "Please select a home team");
      return;
    }

    if (!matchDate) {
      Alert.alert("Error", "Please select match date and time");
      return;
    }

    if (!venue.trim()) {
      Alert.alert("Error", "Please enter venue");
      return;
    }

    if (!finalMatchFormat) {
      Alert.alert("Error", "Please select or enter match format");
      return;
    }

    if (opponentMode === "CLUB") {
      if (!awayTeamId) {
        Alert.alert("Error", "Please select away team");
        return;
      }

      if (homeTeamId === awayTeamId) {
        Alert.alert("Error", "Home team and away team cannot be the same");
        return;
      }
    }

    if (opponentMode === "EXTERNAL" && !externalOpponentName.trim()) {
      Alert.alert("Error", "Please enter outside opponent name");
      return;
    }

    try {
      setSubmitting(true);

   const payload = {
  homeTeamId,
  awayTeamId: opponentMode === "CLUB" ? awayTeamId : null,
  externalOpponentName:
    opponentMode === "EXTERNAL" ? externalOpponentName.trim() : "",
  leagueId,
  matchDate: matchDate.toISOString(),
  venue: venue.trim(),
  matchType,
  matchFormat: finalMatchFormat,
  matchFee: null,
  matchFeeAmount: matchFeeAmount.trim() ? Number(matchFeeAmount) : null,
  matchFeeDueDate: matchFeeDueDate ? matchFeeDueDate.toISOString() : null,
  matchFeeDescription: matchFeeDescription.trim(),
  notes: notes.trim(),
  status,
};

      const response = await updateMatch(matchId, payload);

// Build correct opponent name for notification
const notificationOpponentName =
  opponentMode === "CLUB"
    ? selectedAwayTeamName
    : externalOpponentName.trim();

await addNotification({
  title: "Match Updated",
  message: `${selectedHomeTeamName} vs ${notificationOpponentName}`,
  type: "MATCH",
  targetScreen: "MatchDetails",
  targetId: matchId,
});

Alert.alert(
  "Success",
  typeof response === "string" ? response : "Match updated successfully",
  [{ text: "OK", onPress: () => navigation.goBack() }]
);
    } catch (error: any) {
      console.log("UPDATE MATCH ERROR:", error?.response?.data || error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to update match"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading match...</Text>
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Edit Match</Text>

          <Text style={styles.label}>Match Type</Text>
          <View style={styles.rowWrap}>
            {MATCH_TYPES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chipBtn,
                  matchType === item && styles.chipBtnSelected,
                ]}
                onPress={() => setMatchType(item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    matchType === item && styles.chipTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Match Format</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowFormatPicker(true)}
          >
            <Text style={styles.selectInputText}>
              {matchFormat === "CUSTOM"
                ? customFormat || "Custom format"
                : matchFormat}
            </Text>
          </TouchableOpacity>

          {matchFormat === "CUSTOM" && (
            <TextInput
              style={styles.input}
              placeholder="Enter custom format"
              placeholderTextColor="#7a7a7a"
              value={customFormat}
              onChangeText={setCustomFormat}
            />
          )}

          <Text style={styles.label}>League (Optional)</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowLeaguePicker(true)}
          >
            <Text style={styles.selectInputText}>{selectedLeagueName}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Home Team</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowHomeTeamPicker(true)}
          >
            <Text style={styles.selectInputText}>{selectedHomeTeamName}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Opponent Setup</Text>
          <View style={styles.rowWrap}>
            <TouchableOpacity
              style={[
                styles.chipBtn,
                opponentMode === "EXTERNAL" && styles.chipBtnSelected,
              ]}
              onPress={() => {
                setOpponentMode("EXTERNAL");
                setAwayTeamId(null);
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  opponentMode === "EXTERNAL" && styles.chipTextSelected,
                ]}
              >
                Outside Opponent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chipBtn,
                opponentMode === "CLUB" && styles.chipBtnSelected,
              ]}
              onPress={() => {
                setOpponentMode("CLUB");
                setExternalOpponentName("");
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  opponentMode === "CLUB" && styles.chipTextSelected,
                ]}
              >
                Club vs Club
              </Text>
            </TouchableOpacity>
          </View>

          {opponentMode === "EXTERNAL" && (
            <>
              <Text style={styles.label}>Outside Opponent Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter outside opponent name"
                placeholderTextColor="#7a7a7a"
                value={externalOpponentName}
                onChangeText={setExternalOpponentName}
              />
            </>
          )}

          {opponentMode === "CLUB" && (
            <>
              <Text style={styles.label}>Away Team</Text>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setShowAwayTeamPicker(true)}
              >
                <Text style={styles.selectInputText}>{selectedAwayTeamName}</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.label}>Match Date & Time</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.selectInputText}>
              {matchDate ? matchDate.toLocaleString() : "Select match date & time"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={matchDate || new Date()}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setMatchDate(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>Venue</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter venue"
            placeholderTextColor="#7a7a7a"
            value={venue}
            onChangeText={setVenue}
          />

          <Text style={styles.label}>Match Fee Amount (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter fee amount"
            placeholderTextColor="#7a7a7a"
            value={matchFeeAmount}
            onChangeText={setMatchFeeAmount}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Match Fee Due Date (Optional)</Text>
          <TouchableOpacity
            style={styles.selectInput}
            onPress={() => setShowFeeDueDatePicker(true)}
          >
            <Text style={styles.selectInputText}>
              {matchFeeDueDate
                ? matchFeeDueDate.toLocaleString()
                : "Select fee due date & time"}
            </Text>
          </TouchableOpacity>

          {showFeeDueDatePicker && (
            <DateTimePicker
              value={matchFeeDueDate || new Date()}
              mode="datetime"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(event, selectedDate) => {
                setShowFeeDueDatePicker(false);
                if (selectedDate) setMatchFeeDueDate(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>Match Fee Note (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Example: Only squad players will pay"
            placeholderTextColor="#7a7a7a"
            value={matchFeeDescription}
            onChangeText={setMatchFeeDescription}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Optional notes"
            placeholderTextColor="#7a7a7a"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Status</Text>
          <View style={styles.rowWrap}>
            {(["UPCOMING", "COMPLETED", "CANCELLED"] as MatchStatus[]).map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chipBtn,
                    status === item && styles.chipBtnSelected,
                  ]}
                  onPress={() => setStatus(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      status === item && styles.chipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleUpdateMatch}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? "Updating..." : "Update Match"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* League picker */}
      <Modal visible={showLeaguePicker} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLeaguePicker(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select League</Text>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setLeagueId(null);
                setShowLeaguePicker(false);
              }}
            >
              <Text style={styles.modalItemText}>None</Text>
            </TouchableOpacity>

            {leagues.map((league) => (
              <TouchableOpacity
                key={league.id}
                style={styles.modalItem}
                onPress={() => {
                  setLeagueId(league.id);
                  setShowLeaguePicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{league.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Home team picker */}
      <Modal visible={showHomeTeamPicker} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowHomeTeamPicker(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Home Team</Text>

            {teams.map((team) => (
              <TouchableOpacity
                key={team.id}
                style={styles.modalItem}
                onPress={() => {
                  setHomeTeamId(team.id);
                  if (awayTeamId === team.id) {
                    setAwayTeamId(null);
                  }
                  setShowHomeTeamPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{team.teamName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Away team picker */}
      <Modal visible={showAwayTeamPicker} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAwayTeamPicker(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Away Team</Text>

            {teams
              .filter((team) => team.id !== homeTeamId)
              .map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setAwayTeamId(team.id);
                    setShowAwayTeamPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{team.teamName}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </Pressable>
      </Modal>

      {/* Format picker */}
      <Modal visible={showFormatPicker} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFormatPicker(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Match Format</Text>

            {MATCH_FORMATS.map((format) => (
              <TouchableOpacity
                key={format}
                style={styles.modalItem}
                onPress={() => {
                  setMatchFormat(format);
                  if (format !== "CUSTOM") {
                    setCustomFormat("");
                  }
                  setShowFormatPicker(false);
                }}
              >
                <Text style={styles.modalItemText}>{format}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export default EditMatchScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f5fb",
  },
  container: {
    padding: 20,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    backgroundColor: "#f8f5fb",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#2b0540",
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    color: "#2b0540",
  },
  label: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 8,
    marginTop: 6,
    color: "#2b0540",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  selectInput: {
    borderWidth: 1,
    borderColor: "#d9d2e1",
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  selectInputText: {
    color: "#111",
    fontWeight: "600",
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chipBtn: {
    borderWidth: 1,
    borderColor: "#d6c3e6",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  chipBtnSelected: {
    backgroundColor: "#2b0540",
    borderColor: "#2b0540",
  },
  chipText: {
    fontWeight: "600",
    color: "#2b0540",
  },
  chipTextSelected: {
    color: "#fff",
  },
  submitBtn: {
    backgroundColor: "#da9306",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  submitBtnText: {
    color: "#2b0540",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2b0540",
    marginBottom: 12,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemText: {
    color: "#111",
    fontSize: 15,
    fontWeight: "600",
  },
});