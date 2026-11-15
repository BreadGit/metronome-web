<script lang="ts">
  import BeatIndicators from "./components/BeatIndicators.svelte";
  import Segmented from "./components/Segmented.svelte";
  import SettingsDialog from "./components/SettingsDialog.svelte";
  import TempoControl from "./components/TempoControl.svelte";
  import { Metronome } from "./lib/metronome";
  import { BEATS, clampTempo, cycle, SUBDIVISIONS, toggleBeat } from "./lib/music";
  import { browserStorage, loadSettings, saveSettings } from "./lib/settings";
  import { isHandledNatively, shortcutFor } from "./lib/shortcuts";
  import { recordTap } from "./lib/tapTempo";

  const storage = browserStorage();
  const initialSettings = loadSettings(storage);
  let settings = $state(initialSettings);
  let playing = $state(false);
  let error = $state<string | null>(null);
  let taps: number[] = [];
  let settingsDialog: SettingsDialog;
  let tempoControl: TempoControl;

  const metronome = new Metronome(initialSettings);

  const range = (min: number, max: number) =>
    Array.from({ length: max - min + 1 }, (_, i) => ({ value: min + i, label: String(min + i) }));
  const beatOptions = range(BEATS.min, BEATS.max);
  const subdivisionOptions = range(SUBDIVISIONS.min, SUBDIVISIONS.max);

  $effect(() => {
    const snapshot = $state.snapshot(settings);
    metronome.config = snapshot;
    saveSettings(storage, snapshot);
  });

  $effect(() => {
    const root = document.documentElement;
    if (settings.theme === "system") delete root.dataset.theme;
    else root.dataset.theme = settings.theme;
  });

  function toggle() {
    error = null;
    if (playing) {
      metronome.stop();
      playing = false;
      return;
    }
    playing = true;
    metronome.start().catch((cause: unknown) => {
      console.error(cause);
      playing = false;
      error = "Could not start audio.";
    });
  }

  function tap() {
    const result = recordTap(taps, performance.now());
    taps = result.taps;
    if (result.tempo !== null) settings.tempo = result.tempo;
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || isHandledNatively(event.target, event.key)) return;
    const action = shortcutFor(event);
    if (!action) return;
    event.preventDefault();
    switch (action.kind) {
      case "toggle":
        if (!event.repeat) toggle();
        break;
      case "tap":
        if (!event.repeat) tap();
        break;
      case "typeTempo":
        tempoControl.startDraft(event.key);
        break;
      case "tempo":
        settings.tempo = clampTempo(settings.tempo + action.delta);
        break;
      case "beats":
        settings.beats = cycle(settings.beats, action.delta, BEATS);
        break;
      case "subdivisions":
        settings.subdivisions = cycle(settings.subdivisions, action.delta, SUBDIVISIONS);
        break;
    }
  }

  function onkeyup(event: KeyboardEvent) {
    if (isHandledNatively(event.target, event.key)) return;
    if (shortcutFor(event)?.kind === "toggle") event.preventDefault();
  }
</script>

<svelte:window {onkeydown} {onkeyup} />

<main>
  <header>
    <h1>Metronome</h1>
    <button
      class="button quiet"
      type="button"
      aria-label="Settings"
      title="Settings"
      onclick={() => settingsDialog.open()}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M4 7h9M19 7h1M4 17h3M13 17h7" stroke-linecap="round" />
        <circle cx="16" cy="7" r="2.5" />
        <circle cx="10" cy="17" r="2.5" />
      </svg>
    </button>
  </header>

  <BeatIndicators
    beats={settings.beats}
    silentBeats={settings.silentBeats}
    {playing}
    heardBeat={() => metronome.lastHeardBeat()}
    onToggle={(beat) => (settings.silentBeats = toggleBeat(settings.silentBeats, beat))}
  />

  <TempoControl bind:this={tempoControl} bind:tempo={settings.tempo} />

  <div class="meter">
    <Segmented legend="Beats" options={beatOptions} bind:value={settings.beats} />
    <Segmented
      legend="Subdivisions"
      options={subdivisionOptions}
      bind:value={settings.subdivisions}
    />
  </div>

  <div class="actions">
    <button class="button tap" type="button" onclick={tap}>Tap</button>
    <button class="button primary start" type="button" onclick={toggle}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {#if playing}
          <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" />
        {:else}
          <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
        {/if}
      </svg>
      {playing ? "Stop" : "Start"}
    </button>
  </div>
  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}
</main>

<SettingsDialog bind:this={settingsDialog} bind:settings />

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
    max-width: 30rem;
    min-height: 100dvh;
    margin: 0 auto;
    padding: 0.5rem clamp(16px, 5vw, 2rem) 1.5rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: -0.75rem;
  }

  h1 {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 600;
  }

  .meter {
    display: grid;
    gap: 1rem;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 0.75rem;
    margin-top: auto;
  }

  .actions .button {
    min-height: 64px;
    font-size: 1.125rem;
  }

  @media (min-width: 640px) {
    main {
      min-height: auto;
      padding-top: 1rem;
      padding-bottom: 3rem;
    }

    .actions {
      margin-top: 0.5rem;
    }
  }

  .error {
    margin: -0.75rem 0 0;
    color: var(--text);
    text-align: center;
  }
</style>
