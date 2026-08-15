import { Activity, ChallengeState, DayView } from "@/types";

/**
 * Offline demo mode. Lets the app run end-to-end with no backend by serving
 * local mock data. Enabled via the "Skip login" action or by restoring the
 * sentinel token on launch. Intended for development / demos only.
 */
let offline = false;

/** Sentinel JWT value that flags an offline demo session. */
export const OFFLINE_TOKEN = "offline-demo-token";

export function setOffline(value: boolean): void {
  offline = value;
}

export function isOffline(): boolean {
  return offline;
}

let idSeq = 1;
const a = (
  title: string,
  description: string,
  category: Activity["category"],
  proofType: Activity["proofType"],
  trackingConfig = "{}",
): Activity => ({
  id: idSeq++,
  title,
  description,
  category,
  proofType,
  trackingConfig,
});

/** Mirrors the backend seed list so the selection grid looks complete. */
export const MOCK_ACTIVITIES: Activity[] = [
  a("Go for a workout", "Hit the gym or train at home.", "PHYSICAL", "PHOTO"),
  a(
    "100 squats",
    "Do 100 squats through the day.",
    "PHYSICAL",
    "COUNTER",
    '{"counterTarget":100}',
  ),
  a("Cold shower", "Take a cold shower.", "PHYSICAL", "PHOTO"),
  a(
    "Walk 30 minutes",
    "Get outside for a 30 minute walk.",
    "PHYSICAL",
    "PHOTO",
  ),
  a(
    "Meditate 10 minutes",
    "Sit in stillness for 10 minutes.",
    "SPIRITUAL",
    "TIMER",
    '{"timerTargetMin":10}',
  ),
  a(
    "Pray",
    "Spend a few minutes in prayer.",
    "SPIRITUAL",
    "TIMER",
    '{"timerTargetMin":5}',
  ),
  a("Read a book", "Read a chapter of a real book.", "SPIRITUAL", "PHOTO"),
  a(
    "Deep work block",
    "One focused, distraction-free work block.",
    "CAREER",
    "TEXT_ENTRY",
  ),
  a(
    "Help a customer",
    "Do something that genuinely helps a customer.",
    "CAREER",
    "TEXT_ENTRY",
  ),
  a(
    "Move money forward",
    "Take one concrete step toward income.",
    "CAREER",
    "TEXT_ENTRY",
  ),
  a(
    "Talk to 3 old friends",
    "Reach out to 3 people you miss.",
    "RELATIONAL",
    "NAMED_LIST",
    '{"listSize":3}',
  ),
  a(
    "Call someone you love",
    "Call a person you care about.",
    "RELATIONAL",
    "NAMED_LIST",
    '{"listSize":1}',
  ),
  a(
    "An act of love",
    "Do something kind for someone.",
    "RELATIONAL",
    "NAMED_LIST",
    '{"listSize":1}',
  ),
  a("Write something", "Write a page, a post, or an idea.", "CONTENT", "PHOTO"),
  a("Create or produce", "Make something and capture it.", "CONTENT", "PHOTO"),
  a(
    "Sit with a feeling",
    "Notice a feeling and reflect on it.",
    "PROCESSING",
    "TEXT_ENTRY",
  ),
];

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** A fresh, not-yet-started offline challenge. */
export function mockNotStartedState(): ChallengeState {
  return {
    challengeId: null,
    status: "NOT_STARTED",
    startedAt: null,
    totalDays: 7,
    baseDays: 7,
    extraDays: 0,
    completedDays: 0,
    currentDayIndex: 0,
    todayActivity: null,
    todayCompleted: false,
    days: [],
    selectedActivities: [],
    showFailurePopup: false,
    missedCountJustEvaluated: 0,
    showCompletionPopup: false,
  };
}

/** Build an active challenge from the chosen activity ids. */
export function mockStartState(activityIds: number[]): ChallengeState {
  const selected = activityIds
    .map((id) => MOCK_ACTIVITIES.find((x) => x.id === id))
    .filter((x): x is Activity => !!x);
  const total = 7;
  const days: DayView[] = Array.from({ length: total }, (_, i) => ({
    dayIndex: i,
    dueDate: isoDaysFromNow(i),
    completed: false,
    completedAt: null,
  }));
  return {
    challengeId: 1,
    status: "ACTIVE",
    startedAt: new Date().toISOString(),
    totalDays: total,
    baseDays: total,
    extraDays: 0,
    completedDays: 0,
    currentDayIndex: 0,
    todayActivity: selected[0] ?? null,
    todayCompleted: false,
    days,
    selectedActivities: selected,
    showFailurePopup: false,
    missedCountJustEvaluated: 0,
    showCompletionPopup: false,
  };
}

/** Advance the mock challenge by marking today complete. */
export function mockCompleteToday(prev: ChallengeState): ChallengeState {
  if (prev.status !== "ACTIVE" || prev.todayCompleted) return prev;

  const completedDays = prev.completedDays + 1;
  const finished = completedDays >= prev.totalDays;
  const days = prev.days.map((d) =>
    d.dayIndex === prev.currentDayIndex
      ? { ...d, completed: true, completedAt: new Date().toISOString() }
      : d,
  );

  return {
    ...prev,
    days,
    completedDays,
    currentDayIndex: prev.currentDayIndex,
    todayCompleted: true,
    todayActivity: prev.todayActivity,
    status: finished ? "COMPLETED" : "ACTIVE",
    showCompletionPopup: finished,
  };
}

/**
 * Dev helper: advance the mock challenge by one calendar day.
 * - If not ACTIVE, returns unchanged.
 * - If today was not completed, adds a penalty day (totalDays++, extraDays++).
 * - Advances the currentDayIndex and rotates the todayActivity.
 * - Moves the clock back one day so elapsed time advances.
 */
export function mockAdvanceDay(prev: ChallengeState): ChallengeState {
  if (prev.status !== "ACTIVE") return prev;

  const missed = prev.todayCompleted ? 0 : 1;
  let totalDays = prev.totalDays;
  let extraDays = prev.extraDays;
  if (missed > 0) {
    totalDays = prev.totalDays + 1;
    extraDays = prev.extraDays + 1;
  }

  const nextIndex = prev.currentDayIndex + 1;

  if (prev.completedDays >= totalDays) {
    return {
      ...prev,
      totalDays,
      extraDays,
      status: "COMPLETED",
      showCompletionPopup: true,
    };
  }

  const sel = prev.selectedActivities;
  const nextActivity = sel.length ? sel[nextIndex % sel.length] : null;

  const startedAt = prev.startedAt
    ? new Date(new Date(prev.startedAt).getTime() - 86400000).toISOString()
    : prev.startedAt;

  return {
    ...prev,
    startedAt,
    totalDays,
    extraDays,
    currentDayIndex: nextIndex,
    todayActivity: nextActivity,
    todayCompleted: false,
    showFailurePopup: missed > 0,
    missedCountJustEvaluated: missed,
  };
}
