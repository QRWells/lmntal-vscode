"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const state_viewer_1 = require("./views/state_viewer");
function activate(context) {
    const provider = new state_viewer_1.StateViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(state_viewer_1.StateViewProvider.viewType, provider));
    context.subscriptions.push(vscode.commands.registerCommand('lmntal.stateViewer.next', () => {
        provider.next();
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map