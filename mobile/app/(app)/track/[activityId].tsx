import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import { Button } from "@/components/Button";
import { PrivacyBanner } from "@/components/PrivacyBanner";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useChallenge } from "@/store/challenge";
import {
  getProof,
  saveProof,
  purgeOldProof,
  localDateString,
  StoredProof,
} from "@/storage/secureProof";
import { Activity } from "@/types";
import {
  categoryColors,
  categoryEmojis,
  categoryLabels,
  colors,
  fonts,
  radius,
  shadow,
  spacing,
  type,
} from "@/theme";
import { useNow } from "@/hooks/time";

function parseConfig(json: string): Record<string, number> {
  try {
    return JSON.parse(json) ?? {};
  } catch {
    return {};
  }
}

export default function TrackActivity() {
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const router = useRouter();
  const id = Number(activityId);
  const today = localDateString();

  const state = useChallenge((s) => s.state);
  const activities = useChallenge((s) => s.activities);
  const completeToday = useChallenge((s) => s.completeToday);

  const activity: Activity | undefined = useMemo(() => {
    return (
      state?.selectedActivities.find((a) => a.id === id) ||
      activities.find((a) => a.id === id)
    );
  }, [state, activities, id]);

  const [existing, setExisting] = useState<StoredProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const cfg = activity ? parseConfig(activity.trackingConfig) : {};
  const listSize = cfg.listSize ?? 3;
  const [names, setNames] = useState<string[]>(Array(listSize).fill(""));
  const [textValue, setTextValue] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [count, setCount] = useState(0);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const nowMs = useNow(timerStart ? 1000 : 60000);

  const gongRef = useRef<AudioPlayer | null>(null);
  const closingGongPlayedRef = useRef(false);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    return () => {
      gongRef.current?.remove();
      gongRef.current = null;
    };
  }, []);

  const playGong = useCallback(async () => {
    try {
      const player = createAudioPlayer(
        require("../../../assets/sounds/gong.mp3"),
      );
      gongRef.current = player;
      player.play();
      player.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish) {
          player.remove();
          if (gongRef.current === player) gongRef.current = null;
        }
      });
    } catch {
      /* Sound is a gentle enhancement; ignore playback failures. */
    }
  }, []);

  useEffect(() => {
    (async () => {
      await purgeOldProof(today);
      const found = await getProof(id, today);
      setExisting(found);
      setLoading(false);
    })();
  }, [id, today]);

  // Sound the closing gong 1 min before the end (so it finishes at the target),
  // then stop the timer exactly at the target.
  useEffect(() => {
    if (timerStart == null || !cfg.timerTargetMin) return;
    const targetMs = cfg.timerTargetMin * 60000;
    const elapsedMs = nowMs - timerStart;

    if (!closingGongPlayedRef.current && elapsedMs >= targetMs - 60000) {
      closingGongPlayedRef.current = true;
      playGong();
    }

    if (elapsedMs >= targetMs) {
      setTimerMinutes(cfg.timerTargetMin);
      setTimerStart(null);
    }
  }, [nowMs, timerStart, cfg.timerTargetMin, playGong]);

  if (!activity) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader
          title="Task"
          leftIcon="chevron-back"
          onLeft={() => router.back()}
          onRight={() => {}}
        />
        <View style={styles.sheet}>
          <View style={styles.centered}>
            <Text style={styles.body}>Activity not found.</Text>
            <Button
              label="Go back"
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const alreadyDone = !!existing;

  // Only proof types that store personal content (photos, names, written text)
  // warrant the on-device privacy reassurance.
  const handlesPrivateData =
    activity.proofType === "PHOTO" ||
    activity.proofType === "NAMED_LIST" ||
    activity.proofType === "TEXT_ENTRY";

  const pickImage = async (fromCamera: boolean) => {
    setError(null);
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Permission is needed to attach a photo.");
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const timerTargetSec = cfg.timerTargetMin ? cfg.timerTargetMin * 60 : null;

  const rawElapsedTimerSec =
    timerStart != null
      ? Math.max(0, Math.floor((nowMs - timerStart) / 1000))
      : timerMinutes != null
        ? timerMinutes * 60
        : null;

  const elapsedTimerSec =
    rawElapsedTimerSec != null && timerTargetSec != null
      ? Math.min(rawElapsedTimerSec, timerTargetSec)
      : rawElapsedTimerSec;

  const elapsedTimerMin =
    elapsedTimerSec != null ? Math.floor(elapsedTimerSec / 60) : null;

  const timerReachedTarget =
    timerTargetSec != null && (elapsedTimerSec ?? 0) >= timerTargetSec;

  const formatClock = (totalSec: number): string => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const validate = (): boolean => {
    switch (activity.proofType) {
      case "NAMED_LIST":
        if (names.every((n) => !n.trim())) {
          setError("Add at least one name.");
          return false;
        }
        return true;
      case "TEXT_ENTRY":
        if (!textValue.trim()) {
          setError("Write a few words to mark this done.");
          return false;
        }
        return true;
      case "PHOTO":
        if (!imageUri) {
          setError("Attach a photo as your private proof.");
          return false;
        }
        return true;
      case "TIMER":
        if (!elapsedTimerMin || elapsedTimerMin < 1) {
          setError("Run the timer for at least a minute.");
          return false;
        }
        return true;
      case "COUNTER":
        if (count < 1) {
          setError("Log at least one.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const submit = async () => {
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await saveProof({
        activityId: id,
        proofType: activity.proofType,
        date: today,
        textValues:
          activity.proofType === "NAMED_LIST"
            ? names.filter((n) => n.trim())
            : activity.proofType === "TEXT_ENTRY"
              ? [textValue.trim()]
              : undefined,
        imageUri: activity.proofType === "PHOTO" ? imageUri : undefined,
        minutes:
          activity.proofType === "TIMER"
            ? (elapsedTimerMin ?? undefined)
            : undefined,
        count: activity.proofType === "COUNTER" ? count : undefined,
      });
      // Backend only records the boolean completion - never the proof itself.
      await completeToday();
      router.replace("/(app)/home");
    } catch (e) {
      setError("Could not save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title={categoryLabels[activity.category]}
        leftIcon="chevron-back"
        onLeft={() => router.back()}
        onRight={() => {}}
      />
      <View style={styles.sheet}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                styles.categoryTag,
                { backgroundColor: categoryColors[activity.category] },
              ]}
            >
              <Text style={styles.categoryTagText}>
                {categoryEmojis[activity.category]}{" "}
                {categoryLabels[activity.category]}
              </Text>
            </View>
            <Text style={styles.title}>{activity.title}</Text>
            <Text style={styles.body}>{activity.description}</Text>

            {handlesPrivateData ? (
              <>
                <View style={{ height: spacing.lg }} />
                <PrivacyBanner />
              </>
            ) : null}
            <View style={{ height: spacing.lg }} />

            {loading ? (
              <Text style={styles.body}>Loading…</Text>
            ) : alreadyDone ? (
              <AlreadyDone proof={existing!} activity={activity} />
            ) : (
              <View style={styles.form}>
                {activity.proofType === "NAMED_LIST" &&
                  names.map((n, i) => (
                    <Field
                      key={i}
                      label={`Person ${i + 1}`}
                      value={n}
                      onChangeText={(t) =>
                        setNames((prev) =>
                          prev.map((x, idx) => (idx === i ? t : x)),
                        )
                      }
                      placeholder="Name"
                    />
                  ))}

                {activity.proofType === "TEXT_ENTRY" && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Your reflection</Text>
                    <TextInput
                      value={textValue}
                      onChangeText={setTextValue}
                      placeholder="Write freely — only you will ever read this."
                      placeholderTextColor={colors.inkMuted}
                      multiline
                      style={[styles.input, styles.multiline]}
                    />
                  </View>
                )}

                {activity.proofType === "PHOTO" && (
                  <View style={styles.field}>
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.preview}
                      />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Text style={styles.photoHint}>No photo yet</Text>
                      </View>
                    )}
                    <View style={styles.photoButtons}>
                      <Button
                        label="Take photo"
                        variant="secondary"
                        onPress={() => pickImage(true)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        label="Choose"
                        variant="secondary"
                        onPress={() => pickImage(false)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}

                {activity.proofType === "TIMER" && (
                  <View style={styles.timerBox}>
                    <Text style={styles.timerValue}>
                      {formatClock(elapsedTimerSec ?? 0)}
                    </Text>
                    {cfg.timerTargetMin ? (
                      <Text style={styles.body}>
                        Target: {cfg.timerTargetMin} minutes
                      </Text>
                    ) : null}
                    {timerReachedTarget ? (
                      <Text style={styles.timerDone}>✓ Session complete</Text>
                    ) : timerStart == null ? (
                      <Button
                        label={timerMinutes ? "Resume" : "Start timer"}
                        onPress={() => {
                          const startedFrom = (timerMinutes ?? 0) * 60000;
                          // If resuming past the closing point, don't replay the end gong.
                          closingGongPlayedRef.current =
                            !!cfg.timerTargetMin &&
                            startedFrom >= cfg.timerTargetMin * 60000 - 60000;
                          setTimerStart(Date.now() - startedFrom);
                          playGong();
                        }}
                        style={{ marginTop: spacing.md }}
                      />
                    ) : (
                      <Button
                        label="Stop"
                        variant="secondary"
                        onPress={() => {
                          setTimerMinutes(
                            Math.floor((Date.now() - timerStart) / 60000),
                          );
                          setTimerStart(null);
                        }}
                        style={{ marginTop: spacing.md }}
                      />
                    )}
                  </View>
                )}

                {activity.proofType === "COUNTER" && (
                  <View style={styles.counterBox}>
                    <Text style={styles.timerValue}>{count}</Text>
                    {cfg.counterTarget ? (
                      <Text style={styles.body}>
                        Target: {cfg.counterTarget}
                      </Text>
                    ) : null}
                    <View style={styles.photoButtons}>
                      <Button
                        label="−"
                        variant="secondary"
                        onPress={() => setCount((c) => Math.max(0, c - 1))}
                        style={{ flex: 1 }}
                      />
                      <Button
                        label="+"
                        variant="secondary"
                        onPress={() => setCount((c) => c + 1)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}

                {activity.proofType === "HONOR_TOGGLE" && (
                  <Text style={styles.body}>
                    When you've truly done this, mark it complete below.
                  </Text>
                )}

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                  label="Mark complete"
                  onPress={submit}
                  loading={submitting}
                  disabled={
                    activity.proofType === "TIMER" && !timerReachedTarget
                  }
                  style={{ marginTop: spacing.lg }}
                />
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

function AlreadyDone({
  proof,
  activity,
}: {
  proof: StoredProof;
  activity: Activity;
}) {
  return (
    <View style={styles.doneBox}>
      <Text style={styles.doneBadge}>✓ Completed today</Text>
      <Text style={styles.body}>
        You already logged this today. Here's what you saved — you don't need to
        do it again.
      </Text>
      <View style={{ height: spacing.md }} />

      {proof.textValues?.length
        ? proof.textValues.map((t, i) => (
            <Text key={i} style={styles.savedText}>
              • {t}
            </Text>
          ))
        : null}
      {proof.minutes != null ? (
        <Text style={styles.savedText}>Logged {proof.minutes} minutes.</Text>
      ) : null}
      {proof.count != null ? (
        <Text style={styles.savedText}>Logged {proof.count}.</Text>
      ) : null}
      {proof.imageUri ? (
        <Image source={{ uri: proof.imageUri }} style={styles.preview} />
      ) : null}
    </View>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.inkMuted}
        style={styles.input}
      />
    </View>
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
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  back: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.brass,
    marginBottom: spacing.lg,
  },
  categoryTag: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  categoryTagText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.onDark,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
  form: { gap: spacing.md },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.inkMuted,
  },
  input: {
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: "#FFFFFF",
  },
  multiline: { minHeight: 140, textAlignVertical: "top" },
  preview: {
    width: "100%",
    height: 240,
    borderRadius: radius.md,
    marginTop: spacing.md,
    backgroundColor: colors.line,
  },
  photoPlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  photoHint: { fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted },
  photoButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  timerBox: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.lg,
    ...shadow.soft,
  },
  counterBox: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.lg,
    ...shadow.soft,
  },
  timerValue: { fontFamily: fonts.display, fontSize: 56, color: colors.brass },
  timerUnit: { fontFamily: fonts.body, fontSize: 20, color: colors.inkMuted },
  timerDone: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.brass,
    marginTop: spacing.md,
  },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.danger },
  doneBox: {
    backgroundColor: colors.successBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  doneBadge: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  savedText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.ink,
  },
});
