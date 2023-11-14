import * as vscode from 'vscode';

export class LMNtalFormatter implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
        // all (',' or '=' or ":-") without a space after them
        const post = /(?:,|=|:-|\|)(\S)/g;
        // all ('=', ":-") without a space before them
        const pre = /(\S)(?:=|:-|\|)/g;
        const operator = /([^,:{}()\|\[\]\s])(?:\+|-|\*|\/)(\S)/g;
        const text = document.getText();
        let match;
        const edits = [];
        // find comment lines (start with '//' or '%' or block comment '/* */')
        const linesContainsComment: Set<number> = new Set();
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            if (line.text.startsWith('//') || line.text.startsWith('%')) {
                linesContainsComment.add(i);
            }
            if (line.text.startsWith('/*')) {
                linesContainsComment.add(i);
                var commentLine = document.lineAt(i);
                while (!commentLine.text.endsWith('*/')) {
                    commentLine = document.lineAt(++i);
                    linesContainsComment.add(i);
                }
            }
        }
        while (match = post.exec(text)) {
            // except line comment
            const startPos = document.positionAt(match.index + 1);
            if (linesContainsComment.has(startPos.line)) {
                continue;
            }
            edits.push(vscode.TextEdit.insert(startPos, ' '));
        }
        while (match = pre.exec(text)) {
            const endPos = document.positionAt(match.index + 1);
            if (linesContainsComment.has(endPos.line)) {
                continue;
            }
            edits.push(vscode.TextEdit.insert(endPos, ' '));
        }
        while (match = operator.exec(text)) {
            const startPos = document.positionAt(match.index + 1);
            const endPos = document.positionAt(match.index + 2);
            if (linesContainsComment.has(startPos.line)) {
                continue;
            }
            edits.push(vscode.TextEdit.insert(startPos, ' '));
            edits.push(vscode.TextEdit.insert(endPos, ' '));
        }
        return edits;
    }
}