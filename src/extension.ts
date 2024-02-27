import * as vscode from 'vscode'
import { IlViewerProvider } from './views/il_provider'
import { Slim } from './slim'
import { LMNtalLanguageClient } from './client'

let client: LMNtalLanguageClient
export const outputChannel = vscode.window.createOutputChannel('LMNtal')

export function activate (context: vscode.ExtensionContext): void {
  const ilScheme = 'lmntal-il'

  // register IL viewer
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      ilScheme,
      new IlViewerProvider()
    )
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('lmntal.ilViewer', async () => {
      const editor = vscode.window.activeTextEditor
      if (editor == null) {
        return
      }
      const document = editor.document
      const uri = document.uri
      const ilFile = uri.path.replace(/\.[^.]+$/, '.il')
      const ilUri = vscode.Uri.from({ scheme: ilScheme, path: ilFile })
      const doc = await vscode.workspace.openTextDocument(ilUri)
      await vscode.window.showTextDocument(doc, {
        preview: false,
        viewColumn: vscode.ViewColumn.Two
      })
    })
  )

  // register slim runner
  context.subscriptions.push(
    vscode.commands.registerCommand('lmntal.slim', async () => {
      const editor = vscode.window.activeTextEditor
      if (editor == null) {
        return
      }
      const document = editor.document
      const uri = document.uri
      // TODO: run slim
      const lmntal = vscode.workspace.getConfiguration('lmntal')
      let args = lmntal.get<string[]>('fastRunArgs')
      if (args === undefined) {
        args = []
      }
      const res = await Slim.run(uri, args)
      if (res === undefined) {
        await vscode.window.showErrorMessage('Slim failed to run')
        return
      }
      await vscode.window.showInformationMessage(res)
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('lmntal.serverPath')) {
        await client.stop()
        await client.start()
      } else {
        await client.sendNotification('workspace/didChangeConfiguration', {
          settings: {
            ...vscode.workspace.getConfiguration('lmntal'),
            checkForUpdates: false
          }
        })
      }
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('lmntal.restartServer', async () => {
      await client.stop()
      await client.start()
    })
  )

  client = new LMNtalLanguageClient(context, outputChannel)
  client.start().catch((error) => {
    console.log('Failed to activate LMNtal extension. ' + error)
  })
}

export function deactivate (): void {
  void client.stop()
}
