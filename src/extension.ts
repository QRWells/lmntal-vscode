import * as vscode from 'vscode';
import { IlViewerProvider } from './views/il_provider';
import { Slim } from './slim';
import { LMNtalFormatter } from './formatter';

export function activate(context: vscode.ExtensionContext) {
    const ilScheme = 'lmntal-il';

    // register IL viewer
    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(ilScheme, new IlViewerProvider));
    context.subscriptions.push(
        vscode.commands.registerCommand('lmntal.ilViewer', async () => {
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

    // register slim runner
    context.subscriptions.push(
        vscode.commands.registerCommand('lmntal.slim', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            const document = editor.document;
            const uri = document.uri;
            // TODO: run slim
            const lmntal = vscode.workspace.getConfiguration("lmntal");
            let args = lmntal.get<string[]>("fastRunArgs");
            if (args === undefined) {
                args = [];
            }
            let res = await Slim.run(uri, args);
            if (res === undefined) {
                vscode.window.showErrorMessage("Slim failed to run");
                return;
            }
            vscode.window.showInformationMessage(res);
        }));

    vscode.languages.registerDocumentFormattingEditProvider('lmntal', new LMNtalFormatter);
}