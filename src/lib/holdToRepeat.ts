import type { Attachment } from "svelte/attachments";

export const REPEAT_DELAY_MS = 400;
export const REPEAT_INTERVAL_MS = 50;

/** `step` returns false when it cannot step further, which ends the hold. */
export function holdToRepeat(step: () => boolean): Attachment<HTMLButtonElement> {
  return (button) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const advance = () => !button.disabled && step();
    const repeatAfter = (delay: number) => {
      timer = setTimeout(() => {
        if (advance()) repeatAfter(REPEAT_INTERVAL_MS);
      }, delay);
    };
    const stop = () => clearTimeout(timer);

    const controller = new AbortController();
    const listen = { signal: controller.signal };
    button.addEventListener(
      "pointerdown",
      (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        stop();
        button.setPointerCapture(event.pointerId);
        if (advance()) repeatAfter(REPEAT_DELAY_MS);
      },
      listen,
    );
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      button.addEventListener(type, stop, listen);
    }
    button.addEventListener(
      "click",
      (event) => {
        const fromKeyboard = event.detail === 0;
        if (fromKeyboard) step();
      },
      listen,
    );
    button.addEventListener("contextmenu", (event) => event.preventDefault(), listen);
    window.addEventListener("blur", stop, listen);

    return () => {
      stop();
      controller.abort();
    };
  };
}
