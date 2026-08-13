<script lang="ts">
  // A Svelte SSR page is two files: this component plus a sibling docs.ts config.
  // Props come from the config's props() (server-side) and hydrate in the browser.
  let { topic, hits } = $props();
  let clicks = $state(0);
</script>

<main>
  <h1>Docs: {topic}</h1>
  <p>{hits} visits so far</p>
  <button onclick={() => clicks++}>clicked {clicks} times</button>
</main>

<style>
  /* Scoped to this component and shipped as a stylesheet asset automatically. */
  h1 {
    color: rebeccapurple;
  }
</style>
