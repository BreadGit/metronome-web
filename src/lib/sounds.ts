import type { TickType } from "./music";
import { parseFloatWav } from "./wav";

export const SOUNDS = [
  { id: "square_wave", label: "Hard beep" },
  { id: "sine_wave", label: "Soft beep" },
  { id: "risset_drum", label: "Synth drum" },
  { id: "pluck", label: "Pluck" },
] as const;

export type SoundId = (typeof SOUNDS)[number]["id"];

export type SoundBank = Record<SoundId, Record<TickType, AudioBuffer>>;

const urls = import.meta.glob<string>("../sounds/*.wav", {
  query: "?url",
  import: "default",
  eager: true,
});

async function loadBuffer(sound: SoundId, type: TickType): Promise<AudioBuffer> {
  const url = urls[`../sounds/${sound}_${type}.wav`];
  if (!url) throw new Error(`Missing sound file for ${sound} ${type}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  const { sampleRate, samples } = parseFloatWav(await response.arrayBuffer());
  const buffer = new AudioBuffer({ length: samples.length, sampleRate, numberOfChannels: 1 });
  buffer.copyToChannel(samples, 0);
  return buffer;
}

async function loadSound(sound: SoundId): Promise<Record<TickType, AudioBuffer>> {
  const [strong, weak, sub] = await Promise.all([
    loadBuffer(sound, "strong"),
    loadBuffer(sound, "weak"),
    loadBuffer(sound, "sub"),
  ]);
  return { strong, weak, sub };
}

export async function loadSoundBank(): Promise<SoundBank> {
  const [square_wave, sine_wave, risset_drum, pluck] = await Promise.all([
    loadSound("square_wave"),
    loadSound("sine_wave"),
    loadSound("risset_drum"),
    loadSound("pluck"),
  ]);
  return { square_wave, sine_wave, risset_drum, pluck };
}
