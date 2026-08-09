import { create } from "zustand";
import { api } from "@/api/client";
import {
  isOffline,
  MOCK_ACTIVITIES,
  mockCompleteToday,
  mockNotStartedState,
  mockStartState,
} from "@/api/mock";
import { Activity, ChallengeState } from "@/types";

interface ChallengeStore {
  state: ChallengeState | null;
  activities: Activity[];
  loading: boolean;
  error: string | null;

  fetchState: () => Promise<void>;
  fetchActivities: () => Promise<void>;
  startChallenge: (activityIds: number[]) => Promise<void>;
  completeToday: () => Promise<void>;
  acknowledgePopups: () => Promise<void>;
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
}));
