import { describe, expect, it } from "vitest";
import {
  advancePosition,
  clampTempo,
  normalizePosition,
  tempoMarking,
  tickInterval,
  tickType,
  toggleBeat,
} from "./music";

describe("tempoMarking", () => {
  it.each([
    [30, "Largo"],
    [59, "Largo"],
    [60, "Larghetto"],
    [65, "Larghetto"],
    [66, "Adagio"],
    [75, "Adagio"],
    [76, "Andante"],
    [107, "Andante"],
    [108, "Moderato"],
    [119, "Moderato"],
    [120, "Allegro"],
    [167, "Allegro"],
    [168, "Presto"],
    [199, "Presto"],
    [200, "Prestissimo"],
    [252, "Prestissimo"],
  ])("%i BPM is %s", (tempo, marking) => {
    expect(tempoMarking(tempo)).toBe(marking);
  });
});

describe("clampTempo", () => {
  it("keeps the tempo within 30–252 and rounds", () => {
    expect(clampTempo(10)).toBe(30);
    expect(clampTempo(300)).toBe(252);
    expect(clampTempo(Infinity)).toBe(252);
    expect(clampTempo(120.6)).toBe(121);
  });
});

describe("tickInterval", () => {
  it("divides a beat by the subdivisions", () => {
    expect(tickInterval(120, 1)).toBe(0.5);
    expect(tickInterval(120, 2)).toBe(0.25);
    expect(tickInterval(60, 4)).toBe(0.25);
  });
});

describe("tickType", () => {
  it("is strong on the first beat only when emphasized", () => {
    expect(tickType({ beat: 0, sub: 0 }, true)).toBe("strong");
    expect(tickType({ beat: 0, sub: 0 }, false)).toBe("weak");
  });

  it("is weak on other beats and sub between beats", () => {
    expect(tickType({ beat: 2, sub: 0 }, true)).toBe("weak");
    expect(tickType({ beat: 0, sub: 1 }, true)).toBe("sub");
    expect(tickType({ beat: 3, sub: 2 }, false)).toBe("sub");
  });
});

describe("advancePosition", () => {
  it("walks through subdivisions and wraps at the end of the bar", () => {
    let position = { beat: 0, sub: 0 };
    const positions = [position];
    for (let i = 0; i < 6; i++) {
      position = advancePosition(position, 1, 3, 2);
      positions.push(position);
    }
    expect(positions).toEqual([
      { beat: 0, sub: 0 },
      { beat: 0, sub: 1 },
      { beat: 1, sub: 0 },
      { beat: 1, sub: 1 },
      { beat: 2, sub: 0 },
      { beat: 2, sub: 1 },
      { beat: 0, sub: 0 },
    ]);
  });

  it("skips several steps at once", () => {
    expect(advancePosition({ beat: 1, sub: 1 }, 3, 3, 2)).toEqual({ beat: 0, sub: 0 });
    expect(advancePosition({ beat: 0, sub: 0 }, 13, 3, 2)).toEqual({ beat: 0, sub: 1 });
  });
});

describe("normalizePosition", () => {
  it("moves to the next beat when the subdivision no longer exists", () => {
    expect(normalizePosition({ beat: 1, sub: 3 }, 4, 2)).toEqual({ beat: 2, sub: 0 });
  });

  it("restarts the bar when the beat no longer exists", () => {
    expect(normalizePosition({ beat: 6, sub: 0 }, 4, 1)).toEqual({ beat: 0, sub: 0 });
    expect(normalizePosition({ beat: 3, sub: 2 }, 4, 2)).toEqual({ beat: 0, sub: 0 });
  });
});

describe("toggleBeat", () => {
  it("adds and removes a beat, keeping the list sorted", () => {
    expect(toggleBeat([], 2)).toEqual([2]);
    expect(toggleBeat([3], 1)).toEqual([1, 3]);
    expect(toggleBeat([1, 3], 3)).toEqual([1]);
  });
});
