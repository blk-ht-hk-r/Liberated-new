import { create } from "zustand";
import { api, setToken, loadToken } from "@/api/client";
import { OFFLINE_TOKEN, setOffline } from "@/api/mock";
import { AuthResponse } from "@/types";

interface AuthState {
  userId: number | null;
  email: string | null;
  displayName: string | null;
  token: string | null;
  initializing: boolean;
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
  logout: () => Promise<void>;
}

function applyAuth(set: any, data: AuthResponse) {
  set({
    userId: data.userId,
    email: data.email,
    displayName: data.displayName,
    token: data.token,
    quoteShown: false,
  });
}

export const useAuth = create<AuthState>((set) => ({
  userId: null,
  email: null,
  displayName: null,
  token: null,
  initializing: true,
  quoteShown: false,

  bootstrap: async () => {
    const token = await loadToken();
    if (token === OFFLINE_TOKEN) {
      setOffline(true);
      set({
        token,
        userId: 0,
        displayName: "Guest",
        initializing: false,
      });
      return;
    }
    set({ token, initializing: false });
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
      quoteShown: false,
    });
  },

  logout: async () => {
    setOffline(false);
    await setToken(null);
    set({
      userId: null,
      email: null,
      displayName: null,
      token: null,
      quoteShown: false,
    });
  },
}));
