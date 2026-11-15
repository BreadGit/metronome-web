import { describe, expect, it } from "vitest";
import { shortcutFor, type ShortcutKey } from "./shortcuts";

function key(key: string, modifiers: Partial<ShortcutKey> = {}): ShortcutKey {
  return { key, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...modifiers };
}

describe("shortcutFor", () => {
  it("maps space to start/stop", () => {
    expect(shortcutFor(key(" "))).toEqual({ kind: "toggle" });
  });

  it("maps arrows to tempo steps of 1, or 10 with shift", () => {
    expect(shortcutFor(key("ArrowUp"))).toEqual({ kind: "tempo", delta: 1 });
    expect(shortcutFor(key("ArrowRight"))).toEqual({ kind: "tempo", delta: 1 });
    expect(shortcutFor(key("ArrowDown"))).toEqual({ kind: "tempo", delta: -1 });
    expect(shortcutFor(key("ArrowLeft"))).toEqual({ kind: "tempo", delta: -1 });
    expect(shortcutFor(key("ArrowUp", { shiftKey: true }))).toEqual({ kind: "tempo", delta: 10 });
    expect(shortcutFor(key("ArrowLeft", { shiftKey: true }))).toEqual({
      kind: "tempo",
      delta: -10,
    });
  });

  it("maps T to tap tempo regardless of case", () => {
    expect(shortcutFor(key("t"))).toEqual({ kind: "tap" });
    expect(shortcutFor(key("T"))).toEqual({ kind: "tap" });
  });

  it("ignores other keys and browser modifier combinations", () => {
    expect(shortcutFor(key("x"))).toBeNull();
    expect(shortcutFor(key("t", { ctrlKey: true }))).toBeNull();
    expect(shortcutFor(key(" ", { metaKey: true }))).toBeNull();
    expect(shortcutFor(key("ArrowUp", { altKey: true }))).toBeNull();
  });
});
