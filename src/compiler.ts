import * as vscode from 'vscode';
import * as cp from "child_process";

export class Compiler {
    static async compile(source: vscode.Uri): Promise<string | undefined> {
        const lmntal = vscode.workspace.getConfiguration('lmntal');
        const compilerPath = lmntal.get<string>('compilerPath');
        const compilerArgs = lmntal.get<string>('compilerArgs');
        // call if not undefined
        if (compilerPath === undefined || compilerArgs === undefined) {
            vscode.window.showErrorMessage('Error: Compiler not found. Please set the path to the compiler in the settings.');
            return undefined;
        }

        const compiler = cp.spawn(compilerPath, [compilerArgs, source.fsPath]);

        return new Promise((resolve, reject) => {
            let result = "";
            compiler.stdout.on('data', (data) => {
                result += data;
            });
            compiler.stderr.on('data', (data) => {
                result += data;
            });
            compiler.on('close', (code) => {
                if (code === 0) {
                    resolve(result);
                } else {
                    reject(result);
                }
            });
        });
    }
}