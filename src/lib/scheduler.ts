import {
  advancePosition,
  normalizePosition,
  tickInterval,
  tickType,
  type Position,
  type TickType,
} from "./music";

export interface TickConfig {
  tempo: number;
  beats: number;
  subdivisions: number;
  silentBeats: readonly number[];
  emphasizeFirstBeat: boolean;
}

export interface SchedulerState {
  next: Position;
  lastTime: number | null;
}

export interface PlanWindow {
  now: number;
  start: number;
  horizon: number;
}

export interface PlannedTick {
  time: number;
  duration: number;
  beat: number;
  type: TickType;
  silent: boolean;
}

export const INITIAL_STATE: SchedulerState = { next: { beat: 0, sub: 0 }, lastTime: null };

/** Plans ticks before `horizon`. The first tick plays at `start`; later ticks stay on the grid of
 * the last tick, and grid ticks before `now` are skipped without being returned. */
export function planTicks(
  state: SchedulerState,
  config: TickConfig,
  { now, start, horizon }: PlanWindow,
): { ticks: PlannedTick[]; state: SchedulerState } {
  const { beats, subdivisions } = config;
  const duration = tickInterval(config.tempo, subdivisions);
  const ticks: PlannedTick[] = [];
  let position = normalizePosition(state.next, beats, subdivisions);
  let lastTime = state.lastTime;

  if (lastTime !== null) {
    const missed = Math.max(0, Math.ceil((now - lastTime) / duration) - 1);
    lastTime += missed * duration;
    position = advancePosition(position, missed, beats, subdivisions);
  }

  for (;;) {
    const time = lastTime === null ? start : lastTime + duration;
    if (time >= horizon) break;
    ticks.push({
      time,
      duration,
      beat: position.beat,
      type: tickType(position, config.emphasizeFirstBeat),
      silent: config.silentBeats.includes(position.beat),
    });
    lastTime = time;
    position = advancePosition(position, 1, beats, subdivisions);
  }

  return { ticks, state: { next: position, lastTime } };
}

export function latestDue<T extends { time: number }>(items: readonly T[], now: number): T | null {
  let latest: T | null = null;
  for (const item of items) {
    if (item.time > now) break;
    latest = item;
  }
  return latest;
}
