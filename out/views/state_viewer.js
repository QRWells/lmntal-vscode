"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateViewerPanel = void 0;
const vscode = require("vscode");
const cytoscape = require("cytoscape");
// import * as elk from 'cytoscape-elk';
let cy = cytoscape({
    // container: document.getElementById('stateviewer-graph'),
    boxSelectionEnabled: false,
    autounselectify: true,
    style: [
        {
            selector: 'node',
            style: {
                'content': 'data(label)'
                // 'content': ''
            }
        },
        {
            selector: 'edge',
            style: {
                'target-arrow-shape': 'triangle',
                'curve-style': 'straight',
                'target-arrow-color': '#000000',
                'arrow-scale': 1.5,
                'width': 2,
                'line-color': '#000000',
            }
        }
    ]
});
function graphClear() {
    cy.remove("*");
}
function makeLayout() {
    cy.resize();
    cy.layout({
        name: "elk",
        // elk: {
        //     algorithm: "layered",
        //     "spacing.nodeNode": 0
        // }
    }).run();
}
const default_opts = ["--hl", "--use-builtin-rule"];
const all_opts = ["--hl", "--use-builtin-rule", "--mem-enc", "--delta-mem"];
class StateViewerPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        // Set the webview's initial html content
        this._update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        this._panel.onDidChangeViewState(e => {
            if (this._panel.visible) {
                this._update();
            }
        }, null, this._disposables);
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }
    doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }
    dispose() {
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
    _update() {
        const webview = this._panel.webview;
        // Vary the webview's content based on where it is located in the editor.
    }
    _getHtmlForWebview(webview, catGifPath) {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'state-viewer.js');
        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
        // Local path to css styles
        const styleCytoPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'cyto.css');
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css');
        // Uri to load styles into webview
        const stylesCytoUri = webview.asWebviewUri(styleCytoPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesCytoUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>State Viewer</title>
			</head>
			<body>
                <div class="options" id="stateviewer-options"></div>
                <div class="results" id="stateviewer-results">
                    <div id="stateviewer-graph"></div>
                </div>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}
exports.StateViewerPanel = StateViewerPanel;
StateViewerPanel.cur_opts = default_opts;
StateViewerPanel.all_opts = all_opts;
StateViewerPanel.extra_opts = "";
StateViewerPanel.graph_stream = null;
StateViewerPanel.viewType = 'StateViewer';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=state_viewer.js.map