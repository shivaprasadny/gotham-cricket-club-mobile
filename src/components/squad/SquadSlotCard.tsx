import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type SquadPlayer = {
  squadId?: number;
  userId: number;
  fullName: string;
  nickname?: string | null;
  playerType?: string | null;
  jerseyNumber?: number | null;
  availabilityStatus?: string;
  isPlayingXi: boolean;
  roleInMatch?: string | null;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isWicketKeeper?: boolean;
  squadPosition?: number | null;
};

type Props = {
  label: string;
  player?: SquadPlayer | null;
  accent?: boolean;
  onSelect: () => void;
  onRemove?: () => void;
  onRole?: (role?: string) => void;
};

const SquadSlotCard = ({
  label,
  player,
  accent,
  onSelect,
  onRemove,
  onRole,
}: Props) => {
  if (!player) {
    return (
      <TouchableOpacity
        style={[styles.emptyCard, accent && styles.impactCard]}
        onPress={onSelect}
      >
        <View style={styles.slotNumber}>
          <Text style={styles.slotNumberText}>{label}</Text>
        </View>
        <Ionicons name="add-circle-outline" size={26} color="#7c3c9e" />
        <Text style={styles.emptyTitle}>Select player</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.playerCard, accent && styles.impactCard]}>
      <View style={styles.cardTop}>
        <View style={styles.slotNumber}>
          <Text style={styles.slotNumberText}>{label}</Text>
        </View>
        <TouchableOpacity onPress={onRemove}>
          <Ionicons name="close-circle" size={22} color="#b94a48" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onSelect}>
        <Text numberOfLines={1} style={styles.name}>{player.fullName}</Text>
        <Text numberOfLines={1} style={styles.meta}>
          {player.playerType || "Player"}
          {player.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}
        </Text>
        <Text style={styles.availability}>
          {player.availabilityStatus || "NO RESPONSE"}
        </Text>
      </TouchableOpacity>

      {onRole ? (
        <View style={styles.roles}>
          {[
            ["CAPTAIN", "C", Boolean(player.isCaptain)],
            ["VICE_CAPTAIN", "VC", Boolean(player.isViceCaptain)],
            ["WICKETKEEPER", "WK", Boolean(player.isWicketKeeper)],
          ].map(([role, short, selected]) => (
            <TouchableOpacity
              key={String(role)}
              style={[
                styles.roleChip,
                selected && styles.roleChipSelected,
              ]}
              onPress={() => onRole(String(role))}
            >
              <Text
                style={[
                  styles.roleText,
                  selected && styles.roleTextSelected,
                ]}
              >
                {short}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : accent ? (
        <View style={styles.impactPill}>
          <Text style={styles.impactPillText}>IP</Text>
        </View>
      ) : null}
    </View>
  );
};

export default SquadSlotCard;

const styles = StyleSheet.create({
  emptyCard: {
    minHeight: 150,
    flex: 1,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#c9b7d3",
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: 12,
  },
  playerCard: {
    minHeight: 150,
    flex: 1,
    borderWidth: 1,
    borderColor: "#e3d8e8",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 12,
  },
  impactCard: { borderColor: "#da9306", backgroundColor: "#fffaf0" },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  slotNumber: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eee5f2",
  },
  slotNumberText: { color: "#4B1D6B", fontSize: 11, fontWeight: "900" },
  emptyTitle: { color: "#4B1D6B", fontWeight: "800" },
  name: { color: "#24112e", fontSize: 15, fontWeight: "900" },
  meta: { color: "#74667a", fontSize: 11, marginTop: 3 },
  availability: {
    alignSelf: "flex-start",
    color: "#39734a",
    backgroundColor: "#e8f5ec",
    fontSize: 9,
    fontWeight: "800",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 8,
  },
  roles: { flexDirection: "row", gap: 5, marginTop: 10 },
  roleChip: {
    flex: 1,
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 6,
    backgroundColor: "#f1ebf4",
  },
  roleChipSelected: { backgroundColor: "#4B1D6B" },
  roleText: { color: "#4B1D6B", fontSize: 10, fontWeight: "900" },
  roleTextSelected: { color: "#fff" },
  impactPill: {
    alignSelf: "flex-start",
    backgroundColor: "#da9306",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 9,
  },
  impactPillText: { color: "#2b0540", fontSize: 10, fontWeight: "900" },
});
