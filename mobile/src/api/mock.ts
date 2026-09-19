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
    "50 squats",
    "Do 50 squats through the day.",
    "PHYSICAL",
    "COUNTER",
    '{"counterTarget":50,"counterLabel":"Squats completed now"}',
  ),
  a(
    "30 push-ups",
    "Complete 30 push-ups through the day.",
    "PHYSICAL",
    "COUNTER",
    '{"counterTarget":30,"counterLabel":"Push-ups completed now"}',
  ),
  a("Cold shower", "Take a cold shower.", "PHYSICAL", "PHOTO"),
  a(
    "Walk 30 minutes",
    "Get outside for a 30 minute walk.",
    "PHYSICAL",
    "PHOTO",
  ),
  a(
    "Run for 30 minutes",
    "Run for 30 minutes and add a photo or running-app screenshot.",
    "PHYSICAL",
    "PHOTO",
  ),
  a(
    "Declutter one small space",
    "Organize a drawer, shelf, desk, or another small space.",
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
    "Visit a place of worship",
    "Spend meaningful time at a place of worship.",
    "SPIRITUAL",
    "PHOTO",
  ),
  a(
    "Listen to a full album",
    "Listen to an album from beginning to end without scrolling.",
    "SPIRITUAL",
    "PHOTO",
  ),
  a(
    "Deep work block",
    "One focused, distraction-free work block.",
    "CAREER",
    "TEXT_ENTRY",
  ),
  a(
    "Organize your finances",
    "Review and organize your budget, bills, savings, or spending.",
    "CAREER",
    "HONOR_TOGGLE",
  ),
  a(
    "Learn about investing",
    "Study one investing concept and record what you learned.",
    "CAREER",
    "TEXT_ENTRY",
  ),
  a(
    "Set your yearly goals",
    "Write down your goals and the next steps for reaching them.",
    "CAREER",
    "PHOTO",
  ),
  a(
    "Improve your resume or portfolio",
    "Make one meaningful improvement to your resume or portfolio.",
    "CAREER",
    "PHOTO",
  ),
  a(
    "Learn something for 30 minutes",
    "Spend 30 focused minutes learning a useful skill or topic.",
    "CAREER",
    "TIMER",
    '{"timerTargetMin":30}',
  ),
  a(
    "Reconnect with one old friend",
    "Reach out to one person you miss.",
    "RELATIONAL",
    "NAMED_LIST",
    '{"listSize":1}',
  ),
  a(
    "Make plans with someone",
    "Arrange a walk, meal, call, or meetup with someone.",
    "RELATIONAL",
    "NAMED_LIST",
    '{"listSize":1}',
  ),
  a(
    "Make a dish you've wanted to try",
    "Cook a dish you have been meaning to make.",
    "CREATIVITY",
    "PHOTO",
  ),
  a(
    "Make a sketch",
    "Draw something you can see or imagine.",
    "CREATIVITY",
    "PHOTO",
  ),
  a(
    "Spend 30 minutes on a hobby",
    "Give an offline hobby your full attention for 30 minutes.",
    "CREATIVITY",
    "TIMER",
    '{"timerTargetMin":30}',
  ),
  a(
    "Sit with a feeling",
    "Notice a feeling and reflect on it.",
    "PROCESSING",
    "TEXT_ENTRY",
  ),
  a(
    "Journal about your day",
    "Write about your day in a private journal.",
    "PROCESSING",
    "PHOTO",
  ),
  a(
    "Reflect on your day or week",
    "Review your activities and notice what made you happier or unhappier.",
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
    daysElapsed: 0,
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
    daysElapsed: 0,
    todayActivity: selected[0] ?? null,
    todayCompleted: false,
    days,
    selectedActivities: selected,
    showFailurePopup: false,
    missedCountJustEvaluated: 0,
    showCompletionPopup: false,
  };
}

/** Mark today's task complete. Does NOT finish the challenge — completion is
 *  evaluated at the end of the day (see mockAdvanceDay), matching the backend
 *  model where the challenge completes once baseDays tasks are done. */
export function mockCompleteToday(prev: ChallengeState): ChallengeState {
  if (prev.status !== "ACTIVE" || prev.todayCompleted) return prev;
  // Never record more completed tasks than the challenge requires.
  if (prev.completedDays >= prev.baseDays) return prev;

  const completedDays = prev.completedDays + 1;
  const days = prev.days.map((d) =>
    d.dayIndex === prev.currentDayIndex
      ? { ...d, completed: true, completedAt: new Date().toISOString() }
      : d,
  );

  // daysElapsed is day-based (calendar days elapsed) and must NOT change when a
  // task is completed - it advances only on day rollover (mockAdvanceDay),
  // matching the backend. On the final day the bar is already full before
  // completing, so no bump is needed here.
  return {
    ...prev,
    days,
    completedDays,
    todayCompleted: true,
  };
}

/**
 * Dev helper: end the current day and roll into the next one.
 * - If not ACTIVE, returns unchanged.
 * - End-of-day completion: if all baseDays tasks are done, the challenge
 *   finishes now (not the instant the last task was logged).
 * - If today's task was not completed, adds a penalty day (totalDays++,
 *   extraDays++) and queues the failure popup.
 * - Otherwise advances currentDayIndex, rotates the task, and moves the clock
 *   back one day so elapsed time keeps climbing.
 */
export function mockAdvanceDay(prev: ChallengeState): ChallengeState {
  if (prev.status !== "ACTIVE") return prev;

  // The day is over. If every required task is done, complete the challenge.
  if (prev.completedDays >= prev.baseDays) {
    return {
      ...prev,
      status: "COMPLETED",
      daysElapsed: prev.totalDays,
      showCompletionPopup: true,
    };
  }

  const missed = prev.todayCompleted ? 0 : 1;
  let totalDays = prev.totalDays;
  let extraDays = prev.extraDays;
  if (missed > 0) {
    totalDays = prev.totalDays + 1;
    extraDays = prev.extraDays + 1;
  }

  const nextIndex = prev.currentDayIndex + 1;

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
    daysElapsed: Math.min(nextIndex, totalDays),
    todayActivity: nextActivity,
    todayCompleted: false,
    showFailurePopup: missed > 0,
    missedCountJustEvaluated: missed,
  };
}
