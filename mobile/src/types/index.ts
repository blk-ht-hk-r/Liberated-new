// Shared types mirroring the backend contract.

export type Category =
  | "PHYSICAL"
  | "SPIRITUAL"
  | "CAREER"
  | "RELATIONAL"
  | "CONTENT"
  | "PROCESSING";

export type ProofType =
  | "PHOTO"
  | "NAMED_LIST"
  | "TEXT_ENTRY"
  | "TIMER"
  | "COUNTER"
  | "HONOR_TOGGLE";

export interface Activity {
  id: number;
  title: string;
  description: string;
  category: Category;
  proofType: ProofType;
  trackingConfig: string; // JSON string, e.g. {"listSize":3}
}

export interface DayView {
  dayIndex: number;
  dueDate: string;
  completed: boolean;
  completedAt: string | null;
}

export type ChallengeStatus = "NOT_STARTED" | "ACTIVE" | "COMPLETED";

export interface ChallengeState {
  challengeId: number | null;
  status: ChallengeStatus;
  startedAt: string | null;
  totalDays: number;
  baseDays: number;
  extraDays: number;
  completedDays: number;
  currentDayIndex: number;
  daysElapsed: number;
  todayActivity: Activity | null;
  todayCompleted: boolean;
  days: DayView[];
  selectedActivities: Activity[];
  showFailurePopup: boolean;
  missedCountJustEvaluated: number;
  showCompletionPopup: boolean;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string | null;
  displayName: string | null;
  authProvider: string;
}
