import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatEnumLabel } from "../../utils/formatEnumLabel";

export type PickerPlayer = {
  userId: number;
  fullName: string;
  nickname?: string | null;
  playerType?: string | null;
  jerseyNumber?: number | null;
  availabilityStatus?: string;
};

type Props = {
  visible: boolean;
  title: string;
  players: PickerPlayer[];
  selectedUserIds: number[];
  replacingUserId?: number;
  onClose: () => void;
  onSelect: (player: PickerPlayer) => void;
};

const PlayerPickerModal = ({
  visible,
  title,
  players,
  selectedUserIds,
  replacingUserId,
  onClose,
  onSelect,
}: Props) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return players
      .filter(
        (player) =>
          Number.isInteger(player.userId) && player.userId > 0
      )
      .filter(
        (player) =>
          !selectedUserIds.includes(player.userId) ||
          player.userId === replacingUserId
      )
      .filter(
        (player) =>
          filter === "ALL" ||
          (player.playerType || "").toUpperCase().includes(filter)
      )
      .filter(
        (player) =>
          !text ||
          player.fullName.toLowerCase().includes(text) ||
          (player.nickname || "").toLowerCase().includes(text) ||
          (player.playerType || "").toLowerCase().includes(text) ||
          String(player.jerseyNumber || "").includes(text)
      )
      .sort((a, b) => {
        if (a.availabilityStatus === "AVAILABLE" && b.availabilityStatus !== "AVAILABLE") {
          return -1;
        }
        if (b.availabilityStatus === "AVAILABLE" && a.availabilityStatus !== "AVAILABLE") {
          return 1;
        }
        return a.fullName.localeCompare(b.fullName);
      });
  }, [filter, players, replacingUserId, search, selectedUserIds]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={27} color="#4B1D6B" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={19} color="#817287" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, nickname, role or jersey"
            style={styles.search}
          />
        </View>
        <View style={styles.filters}>
          {[
            ["ALL", "All"],
            ["BAT", "Batters"],
            ["BOWL", "Bowlers"],
            ["ALL_ROUND", "All-rounders"],
            ["WICKET", "Keepers"],
          ].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.filter, filter === key && styles.filterActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.userId)}
          ListEmptyComponent={<Text style={styles.empty}>No matching players.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.player}
              onPress={() => {
                if (!Number.isInteger(item.userId) || item.userId <= 0) {
                  return;
                }
                onSelect(item);
                setSearch("");
                setFilter("ALL");
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.fullName.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.meta}>
                  {item.playerType || "Player"}
                  {item.jerseyNumber ? ` · #${item.jerseyNumber}` : ""}
                  {item.nickname ? ` · ${item.nickname}` : ""}
                </Text>
              </View>
              <Text style={styles.status}>
                {formatEnumLabel(item.availabilityStatus, "No Response")}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
};

export default PlayerPickerModal;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f4f9", paddingTop: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  title: { color: "#2b0540", fontSize: 21, fontWeight: "900" },
  searchBox: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 13,
    paddingHorizontal: 12,
  },
  search: { flex: 1, paddingVertical: 12, color: "#24112e" },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filter: { backgroundColor: "#ece4f0", borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  filterActive: { backgroundColor: "#4B1D6B" },
  filterText: { color: "#4B1D6B", fontSize: 11, fontWeight: "800" },
  filterTextActive: { color: "#fff" },
  player: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e4dbe8",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e9dfee",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#4B1D6B", fontWeight: "900" },
  name: { color: "#281332", fontWeight: "800" },
  meta: { color: "#76697c", fontSize: 11, marginTop: 2 },
  status: { color: "#39734a", fontSize: 9, fontWeight: "800" },
  empty: { textAlign: "center", color: "#75677b", marginTop: 35 },
});
