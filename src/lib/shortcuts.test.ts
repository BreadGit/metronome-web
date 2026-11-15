// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { isHandledNatively, shortcutFor, shortcutLetter, type ShortcutKey } from "./shortcuts";

function key(key: string, modifiers: Partial<ShortcutKey> = {}): ShortcutKey {
  return {
    key,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    isComposing: false,
    keyCode: 0,
    ...modifiers,
  };
}

describe("shortcutFor", () => {
  it("maps space to start/stop, with or without shift", () => {
    expect(shortcutFor(key(" "))).toEqual({ kind: "toggle" });
    expect(shortcutFor(key(" ", { shiftKey: true }))).toEqual({ kind: "toggle" });
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

  it("maps WASD to tempo steps like the arrows", () => {
    expect(shortcutFor(key("w"))).toEqual({ kind: "tempo", delta: 1 });
    expect(shortcutFor(key("d"))).toEqual({ kind: "tempo", delta: 1 });
    expect(shortcutFor(key("s"))).toEqual({ kind: "tempo", delta: -1 });
    expect(shortcutFor(key("a"))).toEqual({ kind: "tempo", delta: -1 });
    expect(shortcutFor(key("W", { shiftKey: true }))).toEqual({ kind: "tempo", delta: 10 });
    expect(shortcutFor(key("A", { shiftKey: true }))).toEqual({ kind: "tempo", delta: -10 });
  });

  it("maps T to tap tempo regardless of case", () => {
    expect(shortcutFor(key("t"))).toEqual({ kind: "tap" });
    expect(shortcutFor(key("T"))).toEqual({ kind: "tap" });
  });

  it("maps B and V to beats and subdivisions, stepping back with shift", () => {
    expect(shortcutFor(key("b"))).toEqual({ kind: "beats", delta: 1 });
    expect(shortcutFor(key("B", { shiftKey: true }))).toEqual({ kind: "beats", delta: -1 });
    expect(shortcutFor(key("v"))).toEqual({ kind: "subdivisions", delta: 1 });
    expect(shortcutFor(key("V", { shiftKey: true }))).toEqual({ kind: "subdivisions", delta: -1 });
  });

  it("maps digits to typing a tempo", () => {
    expect(shortcutFor(key("0"))).toEqual({ kind: "typeTempo" });
    expect(shortcutFor(key("9"))).toEqual({ kind: "typeTempo" });
  });

  it("ignores other keys and browser modifier combinations", () => {
    expect(shortcutFor(key("x"))).toBeNull();
    expect(shortcutFor(key("t", { ctrlKey: true }))).toBeNull();
    expect(shortcutFor(key(" ", { metaKey: true }))).toBeNull();
    expect(shortcutFor(key("ArrowUp", { altKey: true }))).toBeNull();
  });

  it("ignores keys that are part of an IME composition", () => {
    expect(shortcutFor(key(" ", { isComposing: true }))).toBeNull();
    expect(shortcutFor(key("1", { keyCode: 229 }))).toBeNull();
  });
});

describe("shortcutLetter", () => {
  it("gives the unshifted letter for an action", () => {
    expect(shortcutLetter("tap")).toBe("t");
    expect(shortcutLetter("beats")).toBe("b");
    expect(shortcutLetter("subdivisions")).toBe("v");
  });
});

describe("isHandledNatively", () => {
  function element(html: string): HTMLElement {
    document.body.innerHTML = html;
    return document.body.querySelector("[data-target]") ?? document.body;
  }

  it("uses space as a shortcut on every control and text field", () => {
    for (const html of [
      "",
      "<p data-target>Text</p>",
      "<button data-target>Tap</button>",
      "<a href='#' data-target>Link</a>",
      "<input type='radio' data-target>",
      "<input type='range' data-target>",
      "<input type='text' data-target>",
      "<select data-target></select>",
    ]) {
      expect(isHandledNatively(element(html), " "), html).toBe(false);
    }
    expect(isHandledNatively(null, " ")).toBe(false);
  });

  it("leaves arrows to range, radio and text inputs and uses them as shortcuts elsewhere", () => {
    expect(isHandledNatively(element("<input type='range' data-target>"), "ArrowUp")).toBe(true);
    expect(isHandledNatively(element("<input type='radio' data-target>"), "ArrowLeft")).toBe(true);
    expect(isHandledNatively(element("<input type='text' data-target>"), "ArrowUp")).toBe(true);
    expect(isHandledNatively(element("<button data-target>Tap</button>"), "ArrowUp")).toBe(false);
    expect(isHandledNatively(element(""), "ArrowDown")).toBe(false);
  });

  it("uses letters and digits as shortcuts on controls but not in text inputs", () => {
    for (const key of ["t", "b", "1"]) {
      expect(isHandledNatively(element("<button data-target>Tap</button>"), key)).toBe(false);
      expect(isHandledNatively(element("<input type='radio' data-target>"), key)).toBe(false);
      expect(isHandledNatively(element("<input type='range' data-target>"), key)).toBe(false);
      expect(isHandledNatively(element("<input type='text' data-target>"), key)).toBe(true);
    }
  });

  it("leaves every key to an open dialog, wherever focus is", () => {
    for (const html of [
      "<dialog open><p data-target>Text</p></dialog>",
      "<dialog open></dialog><button data-target>Tap</button>",
    ]) {
      for (const key of [" ", "ArrowUp", "t", "1"]) {
        expect(isHandledNatively(element(html), key), `${html} ${key}`).toBe(true);
      }
    }
    expect(isHandledNatively(element("<dialog><p data-target>Text</p></dialog>"), " ")).toBe(false);
  });
});
