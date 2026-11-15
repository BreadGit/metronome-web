// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { isHandledNatively, shortcutFor, type ShortcutKey } from "./shortcuts";

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

describe("isHandledNatively", () => {
  function element(html: string): HTMLElement {
    document.body.innerHTML = html;
    return document.body.querySelector("[data-target]") ?? document.body;
  }

  it("leaves space to focused controls", () => {
    for (const html of [
      "<button data-target>Settings</button>",
      "<a href='#' data-target>Link</a>",
      "<input type='checkbox' data-target>",
      "<input type='radio' data-target>",
      "<input type='range' data-target>",
      "<input type='number' data-target>",
      "<select data-target></select>",
      "<textarea data-target></textarea>",
    ]) {
      expect(isHandledNatively(element(html), " "), html).toBe(true);
    }
  });

  it("uses space as a shortcut on the body and non-interactive elements", () => {
    expect(isHandledNatively(element(""), " ")).toBe(false);
    expect(isHandledNatively(element("<p data-target>Text</p>"), " ")).toBe(false);
    expect(isHandledNatively(null, " ")).toBe(false);
  });

  it("leaves arrows to range, radio and text inputs and uses them as shortcuts elsewhere", () => {
    expect(isHandledNatively(element("<input type='range' data-target>"), "ArrowUp")).toBe(true);
    expect(isHandledNatively(element("<input type='radio' data-target>"), "ArrowLeft")).toBe(true);
    expect(isHandledNatively(element("<input type='number' data-target>"), "ArrowUp")).toBe(true);
    expect(isHandledNatively(element("<button data-target>Tap</button>"), "ArrowUp")).toBe(false);
    expect(isHandledNatively(element(""), "ArrowDown")).toBe(false);
  });

  it("uses T as a shortcut on buttons but not in text inputs", () => {
    expect(isHandledNatively(element("<button data-target>Tap</button>"), "t")).toBe(false);
    expect(isHandledNatively(element("<input type='radio' data-target>"), "t")).toBe(false);
    expect(isHandledNatively(element("<input type='text' data-target>"), "t")).toBe(true);
  });

  it("leaves every key to dialogs", () => {
    const text = element("<dialog open><p data-target>Text</p></dialog>");
    expect(isHandledNatively(text, " ")).toBe(true);
    expect(isHandledNatively(text, "ArrowUp")).toBe(true);
    expect(isHandledNatively(text, "t")).toBe(true);
  });
});
