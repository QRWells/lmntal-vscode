import * as vscode from 'vscode'
import { LMNTAL_LANGUAGE_ID } from '../lmntal'

interface OutlineNode {
  readonly uri: vscode.Uri
  readonly symbol: vscode.DocumentSymbol
}

type OutlineSymbols = vscode.DocumentSymbol[] | vscode.SymbolInformation[]

export class OutlineProvider implements vscode.TreeDataProvider<OutlineNode> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<void>()
  readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event

  refresh (): void {
    this.onDidChangeTreeDataEmitter.fire()
  }

  getTreeItem (element: OutlineNode): vscode.TreeItem {
    const hasChildren = element.symbol.children.length > 0
    const item = new vscode.TreeItem(
      element.symbol.name,
      hasChildren
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    )

    item.description = element.symbol.detail
    item.command = {
      command: 'vscode.open',
      title: 'Open Symbol',
      arguments: [
        element.uri,
        {
          preview: false,
          selection: element.symbol.selectionRange
        } satisfies vscode.TextDocumentShowOptions
      ]
    }

    return item
  }

  async getChildren (element?: OutlineNode): Promise<OutlineNode[]> {
    if (element != null) {
      return element.symbol.children.map((child) => ({
        uri: element.uri,
        symbol: child
      }))
    }

    const editor = vscode.window.activeTextEditor
    if (editor == null || editor.document.languageId !== LMNTAL_LANGUAGE_ID) {
      return []
    }

    const symbols = await vscode.commands.executeCommand<OutlineSymbols>(
      'vscode.executeDocumentSymbolProvider',
      editor.document.uri
    )

    if (
      symbols == null ||
      symbols.length === 0 ||
      !isDocumentSymbolArray(symbols)
    ) {
      return []
    }

    return symbols.map((symbol) => ({
      uri: editor.document.uri,
      symbol
    }))
  }
}

function isDocumentSymbolArray (
  symbols: OutlineSymbols
): symbols is vscode.DocumentSymbol[] {
  return symbols.length === 0 || 'selectionRange' in symbols[0]
}
