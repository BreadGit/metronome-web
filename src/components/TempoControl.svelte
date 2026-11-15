<script lang="ts">
  import { clampTempo, TEMPO, tempoMarking } from "../lib/music";

  interface Props {
    tempo: number;
  }

  let { tempo = $bindable() }: Props = $props();

  function commit(event: Event & { currentTarget: HTMLInputElement }) {
    const typed = event.currentTarget.valueAsNumber;
    if (Number.isFinite(typed)) tempo = clampTempo(typed);
    event.currentTarget.value = String(tempo);
  }
</script>

<section class="tempo" aria-label="Tempo">
  <p class="marking" data-testid="tempo-marking">{tempoMarking(tempo)}</p>
  <div class="row">
    <button
      class="button step"
      type="button"
      aria-label="Decrease tempo"
      onclick={() => (tempo = clampTempo(tempo - 1))}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
    <label class="bpm">
      <input
        type="number"
        inputmode="numeric"
        min={TEMPO.min}
        max={TEMPO.max}
        value={tempo}
        aria-label="Tempo in BPM"
        onchange={commit}
      />
      <span class="label" aria-hidden="true">BPM</span>
    </label>
    <button
      class="button step"
      type="button"
      aria-label="Increase tempo"
      onclick={() => (tempo = clampTempo(tempo + 1))}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
  </div>
  <input
    class="slider"
    type="range"
    min={TEMPO.min}
    max={TEMPO.max}
    bind:value={tempo}
    aria-label="Tempo slider"
  />
</section>

<style>
  .tempo {
    display: grid;
    justify-items: center;
    gap: 0.25rem;
  }

  .marking {
    margin: 0;
    color: var(--muted);
    font-size: 1.125rem;
    font-style: italic;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .step {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    padding: 0;
  }

  .bpm {
    display: grid;
    justify-items: center;
  }

  .bpm input {
    width: 3.2ch;
    padding: 0;
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    font-family: var(--font-numeric);
    font-size: clamp(4.5rem, 22vw, 6.5rem);
    font-weight: 300;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    text-align: center;
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .bpm input:hover,
  .bpm input:focus {
    border-bottom-color: var(--line);
  }

  .bpm input::-webkit-inner-spin-button,
  .bpm input::-webkit-outer-spin-button {
    appearance: none;
    margin: 0;
  }

  .bpm .label {
    margin-top: -0.25rem;
  }

  .slider {
    width: 100%;
    height: 44px;
    margin: 0.25rem 0 0;
    accent-color: var(--accent);
    cursor: pointer;
  }
</style>
