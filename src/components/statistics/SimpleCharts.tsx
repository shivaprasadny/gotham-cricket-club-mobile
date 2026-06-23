import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type BarPoint = {
  label: string;
  value: number;
  secondaryValue?: number;
};

export const MatchBarChart = ({
  title,
  points,
  color = "#6d28d9",
  secondaryColor = "#f4b400",
  secondaryLabel,
}: {
  title: string;
  points: BarPoint[];
  color?: string;
  secondaryColor?: string;
  secondaryLabel?: string;
}) => {
  const max = Math.max(
    1,
    ...points.flatMap((point) => [
      point.value,
      point.secondaryValue == null ? 0 : point.secondaryValue,
    ])
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {secondaryLabel ? (
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.legendText}>Primary</Text>
          <View style={[styles.legendDot, { backgroundColor: secondaryColor }]} />
          <Text style={styles.legendText}>{secondaryLabel}</Text>
        </View>
      ) : null}
      {points.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chart}>
            {points.map((point, index) => (
              <View key={`${point.label}-${index}`} style={styles.column}>
                <View style={styles.valueRow}>
                  <Text style={styles.value}>{point.value}</Text>
                  {point.secondaryValue != null ? (
                    <Text style={styles.secondaryValue}>
                      {point.secondaryValue}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.barArea}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(4, (point.value / max) * 105),
                        backgroundColor: color,
                      },
                    ]}
                  />
                  {point.secondaryValue != null ? (
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(
                            4,
                            (point.secondaryValue / max) * 105
                          ),
                          backgroundColor: secondaryColor,
                        },
                      ]}
                    />
                  ) : null}
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {point.label}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.empty}>No published match data yet.</Text>
      )}
    </View>
  );
};

export const DistributionBars = ({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number; color?: string }[];
}) => {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {items.map((item) => (
        <View key={item.label} style={styles.distributionRow}>
          <Text style={styles.distributionLabel}>{item.label}</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color || "#6d28d9",
                },
              ]}
            />
          </View>
          <Text style={styles.distributionValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  title: { color: "#2b0540", fontSize: 16, fontWeight: "900" },
  legend: { flexDirection: "row", alignItems: "center", marginTop: 7, gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 5 },
  legendText: { color: "#827487", fontSize: 10 },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: 165,
    paddingTop: 12,
  },
  column: { width: 65, alignItems: "center", marginRight: 7 },
  valueRow: { flexDirection: "row", gap: 5, minHeight: 18 },
  value: { color: "#2b0540", fontSize: 10, fontWeight: "900" },
  secondaryValue: { color: "#b87500", fontSize: 10, fontWeight: "900" },
  barArea: {
    height: 110,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  bar: { width: 16, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  label: {
    color: "#716477",
    fontSize: 9,
    textAlign: "center",
    marginTop: 5,
  },
  empty: { color: "#827487", marginTop: 12 },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
  },
  distributionLabel: { width: 88, color: "#65566b", fontSize: 11 },
  track: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#eee7f1",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 5 },
  distributionValue: {
    width: 30,
    textAlign: "right",
    color: "#2b0540",
    fontWeight: "900",
  },
});
