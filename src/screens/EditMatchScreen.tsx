import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
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
  const [matchFee, setMatchFee] = useState("");
  const [matchDate, setMatchDate] = useState<Date | null>(null);
  const [matchType, setMatchType] = useState("League");
  const [status, setStatus] = useState<MatchStatus>("UPCOMING");
  const [opponentMode, setOpponentMode] = useState<"EXTERNAL" | "CLUB">(
    "EXTERNAL"
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    void loadScreenData();
  }, []);

  // Load current match plus dropdown data
  const loadScreenData = async () => {
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
      setMatchFee(
        matchData?.matchFee !== null && matchData?.matchFee !== undefined
          ? String(matchData.matchFee)
          : ""
      );
      setMatchDate(matchData?.matchDate ? new Date(matchData.matchDate) : null);
      setMatchType(matchData?.matchType || "League");
      setStatus(matchData?.status || "UPCOMING");

      if (matchData?.awayTeamId) {
        setOpponentMode("CLUB");
      } else {
        setOpponentMode("EXTERNAL");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load match"
      );
    } finally {
      setLoading(false);
    }
  };

  // Validate and update match
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

    if (!matchType.trim()) {
      Alert.alert("Error", "Please select match type");
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

    if (opponentMode === "EXTERNAL") {
      if (!externalOpponentName.trim()) {
        Alert.alert("Error", "Please enter outside opponent name");
        return;
      }
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
        matchType: matchType.trim(),
        matchFee: matchFee.trim() ? Number(matchFee) : null,
        notes: notes.trim(),
        status,
      };

      const response = await updateMatch(matchId, payload);

      Alert.alert(
        "Success",
        typeof response === "string"
          ? response
          : "Match updated successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to update match"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Loading match...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Match</Text>

      <Text style={styles.label}>Match Type</Text>
      <View style={styles.rowWrap}>
        {["League", "Friendly", "Practice", "Intra Club", "Tournament"].map(
          (item) => (
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
          )
        )}
      </View>

      <Text style={styles.label}>League (Optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.rowWrap}>
          <TouchableOpacity
            style={[
              styles.chipBtn,
              leagueId === null && styles.chipBtnSelected,
            ]}
            onPress={() => setLeagueId(null)}
          >
            <Text
              style={[
                styles.chipText,
                leagueId === null && styles.chipTextSelected,
              ]}
            >
              None
            </Text>
          </TouchableOpacity>

          {leagues.map((league) => (
            <TouchableOpacity
              key={league.id}
              style={[
                styles.chipBtn,
                leagueId === league.id && styles.chipBtnSelected,
              ]}
              onPress={() => setLeagueId(league.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  leagueId === league.id && styles.chipTextSelected,
                ]}
              >
                {league.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.label}>Home Team</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.rowWrap}>
          {teams.map((team) => (
            <TouchableOpacity
              key={team.id}
              style={[
                styles.chipBtn,
                homeTeamId === team.id && styles.chipBtnSelected,
              ]}
              onPress={() => setHomeTeamId(team.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  homeTeamId === team.id && styles.chipTextSelected,
                ]}
              >
                {team.teamName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.rowWrap}>
              {teams
                .filter((team) => team.id !== homeTeamId)
                .map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      styles.chipBtn,
                      awayTeamId === team.id && styles.chipBtnSelected,
                    ]}
                    onPress={() => setAwayTeamId(team.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        awayTeamId === team.id && styles.chipTextSelected,
                      ]}
                    >
                      {team.teamName}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
        </>
      )}

      <Text style={styles.label}>Match Date & Time</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.inputText}>
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

      <Text style={styles.label}>Match Fee ($)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter match fee in dollars"
        placeholderTextColor="#7a7a7a"
        value={matchFee}
        onChangeText={setMatchFee}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Optional notes"
        placeholderTextColor="#7a7a7a"
        value={notes}
        onChangeText={setNotes}
        multiline
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
  );
};

export default EditMatchScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8f5fb",
    flexGrow: 1,
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
  inputText: {
    color: "#111",
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f5fb",
  },
  centerText: {
    color: "#2b0540",
    fontWeight: "600",
  },
});