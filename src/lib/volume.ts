export const VOLUME = { min: 0, max: 100, default: 75 } as const;

export function volumeGain(volume: number, muted: boolean): number {
  return muted ? 0 : (volume / VOLUME.max) ** 2;
}
