import * as vscode from 'vscode';
import { Uri, ViewColumn, Webview, window } from 'vscode';
import { getUri, getNonce } from '../utils';
import { Slim } from '../slim';
import { Compiler } from '../compiler';
import { Membrane, mem2cy } from '../lmntal';

export class VisualizerPanel {
    static graph_stream: string[] = [];

    public static readonly viewType = 'Visualizer';
    public static currentPanel: VisualizerPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _doc: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, doc: vscode.Uri) {
        this._panel = panel;
        this._doc = doc;
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Set the HTML content for the webview panel
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

        // Set an event listener to listen for messages passed from the webview context
        this._setWebviewMessageListener(this._panel.webview);
    }

    public dispose() {
        VisualizerPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    /**
     * Defines and returns the HTML that should be rendered within the webview panel.
     *
     * @remarks This is also the place where references to the Svelte webview build files
     * are created and inserted into the webview HTML.
     *
     * @param webview A reference to the extension webview
     * @param extensionUri The URI of the directory containing the extension
     * @returns A template string literal containing the HTML that should be
     * rendered within the webview panel
     */
    private _getWebviewContent(webview: Webview, extensionUri: Uri) {
        // The CSS file from the Svelte build output
        const stylesUri = getUri(webview, extensionUri, ["out", "assets", "index.css"]);
        // The JS file from the Svelte build output
        const scriptUri = getUri(webview, extensionUri, ["out", "assets", "index.js"]);

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
            <head>
            <title>Visualizer</title>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <link rel="stylesheet" type="text/css" href="${stylesUri}">
                <script defer nonce="${nonce}" src="${scriptUri}"></script>
            </head>
            <body>
            </body>
        </html>
        `;
    }

    public sameDoc(doc: vscode.Uri): boolean {
        return this._doc.fsPath === doc.fsPath;
    }

    public sendGraph(graph: string[]) {
        this._panel.webview.postMessage(
            {
                command: 'visual',
            }
        )
        let content = JSON.stringify(graph);
        this._panel.webview.postMessage(
            {
                command: 'graph',
                data: content,
            }
        )
    }

    /**
     * Sets up an event listener to listen for messages passed from the webview context and
     * executes code based on the message that is recieved.
     *
     * @param webview A reference to the extension webview
     * @param context A reference to the extension context
     */
    private _setWebviewMessageListener(webview: Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;

                switch (command) {
                    case "ready":
                        // this.init = Promise.resolve(true);
                        return;
                }
            },
            undefined,
            this._disposables
        );
    }

    private static async rerun(editor: vscode.TextEditor | undefined) {

        let il = await Compiler.compile_with_args(editor!.document.uri, ["--hl-opt", "--slimcode"]);
        if (il === undefined) {
            vscode.window.showErrorMessage("Compile failed");
            return;
        }

        let res = await Slim.run_with_input(il, ['--dump-json', '-t', '-']);
        if (res === undefined || res === "bad input file.\n") {
            vscode.window.showErrorMessage("Slim failed to run");
            return;
        }

        let results = res?.split("\n").filter((str) => str !== "");

        if (results === undefined) {
            vscode.window.showErrorMessage("Error parsing Slim output");
            VisualizerPanel.currentPanel!._panel.reveal(ViewColumn.Two);
            return;
        }

        let graph_stream: string[] = [];

        try {
            graph_stream = results.map((str) => JSON.stringify(mem2cy(new Membrane(JSON.parse(str)))));
        } catch (e) {
            vscode.window.showErrorMessage("Error parsing Slim output");
            return;
        }

        if (graph_stream.length === results.length) {
            VisualizerPanel.currentPanel!.sendGraph(graph_stream);
        }
    }

    /**
     * Renders the current webview panel if it exists otherwise a new webview panel
     * will be created and displayed.
     *
     * @param extensionUri The URI of the directory containing the extension.
     */
    public static async render(extensionUri: Uri) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const doc = editor.document.uri;
        let needRerun = false;

        if (VisualizerPanel.currentPanel) {
            // If the webview panel already exists reveal it
            VisualizerPanel.currentPanel._panel.reveal(ViewColumn.Two);
            needRerun = !VisualizerPanel.currentPanel.sameDoc(doc);
        } else {
            // If a webview panel does not already exist create and show a new one
            const panel = window.createWebviewPanel(
                // Panel view type
                "visualizer",
                // Panel title
                "Visualizer",
                // The editor column the panel should be displayed in
                ViewColumn.Two,
                // Extra panel configurations
                {
                    // Enable JavaScript in the webview
                    enableScripts: true,
                    // Restrict the webview to only load resources from the `out` and `webview-ui/public/build` directories
                    localResourceRoots: [Uri.joinPath(extensionUri, "out"), Uri.joinPath(extensionUri, "out/assets")],
                }
            );

            VisualizerPanel.currentPanel = new VisualizerPanel(panel, extensionUri, doc);
            needRerun = true;
        }

        if (needRerun) {
            await this.rerun(editor);
        }
    }
}
