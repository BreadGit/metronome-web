import { describe, expect, it } from "vitest";
import { INITIAL_STATE, latestDue, planTicks, type TickConfig } from "./scheduler";

const config: TickConfig = {
  tempo: 120,
  beats: 4,
  subdivisions: 1,
  silentBeats: [],
  emphasizeFirstBeat: true,
};

const at = (now: number, horizon: number, start = now) => ({ now, start, horizon });

describe("planTicks", () => {
  it("starts at the start time and fills the window", () => {
    const { ticks, state } = planTicks(INITIAL_STATE, config, at(0.95, 2.1, 1));
    expect(ticks.map((t) => [t.time, t.beat, t.type])).toEqual([
      [1, 0, "strong"],
      [1.5, 1, "weak"],
      [2, 2, "weak"],
    ]);
    expect(state).toEqual({ next: { beat: 3, sub: 0 }, lastTime: 2 });
  });

  it("continues from the previous state without gaps or repeats", () => {
    const first = planTicks(INITIAL_STATE, config, at(0, 0.6));
    const second = planTicks(first.state, config, at(0.6, 1.6, 0.65));
    expect([...first.ticks, ...second.ticks].map((t) => t.time)).toEqual([0, 0.5, 1, 1.5]);
    expect(second.ticks.map((t) => t.beat)).toEqual([2, 3]);
  });

  it("plans nothing when the next tick is beyond the horizon", () => {
    const first = planTicks(INITIAL_STATE, config, at(0, 0.1));
    const second = planTicks(first.state, config, at(0.1, 0.2));
    expect(second.ticks).toEqual([]);
    expect(second.state).toEqual(first.state);
  });

  it("applies a tempo change from the last tick", () => {
    const first = planTicks(INITIAL_STATE, { ...config, tempo: 30 }, at(0, 0.1));
    const second = planTicks(first.state, { ...config, tempo: 240 }, at(0.1, 0.6));
    expect(second.ticks.map((t) => t.time)).toEqual([0.25, 0.5]);
  });

  it("plays a grid tick that is already inside the start lead", () => {
    const first = planTicks(INITIAL_STATE, config, at(0, 0.1));
    const second = planTicks(first.state, config, at(0.48, 0.6, 0.53));
    expect(second.ticks.map((t) => [t.time, t.beat])).toEqual([[0.5, 1]]);
  });

  it("keeps the tempo and bar phase when planning is late, skipping missed ticks", () => {
    let state = INITIAL_STATE;
    const planned = [];
    for (let now = 0; now < 4; now++) {
      const result = planTicks(state, config, at(now, now + 0.1, now + 0.05));
      state = result.state;
      planned.push(...result.ticks.map((t) => [t.time, t.beat]));
    }
    expect(planned).toEqual([
      [0.05, 0],
      [1.05, 2],
      [2.05, 0],
      [3.05, 2],
    ]);
    expect(state).toEqual({ next: { beat: 3, sub: 0 }, lastTime: 3.05 });
  });

  it("advances past missed ticks even when none fall in the window", () => {
    const first = planTicks(INITIAL_STATE, config, at(0, 0.1));
    const second = planTicks(first.state, config, at(1.2, 1.3));
    expect(second.ticks).toEqual([]);
    expect(second.state).toEqual({ next: { beat: 3, sub: 0 }, lastTime: 1 });
    const third = planTicks(second.state, config, at(1.45, 1.55));
    expect(third.ticks.map((t) => [t.time, t.beat])).toEqual([[1.5, 3]]);
  });

  it("skips missed ticks at a tempo changed while planning was late", () => {
    const first = planTicks(INITIAL_STATE, config, at(0, 0.1));
    const second = planTicks(first.state, { ...config, tempo: 240 }, at(1.1, 1.3));
    expect(second.ticks.map((t) => [t.time, t.beat])).toEqual([[1.25, 1]]);
  });

  it("marks subdivisions and silent beats", () => {
    const { ticks } = planTicks(
      INITIAL_STATE,
      { ...config, subdivisions: 2, silentBeats: [1], emphasizeFirstBeat: false },
      at(0, 1),
    );
    expect(ticks.map((t) => [t.beat, t.type, t.silent, t.duration])).toEqual([
      [0, "weak", false, 0.25],
      [0, "sub", false, 0.25],
      [1, "weak", true, 0.25],
      [1, "sub", true, 0.25],
    ]);
  });

  it("keeps the bar position valid when beats or subdivisions shrink", () => {
    const first = planTicks(INITIAL_STATE, { ...config, beats: 8, subdivisions: 4 }, at(0, 3.8));
    expect(first.state.next).toEqual({ beat: 7, sub: 3 });
    const second = planTicks(first.state, { ...config, beats: 4, subdivisions: 2 }, at(3.8, 4.1));
    expect(second.ticks.map((t) => [t.beat, t.type])).toEqual([[0, "strong"]]);
  });

  it("wraps after shrinking and then skips on the new bar", () => {
    const first = planTicks(INITIAL_STATE, { ...config, beats: 8 }, at(0, 3.1));
    expect(first.state).toEqual({ next: { beat: 7, sub: 0 }, lastTime: 3 });
    const second = planTicks(first.state, { ...config, beats: 3 }, at(4.1, 4.6));
    expect(second.ticks.map((t) => [t.time, t.beat])).toEqual([[4.5, 2]]);
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
