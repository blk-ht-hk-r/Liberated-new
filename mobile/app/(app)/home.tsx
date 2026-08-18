import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ConfettiCannon from "react-native-confetti-cannon";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import { MessageModal } from "@/components/MessageModal";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/store/auth";
import { useChallenge } from "@/store/challenge";
import { useNow, formatElapsedFull, formatUntilMidnight } from "@/hooks/time";
import { isOffline } from "@/api/mock";
import {
  categoryColors,
  categoryEmojis,
  categoryLabels,
  colors,
  fonts,
  radius,
  shadow,
  spacing,
} from "@/theme";

const QUOTE = {
  eyebrow: "Before you begin",
  title: "Willpower is a limited resource.",
  body: "You need structure to break free from the noise. These apps are engineered by thousands of people to capture your attention — willpower alone was never going to be enough. For the next 7 days, we'll fill that space with things that give you back.",
};

export default function Home() {
  const router = useRouter();
  const logout = useAuth((s) => s.logout);
  const quoteShown = useAuth((s) => s.quoteShown);
  const markQuoteShown = useAuth((s) => s.markQuoteShown);

  const { state, loading, fetchState, acknowledgePopups, reset } =
    useChallenge();
  const [showQuote, setShowQuote] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const nowMs = useNow();

  useEffect(() => {
    if (!quoteShown) setShowQuote(true);
  }, [quoteShown]);

  useFocusEffect(
    React.useCallback(() => {
      fetchState();
    }, [fetchState]),
  );

  const dismissQuote = () => {
    setShowQuote(false);
    markQuoteShown();
  };

  const celebrate = () => {
    setShowConfetti(true);
    acknowledgePopups();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title="LIBERATED"
        leftIcon="log-out-outline"
        onLeft={logout}
        onRight={() => {}}
      />

      <View style={styles.sheet}>
        {loading && !state ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.brass} />
          </View>
        ) : state && state.status === "COMPLETED" ? (
          <CompletedHome onRestart={reset} />
        ) : state && state.status !== "NOT_STARTED" ? (
          <ActiveHome nowMs={nowMs} />
        ) : (
          <NotStarted onStart={() => router.push("/(app)/select-activities")} />
        )}
      </View>

      <MessageModal
        visible={showQuote}
        eyebrow={QUOTE.eyebrow}
        title={QUOTE.title}
        body={QUOTE.body}
        primaryLabel="Start 7-Day Challenge"
        onPrimary={dismissQuote}
        scene
      />

      <MessageModal
        visible={!!state?.showFailurePopup && !showQuote}
        eyebrow="A day was added"
        tone="danger"
        title="You missed a task."
        body={
          state
            ? `You didn't complete ${state.missedCountJustEvaluated} day${
                state.missedCountJustEvaluated > 1 ? "s" : ""
              }. ${state.missedCountJustEvaluated} more day${
                state.missedCountJustEvaluated > 1 ? "s have" : " has"
              } been added to your challenge. Keep going — the reset only works if you finish.`
            : ""
        }
        primaryLabel="I'll finish it"
        onPrimary={acknowledgePopups}
      />

      <MessageModal
        visible={!!state?.showCompletionPopup && !showQuote}
        eyebrow="Challenge complete"
        tone="success"
        title="You are Liberated."
        body="Seven days without the scroll, seven things you actually did. Notice how that feels — that feeling was always available to you. Carry it forward."
        primaryLabel="Celebrate"
        onPrimary={celebrate}
      />

      {showConfetti ? (
        <ConfettiCannon
          count={150}
          origin={{ x: -10, y: 0 }}
          fadeOut
          autoStart
          onAnimationEnd={() => setShowConfetti(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function NotStarted({ onStart }: { onStart: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.centered}>
      <View style={styles.blob}>
        <Ionicons name="leaf" size={44} color={colors.brass} />
      </View>
      <Text style={styles.eyebrow}>The 7-day challenge</Text>
      <Text style={styles.hero}>Seven days to feel like yourself again.</Text>
      <Text style={styles.heroBody}>
        No social media for a week. Each day, one meaningful thing to fill the
        space it leaves behind. Miss a day and it costs you a day. Simple, and
        worth it. Take it one breath at a time.
      </Text>
      <Button
        label="Begin"
        onPress={onStart}
        style={{ marginTop: spacing.xl, alignSelf: "stretch" }}
      />
    </ScrollView>
  );
}

function CompletedHome({ onRestart }: { onRestart: () => void }) {
  const state = useChallenge((s) => s.state)!;
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.wordmark}>LIBERATED</Text>

      <Text style={styles.progressLabel}>
        Progress: {state.totalDays} / {state.totalDays} Days
      </Text>
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
        <ProgressBar total={state.totalDays} completed={state.totalDays} />
      </View>

      <View style={styles.completedWrap}>
        <View style={styles.blob}>
          <Ionicons name="sparkles" size={44} color={colors.brass} />
        </View>
        <Text style={styles.eyebrow}>Challenge complete</Text>
        <Text style={styles.hero}>You are Liberated.</Text>
        <Text style={styles.heroBody}>
          You finished all {state.totalDays} days. Come back soon — new features
          are on the way.
        </Text>
        <Pressable onPress={onRestart} style={styles.restartButton}>
          <Ionicons name="refresh" size={16} color={colors.brass} />
          <Text style={styles.restartText}>Start again</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ActiveHome({ nowMs }: { nowMs: number }) {
  const router = useRouter();
  const state = useChallenge((s) => s.state)!;
  const advanceDay = useChallenge((s) => s.advanceDay);
  const completeChallengeDev = useChallenge((s) => s.completeChallengeDev);
  const resetTestClock = useChallenge((s) => s.resetTestClock);

  const elapsed = useMemo(
    () => formatElapsedFull(state.startedAt, nowMs),
    [state.startedAt, nowMs],
  );
  const untilMidnight = useMemo(() => formatUntilMidnight(nowMs), [nowMs]);
  const today = state.todayActivity;
  const done = state.todayCompleted;

  const progress =
    state.status === "COMPLETED" ? state.totalDays : state.daysElapsed;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.wordmark}>LIBERATED</Text>

      <Text style={styles.progressLabel}>
        Progress: {progress} / {state.totalDays} Days
      </Text>
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
        <ProgressBar total={state.totalDays} completed={progress} />
      </View>

      <View style={styles.statBlock}>
        <Text style={styles.statLabel}>Time Since Liberation</Text>
        <Text style={styles.timer}>{elapsed}</Text>
        <Text style={styles.timerUnits}>days : hours : minutes : seconds</Text>
      </View>

      <Text style={styles.sectionLabel}>Today's Task</Text>
      {today ? (
        <Pressable
          onPress={() => router.push(`/(app)/track/${today.id}`)}
          style={({ pressed }) => [
            styles.taskCard,
            done && styles.taskCardDone,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.taskHead}>
            <Ionicons
              name={done ? "checkmark-circle" : "book"}
              size={20}
              color={colors.success}
            />
            <Text style={styles.taskTag}>
              {categoryEmojis[today.category]} {categoryLabels[today.category]}
            </Text>
            {!done ? (
              <Pressable
                hitSlop={10}
                onPress={(e: any) => {
                  e?.stopPropagation?.();
                  router.push(`/(app)/select-activities?mode=edit`);
                }}
                style={styles.changeButton}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={colors.brass}
                />
                <Text style={styles.changeText}>Change</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.taskTitle}>{today.title}</Text>
          <Text style={styles.taskDesc}>{today.description}</Text>
          <View style={styles.logRow}>
            <Ionicons
              name={done ? "checkmark-done" : "checkmark-circle-outline"}
              size={18}
              color={colors.success}
            />
            <Text style={styles.logText}>
              {done ? "Completed — tap to view" : "Log Completion"}
            </Text>
          </View>
        </Pressable>
      ) : (
        <Text style={styles.heroBody}>No task for today.</Text>
      )}

      <View style={styles.countdownBlock}>
        <Text style={styles.countdown}>{untilMidnight} remaining</Text>
        <Text style={styles.countdownLabel}>Countdown to midnight</Text>
      </View>
      {__DEV__ ? (
        <View style={styles.devRow}>
          <Pressable onPress={() => advanceDay()} style={styles.skipButton}>
            <Text style={styles.skipText}>
              {isOffline()
                ? "⏭ Skip to next day (dev)"
                : "⏭ Advance 1 day (dev/backend)"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => completeChallengeDev()}
            style={styles.devButtonSecondary}
          >
            <Text style={styles.devTextSecondary}>✅ Complete today (dev)</Text>
          </Pressable>
          {!isOffline() ? (
            <Pressable
              onPress={() => resetTestClock()}
              style={styles.devButtonSecondary}
            >
              <Text style={styles.devTextSecondary}>
                ⏱ Reset test clock (dev)
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
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
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pressed: { transform: [{ scale: 0.99 }] },

  wordmark: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 2,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  progressLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkMuted,
  },

  statBlock: { alignItems: "center", marginBottom: spacing.xl },
  statLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  timer: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.ink,
    fontVariant: ["tabular-nums"],
    letterSpacing: 1,
  },
  timerUnits: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 4,
  },

  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.inkSoft,
    marginBottom: spacing.sm,
  },
  taskCard: {
    backgroundColor: colors.paperElevated,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.success,
    padding: spacing.lg,
    ...shadow.soft,
  },
  taskCardDone: { backgroundColor: colors.successBg },
  taskHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  changeButton: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  changeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.brass,
  },
  skipButton: {
    alignSelf: "center",
    marginTop: spacing.md,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.paperElevated,
  },
  skipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.brass,
  },
  devRow: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
    marginTop: spacing.md,
  },
  devButtonSecondary: {
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    backgroundColor: colors.paperElevated,
  },
  devTextSecondary: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.brassDeep,
  },
  taskTag: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: colors.inkMuted,
  },
  taskTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: colors.brassDeep,
  },
  taskDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkSoft,
    marginTop: 6,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  logText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.success,
  },

  countdownBlock: { alignItems: "center", marginTop: spacing.xl },
  countdown: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
  countdownLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 4,
  },
  completedWrap: {
    flexGrow: 1,
    alignItems: "flex-start",
    paddingVertical: spacing.xl,
  },
  restartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xl,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
  },
  restartText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.brass,
  },

  // Not-started state
  centered: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    padding: spacing.lg,
  },
  blob: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.brass,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  heroBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkSoft,
    marginTop: spacing.md,
  },
});
