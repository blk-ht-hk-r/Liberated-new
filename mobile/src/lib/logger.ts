/**
 * Tiny dev-only logger. Every method is a no-op unless __DEV__ is true, so the
 * published Expo Go build stays completely silent (no console noise, no cost).
 * Tag each call with a short module name so Metro logs are easy to scan:
 *
 *   logger.debug("api", "GET /api/challenge");
 *   logger.error("auth", "login failed", err);
 */
type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, tag: string, args: unknown[]): void {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console[level](`[${tag}]`, ...args);
}

export const logger = {
  debug: (tag: string, ...args: unknown[]) => emit("debug", tag, args),
  info: (tag: string, ...args: unknown[]) => emit("info", tag, args),
  warn: (tag: string, ...args: unknown[]) => emit("warn", tag, args),
  error: (tag: string, ...args: unknown[]) => emit("error", tag, args),
};
