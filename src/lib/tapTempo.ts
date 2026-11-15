import { clampTempo } from "./music";

export const TAP_WINDOW_MS = 5000;

export interface TapResult {
  taps: number[];
  tempo: number | null;
}

export function recordTap(taps: readonly number[], now: number): TapResult {
  const previous = taps.filter((t) => now - t <= TAP_WINDOW_MS);
  const recent = [...previous, now];
  if (previous.length === 0) return { taps: recent, tempo: null };
  const averageInterval = (now - Math.min(...previous)) / previous.length;
  return { taps: recent, tempo: clampTempo(Math.floor(60_000 / averageInterval)) };
}
