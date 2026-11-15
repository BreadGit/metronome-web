<script lang="ts">
  import { VOLUME } from "../lib/volume";

  interface Props {
    volume: number;
    muted: boolean;
  }

  let { volume = $bindable(), muted = $bindable() }: Props = $props();

  const silent = $derived(muted || volume === 0);
  const shown = $derived(muted ? 0 : volume);

  function toggleMute() {
    if (!silent) {
      muted = true;
      return;
    }
    muted = false;
    if (volume === 0) volume = VOLUME.default;
  }

  function slide(event: Event & { currentTarget: HTMLInputElement }) {
    volume = event.currentTarget.valueAsNumber;
    muted = false;
  }
</script>

<div class="volume">
  <button
    class="button quiet"
    type="button"
    aria-label={silent ? "Unmute" : "Mute"}
    title={silent ? "Unmute" : "Mute"}
    onclick={toggleMute}
  >
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3.5 9.5h3l5-4v13l-5-4h-3z" />
      {#if silent}
        <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" />
      {:else}
        <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
        {#if volume >= 50}
          <path d="M18 7a7 7 0 0 1 0 10" />
        {/if}
      {/if}
    </svg>
  </button>
  <input
    class="slider"
    type="range"
    min={VOLUME.min}
    max={VOLUME.max}
    step="1"
    value={shown}
    aria-label="Volume"
    aria-valuetext="{shown}%"
    oninput={slide}
  />
</div>

<style>
  .volume {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: -0.75rem;
  }

  .button {
    padding: 0;
    color: var(--muted);
  }

  .button:hover {
    color: var(--text);
  }

  .slider {
    flex: 1;
    min-width: 0;
    height: 44px;
    margin: 0;
    accent-color: var(--muted);
    cursor: pointer;
  }
</style>
