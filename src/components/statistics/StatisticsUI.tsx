import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  PlayerLeaderboardEntry,
  StatisticsFilterOptions,
  StatisticsFilters,
} from "../../types/scorecard";

export const StatGrid = ({
  items,
}: {
  items: { label: string; value: string | number }[];
}) => (
  <View style={styles.grid}>
    {items.map((item) => (
      <View key={item.label} style={styles.stat}>
        <Text style={styles.value}>{item.value}</Text>
        <Text style={styles.label}>{item.label}</Text>
      </View>
    ))}
  </View>
);

export const LeaderboardList = ({
  entries,
  onPlayerPress,
}: {
  entries: PlayerLeaderboardEntry[];
  onPlayerPress: (playerId: number) => void;
}) => (
  <View style={styles.list}>
    {entries.map((entry) => (
      <TouchableOpacity
        key={`${entry.rank}-${entry.playerId}`}
        style={styles.leaderRow}
        onPress={() => onPlayerPress(entry.playerId)}
      >
        <Text style={styles.rank}>{entry.rank}</Text>
        <Text style={styles.name}>{entry.fullName}</Text>
        <View>
          <Text style={styles.leaderValue}>{entry.value}</Text>
          {entry.secondaryValue != null ? (
            <Text style={styles.secondary}>{entry.secondaryValue}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    ))}
  </View>
);

type FilterBarProps = {
  options: StatisticsFilterOptions | null;
  value: StatisticsFilters;
  onChange: (filters: StatisticsFilters) => void;
  includeLeague?: boolean;
};

export const StatisticsFilterBar = ({
  options,
  value,
  onChange,
  includeLeague = true,
}: FilterBarProps) => {
  const [openFilter, setOpenFilter] = useState<
    "year" | "leagueId" | "teamId" | null
  >(null);

  if (!options) return null;

  const update = <K extends keyof StatisticsFilters>(
    key: K,
    nextValue: StatisticsFilters[K]
  ) => {
    const next = { ...value };
    if (nextValue == null || nextValue === "") delete next[key];
    else next[key] = nextValue;
    onChange(next);
  };

  const hasFilters = Object.keys(value).length > 0;
  const selectedLeague = options.leagues.find(
    (league) => league.id === value.leagueId
  );
  const selectedTeam = options.teams.find((team) => team.id === value.teamId);
  const modalItems =
    openFilter === "year"
      ? options.years.map((year) => ({ value: year, label: String(year) }))
      : openFilter === "leagueId"
      ? options.leagues.map((league) => ({
          value: league.id,
          label: league.name,
        }))
      : openFilter === "teamId"
      ? options.teams.map((team) => ({ value: team.id, label: team.name }))
      : [];
  const modalTitle =
    openFilter === "year"
      ? "Choose Year"
      : openFilter === "leagueId"
      ? "Choose League"
      : "Choose Team";

  const choose = (nextValue?: string | number) => {
    if (openFilter) update(openFilter, nextValue as never);
    setOpenFilter(null);
  };

  return (
    <>
      <View style={styles.compactFilters}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.compactButton,
              value.year != null && styles.compactButtonActive,
            ]}
            onPress={() => setOpenFilter("year")}
          >
            <Text style={styles.compactButtonLabel}>Year</Text>
            <Text style={styles.compactButtonValue}>
              {value.year || "All"}
            </Text>
          </TouchableOpacity>

          {includeLeague ? (
            <TouchableOpacity
              style={[
                styles.compactButton,
                value.leagueId != null && styles.compactButtonActive,
              ]}
              onPress={() => setOpenFilter("leagueId")}
            >
              <Text style={styles.compactButtonLabel}>League</Text>
              <Text style={styles.compactButtonValue} numberOfLines={1}>
                {selectedLeague?.name || "All"}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[
              styles.compactButton,
              value.teamId != null && styles.compactButtonActive,
            ]}
            onPress={() => setOpenFilter("teamId")}
          >
            <Text style={styles.compactButtonLabel}>Team</Text>
            <Text style={styles.compactButtonValue} numberOfLines={1}>
              {selectedTeam?.name || "All"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {hasFilters ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onChange({})}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        visible={openFilter !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenFilter(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setOpenFilter(null)}
        >
          <Pressable style={styles.filterModal} onPress={() => undefined}>
            <Text style={styles.filterModalTitle}>{modalTitle}</Text>
            <ScrollView style={styles.filterModalList}>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => choose(undefined)}
              >
                <Text style={styles.filterOptionText}>All</Text>
              </TouchableOpacity>
              {modalItems.map((item) => (
                <TouchableOpacity
                  key={`${openFilter}-${item.value}`}
                  style={styles.filterOption}
                  onPress={() => choose(item.value)}
                >
                  <Text style={styles.filterOptionText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  stat: { width: "31%", minWidth: 96, flexGrow: 1, backgroundColor: "#fff", borderRadius: 14, padding: 13 },
  value: { color: "#2b0540", fontSize: 20, fontWeight: "900" },
  label: { color: "#7a6c80", fontSize: 11, marginTop: 3 },
  list: { backgroundColor: "#fff", borderRadius: 15, overflow: "hidden" },
  leaderRow: { flexDirection: "row", alignItems: "center", padding: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e4dae7" },
  rank: { width: 30, color: "#da9306", fontWeight: "900", fontSize: 16 },
  name: { flex: 1, color: "#2b0540", fontWeight: "800" },
  leaderValue: { color: "#2b0540", fontWeight: "900", textAlign: "right" },
  secondary: { color: "#827487", fontSize: 10, textAlign: "right" },
  compactFilters: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  compactFilterContent: { gap: 7, paddingRight: 5 },
  compactButton: {
    minWidth: 88,
    maxWidth: 145,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2d8e6",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  compactButtonActive: { borderColor: "#6d28d9", backgroundColor: "#f4efff" },
  compactButtonLabel: { color: "#827487", fontSize: 9, fontWeight: "800" },
  compactButtonValue: {
    color: "#2b0540",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  clearButton: { paddingHorizontal: 8, paddingVertical: 10 },
  clearText: { color: "#6d28d9", fontSize: 12, fontWeight: "800" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 28,
  },
  filterModal: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    maxHeight: "65%",
  },
  filterModalTitle: {
    color: "#2b0540",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  filterModalList: { maxHeight: 380 },
  filterOption: {
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e6dce9",
  },
  filterOptionText: { color: "#403347", fontSize: 15, fontWeight: "700" },
});
