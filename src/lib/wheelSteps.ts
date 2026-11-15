import type { Attachment } from "svelte/attachments";

export const PIXELS_PER_STEP = 50;
const PIXELS_PER_DELTA_MODE = [1, 20, 800];

export interface WheelStep {
  accumulated: number;
  step: -1 | 0 | 1;
}

/** Adds a vertical wheel delta and returns at most one step, positive for scrolling up. */
export function wheelStep(accumulated: number, deltaY: number, deltaMode: number): WheelStep {
  const pixels = deltaY * (PIXELS_PER_DELTA_MODE[deltaMode] ?? 1);
  const total = Math.sign(pixels) === -Math.sign(accumulated) ? pixels : accumulated + pixels;
  if (Math.abs(total) < PIXELS_PER_STEP) return { accumulated: total, step: 0 };
  return { accumulated: total % PIXELS_PER_STEP, step: total < 0 ? 1 : -1 };
}

/** Steps on vertical wheel scrolls over the element; `step` gets +1 or -1. */
export function wheelToStep(step: (delta: 1 | -1) => void): Attachment<HTMLElement> {
  return (element) => {
    let accumulated = 0;
    const onwheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      const result = wheelStep(accumulated, event.deltaY, event.deltaMode);
      accumulated = result.accumulated;
      if (result.step !== 0) step(result.step);
    };
    element.addEventListener("wheel", onwheel, { passive: false });
    return () => element.removeEventListener("wheel", onwheel);
  };
}
