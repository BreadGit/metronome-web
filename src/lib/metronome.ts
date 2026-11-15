import {
  INITIAL_STATE,
  latestDue,
  planTicks,
  type PlannedTick,
  type SchedulerState,
  type TickConfig,
} from "./scheduler";
import { loadSoundBank, type SoundBank, type SoundId } from "./sounds";

const TIMER_INTERVAL_MS = 25;
const MIN_LEAD_S = 0.05;
const LOOKAHEAD_S = 0.1;

export interface MetronomeConfig extends TickConfig {
  sound: SoundId;
}

export interface HeardBeat {
  beat: number;
  silent: boolean;
  age: number;
}

export class Metronome {
  config: MetronomeConfig;
  #sounds: Promise<SoundBank> | null = null;
  #context: AudioContext | null = null;
  #timer: ReturnType<typeof setInterval> | undefined;
  #session = 0;
  #running = false;
  #state: SchedulerState = INITIAL_STATE;
  #beats: PlannedTick[] = [];
  readonly #sources = new Set<AudioBufferSourceNode>();

  constructor(config: MetronomeConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.#running) return;
    this.#running = true;
    const session = ++this.#session;
    try {
      const context = (this.#context ??= new AudioContext({ latencyHint: "interactive" }));
      const [bank] = await Promise.all([this.#loadSounds(), context.resume()]);
      if (session !== this.#session) return;
      this.#state = INITIAL_STATE;
      this.#beats = [];
      const schedule = () => this.#schedule(context, bank);
      schedule();
      this.#timer = setInterval(schedule, TIMER_INTERVAL_MS);
    } catch (error) {
      if (session !== this.#session) return;
      this.stop();
      throw error;
    }
  }

  stop(): void {
    this.#running = false;
    this.#session++;
    clearInterval(this.#timer);
    this.#timer = undefined;
    for (const source of this.#sources) source.stop();
    this.#sources.clear();
    this.#beats = [];
    void this.#context?.suspend();
  }

  lastHeardBeat(): HeardBeat | null {
    const context = this.#context;
    if (!context || !this.#running) return null;
    const heardAt = this.#heardAt(context);
    const tick = latestDue(this.#beats, heardAt);
    return tick && { beat: tick.beat, silent: tick.silent, age: heardAt - tick.time };
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

  #schedule(context: AudioContext, bank: SoundBank): void {
    const now = context.currentTime;
    const { ticks, state } = planTicks(
      this.#state,
      this.config,
      now + MIN_LEAD_S,
      now + LOOKAHEAD_S,
    );
    this.#state = state;
    const sound = bank[this.config.sound];
    for (const tick of ticks) {
      if (!tick.silent) this.#play(context, sound[tick.type], tick.time, tick.duration);
      if (tick.type !== "sub") this.#beats.push(tick);
    }
    const latest = latestDue(this.#beats, this.#heardAt(context));
    if (latest) this.#beats = this.#beats.slice(this.#beats.indexOf(latest));
  }

  #play(context: AudioContext, buffer: AudioBuffer, time: number, duration: number): void {
    const source = new AudioBufferSourceNode(context, { buffer });
    source.connect(context.destination);
    source.onended = () => this.#sources.delete(source);
    source.start(time);
    source.stop(time + duration);
    this.#sources.add(source);
  }
}
