import {
  nextPosition,
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

export interface PlannedTick {
  time: number;
  duration: number;
  beat: number;
  type: TickType;
  silent: boolean;
}

export const INITIAL_STATE: SchedulerState = { next: { beat: 0, sub: 0 }, lastTime: null };

export function planTicks(
  state: SchedulerState,
  config: TickConfig,
  earliest: number,
  horizon: number,
): { ticks: PlannedTick[]; state: SchedulerState } {
  const { beats, subdivisions } = config;
  const duration = tickInterval(config.tempo, subdivisions);
  const ticks: PlannedTick[] = [];
  let position = normalizePosition(state.next, beats, subdivisions);
  let lastTime = state.lastTime;

  for (;;) {
    const time = lastTime === null ? earliest : Math.max(lastTime + duration, earliest);
    if (time >= horizon) break;
    ticks.push({
      time,
      duration,
      beat: position.beat,
      type: tickType(position, config.emphasizeFirstBeat),
      silent: config.silentBeats.includes(position.beat),
    });
    lastTime = time;
    position = nextPosition(position, beats, subdivisions);
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
