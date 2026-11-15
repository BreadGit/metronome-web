import { startClock } from "./clock";
import {
  INITIAL_STATE,
  latestDue,
  planTicks,
  type PlannedTick,
  type SchedulerState,
  type TickConfig,
} from "./scheduler";
import { loadSoundBank, type SoundBank, type SoundId } from "./sounds";
import { volumeGain } from "./volume";

const TIMER_INTERVAL_MS = 25;
const START_LEAD_S = 0.05;
const LOOKAHEAD_S = 0.1;
const VOLUME_SMOOTHING_S = 0.015;

export interface MetronomeConfig extends TickConfig {
  sound: SoundId;
  volume: number;
  muted: boolean;
}

interface Audio {
  context: AudioContext;
  output: GainNode;
}

export interface HeardBeat {
  beat: number;
  silent: boolean;
  age: number;
}

export class Metronome {
  #config: MetronomeConfig;
  #sounds: Promise<SoundBank> | null = null;
  #audio: Audio | null = null;
  #stopClock: (() => void) | undefined;
  #session = 0;
  #running = false;
  #state: SchedulerState = INITIAL_STATE;
  #beats: PlannedTick[] = [];
  readonly #sources = new Set<AudioBufferSourceNode>();

  constructor(config: MetronomeConfig) {
    this.#config = config;
  }

  get config(): MetronomeConfig {
    return this.#config;
  }

  set config(config: MetronomeConfig) {
    this.#config = config;
    if (!this.#audio) return;
    const { context, output } = this.#audio;
    if (this.#running && context.state === "running") {
      output.gain.setTargetAtTime(this.#gain(), context.currentTime, VOLUME_SMOOTHING_S);
    } else {
      output.gain.cancelScheduledValues(0);
      output.gain.setValueAtTime(this.#gain(), context.currentTime);
    }
  }

  async start(): Promise<void> {
    if (this.#running) return;
    this.#running = true;
    const session = ++this.#session;
    try {
      const audio = (this.#audio ??= this.#createAudio());
      const [bank] = await Promise.all([this.#loadSounds(), audio.context.resume()]);
      if (session !== this.#session) return;
      this.#state = INITIAL_STATE;
      this.#beats = [];
      const schedule = () => this.#schedule(audio, bank);
      schedule();
      this.#stopClock = startClock(schedule, TIMER_INTERVAL_MS);
    } catch (error) {
      if (session !== this.#session) return;
      this.stop();
      throw error;
    }
  }

  stop(): void {
    this.#running = false;
    this.#session++;
    this.#stopClock?.();
    this.#stopClock = undefined;
    for (const source of this.#sources) source.stop();
    this.#sources.clear();
    this.#beats = [];
    void this.#audio?.context.suspend();
  }

  lastHeardBeat(): HeardBeat | null {
    const context = this.#audio?.context;
    if (!context || !this.#running) return null;
    const heardAt = this.#heardAt(context);
    const tick = latestDue(this.#beats, heardAt);
    return tick && { beat: tick.beat, silent: tick.silent, age: heardAt - tick.time };
  }

  #createAudio(): Audio {
    const context = new AudioContext({ latencyHint: "interactive" });
    const output = new GainNode(context, { gain: this.#gain() });
    output.connect(context.destination);
    return { context, output };
  }

  #gain(): number {
    return volumeGain(this.#config.volume, this.#config.muted);
  }

  #loadSounds(): Promise<SoundBank> {
    this.#sounds ??= loadSoundBank().catch((error: unknown) => {
      this.#sounds = null;
      throw error;
    });
    return this.#sounds;
  }

  #heardAt(context: AudioContext): number {
    return context.currentTime - (context.outputLatency || 0);
  }

  #schedule({ context, output }: Audio, bank: SoundBank): void {
    const now = context.currentTime;
    const { ticks, state } = planTicks(this.#state, this.#config, {
      now,
      start: now + START_LEAD_S,
      horizon: now + LOOKAHEAD_S,
    });
    this.#state = state;
    const sound = bank[this.#config.sound];
    for (const tick of ticks) {
      if (!tick.silent) this.#play(output, sound[tick.type], tick.time, tick.duration);
      if (tick.type !== "sub") this.#beats.push(tick);
    }
    const latest = latestDue(this.#beats, this.#heardAt(context));
    if (latest) this.#beats = this.#beats.slice(this.#beats.indexOf(latest));
  }

  #play(output: GainNode, buffer: AudioBuffer, time: number, duration: number): void {
    const source = new AudioBufferSourceNode(output.context, { buffer });
    source.connect(output);
    source.onended = () => this.#sources.delete(source);
    source.start(time);
    source.stop(time + duration);
    this.#sources.add(source);
  }
}
