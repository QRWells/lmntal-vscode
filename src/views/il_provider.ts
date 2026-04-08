import * as vscode from 'vscode'
import { Compiler } from '../compiler'

export class IlViewerProvider implements vscode.TextDocumentContentProvider {
  // emitter and its event
  onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>()
  onDidChange = this.onDidChangeEmitter.event

  async provideTextDocumentContent (uri: vscode.Uri): Promise<string> {
    const file = uri.path.replace(/\.[^.]+$/, '.lmn')

    try {
      const result = await Compiler.compile(vscode.Uri.file(file))
      return result ?? ''
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to compile. Check the compiler settings.'
      void vscode.window.showErrorMessage(message)
      return message
    }
  }
}
