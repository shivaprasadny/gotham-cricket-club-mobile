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
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  getActivePolls,
  getClosedPolls,
  getMyPolls,
} from "../services/pollService";
import { PollResponse } from "../types/poll";
import PollCard from "../components/polls/PollCard";

type Tab = "active" | "closed" | "my";

type Props = { navigation: any };

const PollsScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "CAPTAIN";

  const [tab, setTab] = useState<Tab>("active");
  const [activePolls, setActivePolls] = useState<PollResponse[]>([]);
  const [closedPolls, setClosedPolls] = useState<PollResponse[]>([]);
  const [myPolls, setMyPolls] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [active, closed, my] = await Promise.all([
        getActivePolls(),
        getClosedPolls(),
        getMyPolls(),
      ]);
      setActivePolls(active);
      setClosedPolls(closed);
      setMyPolls(my);
    } catch (err: any) {
      Alert.alert("Polls", err?.response?.data?.message || "Could not load polls");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadAll();
    }, [loadAll])
  );

  const onRefresh = () => {
    setRefreshing(true);
    void loadAll();
  };

  /** Replace a poll in all three lists after a mutation */
  const handlePollUpdated = (updated: PollResponse) => {
    const replace = (list: PollResponse[]) =>
      list.map((p) => (p.pollId === updated.pollId ? updated : p));
    setActivePolls(replace);
    setClosedPolls(replace);
    setMyPolls(replace);
    // Re-load to ensure the poll moves to the correct tab (e.g. just closed)
    void loadAll();
  };

  const handlePollDeleted = (pollId: number) => {
    const remove = (list: PollResponse[]) => list.filter((p) => p.pollId !== pollId);
    setActivePolls(remove);
    setClosedPolls(remove);
    setMyPolls(remove);
  };

  const currentList: PollResponse[] =
    tab === "active" ? activePolls : tab === "closed" ? closedPolls : myPolls;

  const tabLabel: Record<Tab, string> = {
    active: `Active${activePolls.length ? ` (${activePolls.length})` : ""}`,
    closed: "Closed",
    my: canManage ? "My Polls" : "Voted",
  };

  const emptyText: Record<Tab, string> = {
    active: "No active polls right now.",
    closed: "No closed polls yet.",
    my: canManage ? "You have not created any polls." : "You have not voted in any polls.",
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Polls</Text>
            <Text style={styles.subtitle}>Vote and see results</Text>
          </View>
        </View>
        {canManage && (
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate("CreatePoll")}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(["active", "closed", "my"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {tabLabel[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#da9306" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {currentList.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkbox-outline" size={44} color="#c4b7cc" />
              <Text style={styles.emptyTitle}>Nothing here</Text>
              <Text style={styles.emptyText}>{emptyText[tab]}</Text>
            </View>
          ) : (
            currentList.map((poll) => (
              <PollCard
                key={poll.pollId}
                poll={poll}
                onUpdated={handlePollUpdated}
                onDeleted={handlePollDeleted}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default PollsScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f0f7" },
  header: {
    backgroundColor: "#2b0540",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { padding: 4 },
  title: { color: "#fff", fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#f4b400", fontSize: 12, marginTop: 2 },
  createBtn: {
    backgroundColor: "#da9306",
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ede9f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#2b0540" },
  tabText: { fontSize: 12, fontWeight: "700", color: "#9b8ca1" },
  tabTextActive: { color: "#2b0540", fontWeight: "900" },
  list: { padding: 16, paddingBottom: 30 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "900", color: "#2b0540", marginTop: 12 },
  emptyText: { color: "#7a6c80", marginTop: 6, textAlign: "center" },
});
