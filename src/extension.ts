import * as vscode from 'vscode';
import { StateViewProvider } from './state_viewer';

export function activate(context: vscode.ExtensionContext) {

    const provider = new StateViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(StateViewProvider.viewType, provider));

    context.subscriptions.push(
        vscode.commands.registerCommand('lmntal.stateViewer.next', () => {
            provider.next();
        }));
}

