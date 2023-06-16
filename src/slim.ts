import * as vscode from 'vscode';
import * as cp from "child_process";

export class Slim {
    static async run(source: vscode.Uri, args: string[]): Promise<string | undefined> {
        const lmntal = vscode.workspace.getConfiguration("lmntal");
        const slimPath = lmntal.get<string>("slimPath");
        if (slimPath === undefined || slimPath === "") {
            vscode.window.showErrorMessage('Error: Slim not found. Please set the path to the slim in the settings.');
            return;
        }
        // concat args and source
        args.push(source.fsPath);
        const slim = cp.spawn(slimPath, args);

        return new Promise((resolve, reject) => {
            let result = "";
            slim.stdout.on('data', (data) => {
                result += data;
            });
            slim.stderr.on('data', (data) => {
                result += data;
            });
            slim.on('error', (err) => {
                reject(err);
            });
            slim.on('close', (code) => {
                if (code === 0) {
                    resolve(result);
                } else {
                    reject(result);
                }
            });
        });
    }

    static async run_with_input(input: string, args: string[]): Promise<string | undefined> {
        const lmntal = vscode.workspace.getConfiguration("lmntal");
        const slimPath = lmntal.get<string>("slimPath");
        if (slimPath === undefined || slimPath === "") {
            vscode.window.showErrorMessage('Error: Slim not found. Please set the path to the slim in the settings.');
            return;
        }
        // concat args and source
        const slim = cp.spawn(slimPath, args);
        slim.stdin.write(input);
        slim.stdin.end();

        return new Promise((resolve, reject) => {
            let result = "";
            slim.stdout.on('data', (data) => {
                result += data;
            });
            slim.stderr.on('data', (data) => {
                result += data;
            });
            slim.on('error', (err) => {
                reject(err);
            });
            slim.on('close', (code) => {
                if (code === 0) {
                    resolve(result);
                } else {
                    reject(result);
                }
            });
        });
    }
}