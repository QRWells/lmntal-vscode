"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compiler = void 0;
const vscode = require("vscode");
const cp = require("child_process");
class Compiler {
    static async compile(source) {
        const lmntal = vscode.workspace.getConfiguration('lmntal');
        const compilerPath = lmntal.get('compilerPath');
        const compilerArgs = lmntal.get('compilerArgs');
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
                }
                else {
                    reject(result);
                }
            });
        });
    }
}
exports.Compiler = Compiler;
//# sourceMappingURL=compiler.js.map