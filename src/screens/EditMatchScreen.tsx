import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { deleteMatch, getMatchById, updateMatch } from "../services/matchService";

type Props = {
  route: any;
  navigation: any;
};

const EditMatchScreen = ({ route, navigation }: Props) => {
  const { matchId } = route.params;

  const [opponentName, setOpponentName] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  const [matchType, setMatchType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatch();
  }, []);

  const loadMatch = async () => {
    try {
      const data = await getMatchById(matchId);
      setOpponentName(data.opponentName || "");
      setMatchDate(data.matchDate || "");
      setVenue(data.venue || "");
      setMatchType(data.matchType || "");
      setNotes(data.notes || "");
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to load match");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await updateMatch(matchId, {
        opponentName,
        matchDate,
        venue,
        matchType,
        notes,
      });

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Match updated successfully"
      );

      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to update match");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await deleteMatch(matchId);

      Alert.alert(
        "Success",
        typeof response === "string" ? response : "Match deleted successfully"
      );

      navigation.navigate("Matches");
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to delete match");
    }
  };

  if (loading) {
    return <Text style={{ textAlign: "center", marginTop: 40 }}>Loading...</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Match</Text>

      <TextInput style={styles.input} value={opponentName} onChangeText={setOpponentName} placeholder="Opponent Name" />
      <TextInput style={styles.input} value={matchDate} onChangeText={setMatchDate} placeholder="Match Date" />
      <TextInput style={styles.input} value={venue} onChangeText={setVenue} placeholder="Venue" />
      <TextInput style={styles.input} value={matchType} onChangeText={setMatchType} placeholder="Match Type" />
      <TextInput style={[styles.input, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Notes" multiline numberOfLines={4} />

      <Button title="Update Match" onPress={handleUpdate} />
      <Text style={{ marginTop: 12 }} />
      <Button title="Delete Match" onPress={handleDelete} color="#c0392b" />
    </ScrollView>
  );
};

export default EditMatchScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
});