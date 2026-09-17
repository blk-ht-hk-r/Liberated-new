import { create } from "zustand";
import axios from "axios";
import {
  api,
  setToken,
  loadToken,
  registerUnauthorizedHandler,
} from "@/api/client";
import { OFFLINE_TOKEN, setOffline } from "@/api/mock";
import { useChallenge } from "@/store/challenge";
import { AuthResponse, CurrentUserResponse } from "@/types";

export type AuthStatus =
  | "initializing"
  | "authenticated"
  | "unauthenticated"
  | "connectionError";

interface AuthState {
  userId: number | null;
  email: string | null;
  displayName: string | null;
  token: string | null;
  status: AuthStatus;
  /** Whether the post-login quote popup has been shown this session. */
  quoteShown: boolean;

  bootstrap: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  /** Dev-only: start a local offline demo session with no backend. */
  enableOfflineMode: () => Promise<void>;
  markQuoteShown: () => void;
  clearSession: () => Promise<void>;
  logout: () => Promise<void>;
}

function applyAuth(set: any, data: AuthResponse) {
  setOffline(false);
  set({
    userId: data.userId,
    email: data.email,
    displayName: data.displayName,
    token: data.token,
    status: "authenticated",
    quoteShown: false,
  });
}

export const useAuth = create<AuthState>((set, get) => ({
  userId: null,
  email: null,
  displayName: null,
  token: null,
  status: "initializing",
  quoteShown: false,

  bootstrap: async () => {
    set({ status: "initializing" });
    try {
      const token = await loadToken();
      if (!token) {
        setOffline(false);
        set({
          token: null,
          userId: null,
          email: null,
          displayName: null,
          status: "unauthenticated",
        });
        return;
      }

      if (token === OFFLINE_TOKEN) {
        setOffline(true);
        set({
          token,
          userId: 0,
          email: null,
          displayName: "Guest",
          status: "authenticated",
        });
        return;
      }

      setOffline(false);
      set({ token });
      const { data } = await api.get<CurrentUserResponse>("/api/auth/me");
      set({
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
        status: "authenticated",
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await get().clearSession();
        return;
      }
      set({
        userId: null,
        email: null,
        displayName: null,
        status: "connectionError",
      });
    }
  },

  loginWithEmail: async (email, password) => {
    const { data } = await api.post<AuthResponse>("/api/auth/login", {
      email,
      password,
    });
    await setToken(data.token);
    applyAuth(set, data);
  },

  register: async (email, password, displayName) => {
    const { data } = await api.post<AuthResponse>("/api/auth/register", {
      email,
      password,
      displayName,
    });
    await setToken(data.token);
    applyAuth(set, data);
  },

  requestOtp: async (phone) => {
    await api.post("/api/auth/otp/request", { phone });
  },

  verifyOtp: async (phone, code) => {
    const { data } = await api.post<AuthResponse>("/api/auth/otp/verify", {
      phone,
      code,
    });
    await setToken(data.token);
    applyAuth(set, data);
  },

  loginWithGoogle: async (idToken) => {
    const { data } = await api.post<AuthResponse>("/api/auth/google", {
      idToken,
    });
    await setToken(data.token);
    applyAuth(set, data);
  },

  markQuoteShown: () => set({ quoteShown: true }),

  enableOfflineMode: async () => {
    setOffline(true);
    await setToken(OFFLINE_TOKEN);
    set({
      userId: 0,
      email: null,
      displayName: "Guest",
      token: OFFLINE_TOKEN,
      status: "authenticated",
      quoteShown: false,
    });
  },

  clearSession: async () => {
    setOffline(false);
    const clearToken = setToken(null);
    useChallenge.getState().reset();
    set({
      userId: null,
      email: null,
      displayName: null,
      token: null,
      status: "unauthenticated",
      quoteShown: false,
    });
    await clearToken;
  },

  logout: async () => get().clearSession(),
}));

registerUnauthorizedHandler(() => useAuth.getState().clearSession());
