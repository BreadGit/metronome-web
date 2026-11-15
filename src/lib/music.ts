export const TEMPO = { min: 30, max: 252, default: 80 } as const;
export const BEATS = { min: 1, max: 8, default: 4 } as const;
export const SUBDIVISIONS = { min: 1, max: 4, default: 1 } as const;

export type TickType = "strong" | "weak" | "sub";

export interface Position {
  beat: number;
  sub: number;
}

const MARKINGS: readonly (readonly [minTempo: number, name: string])[] = [
  [200, "Prestissimo"],
  [168, "Presto"],
  [120, "Allegro"],
  [108, "Moderato"],
  [76, "Andante"],
  [66, "Adagio"],
  [60, "Larghetto"],
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampTempo(tempo: number): number {
  return clamp(Math.round(tempo), TEMPO.min, TEMPO.max);
}

export function tempoMarking(tempo: number): string {
  return MARKINGS.find(([minTempo]) => tempo >= minTempo)?.[1] ?? "Largo";
}

export function tickInterval(tempo: number, subdivisions: number): number {
  return 60 / tempo / subdivisions;
}

export function tickType(position: Position, emphasizeFirstBeat: boolean): TickType {
  if (position.sub !== 0) return "sub";
  return emphasizeFirstBeat && position.beat === 0 ? "strong" : "weak";
}

export function normalizePosition(
  position: Position,
  beats: number,
  subdivisions: number,
): Position {
  let { beat, sub } = position;
  if (sub >= subdivisions) {
    sub = 0;
    beat += 1;
  }
  if (beat >= beats) beat = 0;
  return { beat, sub };
}

export function nextPosition(position: Position, beats: number, subdivisions: number): Position {
  return normalizePosition({ beat: position.beat, sub: position.sub + 1 }, beats, subdivisions);
}

export function toggleBeat(silentBeats: readonly number[], beat: number): number[] {
  return silentBeats.includes(beat)
    ? silentBeats.filter((b) => b !== beat)
    : [...silentBeats, beat].sort((a, b) => a - b);
}
