<script>
  import Visualizer from "./lib/Visualizer.svelte";
  import StateViewer from "./lib/StateViewer.svelte";
  import { onMount } from "svelte";

  let isVisualizer = false;

  onMount(() => {
    window.addEventListener("message", (event) => {
      const message = event.data; // The JSON data our extension sent

      switch (message.command) {
        case "visual":
          isVisualizer = true;
          break;
      }
    });
  });
</script>

<main>
  {#if isVisualizer}
    <Visualizer />
  {:else}
    <StateViewer />
  {/if}
</main>
