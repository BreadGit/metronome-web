const WAVE_FORMAT_IEEE_FLOAT = 3;

export interface FloatWav {
  sampleRate: number;
  samples: Float32Array<ArrayBuffer>;
}

function fourCC(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

export function parseFloatWav(buffer: ArrayBuffer): FloatWav {
  const view = new DataView(buffer);
  if (view.byteLength < 12 || fourCC(view, 0) !== "RIFF" || fourCC(view, 8) !== "WAVE") {
    throw new Error("Not a RIFF/WAVE file");
  }

  let sampleRate: number | null = null;
  let offset = 12;
  while (offset + 8 <= view.byteLength) {
    const id = fourCC(view, offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;

    if (id === "fmt ") {
      const format = view.getUint16(body, true);
      const channels = view.getUint16(body + 2, true);
      const bitsPerSample = view.getUint16(body + 14, true);
      if (format !== WAVE_FORMAT_IEEE_FLOAT || channels !== 1 || bitsPerSample !== 32) {
        throw new Error("Expected mono 32-bit float PCM");
      }
      sampleRate = view.getUint32(body + 4, true);
    } else if (id === "data") {
      if (sampleRate === null) throw new Error("data chunk before fmt chunk");
      const length = Math.floor(Math.min(size, view.byteLength - body) / 4);
      const samples = new Float32Array(length);
      for (let i = 0; i < length; i++) samples[i] = view.getFloat32(body + i * 4, true);
      return { sampleRate, samples };
    }

    offset = body + size + (size % 2);
  }
  throw new Error("No data chunk");
}
