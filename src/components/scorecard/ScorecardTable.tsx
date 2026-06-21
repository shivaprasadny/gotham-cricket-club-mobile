import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BattingPerformanceResponse,
  BowlingPerformanceResponse,
  FieldingPerformanceResponse,
} from "../../types/scorecard";

type BattingProps = {
  rows: BattingPerformanceResponse[];
  onPlayerPress?: (playerId: number) => void;
};

export const BattingTable = ({ rows, onPlayerPress }: BattingProps) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.nameCell]}>Batter</Text>
        {["R", "B", "4s", "6s", "SR"].map((label) => (
          <Text key={label} style={styles.headerCell}>{label}</Text>
        ))}
      </View>
      {rows.map((row, index) => (
        <View key={`${row.playerId || row.playerName}-${index}`} style={styles.row}>
          <View style={styles.nameCell}>
            <TouchableOpacity
              disabled={!row.playerId || !onPlayerPress}
              onPress={() => row.playerId && onPlayerPress?.(row.playerId)}
            >
              <Text style={[styles.playerName, Boolean(row.playerId) && styles.link]}>
                {row.playerName}
              </Text>
            </TouchableOpacity>
            {row.dismissal ? <Text style={styles.subText}>{row.dismissal}</Text> : null}
          </View>
          {[row.runs, row.balls, row.fours, row.sixes, row.strikeRate.toFixed(2)].map(
            (value, valueIndex) => (
              <Text key={valueIndex} style={styles.cell}>{value}</Text>
            )
          )}
        </View>
      ))}
    </View>
  </ScrollView>
);

type BowlingProps = {
  rows: BowlingPerformanceResponse[];
  onPlayerPress?: (playerId: number) => void;
};

export const BowlingTable = ({ rows, onPlayerPress }: BowlingProps) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.nameCell]}>Bowler</Text>
        {["O", "M", "R", "W", "Econ", "Ext"].map((label) => (
          <Text key={label} style={styles.headerCell}>{label}</Text>
        ))}
      </View>
      {rows.map((row, index) => (
        <View key={`${row.playerId || row.playerName}-${index}`} style={styles.row}>
          <View style={styles.nameCell}>
            <TouchableOpacity
              disabled={!row.playerId || !onPlayerPress}
              onPress={() => row.playerId && onPlayerPress?.(row.playerId)}
            >
              <Text style={[styles.playerName, Boolean(row.playerId) && styles.link]}>
                {row.playerName}
              </Text>
            </TouchableOpacity>
          </View>
          {[
            row.oversDisplay,
            row.maidens,
            row.runsConceded,
            row.wickets,
            row.economy.toFixed(2),
            row.totalBowlingExtras,
          ].map((value, valueIndex) => (
            <Text key={valueIndex} style={styles.cell}>{value}</Text>
          ))}
        </View>
      ))}
    </View>
  </ScrollView>
);

type FieldingProps = {
  rows: FieldingPerformanceResponse[];
  onPlayerPress?: (playerId: number) => void;
};

export const FieldingTable = ({ rows, onPlayerPress }: FieldingProps) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.nameCell]}>Fielder</Text>
        {["C", "Drop", "RO", "St", "Eff%"].map((label) => (
          <Text key={label} style={styles.headerCell}>{label}</Text>
        ))}
      </View>
      {rows.map((row) => (
        <View key={row.playerId} style={styles.row}>
          <View style={styles.nameCell}>
            <TouchableOpacity onPress={() => onPlayerPress?.(row.playerId)}>
              <Text style={[styles.playerName, styles.link]}>{row.playerName}</Text>
            </TouchableOpacity>
          </View>
          {[
            row.catches,
            row.droppedCatches,
            row.runOuts,
            row.stumpings,
            row.catchEfficiency.toFixed(2),
          ].map((value, valueIndex) => (
            <Text key={valueIndex} style={styles.cell}>{value}</Text>
          ))}
        </View>
      ))}
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#2b0540",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd2e2",
    backgroundColor: "#fff",
  },
  headerCell: {
    width: 58,
    paddingVertical: 10,
    textAlign: "center",
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  cell: {
    width: 58,
    paddingVertical: 12,
    textAlign: "center",
    color: "#28202d",
    fontSize: 13,
  },
  nameCell: {
    width: 172,
    paddingHorizontal: 10,
  },
  playerName: {
    color: "#211725",
    fontSize: 13,
    fontWeight: "700",
  },
  link: {
    color: "#6d28d9",
  },
  subText: {
    color: "#7b6d80",
    fontSize: 10,
    marginTop: 2,
  },
});
