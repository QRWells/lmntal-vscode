import * as vscode from 'vscode';
import { Compiler } from '../compiler';

export class IlViewerProvider implements vscode.TextDocumentContentProvider {
    // emitter and its event
    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
    onDidChange = this.onDidChangeEmitter.event;

    provideTextDocumentContent(uri: vscode.Uri): vscode.ProviderResult<string> {
        let file = uri.path.replace(/\.[^\.]+$/, '.lmn');
        let result = Compiler.compile(vscode.Uri.file(file));
        // if rejected, show error message
        result.catch(() => {
            vscode.window.showErrorMessage("Error: Failed to compile. Please check the compiler settings.");
        });
        return result;
    }
}