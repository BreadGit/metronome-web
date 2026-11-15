<script lang="ts">
  interface Props {
    text: string;
    letter?: string;
  }

  let { text, letter }: Props = $props();

  const at = $derived(letter ? text.toLowerCase().indexOf(letter.toLowerCase()) : -1);
</script>

<span
  >{#if at < 0}{text}{:else}{text.slice(0, at)}<u>{text[at]}</u>{text.slice(at + 1)}{/if}</span
>

<style>
  u {
    text-underline-offset: 0.15em;
  }
</style>
