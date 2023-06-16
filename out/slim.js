"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Slim = void 0;
const vscode = require("vscode");
const cp = require("child_process");
class Slim {
    static async run(source) {
        const lmntal = vscode.workspace.getConfiguration("lmntal");
        const slimPath = lmntal.get("slimPath");
        if (slimPath === undefined) {
            vscode.window.showErrorMessage('Error: Slim not found. Please set the path to the slim in the settings.');
            return;
        }
        const slim = cp.spawn(slimPath, [source.fsPath]);
    }
}
exports.Slim = Slim;
//# sourceMappingURL=slim.js.map