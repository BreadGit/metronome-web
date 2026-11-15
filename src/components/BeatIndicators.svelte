<script lang="ts">
  import type { HeardBeat } from "../lib/metronome";

  const FLASH_S = 0.12;

  interface Props {
    beats: number;
    silentBeats: readonly number[];
    playing: boolean;
    heardBeat: () => HeardBeat | null;
    onToggle: (beat: number) => void;
  }

  let { beats, silentBeats, playing, heardBeat, onToggle }: Props = $props();

  let lit = $state<number | null>(null);

  $effect(() => {
    if (!playing) {
      lit = null;
      return;
    }
    let frame = requestAnimationFrame(function update() {
      const heard = heardBeat();
      lit = heard && heard.age < FLASH_S ? heard.beat : null;
      frame = requestAnimationFrame(update);
    });
    return () => cancelAnimationFrame(frame);
  });
</script>

<div class="beats" role="group" aria-label="Beat pattern">
  {#each { length: beats }, beat (beat)}
    {@const silent = silentBeats.includes(beat)}
    <button
      type="button"
      class="beat"
      class:silent
      class:lit={lit === beat}
      aria-pressed={silent}
      aria-label="Mute beat {beat + 1}"
      title="Mute beat {beat + 1}"
      onclick={() => onToggle(beat)}
    >
      <span class="dot"></span>
    </button>
  {/each}
</div>

<style>
  .beats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem;
  }

  .beat {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    touch-action: manipulation;
  }

  .dot {
    width: 32px;
    height: 32px;
    border: 3px solid var(--line);
    border-radius: 50%;
    background: var(--line);
    transition:
      background-color 200ms ease-out,
      border-color 200ms ease-out;
  }

  .beat:hover .dot {
    border-color: var(--muted);
  }

  .silent .dot {
    background: transparent;
  }

  .lit .dot {
    border-color: var(--accent);
    background: var(--accent);
    transition: none;
  }

  .lit.silent .dot {
    border-color: var(--muted);
    background: transparent;
  }
</style>
