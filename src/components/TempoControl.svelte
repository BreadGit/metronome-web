<script lang="ts">
  import { holdToRepeat } from "../lib/holdToRepeat";
  import { clampTempo, TEMPO, tempoMarking } from "../lib/music";
  import { isComposing } from "../lib/shortcuts";
  import { MAX_TEMPO_DIGITS, parseTempo, tempoDigits } from "../lib/tempoEntry";
  import { wheelToStep } from "../lib/wheelSteps";

  interface Props {
    tempo: number;
  }

  let { tempo = $bindable() }: Props = $props();

  const hintId = $props.id();
  let input: HTMLInputElement;
  let draft = $state<string | null>(null);
  const shown = $derived(draft ?? String(tempo));
  const pending = $derived(draft !== null && draft !== String(tempo));

  export function startDraft(digit: string) {
    draft = tempoDigits(digit);
    input.value = draft;
    input.focus();
    input.setSelectionRange(draft.length, draft.length);
  }

  function edit(event: Event & { currentTarget: HTMLInputElement }) {
    draft = tempoDigits(event.currentTarget.value);
    event.currentTarget.value = draft;
  }

  function confirm() {
    if (draft === null) return;
    const typed = parseTempo(draft);
    if (typed !== null) tempo = typed;
    draft = null;
  }

  function step(delta: number): boolean {
    input.blur();
    const next = clampTempo(tempo + delta);
    if (next === tempo) return false;
    tempo = next;
    return true;
  }

  function onkeydown(event: KeyboardEvent) {
    if (isComposing(event)) return;
    if (event.key === "Escape") draft = null;
    else if (event.key !== "Enter") return;
    event.preventDefault();
    input.blur();
  }
</script>

<section class="tempo" aria-label="Tempo">
  <p class="marking" data-testid="tempo-marking">{tempoMarking(tempo)}</p>
  <div class="row">
    <button
      class="button step"
      type="button"
      aria-label="Decrease tempo"
      {@attach holdToRepeat(() => step(-1))}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
    <label class="bpm">
      <input
        bind:this={input}
        class:pending
        style:--digits={Math.max(shown.length, 1)}
        type="text"
        inputmode="numeric"
        enterkeyhint="done"
        autocomplete="off"
        maxlength={MAX_TEMPO_DIGITS}
        value={shown}
        aria-label="Tempo in BPM"
        aria-describedby={pending ? hintId : undefined}
        oninput={edit}
        onclick={() => input.select()}
        onblur={confirm}
        {onkeydown}
        {@attach wheelToStep((delta) => {
          if (draft === null) step(delta);
        })}
      />
      <span id={hintId} class="label" aria-hidden="true">{pending ? "Enter to set" : "BPM"}</span>
    </label>
    <button
      class="button step"
      type="button"
      aria-label="Increase tempo"
      {@attach holdToRepeat(() => step(1))}
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
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  .bpm {
    display: grid;
    justify-items: center;
    width: calc(3ch + 0.2em);
    font-family: var(--font-numeric);
    font-size: clamp(3.5rem, min(22vw, 11dvh), 6.5rem);
    font-weight: 300;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .bpm input {
    width: calc(var(--digits) * 1ch + 0.2em);
    padding: 0.1em;
    border: 0;
    border-radius: 0.14em;
    background: transparent;
    font: inherit;
    font-variant-numeric: inherit;
    text-align: center;
    caret-color: var(--accent);
    cursor: text;
  }

  .bpm input::selection {
    background: color-mix(in srgb, var(--accent) 30%, transparent);
  }

  .bpm input:hover {
    background: color-mix(in srgb, var(--accent) 7%, transparent);
  }

  .bpm input:focus {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    box-shadow: inset 0 -3px var(--accent);
    outline: none;
  }

  .bpm input.pending {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    color: var(--accent);
  }

  .bpm .label {
    margin-top: 0.25rem;
    font-family: var(--font);
    line-height: 1.4;
    white-space: nowrap;
  }

  .slider {
    width: 100%;
    height: clamp(32px, 6dvh, 44px);
    margin: clamp(0px, 0.5dvh, 0.25rem) 0 0;
    accent-color: var(--accent);
    cursor: pointer;
  }
</style>
