import { BEATS, SUBDIVISIONS, TEMPO } from "./music";
import { SOUNDS, type SoundId } from "./sounds";
import { VOLUME } from "./volume";

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export interface Settings {
  tempo: number;
  beats: number;
  subdivisions: number;
  silentBeats: number[];
  emphasizeFirstBeat: boolean;
  sound: SoundId;
  theme: Theme;
  volume: number;
  muted: boolean;
}

export type SettingsStorage = Pick<Storage, "getItem" | "setItem">;

const SOUND_IDS: readonly SoundId[] = SOUNDS.map((s) => s.id);

export const STORAGE_KEY = "metronome-web:settings";

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  tempo: TEMPO.default,
  beats: BEATS.default,
  subdivisions: SUBDIVISIONS.default,
  silentBeats: [],
  emphasizeFirstBeat: true,
  sound: "sine_wave",
  theme: "system",
  volume: VOLUME.default,
  muted: false,
};

function intInRange(value: unknown, range: { min: number; max: number }): value is number {
  return (
    Number.isInteger(value) && (value as number) >= range.min && (value as number) <= range.max
  );
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return options.includes(value as T);
}

function parseSilentBeats(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const beats = value.filter((beat) => intInRange(beat, { min: 0, max: BEATS.max - 1 }));
  return [...new Set(beats)].sort((a, b) => a - b);
}

export function parseSettings(raw: unknown): Settings {
  const input: Record<string, unknown> = typeof raw === "object" && raw !== null ? { ...raw } : {};
  const d = DEFAULT_SETTINGS;
  return {
    tempo: intInRange(input.tempo, TEMPO) ? input.tempo : d.tempo,
    beats: intInRange(input.beats, BEATS) ? input.beats : d.beats,
    subdivisions: intInRange(input.subdivisions, SUBDIVISIONS)
      ? input.subdivisions
      : d.subdivisions,
    silentBeats: parseSilentBeats(input.silentBeats) ?? [...d.silentBeats],
    emphasizeFirstBeat:
      typeof input.emphasizeFirstBeat === "boolean"
        ? input.emphasizeFirstBeat
        : d.emphasizeFirstBeat,
    sound: oneOf(input.sound, SOUND_IDS) ? input.sound : d.sound,
    theme: oneOf(input.theme, THEMES) ? input.theme : d.theme,
    volume: intInRange(input.volume, VOLUME) ? input.volume : d.volume,
    muted: typeof input.muted === "boolean" ? input.muted : d.muted,
  };
}

export function browserStorage(): SettingsStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSettings(storage: SettingsStorage | null): Settings {
  try {
    const stored = storage?.getItem(STORAGE_KEY);
    return parseSettings(stored ? JSON.parse(stored) : null);
  } catch {
    return parseSettings(null);
  }
}

export function saveSettings(storage: SettingsStorage | null, settings: Settings): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
