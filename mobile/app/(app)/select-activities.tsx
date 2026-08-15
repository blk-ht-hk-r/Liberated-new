import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/Button";
import { ActivityTile } from "@/components/ActivityTile";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useChallenge } from "@/store/challenge";
import { apiErrorMessage } from "@/api/client";
import { colors, fonts, radius, shadow, spacing } from "@/theme";

const REQUIRED = 7;

export default function SelectActivities() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = (params as any).mode as string | undefined;
  const isEdit = mode === "edit";
  const { activities, fetchActivities, startChallenge, changeTodayActivity, state } = useChallenge();
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities().catch(() => setError("Could not load activities"));
  }, [fetchActivities]);

  useEffect(() => {
    if (isEdit && state) {
      const todayId = state.todayActivity?.id;
      setSelected(todayId ? [todayId] : []);
    }
  }, [isEdit, state]);

  const toggle = (id: number) => {
    if (isEdit) {
      setSelected([id]);
      return;
    }
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= REQUIRED) return prev;
      return [...prev, id];
    });
  };

  const remaining = REQUIRED - selected.length;
  const canStart = selected.length === REQUIRED;
  const selectedId = selected[0];
  const isDifferentFromToday = isEdit && state && selectedId != null && selectedId !== state.todayActivity?.id;

  const start = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isEdit) {
        if (selectedId == null) return;
        await changeTodayActivity(selectedId);
        router.back();
      } else {
        await startChallenge(selected);
        router.replace("/(app)/home");
      }
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader
        title="Day 1"
        leftIcon="chevron-back"
        onLeft={() => router.back()}
        onRight={() => {}}
      />

      <View style={styles.sheet}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Select Your Activities</Text>
          {!isEdit ? (
            <Text style={styles.subtitle}>
              {selected.length}/{REQUIRED} selected
            </Text>
          ) : (
            <Text style={styles.subtitle}>Change today's task</Text>
          )}

          <View style={styles.grid}>
            {activities.map((a) => {
              const isSelected = selected.includes(a.id);
              const usedIds = state?.selectedActivities
                .slice(0, state.completedDays)
                .map((x) => x.id || 0) ?? [];
              const disabled = isEdit
                ? usedIds.includes(a.id) && a.id !== state?.todayActivity?.id
                : !isSelected && selected.length >= REQUIRED;
              return (
                <View key={a.id} style={styles.cell}>
                  <ActivityTile
                    label={a.title}
                    category={a.category}
                    selected={isSelected}
                    disabled={disabled}
                    onPress={() => toggle(a.id)}
                  />
                </View>
              );
            })}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.counter}>
            {isEdit
              ? isDifferentFromToday
                ? "Ready to switch"
                : "Pick a different activity"
              : canStart
              ? "You're ready. Seven chosen."
              : `Pick ${remaining} more ${remaining === 1 ? "thing" : "things"}`}
          </Text>
          <Button
            label={isEdit ? "Save change" : "Begin the 7 days"}
            onPress={start}
            disabled={isEdit ? !isDifferentFromToday : !canStart}
            loading={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  sheet: {
    flex: 1,
    backgroundColor: colors.paperElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: "hidden",
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md,
  },
  cell: { width: "48%" },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.danger,
    marginTop: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.paperElevated,
    gap: spacing.md,
  },
  counter: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: "center",
  },
});
