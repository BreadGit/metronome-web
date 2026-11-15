import { clampTempo } from "./music";

export const MAX_TEMPO_DIGITS = 3;

export function tempoDigits(text: string): string {
  return text.replace(/\D/g, "").slice(0, MAX_TEMPO_DIGITS);
}

export function parseTempo(draft: string): number | null {
  return /^\d+$/.test(draft) ? clampTempo(Number(draft)) : null;
}
