export type ShortcutAction =
  | { kind: "toggle" }
  | { kind: "tap" }
  | { kind: "typeTempo" }
  | { kind: "tempo"; delta: number }
  | { kind: "beats"; delta: number }
  | { kind: "subdivisions"; delta: number };

export interface Shortcut {
  keys: readonly string[];
  shift?: boolean;
  label: string;
  description: string;
  action: ShortcutAction;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export const SHORTCUTS: readonly Shortcut[] = [
  {
    keys: [" "],
    label: "Space",
    description: "Start or stop",
    action: { kind: "toggle" },
  },
  {
    keys: DIGITS,
    shift: false,
    label: "0–9",
    description: "Type tempo",
    action: { kind: "typeTempo" },
  },
  {
    keys: ["arrowup", "arrowright", "w", "d"],
    shift: false,
    label: "↑ → W D",
    description: "Tempo +1",
    action: { kind: "tempo", delta: 1 },
  },
  {
    keys: ["arrowdown", "arrowleft", "s", "a"],
    shift: false,
    label: "↓ ← S A",
    description: "Tempo −1",
    action: { kind: "tempo", delta: -1 },
  },
  {
    keys: ["arrowup", "arrowright", "w", "d"],
    shift: true,
    label: "Shift ↑ → W D",
    description: "Tempo +10",
    action: { kind: "tempo", delta: 10 },
  },
  {
    keys: ["arrowdown", "arrowleft", "s", "a"],
    shift: true,
    label: "Shift ↓ ← S A",
    description: "Tempo −10",
    action: { kind: "tempo", delta: -10 },
  },
  { keys: ["t"], shift: false, label: "T", description: "Tap tempo", action: { kind: "tap" } },
  {
    keys: ["b"],
    shift: false,
    label: "B",
    description: "Beats +1",
    action: { kind: "beats", delta: 1 },
  },
  {
    keys: ["b"],
    shift: true,
    label: "Shift B",
    description: "Beats −1",
    action: { kind: "beats", delta: -1 },
  },
  {
    keys: ["v"],
    shift: false,
    label: "V",
    description: "Subdivisions +1",
    action: { kind: "subdivisions", delta: 1 },
  },
  {
    keys: ["v"],
    shift: true,
    label: "Shift V",
    description: "Subdivisions −1",
    action: { kind: "subdivisions", delta: -1 },
  },
];

export function shortcutLetter(kind: ShortcutAction["kind"]): string | undefined {
  return SHORTCUTS.find((s) => s.action.kind === kind && !s.shift)?.keys[0];
}

export type ShortcutKey = Pick<
  KeyboardEvent,
  "key" | "shiftKey" | "ctrlKey" | "metaKey" | "altKey" | "isComposing" | "keyCode"
>;

export function isComposing(event: Pick<KeyboardEvent, "isComposing" | "keyCode">): boolean {
  return event.isComposing || event.keyCode === 229;
}

export function shortcutFor(event: ShortcutKey): ShortcutAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey || isComposing(event)) return null;
  const key = event.key.toLowerCase();
  const shortcut = SHORTCUTS.find(
    (s) => (s.shift ?? event.shiftKey) === event.shiftKey && s.keys.includes(key),
  );
  return shortcut?.action ?? null;
}

export function isHandledNatively(target: EventTarget | null, key: string): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.ownerDocument.querySelector("dialog[open]")) return true;
  if (key === " ") return false;
  if (target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) {
    return target.type === "range" || target.type === "radio" ? key.startsWith("Arrow") : true;
  }
  return false;
}
