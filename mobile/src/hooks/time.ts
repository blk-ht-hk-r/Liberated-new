import { useEffect, useState } from "react";

/** Ticks every second so callers re-render live timers. Returns current time ms. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Formats an elapsed duration as "Dd HH:MM:SS" (days shown only when > 0). */
export function formatElapsed(fromIso: string | null, nowMs: number): string {
  if (!fromIso) return "00:00:00";
  const start = new Date(fromIso).getTime();
  let secs = Math.max(0, Math.floor((nowMs - start) / 1000));
  const days = Math.floor(secs / 86400);
  secs -= days * 86400;
  const h = Math.floor(secs / 3600);
  secs -= h * 3600;
  const m = Math.floor(secs / 60);
  const s = secs - m * 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = `${pad(h)}:${pad(m)}:${pad(s)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

/** Whole days remaining until the projected end of the challenge. */
export function daysRemaining(
  startIso: string | null,
  totalDays: number,
  nowMs: number,
): number {
  if (!startIso) return totalDays;
  const start = new Date(startIso).getTime();
  const elapsedDays = Math.floor((nowMs - start) / 86400000);
  return Math.max(0, totalDays - elapsedDays);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Formats elapsed time as "DD:HH:MM:SS", always including padded days. */
export function formatElapsedFull(
  fromIso: string | null,
  nowMs: number,
): string {
  if (!fromIso) return "00:00:00:00";
  const start = new Date(fromIso).getTime();
  let secs = Math.max(0, Math.floor((nowMs - start) / 1000));
  const days = Math.floor(secs / 86400);
  secs -= days * 86400;
  const h = Math.floor(secs / 3600);
  secs -= h * 3600;
  const m = Math.floor(secs / 60);
  const s = secs - m * 60;
  return `${pad(days)}:${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Time remaining until the next local midnight, as "HH:MM:SS". */
export function formatUntilMidnight(nowMs: number): string {
  const midnight = new Date(nowMs);
  midnight.setHours(24, 0, 0, 0);
  let secs = Math.max(0, Math.floor((midnight.getTime() - nowMs) / 1000));
  const h = Math.floor(secs / 3600);
  secs -= h * 3600;
  const m = Math.floor(secs / 60);
  const s = secs - m * 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
