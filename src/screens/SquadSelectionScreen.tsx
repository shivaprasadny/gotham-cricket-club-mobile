import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllMembers } from "../services/adminService";
import {
  addOrUpdateSquadMember,
  getSquadByMatch,
  removeSquadMember,
} from "../services/squadService";

type Props = {
  route: any;
};

type Member = {
  id?: number;
  userId?: number;
  fullName?: string;
  email?: string;
};

type SquadMember = {
  squadId: number;
  userId: number;
  fullName: string;
  nickname?: string;
  playerType?: string;
  jerseyNumber?: number;
  isPlayingXi: boolean;
  roleInMatch?: string;
};

const SquadSelectionScreen = ({ route }: Props) => {
  const { matchId } = route.params;

  const [members, setMembers] = useState<Member[]>([]);
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isPlayingXi, setIsPlayingXi] = useState(true);
  const [roleInMatch, setRoleInMatch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [membersData, squadData] = await Promise.all([
        getAllMembers(),
        getSquadByMatch(matchId),
      ]);

      setMembers(Array.isArray(membersData) ? membersData : []);
      setSquad(Array.isArray(squadData) ? squadData : []);
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to load squad");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      Alert.alert("Error", "Please select a member");
      return;
    }

    try {
      const response = await addOrUpdateSquadMember(matchId, {
        userId: selectedUserId,
        isPlayingXi,
        roleInMatch,
      });

      Alert.alert("Success", typeof response === "string" ? response : "Saved");
      setSelectedUserId(null);
      setRoleInMatch("");
      setIsPlayingXi(true);
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to save squad");
    }
  };

  const handleRemove = async (userId: number) => {
    try {
      const response = await removeSquadMember(matchId, userId);
      Alert.alert("Success", typeof response === "string" ? response : "Removed");
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to remove player");
    }
  };

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
      data={squad}
      keyExtractor={(item) => item.squadId.toString()}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.container}>
          <Text style={styles.title}>Squad Selection</Text>

          <Text style={styles.label}>Select Member</Text>
          {members.map((member) => {
            const memberId = member.userId ?? member.id ?? 0;
            const selected = selectedUserId === memberId;

            return (
              <TouchableOpacity
                key={memberId}
                style={[styles.memberOption, selected && styles.memberOptionSelected]}
                onPress={() => setSelectedUserId(memberId)}
              >
                <Text style={[styles.memberOptionText, selected && styles.memberOptionTextSelected]}>
                  {member.fullName}
                </Text>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.label}>Playing XI</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.toggleBtn, isPlayingXi && styles.toggleBtnSelected]}
              onPress={() => setIsPlayingXi(true)}
            >
              <Text style={[styles.toggleText, isPlayingXi && styles.toggleTextSelected]}>YES</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, !isPlayingXi && styles.toggleBtnSelected]}
              onPress={() => setIsPlayingXi(false)}
            >
              <Text style={[styles.toggleText, !isPlayingXi && styles.toggleTextSelected]}>NO</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Role in Match (Opening Batsman, Bowler, WK...)"
            value={roleInMatch}
            onChangeText={setRoleInMatch}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Squad Member</Text>
          </TouchableOpacity>

          <Text style={styles.section}>Current Squad</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.fullName}</Text>
          <Text>{item.isPlayingXi ? "Playing XI" : "Reserve"}</Text>
          <Text>{item.roleInMatch || "No role set"}</Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleRemove(item.userId)}
          >
            <Text style={styles.deleteBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={<Text style={{ textAlign: "center" }}>No squad selected yet.</Text>}
      contentContainerStyle={styles.list}
    />
  );
};

export default SquadSelectionScreen;

const styles = StyleSheet.create({
  list: {
    padding: 16,
    backgroundColor: "#fff",
  },
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },
  memberOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 8,
  },
  memberOptionSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  memberOptionText: {
    textAlign: "center",
  },
  memberOptionTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleBtnSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  toggleText: {
    textAlign: "center",
  },
  toggleTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  saveBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  section: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#f7f7f7",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  deleteBtn: {
    marginTop: 10,
    backgroundColor: "#c0392b",
    paddingVertical: 10,
    borderRadius: 8,
  },
  deleteBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});