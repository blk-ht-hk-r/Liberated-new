import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { categoryIcons, colors, fonts, radius, shadow, spacing } from "@/theme";
import { Category } from "@/types";

interface Props {
  label: string;
  category: Category;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/** Map a few common activity titles to nicer icons; otherwise fall back to the
 *  category icon. */
const TITLE_ICONS: { match: RegExp; icon: keyof typeof Ionicons.glyphMap }[] = [
  { match: /call|friend|love/i, icon: "call" },
  { match: /read|book/i, icon: "book" },
  { match: /walk/i, icon: "walk" },
  { match: /workout|squat|gym|train/i, icon: "barbell" },
  { match: /cold shower|shower/i, icon: "water" },
  { match: /meditate|still/i, icon: "leaf" },
  { match: /pray/i, icon: "moon" },
  { match: /cook|meal/i, icon: "restaurant" },
  { match: /draw|paint/i, icon: "color-palette" },
  { match: /journal|write|reflect|feeling/i, icon: "create" },
  { match: /listen|album|music/i, icon: "musical-notes" },
  { match: /work|customer|money|income/i, icon: "briefcase" },
];

function iconFor(
  label: string,
  category: Category,
): keyof typeof Ionicons.glyphMap {
  const hit = TITLE_ICONS.find((t) => t.match.test(label));
  return (hit?.icon ??
    categoryIcons[category]) as keyof typeof Ionicons.glyphMap;
}

/** Cream grid tile. When selected it fills deep teal with a mint border and a check. */
export function ActivityTile({
  label,
  category,
  selected,
  onPress,
  disabled,
}: Props) {
  const icon = iconFor(label, category);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.tile,
        selected && styles.tileSelected,
        disabled && !selected && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {selected && (
        <View style={styles.check}>
          <Ionicons name="checkmark" size={14} color={colors.paper} />
        </View>
      )}
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={icon}
          size={24}
          color={selected ? colors.onDark : colors.brass}
        />
      </View>
      <Text
        style={[styles.label, selected && styles.labelSelected]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 108,
    backgroundColor: colors.paperElevated,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: spacing.md,
    justifyContent: "center",
    alignItems: "flex-start",
    ...shadow.soft,
  },
  tileSelected: {
    backgroundColor: colors.paper,
    borderColor: colors.mint,
    borderWidth: 2,
  },
  disabled: { opacity: 0.4 },
  pressed: { transform: [{ scale: 0.97 }] },
  check: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  iconWrapSelected: { backgroundColor: "rgba(212, 233, 214, 0.18)" },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
  },
  labelSelected: { color: colors.onDark },
});
