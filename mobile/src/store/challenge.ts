import { create } from "zustand";
import { api } from "@/api/client";
import {
  isOffline,
  MOCK_ACTIVITIES,
  mockCompleteToday,
  mockAdvanceDay,
  mockNotStartedState,
  mockStartState,
} from "@/api/mock";
import { Activity, ChallengeState } from "@/types";

interface ChallengeStore {
  state: ChallengeState | null;
  activities: Activity[];
  loading: boolean;
  error: string | null;
  testDate: string | null;

  fetchState: () => Promise<void>;
  fetchActivities: () => Promise<void>;
  startChallenge: (activityIds: number[]) => Promise<void>;
  completeToday: () => Promise<void>;
  acknowledgePopups: () => Promise<void>;
  advanceDay: () => Promise<void>;
  completeChallengeDev: () => Promise<void>;
  resetTestClock: () => Promise<void>;
  changeTodayActivity: (activityId: number) => Promise<void>;
  reset: () => void;
}

function currentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export const useChallenge = create<ChallengeStore>((set, get) => ({
  state: null,
  activities: [],
  loading: false,
  error: null,
  testDate: null,

  fetchState: async () => {
    if (isOffline()) {
      set((s) => ({
        state: s.state ?? mockNotStartedState(),
        loading: false,
        error: null,
      }));
      return;
    }
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<ChallengeState>("/api/challenge");
      set({ state: data, loading: false });

      try {
        const { data: devData } = await api.get<{ testDate?: string }>(
          "/api/dev/date",
        );
        set({
          testDate:
            devData?.testDate && devData.testDate !== "null"
              ? devData.testDate
              : null,
        });
      } catch {
        set({ testDate: null });
      }
    } catch (e) {
      set({ state: null, loading: false, error: "Could not load challenge" });
    }
  },

  fetchActivities: async () => {
    if (isOffline()) {
      set({ activities: MOCK_ACTIVITIES });
      return;
    }
    const { data } = await api.get<Activity[]>("/api/activities");
    set({ activities: data });
  },

  reset: () => {
    set({
      state: null,
      activities: [],
      loading: false,
      error: null,
      testDate: null,
    });
  },

  startChallenge: async (activityIds) => {
    if (isOffline()) {
      set({ state: mockStartState(activityIds) });
      return;
    }
    const { data } = await api.post<ChallengeState>("/api/challenge/start", {
      activityIds,
      timezone: currentTimezone(),
    });
    set({ state: data });
  },

  completeToday: async () => {
    if (isOffline()) {
      set((s) => ({
        state: s.state ? mockCompleteToday(s.state) : s.state,
      }));
      return;
    }
    const { data } = await api.post<ChallengeState>(
      "/api/challenge/complete-today",
    );
    set({ state: data });
  },

  acknowledgePopups: async () => {
    if (isOffline()) {
      set((s) => ({
        state: s.state
          ? { ...s.state, showFailurePopup: false, showCompletionPopup: false }
          : s.state,
      }));
      return;
    }
    const { data } = await api.post<ChallengeState>(
      "/api/challenge/acknowledge-popups",
    );
    set({ state: data });
  },

  advanceDay: async () => {
    if (isOffline()) {
      set((s) => ({ state: s.state ? mockAdvanceDay(s.state) : s.state }));
      return;
    }

    let nextDate = get().testDate;
    if (!nextDate) {
      try {
        const { data } = await api.get<{ testDate?: string }>("/api/dev/date");
        if (data?.testDate && data.testDate !== "null") {
          nextDate = data.testDate;
        }
      } catch {
        // Ignore and fall back to the current started date below.
      }
    }

    const startedAt = get().state?.startedAt ?? null;
    const base = nextDate
      ? new Date(`${nextDate}T00:00:00Z`)
      : startedAt
        ? new Date(startedAt)
        : new Date();

    base.setUTCDate(base.getUTCDate() + 1);
    const iso = base.toISOString().slice(0, 10);

    await api.post(`/api/dev/set-date?date=${iso}`);
    set({ testDate: iso });
    await get().fetchState();
  },
  completeChallengeDev: async () => {
    if (isOffline()) {
      set((s) => ({ state: s.state ? mockCompleteToday(s.state) : s.state }));
      return;
    }

    await get().completeToday();
    await get().fetchState();
  },
  resetTestClock: async () => {
    if (isOffline()) {
      return;
    }

    try {
      await api.post("/api/dev/clear-date");
      set({ testDate: null });
      await get().fetchState();
    } catch {
      set({ error: "Could not reset test clock" });
    }
  },

  changeTodayActivity: async (activityId) => {
    if (isOffline()) {
      set((s) => {
        if (!s.state) return {} as any;
        const prev = s.state;
        if (prev.todayCompleted) return {} as any;
        const idx = prev.currentDayIndex;
        const replacement =
          MOCK_ACTIVITIES.find((x) => x.id === activityId) ?? null;
        const newSelected = prev.selectedActivities.map((a, i) =>
          i === idx ? replacement : a,
        );
        return {
          state: {
            ...prev,
            selectedActivities: newSelected,
            todayActivity: newSelected[idx] ?? prev.todayActivity,
          },
        } as any;
      });
      return;
    }

    const { data } = await api.post<ChallengeState>(
      "/api/challenge/change-activity",
      {
        activityId,
      },
    );
    set({ state: data });
  },
}));
