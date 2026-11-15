import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  parseSettings,
  saveSettings,
  STORAGE_KEY,
  type Settings,
  type SettingsStorage,
} from "./settings";

function memoryStorage(initial: Record<string, string> = {}): SettingsStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const failingStorage: SettingsStorage = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("quota");
  },
};

const custom: Settings = {
  tempo: 140,
  beats: 7,
  subdivisions: 3,
  silentBeats: [2, 5],
  emphasizeFirstBeat: false,
  sound: "pluck",
  theme: "dark",
  volume: 40,
  muted: true,
};

describe("parseSettings", () => {
  it("returns defaults for missing or malformed input", () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings("nope")).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings([])).toEqual(DEFAULT_SETTINGS);
  });

  it("keeps valid values", () => {
    expect(parseSettings(custom)).toEqual(custom);
  });

  it("replaces each invalid value with its default", () => {
    expect(
      parseSettings({
        ...custom,
        tempo: 300,
        beats: 0,
        subdivisions: 2.5,
        emphasizeFirstBeat: "yes",
        sound: "cowbell",
        theme: "blue",
        volume: 101,
        muted: 1,
      }),
    ).toEqual({
      ...DEFAULT_SETTINGS,
      silentBeats: custom.silentBeats,
    });
  });

  it("drops invalid and duplicate silent beats and sorts them", () => {
    expect(parseSettings({ silentBeats: [5, "1", 8, -1, 0, 5, 1.5] }).silentBeats).toEqual([0, 5]);
    expect(parseSettings({ silentBeats: "1,2" }).silentBeats).toEqual([]);
  });

  it("fills in fields missing from older stored settings", () => {
    const older: Partial<Settings> = { ...custom };
    delete older.volume;
    delete older.muted;
    expect(parseSettings(older)).toEqual({ ...custom, volume: 75, muted: false });
  });

  it("rejects fractional and negative volumes", () => {
    expect(parseSettings({ volume: 33.5 }).volume).toBe(DEFAULT_SETTINGS.volume);
    expect(parseSettings({ volume: -1 }).volume).toBe(DEFAULT_SETTINGS.volume);
    expect(parseSettings({ volume: 0 }).volume).toBe(0);
  });
});

describe("loadSettings and saveSettings", () => {
  it("round-trips through storage", () => {
    const storage = memoryStorage();
    expect(saveSettings(storage, custom)).toBe(true);
    expect(loadSettings(storage)).toEqual(custom);
  });

  it("falls back to defaults for unreadable stored data", () => {
    expect(loadSettings(memoryStorage({ [STORAGE_KEY]: "{not json" }))).toEqual(DEFAULT_SETTINGS);
  });

  it("works without storage", () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(null, custom)).toBe(false);
    expect(loadSettings(failingStorage)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(failingStorage, custom)).toBe(false);
  });
});
