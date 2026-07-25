import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius } from "@/theme";

interface Props {
  total: number;
  completed: number;
}

/** Chunky progress bar — one calm segment per day. */
const RAINBOW = [
  "#8FB09B",
  "#88B4AE",
  "#9DB9D2",
  "#8FAAC7",
  "#B0A3CC",
  "#CB9AA3",
  "#CDB891",
];

export function ProgressBar({ total, completed }: Props) {
  const segments = Array.from({ length: Math.max(total, 1) });
  return (
    <View style={styles.row}>
      {segments.map((_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            i < completed
              ? { backgroundColor: RAINBOW[i % RAINBOW.length] }
              : styles.empty,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 5,
  },
  segment: {
    flex: 1,
    height: 12,
    borderRadius: radius.pill,
  },
  empty: { backgroundColor: colors.line },
});
