import * as vscode from 'vscode';

export class RuntimeControl implements vscode.WebviewViewProvider {
    public static readonly viewType = 'lmntal.slimControl';

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }
}