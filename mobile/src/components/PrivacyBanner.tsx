import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, spacing } from "@/theme";

/** Reassures the user that proof data stays on-device. */
export function PrivacyBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.lock}>🔒</Text>
      <Text style={styles.text}>
        Top secret! This stays only on your phone — nothing you enter here is
        sent to our servers, and it vanishes tomorrow.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.successBg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  lock: { fontSize: 18, marginTop: 1 },
  text: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 19,
    color: colors.success,
  },
});
