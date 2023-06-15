"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateViewProvider = void 0;
const vscode = require("vscode");
class StateViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                // case 'colorSelected':
                //     {
                //         vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
                //         break;
                //     }
            }
        });
    }
    next() {
        if (this._view) {
            this._view.show?.(true);
            this._view.webview.postMessage({ type: 'next' });
        }
    }
    _getHtmlForWebview(webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'state-viewer.js'));
        // Do the same for the stylesheet.
        const styleCytoUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'cyto.css'));
        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleCytoUri}" rel="stylesheet">
				<title>State Viewer</title>
			</head>
			<body>
				<div id="state-viewer"/>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}
exports.StateViewProvider = StateViewProvider;
StateViewProvider.viewType = 'lmntal.stateViewer';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=state_viewer.js.map