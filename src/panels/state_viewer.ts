import * as vscode from 'vscode';
import { Uri, ViewColumn, Webview, window } from 'vscode';
import { getUri, getNonce } from '../utils';
import { slim2cy } from '../cyto';
import { Slim } from '../slim';

const default_opts = ["--hl", "--use-builtin-rule"];
const all_opts = ["--hl", "--use-builtin-rule", "--mem-enc", "--delta-mem"];

export class StateViewerPanel {
    public static readonly viewType = 'StateViewer';
    public static currentPanel: StateViewerPanel | undefined;
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

    public sameDoc(doc: vscode.Uri): boolean {
        return this._doc.fsPath === doc.fsPath;
    }

    public dispose() {
        StateViewerPanel.currentPanel = undefined;

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
            <title>State Viewer</title>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <link rel="stylesheet" type="text/css" href="${stylesUri}">
            </head>
            <body>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
        </html>
        `;
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
                const text = message.text;

                switch (command) {
                    case "hello":
                        // Code that should run in response to the hello message command
                        window.showInformationMessage(text);
                        return;
                    // Add more switch case statements here as more webview message commands
                    // are created within the webview context (i.e. inside media/main.js)
                }
            },
            undefined,
            this._disposables
        );
    }

    private sendContent(content: any[]) {
        this._panel.webview.postMessage(
            {
                command: 'data',
                content: content
            }
        )
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

        if (StateViewerPanel.currentPanel !== undefined) {
            // If the webview panel already exists reveal it
            StateViewerPanel.currentPanel._panel.reveal(ViewColumn.Two);
            needRerun = !StateViewerPanel.currentPanel.sameDoc(doc);
        } else {
            // If a webview panel does not already exist create and show a new one
            const panel = window.createWebviewPanel(
                // Panel view type
                "stateViewer",
                // Panel title
                "State Viewer",
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

            StateViewerPanel.currentPanel = new StateViewerPanel(panel, extensionUri, doc);
            needRerun = true;
        }

        if (needRerun) {
            let res = await Slim.run(editor.document.uri, ["--nd", "-t", "--dump-lavit", "--hide-ruleset"]);
            if (res === undefined) {
                vscode.window.showErrorMessage("Slim failed to run");
                StateViewerPanel.currentPanel._panel.reveal(ViewColumn.Two);
                return;
            }

            let content = slim2cy(res!);
            if (content !== null) {
                StateViewerPanel.currentPanel.sendContent(content);
            }
        }
    }
}
