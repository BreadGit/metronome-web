import { describe, expect, it } from "vitest";
import { parseTempo, tempoDigits } from "./tempoEntry";

describe("tempoDigits", () => {
  it("keeps at most three digits", () => {
    expect(tempoDigits("120")).toBe("120");
    expect(tempoDigits("1a2 0")).toBe("120");
    expect(tempoDigits("1234")).toBe("123");
    expect(tempoDigits("-.e")).toBe("");
  });
});

describe("parseTempo", () => {
  it("clamps a typed tempo to 30–252", () => {
    expect(parseTempo("120")).toBe(120);
    expect(parseTempo("7")).toBe(30);
    expect(parseTempo("999")).toBe(252);
  });

  it("rejects an empty or non-numeric draft", () => {
    expect(parseTempo("")).toBeNull();
    expect(parseTempo("12a")).toBeNull();
  });
});
