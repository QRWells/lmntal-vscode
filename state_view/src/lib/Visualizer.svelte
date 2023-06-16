<script lang="ts">
    import cytoscape from "cytoscape";
    import cola from "cytoscape-cola";
    import { onMount } from "svelte";
    import { Pane, Splitpanes } from "svelte-splitpanes";
    import {
        provideVSCodeDesignSystem,
        vsCodeButton,
    } from "@vscode/webview-ui-toolkit";

    provideVSCodeDesignSystem().register(vsCodeButton());

    const vscode = acquireVsCodeApi();

    let refElement = null;
    let cyInstance: cytoscape.Core = null;
    let disable = false;
    let graph_data: string[] = [];
    let step_counter = 0;

    function makeLayout() {
        cyInstance.resize();
        cyInstance
            .layout({
                name: "cola",
                infinite: true,
                fit: false,
                ready: () => {
                    cyInstance.fit(20);
                },
            })
            .run();
    }

    onMount(() => {
        cytoscape.use(cola);

        cyInstance = cytoscape({
            container: refElement,
            boxSelectionEnabled: false,
            autounselectify: true,
            style: [
                {
                    selector: "node",
                    style: {
                        content: "data(label)",
                        "background-color": "#11479e",
                    },
                },
                {
                    selector: "edge",
                    style: {
                        "curve-style": "bezier",
                        width: 3,
                        "line-color": "#9dbaea",
                    },
                },
                {
                    selector: ".membrane",
                    style: {
                        shape: "roundrectangle",
                        content:
                            "data(label)" /* must be specified if you want to display the node text */,
                        "border-color": "#11479e",
                        "background-color": "#87ceeb",
                        "background-opacity": 0.3,
                    },
                },
            ],
        });

        vscode.postMessage({
            command: "ready",
        });

        window.addEventListener("message", (event) => {
            const message = event.data; // The JSON data our extension sent

            switch (message.command) {
                case "graph":
                    cyInstance.remove("*");
                    graph_data = JSON.parse(message.data);
                    console.log(message.data);
                    console.log(graph_data);
                    makeLayout();
                    break;
            }
        });
    });

    function next() {
        if (!graph_data) return;
        let res = graph_data[step_counter++];
        if (!res) {
            disable = true;
            return;
        }
        let data = JSON.parse(res.toString());
        cyInstance.remove("*");
        cyInstance.add(data);
        makeLayout();
    }
</script>

<Splitpanes class="default-theme" horizontal={true} style="height: 100vh">
    <Pane minSize={50} size={75}>
        <div class="graph" bind:this={refElement} />
    </Pane>
    <Pane minSize={25} class="control">
        <div class="control">
            <vscode-button on:click={next} disabled={disable}>
                Next
            </vscode-button>
        </div>
    </Pane>
</Splitpanes>

<style>
    .graph {
        height: 100%;
        width: 100%;
    }

    .control {
        height: 100%;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
