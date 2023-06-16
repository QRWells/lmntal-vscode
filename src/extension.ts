import * as vscode from 'vscode';
import { IlViewerProvider } from './views/il_provider';

export function activate(context: vscode.ExtensionContext) {
    const ilScheme = 'lmntal-il';

    context.subscriptions.push(
        vscode.commands.registerCommand('lmntal.stateViewer', () => {
            const panel = vscode.window.createWebviewPanel(
                'stateViewer',
                'State Viewer',
                vscode.ViewColumn.Two
            );
            panel.webview.html = ""
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('lmntal.visualizer', () => { }));

    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(ilScheme, new IlViewerProvider));
    context.subscriptions.push(
        vscode.commands.registerCommand('lmntal.ilViewer', async () => {
            // get current document
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            const document = editor.document;
            const uri = document.uri;
            let ilFile = uri.path.replace(/\.[^\.]+$/, '.il');
            const ilUri = vscode.Uri.from({ scheme: ilScheme, path: ilFile });
            const doc = await vscode.workspace.openTextDocument(ilUri);
            await vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode.ViewColumn.Two });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('lmntal.slim', () => { }));
}