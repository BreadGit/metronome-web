<script lang="ts">
  import { THEMES, type Settings, type Theme } from "../lib/settings";
  import { SHORTCUTS } from "../lib/shortcuts";
  import { SOUNDS } from "../lib/sounds";
  import Segmented from "./Segmented.svelte";

  interface Props {
    settings: Settings;
  }

  let { settings = $bindable() }: Props = $props();

  const THEME_LABELS: Record<Theme, string> = {
    system: "System",
    light: "Light",
    dark: "Dark",
  };
  const themeOptions = THEMES.map((value) => ({ value, label: THEME_LABELS[value] }));

  let dialog: HTMLDialogElement;

  export function open() {
    dialog.showModal();
  }
</script>

<dialog bind:this={dialog} aria-labelledby="settings-title" closedby="any">
  <div class="content">
    <header>
      <h2 id="settings-title">Settings</h2>
      <button class="button quiet" type="button" onclick={() => dialog.close()}>Close</button>
    </header>

    <label class="field">
      <span class="label">Sound</span>
      <select bind:value={settings.sound}>
        {#each SOUNDS as sound (sound.id)}
          <option value={sound.id}>{sound.label}</option>
        {/each}
      </select>
    </label>

    <label class="check">
      <input type="checkbox" bind:checked={settings.emphasizeFirstBeat} />
      Emphasize first beat
    </label>

    <Segmented legend="Theme" options={themeOptions} bind:value={settings.theme} />

    <section class="about" aria-labelledby="about-title">
      <h3 id="about-title" class="label">About</h3>
      <p>
        Version {__APP_VERSION__} ·
        <a href="https://github.com/BreadGit/metronome-web">Source code</a> ·
        <a href="https://www.gnu.org/licenses/gpl-3.0.html">GPL-3.0</a>
      </p>
      <p>
        A web port of
        <a href="https://github.com/Kr0oked/Metronome">Metronome</a>
        by Philipp Bobek (Kr0oked).
      </p>
      <h3 class="label">Keyboard</h3>
      <dl class="shortcuts">
        {#each SHORTCUTS as shortcut (shortcut.label)}
          <dt><kbd>{shortcut.label}</kbd></dt>
          <dd>{shortcut.description}</dd>
        {/each}
      </dl>
    </section>
  </div>
</dialog>

<style>
  dialog {
    width: min(26rem, calc(100% - 2rem));
    max-height: calc(100dvh - 2rem);
    padding: 0;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--text);
  }

  dialog::backdrop {
    background: rgb(0 0 0 / 0.45);
  }

  .content {
    display: grid;
    gap: 1.25rem;
    padding: 1rem 1.25rem 1.5rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font-size: 1.25rem;
  }

  h3 {
    margin: 0;
  }

  .field {
    display: grid;
    gap: 0.375rem;
  }

  select {
    min-height: 44px;
    padding: 0 0.75rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }

  .check {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 44px;
    cursor: pointer;
  }

  .check input {
    width: 1.25rem;
    height: 1.25rem;
    margin: 0;
    accent-color: var(--accent);
  }

  .about {
    display: grid;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--line);
    font-size: 0.9375rem;
  }

  .about p {
    margin: 0;
  }

  .about h3:not(:first-child) {
    margin-top: 0.5rem;
  }

  .shortcuts {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.375rem 1rem;
    margin: 0;
  }

  dd {
    margin: 0;
    color: var(--muted);
  }

  kbd {
    padding: 0.0625rem 0.375rem;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: var(--surface);
    font-family: inherit;
    font-size: 0.875rem;
    white-space: nowrap;
  }
</style>
