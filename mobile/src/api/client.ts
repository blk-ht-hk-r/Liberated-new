import axios, { AxiosError } from "axios";
import * as SecureStore from "@/storage/secureStore";
import { config } from "@/config";
import { logger } from "@/lib/logger";

const TOKEN_KEY = "liberated.jwt";

export const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15000,
});

let inMemoryToken: string | null = null;
let unauthorizedHandler: (() => void | Promise<void>) | null = null;
let handlingUnauthorized = false;

export function registerUnauthorizedHandler(
  handler: () => void | Promise<void>,
): void {
  unauthorizedHandler = handler;
}

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
  // Stamp a start time for latency measurement (never logs the token itself).
  (cfg as any).metadata = { start: Date.now() };
  logger.debug("api", `→ ${cfg.method?.toUpperCase()} ${cfg.url}`);
  return cfg;
});

// Log responses and errors (dev only) so a failed action shows a real reason.
api.interceptors.response.use(
  (res) => {
    const start = (res.config as any).metadata?.start;
    const ms = start ? Date.now() - start : 0;
    logger.debug(
      "api",
      `← ${res.status} ${res.config.method?.toUpperCase()} ${res.config.url} (${ms}ms)`,
    );
    return res;
  },
  (error: AxiosError) => {
    const cfg = (error.config ?? {}) as any;
    const ms = cfg.metadata?.start ? Date.now() - cfg.metadata.start : 0;
    const status = error.response?.status ?? "NETWORK";
    logger.error(
      "api",
      `× ${status} ${cfg.method?.toUpperCase?.() ?? ""} ${cfg.url ?? ""} (${ms}ms)`,
      error.response?.data ?? error.message,
    );

    const url = cfg.url ?? "";
    const isProtectedAuthRequest =
      url === "/api/auth/me" || url === "/api/auth/push-token";
    const isPublicAuthRequest =
      url.startsWith("/api/auth/") && !isProtectedAuthRequest;
    if (
      status === 401 &&
      inMemoryToken &&
      !isPublicAuthRequest &&
      unauthorizedHandler &&
      !handlingUnauthorized
    ) {
      handlingUnauthorized = true;
      Promise.resolve(unauthorizedHandler())
        .catch((handlerError) => {
          logger.error("auth", "failed to clear unauthorized session", handlerError);
        })
        .finally(() => {
          handlingUnauthorized = false;
        });
    }
    return Promise.reject(error);
  },
);

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
