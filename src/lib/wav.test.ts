import { describe, expect, it } from "vitest";
import squareWaveStrong from "../sounds/square_wave_strong.wav?inline";
import { parseFloatWav } from "./wav";

interface Chunk {
  id: string;
  body: Uint8Array;
}

function fmtChunk(format = 3, channels = 1, sampleRate = 48_000, bits = 32): Chunk {
  const view = new DataView(new ArrayBuffer(16));
  view.setUint16(0, format, true);
  view.setUint16(2, channels, true);
  view.setUint32(4, sampleRate, true);
  view.setUint32(8, (sampleRate * channels * bits) / 8, true);
  view.setUint16(12, (channels * bits) / 8, true);
  view.setUint16(14, bits, true);
  return { id: "fmt ", body: new Uint8Array(view.buffer) };
}

function dataChunk(samples: number[]): Chunk {
  const view = new DataView(new ArrayBuffer(samples.length * 4));
  samples.forEach((sample, i) => view.setFloat32(i * 4, sample, true));
  return { id: "data", body: new Uint8Array(view.buffer) };
}

function wav(chunks: Chunk[]): ArrayBuffer {
  const parts = chunks.map(({ id, body }) => {
    const padded = new Uint8Array(8 + body.length + (body.length % 2));
    const view = new DataView(padded.buffer);
    [...id].forEach((char, i) => view.setUint8(i, char.charCodeAt(0)));
    view.setUint32(4, body.length, true);
    padded.set(body, 8);
    return padded;
  });
  const size = 12 + parts.reduce((sum, part) => sum + part.length, 0);
  const bytes = new Uint8Array(size);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  new DataView(bytes.buffer).setUint32(4, size - 8, true);
  bytes.set(new TextEncoder().encode("WAVE"), 8);
  let offset = 12;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes.buffer;
}

describe("parseFloatWav", () => {
  it("reads mono 32-bit float samples", () => {
    const { sampleRate, samples } = parseFloatWav(wav([fmtChunk(), dataChunk([0, 0.5, -1])]));
    expect(sampleRate).toBe(48_000);
    expect([...samples]).toEqual([0, 0.5, -1]);
  });

  it("skips unknown chunks, including odd-sized ones", () => {
    const odd = { id: "PEAK", body: new Uint8Array(3) };
    const { samples } = parseFloatWav(wav([fmtChunk(), odd, dataChunk([0.25])]));
    expect([...samples]).toEqual([0.25]);
  });

  it("rejects files that are not mono float WAV", () => {
    expect(() => parseFloatWav(new ArrayBuffer(4))).toThrow("RIFF");
    expect(() => parseFloatWav(wav([fmtChunk(1, 1, 48_000, 16), dataChunk([0])]))).toThrow("float");
    expect(() => parseFloatWav(wav([fmtChunk(3, 2), dataChunk([0])]))).toThrow("float");
    expect(() => parseFloatWav(wav([dataChunk([0])]))).toThrow("fmt");
    expect(() => parseFloatWav(wav([fmtChunk()]))).toThrow("data");
  });

  it("reads the bundled upstream sounds", async () => {
    const buffer = await (await fetch(squareWaveStrong)).arrayBuffer();
    const { sampleRate, samples } = parseFloatWav(buffer);
    expect(sampleRate).toBe(48_000);
    expect(samples).toHaveLength(2400);
    expect(samples[0]).toBeCloseTo(0.8, 2);
  });
});
