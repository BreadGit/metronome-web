import { describe, expect, it } from "vitest";
import { VOLUME, volumeGain } from "./volume";

describe("volumeGain", () => {
  it("is silent at zero and full at the maximum", () => {
    expect(volumeGain(VOLUME.min, false)).toBe(0);
    expect(volumeGain(VOLUME.max, false)).toBe(1);
  });

  it("follows a perceptual curve", () => {
    expect(volumeGain(50, false)).toBeCloseTo(0.25);
    expect(volumeGain(VOLUME.default, false)).toBeCloseTo(0.5625);
  });

  it("is silent when muted", () => {
    expect(volumeGain(VOLUME.max, true)).toBe(0);
  });
});
