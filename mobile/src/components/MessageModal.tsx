import React from "react";
import { Image, Modal, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { colors, fonts, radius, shadow, spacing, type } from "@/theme";

// Calm lake illustration shown on the motivation modal.
const SCENE_IMAGE = require("../../assets/scenes/calm-lake.png");

interface Props {
  visible: boolean;
  eyebrow?: string;
  title: string;
  body: string;
  primaryLabel?: string;
  onPrimary: () => void;
  tone?: "neutral" | "danger" | "success";
  /** Show a calm, stylized horizon illustration above the action. */
  scene?: boolean;
}

/** Reflective, calm modal used for the quote, failure, and completion popups. */
export function MessageModal({
  visible,
  eyebrow,
  title,
  body,
  primaryLabel = "Continue",
  onPrimary,
  tone = "neutral",
  scene = false,
}: Props) {
  const accent =
    tone === "danger"
      ? colors.danger
      : tone === "success"
        ? colors.success
        : colors.brass;
  const emoji = tone === "danger" ? "🍂" : tone === "success" ? "🌸" : "🌿";
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onPrimary}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.badge, { backgroundColor: `${accent}22` }]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>
          {eyebrow ? (
            <Text style={[type.label, { color: accent }]}>{eyebrow}</Text>
          ) : null}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          {scene ? (
            <Image
              source={SCENE_IMAGE}
              style={styles.scene}
              resizeMode="stretch"
            />
          ) : null}
          <Button
            label={primaryLabel}
            onPress={onPrimary}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    backgroundColor: colors.paperElevated,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadow.soft,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emoji: { fontSize: 34 },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 32,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkSoft,
    marginTop: spacing.md,
  },
  scene: {
    width: "100%",
    height: 104,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    overflow: "hidden",
    backgroundColor: colors.sky,
  },
});
