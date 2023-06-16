"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IlViewerProvider = void 0;
const vscode = require("vscode");
const compiler_1 = require("../compiler");
class IlViewerProvider {
    constructor() {
        // emitter and its event
        this.onDidChangeEmitter = new vscode.EventEmitter();
        this.onDidChange = this.onDidChangeEmitter.event;
    }
    provideTextDocumentContent(uri, token) {
        let file = uri.path.replace(/\.[^\.]+$/, '.lmn');
        let result = compiler_1.Compiler.compile(vscode.Uri.file(file));
        if (result !== undefined) {
            return result;
        }
        return "";
    }
}
exports.IlViewerProvider = IlViewerProvider;
//# sourceMappingURL=il_provider.js.map