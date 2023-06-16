import * as vscode from 'vscode';

export class ElementProvider implements vscode.TreeDataProvider<Element>{
    onDidChangeTreeData?: vscode.Event<void | Element | Element[] | null | undefined> | undefined;
    getTreeItem(element: Element): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: Element | undefined): vscode.ProviderResult<Element[]> {
        throw new Error('Method not implemented.');
    }
    getParent?(element: Element): vscode.ProviderResult<Element> {
        throw new Error('Method not implemented.');
    }
    resolveTreeItem?(item: vscode.TreeItem, element: Element, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }
}

class Element implements vscode.TreeItem {

}