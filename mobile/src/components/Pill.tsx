import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { categoryColors } from "@/theme";
import { colors, fonts, radius, shadow, spacing } from "@/theme";
import { Category } from "@/types";

interface Props {
  label: string;
  category: Category;
  selected: boolean;
  order?: number; // 1-based selection order shown when selected
  onPress: () => void;
  disabled?: boolean;
}

/** Bouncy candy pill for the activity selector. Fills with its category tone when selected. */
export function Pill({
  label,
  category,
  selected,
  order,
  onPress,
  disabled,
}: Props) {
  const accent = categoryColors[category];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pill,
        { borderColor: accent, backgroundColor: `${accent}1A` },
        selected && { backgroundColor: accent, ...shadow.soft },
        disabled && !selected && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {selected && order != null && (
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>{order}</Text>
        </View>
      )}
      <Text
        style={[styles.label, { color: selected ? colors.onDark : accent }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: radius.pill,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  disabled: { opacity: 0.35 },
  pressed: { transform: [{ scale: 0.94 }] },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  orderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.32)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  orderText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.onDark,
  },
});
