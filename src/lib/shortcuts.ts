export type ShortcutAction =
  { kind: "toggle" } | { kind: "tempo"; delta: number } | { kind: "tap" };

export interface Shortcut {
  keys: readonly string[];
  shift: boolean;
  label: string;
  description: string;
  action: ShortcutAction;
}

export const SHORTCUTS: readonly Shortcut[] = [
  {
    keys: [" "],
    shift: false,
    label: "Space",
    description: "Start or stop",
    action: { kind: "toggle" },
  },
  {
    keys: ["arrowup", "arrowright"],
    shift: false,
    label: "↑ →",
    description: "Tempo +1",
    action: { kind: "tempo", delta: 1 },
  },
  {
    keys: ["arrowdown", "arrowleft"],
    shift: false,
    label: "↓ ←",
    description: "Tempo −1",
    action: { kind: "tempo", delta: -1 },
  },
  {
    keys: ["arrowup", "arrowright"],
    shift: true,
    label: "Shift ↑ →",
    description: "Tempo +10",
    action: { kind: "tempo", delta: 10 },
  },
  {
    keys: ["arrowdown", "arrowleft"],
    shift: true,
    label: "Shift ↓ ←",
    description: "Tempo −10",
    action: { kind: "tempo", delta: -10 },
  },
  { keys: ["t"], shift: false, label: "T", description: "Tap tempo", action: { kind: "tap" } },
];

export type ShortcutKey = Pick<
  KeyboardEvent,
  "key" | "shiftKey" | "ctrlKey" | "metaKey" | "altKey"
>;

export function shortcutFor(event: ShortcutKey): ShortcutAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  const key = event.key.toLowerCase();
  const shortcut = SHORTCUTS.find((s) => s.shift === event.shiftKey && s.keys.includes(key));
  return shortcut?.action ?? null;
}

export function isHandledNatively(target: EventTarget | null, key: string): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.closest("dialog")) return true;
  if (target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) {
    return target.type === "range" || target.type === "radio" ? key.startsWith("Arrow") : true;
  }
  return false;
}
