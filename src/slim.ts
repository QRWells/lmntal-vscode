import * as vscode from 'vscode';
import * as cp from "child_process";

export class Slim {
    static async run(source: vscode.Uri): Promise<string | undefined> {
        const lmntal = vscode.workspace.getConfiguration("lmntal");
        const slimPath = lmntal.get<string>("slimPath");
        if (slimPath === undefined) {
            vscode.window.showErrorMessage('Error: Slim not found. Please set the path to the slim in the settings.');
            return;
        }

        const slim = cp.spawn(slimPath, [source.fsPath]);
    }
}