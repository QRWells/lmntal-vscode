import * as vscode from 'vscode';
import { Compiler } from '../compiler';

export class IlViewerProvider implements vscode.TextDocumentContentProvider {
    // emitter and its event
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
        let file = uri.path.replace(/\.[^\.]+$/, '.lmn');
        let result = Compiler.compile(vscode.Uri.file(file));
        if (result !== undefined) {
            return result;
        }
        return "";
    }
}