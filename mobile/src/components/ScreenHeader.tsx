import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing } from "@/theme";

interface Props {
  title: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  onLeft?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRight?: () => void;
}

/** Deep-teal top bar: left icon (menu/back), centered title, right icon (bell). */
export function ScreenHeader({
  title,
  leftIcon = "menu",
  onLeft,
  rightIcon = "notifications-outline",
  onRight,
}: Props) {
  return (
    <View style={styles.bar}>
      <Pressable onPress={onLeft} hitSlop={12} style={styles.side}>
        {onLeft ? (
          <Ionicons name={leftIcon} size={22} color={colors.onDark} />
        ) : null}
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={onRight} hitSlop={12} style={styles.side}>
        {onRight ? (
          <Ionicons name={rightIcon} size={22} color={colors.onDark} />
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
    backgroundColor: colors.paper,
  },
  side: { width: 28, alignItems: "center", justifyContent: "center" },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.onDark,
  },
});
