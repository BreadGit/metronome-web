<script lang="ts" generics="T extends string | number">
  import ShortcutLabel from "./ShortcutLabel.svelte";

  interface Props {
    legend: string;
    shortcut?: string;
    options: readonly { value: T; label: string }[];
    value: T;
  }

  let { legend, shortcut, options, value = $bindable() }: Props = $props();
  const name = $props.id();
</script>

<fieldset>
  <legend class="label"><ShortcutLabel text={legend} letter={shortcut} /></legend>
  <div class="segments">
    {#each options as option (option.value)}
      <label>
        <input type="radio" {name} value={option.value} bind:group={value} />
        <span>{option.label}</span>
      </label>
    {/each}
  </div>
</fieldset>

<style>
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }

  legend {
    padding: 0;
    margin-bottom: 0.375rem;
  }

  .segments {
    display: flex;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    overflow: hidden;
  }

  label {
    flex: 1 1 0;
    position: relative;
    min-width: 0;
  }

  label + label {
    border-left: 1px solid var(--line);
  }

  input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  span {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 0.25rem;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    user-select: none;
  }

  label:hover span {
    background: color-mix(in srgb, var(--line) 45%, transparent);
  }

  input:checked + span {
    background: var(--accent);
    color: var(--bg);
  }

  input:focus-visible + span {
    outline: 2px solid var(--accent);
    outline-offset: -4px;
    box-shadow: inset 0 0 0 4px var(--bg);
  }
</style>
