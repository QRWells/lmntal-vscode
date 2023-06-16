<script lang="ts">
    import cytoscape from "cytoscape";
    import elk from "cytoscape-elk";
    import { onMount } from "svelte";
    import { Pane, Splitpanes } from "svelte-splitpanes";

    let refElement = null;
    let cyInstance: cytoscape.Core = null;

    function makeLayout() {
        cyInstance.resize();
        cyInstance
            .layout({
                name: "elk",
                elk: {
                    algorithm: "layered",
                    "spacing.nodeNode": 0,
                },
            })
            .run();
    }

    function resize() {
        cyInstance.resize();
    }

    onMount(() => {
        cytoscape.use(elk);

        cyInstance = cytoscape({
            container: refElement,
            boxSelectionEnabled: false,
            autounselectify: true,
            style: [
                {
                    selector: "node",
                    style: {
                        content: "data(label)",
                        // 'content': ''
                    },
                },
                {
                    selector: "edge",
                    style: {
                        "target-arrow-shape": "triangle",
                        "curve-style": "straight",
                        "target-arrow-color": "#000000",
                        "arrow-scale": 1.5,
                        width: 2,
                        "line-color": "#000000",
                    },
                },
            ],
        });
    });

    window.addEventListener("message", (event) => {
        const message = event.data; // The JSON data our extension sent

        switch (message.command) {
            case "data":
                cyInstance.remove("*");
                cyInstance.add(message.content);
                makeLayout();
                break;
        }
    });
</script>

<Splitpanes
    class="default-theme"
    horizontal={true}
    style="height: 100vh"
    on:resized={resize}
>
    <Pane minSize={50} size={75}>
        <div class="graph" bind:this={refElement} />
    </Pane>
    <Pane minSize={25} class="control">
        <div class="control" />
    </Pane>
</Splitpanes>

<style>
    .graph {
        height: 100%;
        width: 100%;
    }
</style>
