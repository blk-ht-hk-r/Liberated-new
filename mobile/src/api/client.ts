import axios from "axios";
import * as SecureStore from "@/storage/secureStore";
import { config } from "@/config";

const TOKEN_KEY = "liberated.jwt";

export const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15000,
});

let inMemoryToken: string | null = null;

export async function loadToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  const stored = await SecureStore.getItemAsync(TOKEN_KEY);
  inMemoryToken = stored;
  return stored;
}

export async function setToken(token: string | null): Promise<void> {
  inMemoryToken = token;
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

// Attach the bearer token to every request when present.
api.interceptors.request.use(async (cfg) => {
  const token = await loadToken();
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

export function apiErrorMessage(
  e: unknown,
  fallback = "Something went wrong",
): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as any;
    return data?.message || data?.error || e.message || fallback;
  }
  return fallback;
}
