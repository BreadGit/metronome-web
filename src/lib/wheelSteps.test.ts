// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { PIXELS_PER_STEP, wheelStep, wheelToStep } from "./wheelSteps";

const PIXEL = 0;
const LINE = 1;
const PAGE = 2;

function scroll(deltas: number[], deltaMode = PIXEL) {
  let accumulated = 0;
  const steps: number[] = [];
  for (const delta of deltas) {
    const result = wheelStep(accumulated, delta, deltaMode);
    accumulated = result.accumulated;
    steps.push(result.step);
  }
  return { accumulated, steps };
}

describe("wheelStep", () => {
  it("steps once per mouse notch in pixel mode", () => {
    expect(scroll([-100, -100, -100]).steps).toEqual([1, 1, 1]);
    expect(scroll([120, 120, 120, 120]).steps).toEqual([-1, -1, -1, -1]);
  });

  it("steps once per mouse notch in line and page modes", () => {
    expect(scroll([3, 3, 3, 3, 3, 3], LINE).steps).toEqual([-1, -1, -1, -1, -1, -1]);
    expect(scroll([-1, -1], PAGE).steps).toEqual([1, 1]);
  });

  it("accumulates small trackpad deltas", () => {
    const { steps, accumulated } = scroll(Array<number>(12).fill(-10));
    expect(steps).toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0]);
    expect(accumulated).toBe(-20);
  });

  it("keeps the remainder after a step", () => {
    expect(wheelStep(0, 70, PIXEL)).toEqual({ accumulated: 20, step: -1 });
    expect(wheelStep(20, 30, PIXEL)).toEqual({ accumulated: 0, step: -1 });
  });

  it("starts over when the direction changes", () => {
    expect(wheelStep(-40, 30, PIXEL)).toEqual({ accumulated: 30, step: 0 });
    expect(scroll([-40, 40, -40]).steps).toEqual([0, 0, 0]);
  });

  it("steps at most once for a large delta", () => {
    expect(wheelStep(0, -PIXELS_PER_STEP * 5 - 10, PIXEL)).toEqual({ accumulated: -10, step: 1 });
  });
});

describe("wheelToStep", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  function setup() {
    const element = document.createElement("input");
    document.body.append(element);
    const steps: number[] = [];
    const cleanup = wheelToStep((delta) => steps.push(delta))(element);
    const wheel = ({ ctrlKey = false, metaKey = false, ...init }: WheelEventInit) => {
      const event = new WheelEvent("wheel", { cancelable: true, ...init });
      // happy-dom's WheelEvent has no modifier keys.
      Object.defineProperties(event, { ctrlKey: { value: ctrlKey }, metaKey: { value: metaKey } });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    };
    return { steps, wheel, cleanup: () => typeof cleanup === "function" && cleanup() };
  }

  it("steps and prevents scrolling for vertical wheel events", () => {
    const { steps, wheel } = setup();
    expect(wheel({ deltaY: -100 })).toBe(true);
    expect(wheel({ deltaY: 100 })).toBe(true);
    expect(wheel({ deltaY: 10 })).toBe(true);
    expect(steps).toEqual([1, -1]);
  });

  it("lets zoom and horizontal scrolling through", () => {
    const { steps, wheel } = setup();
    expect(wheel({ deltaY: -100, ctrlKey: true })).toBe(false);
    expect(wheel({ deltaY: -100, metaKey: true })).toBe(false);
    expect(wheel({ deltaX: 100, deltaY: 20 })).toBe(false);
    expect(steps).toEqual([]);
  });

  it("stops listening on cleanup", () => {
    const { steps, wheel, cleanup } = setup();
    cleanup();
    expect(wheel({ deltaY: -100 })).toBe(false);
    expect(steps).toEqual([]);
  });
});
