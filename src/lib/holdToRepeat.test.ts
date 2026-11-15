// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { holdToRepeat, REPEAT_DELAY_MS, REPEAT_INTERVAL_MS } from "./holdToRepeat";

function setup(limit = Infinity) {
  const button = document.createElement("button");
  document.body.append(button);
  button.setPointerCapture = vi.fn();
  let steps = 0;
  const cleanup = holdToRepeat(() => {
    if (steps >= limit) return false;
    steps += 1;
    return true;
  })(button);
  const pointer = (type: string, init: PointerEventInit = {}) =>
    button.dispatchEvent(
      new PointerEvent(type, { isPrimary: true, button: 0, pointerId: 1, ...init }),
    );
  return {
    button,
    steps: () => steps,
    pointer,
    press: () => pointer("pointerdown"),
    release: () => {
      pointer("pointerup");
      button.dispatchEvent(new MouseEvent("click", { detail: 1 }));
    },
    cleanup: () => {
      if (typeof cleanup === "function") cleanup();
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe("holdToRepeat", () => {
  it("steps once for a press and release", () => {
    const { steps, press, release } = setup();
    press();
    expect(steps()).toBe(1);
    release();
    vi.advanceTimersByTime(2000);
    expect(steps()).toBe(1);
  });

  it("captures the pointer", () => {
    const { button, press } = setup();
    press();
    expect(button.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it("repeats after the delay while held", () => {
    const { steps, press } = setup();
    press();
    vi.advanceTimersByTime(REPEAT_DELAY_MS - 1);
    expect(steps()).toBe(1);
    vi.advanceTimersByTime(1);
    expect(steps()).toBe(2);
    vi.advanceTimersByTime(REPEAT_INTERVAL_MS * 10);
    expect(steps()).toBe(12);
  });

  it.each(["pointerup", "pointercancel", "lostpointercapture"])("stops on %s", (type) => {
    const { steps, press, pointer } = setup();
    press();
    vi.advanceTimersByTime(REPEAT_DELAY_MS + REPEAT_INTERVAL_MS);
    pointer(type);
    vi.advanceTimersByTime(2000);
    expect(steps()).toBe(3);
  });

  it("stops when the window loses focus", () => {
    const { steps, press } = setup();
    press();
    window.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(2000);
    expect(steps()).toBe(1);
  });

  it("stops when the button is disabled or removed", () => {
    const { button, steps, press, cleanup } = setup();
    press();
    vi.advanceTimersByTime(REPEAT_DELAY_MS);
    button.disabled = true;
    vi.advanceTimersByTime(2000);
    expect(steps()).toBe(2);

    button.disabled = false;
    press();
    cleanup();
    vi.advanceTimersByTime(2000);
    expect(steps()).toBe(3);
  });

  it("stops at the limit", () => {
    const { steps, press } = setup(5);
    press();
    vi.advanceTimersByTime(5000);
    expect(steps()).toBe(5);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ignores secondary buttons and non-primary pointers", () => {
    const { steps, pointer } = setup();
    pointer("pointerdown", { button: 2 });
    pointer("pointerdown", { isPrimary: false });
    vi.advanceTimersByTime(2000);
    expect(steps()).toBe(0);
  });

  it("steps once per keyboard activation", () => {
    const { button, steps } = setup();
    button.dispatchEvent(new MouseEvent("click", { detail: 0 }));
    button.dispatchEvent(new MouseEvent("click", { detail: 0 }));
    vi.advanceTimersByTime(2000);
    expect(steps()).toBe(2);
  });

  it("prevents the context menu", () => {
    const { button } = setup();
    const event = new MouseEvent("contextmenu", { cancelable: true });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
