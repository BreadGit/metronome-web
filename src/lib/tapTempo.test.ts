import { describe, expect, it } from "vitest";
import { recordTap, TAP_WINDOW_MS } from "./tapTempo";

function tapAll(times: number[]) {
  let taps: number[] = [];
  let tempo: number | null = null;
  for (const time of times) ({ taps, tempo } = recordTap(taps, time));
  return { taps, tempo };
}

describe("recordTap", () => {
  it("needs two taps for a tempo", () => {
    expect(recordTap([], 1000)).toEqual({ taps: [1000], tempo: null });
  });

  it("averages the intervals between taps", () => {
    expect(tapAll([0, 500, 1000, 1500]).tempo).toBe(120);
    expect(tapAll([0, 400, 1000]).tempo).toBe(120);
  });

  it("truncates to whole BPM", () => {
    expect(tapAll([0, 700]).tempo).toBe(85);
  });

  it("forgets taps older than the window", () => {
    const { taps, tempo } = tapAll([0, 1000, 1000 + TAP_WINDOW_MS + 1]);
    expect(taps).toEqual([1000 + TAP_WINDOW_MS + 1]);
    expect(tempo).toBeNull();
  });

  it("keeps a tap exactly at the window edge", () => {
    expect(tapAll([0, TAP_WINDOW_MS]).tempo).toBe(30);
  });

  it("clamps to the tempo range", () => {
    expect(tapAll([0, 100]).tempo).toBe(252);
    expect(tapAll([0, 0]).tempo).toBe(252);
    expect(tapAll([0, 4000]).tempo).toBe(30);
  });
});
