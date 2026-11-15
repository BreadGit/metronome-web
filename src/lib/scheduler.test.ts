import { describe, expect, it } from "vitest";
import { INITIAL_STATE, latestDue, planTicks, type TickConfig } from "./scheduler";

const config: TickConfig = {
  tempo: 120,
  beats: 4,
  subdivisions: 1,
  silentBeats: [],
  emphasizeFirstBeat: true,
};

describe("planTicks", () => {
  it("starts at the earliest time and fills the window", () => {
    const { ticks, state } = planTicks(INITIAL_STATE, config, 1, 2.1);
    expect(ticks.map((t) => [t.time, t.beat, t.type])).toEqual([
      [1, 0, "strong"],
      [1.5, 1, "weak"],
      [2, 2, "weak"],
    ]);
    expect(state).toEqual({ next: { beat: 3, sub: 0 }, lastTime: 2 });
  });

  it("continues from the previous state without gaps or repeats", () => {
    const first = planTicks(INITIAL_STATE, config, 0, 0.6);
    const second = planTicks(first.state, config, 0.6, 1.6);
    expect([...first.ticks, ...second.ticks].map((t) => t.time)).toEqual([0, 0.5, 1, 1.5]);
    expect(second.ticks.map((t) => t.beat)).toEqual([2, 3]);
  });

  it("plans nothing when the next tick is beyond the horizon", () => {
    const first = planTicks(INITIAL_STATE, config, 0, 0.1);
    const second = planTicks(first.state, config, 0.1, 0.2);
    expect(second.ticks).toEqual([]);
    expect(second.state).toEqual(first.state);
  });

  it("applies a tempo change from the last tick", () => {
    const first = planTicks(INITIAL_STATE, { ...config, tempo: 30 }, 0, 0.1);
    const second = planTicks(first.state, { ...config, tempo: 240 }, 0.1, 0.6);
    expect(second.ticks.map((t) => t.time)).toEqual([0.25, 0.5]);
  });

  it("plays an overdue tick at the earliest time instead of in the past", () => {
    const first = planTicks(INITIAL_STATE, config, 0, 0.1);
    const second = planTicks(first.state, config, 3, 3.1);
    expect(second.ticks.map((t) => t.time)).toEqual([3]);
  });

  it("marks subdivisions and silent beats", () => {
    const { ticks } = planTicks(
      INITIAL_STATE,
      { ...config, subdivisions: 2, silentBeats: [1], emphasizeFirstBeat: false },
      0,
      1,
    );
    expect(ticks.map((t) => [t.beat, t.type, t.silent, t.duration])).toEqual([
      [0, "weak", false, 0.25],
      [0, "sub", false, 0.25],
      [1, "weak", true, 0.25],
      [1, "sub", true, 0.25],
    ]);
  });

  it("keeps the bar position valid when beats or subdivisions shrink", () => {
    const first = planTicks(INITIAL_STATE, { ...config, beats: 8, subdivisions: 4 }, 0, 3.8);
    expect(first.state.next).toEqual({ beat: 7, sub: 3 });
    const second = planTicks(first.state, { ...config, beats: 4, subdivisions: 2 }, 3.8, 4.1);
    expect(second.ticks.map((t) => [t.beat, t.type])).toEqual([[0, "strong"]]);
  });
});

describe("latestDue", () => {
  const items = [{ time: 1 }, { time: 2 }, { time: 3 }];

  it("returns the last item at or before the time", () => {
    expect(latestDue(items, 2)).toEqual({ time: 2 });
    expect(latestDue(items, 2.5)).toEqual({ time: 2 });
    expect(latestDue(items, 10)).toEqual({ time: 3 });
  });

  it("returns null when nothing is due", () => {
    expect(latestDue(items, 0.5)).toBeNull();
    expect(latestDue([], 1)).toBeNull();
  });
});
