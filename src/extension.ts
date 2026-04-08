import * as vscode from 'vscode'
import { getLmntalSettings } from './config'
import { IlViewerProvider } from './views/il_provider'
import { Slim } from './slim'
import { LMNtalLanguageClient } from './client'
import { disableUpdateChecks, LMNTAL_LANGUAGE_ID } from './lmntal'
import { OutlineProvider } from './views/outline'

let client: LMNtalLanguageClient
export const outputChannel = vscode.window.createOutputChannel('LMNtal')
const commandOutputChannel = vscode.window.createOutputChannel('LMNtal Commands')

export function activate (context: vscode.ExtensionContext): void {
  const ilScheme = 'lmntal-il'
  const outlineProvider = new OutlineProvider()

  context.subscriptions.push(outputChannel, commandOutputChannel)

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
      if (document.isUntitled || document.isDirty) {
        void vscode.window.showWarningMessage(
          'Save the LMNtal document before opening the IL Viewer.'
        )
        return
      }

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

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('lmntal-outline', outlineProvider)
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
      const { slimArgs } = getLmntalSettings()

      try {
        const result =
          document.isDirty || document.isUntitled
            ? await Slim.runWithInput(document.getText(), [...slimArgs])
            : await Slim.run(uri, [...slimArgs])

        if (result === undefined) {
          return
        }

        commandOutputChannel.clear()
        commandOutputChannel.appendLine('[ Slim ]')
        commandOutputChannel.append(result)
        commandOutputChannel.show(true)

        void vscode.window.showInformationMessage(
          'Slim finished. See the LMNtal Commands output channel.'
        )
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Slim failed to run.'
        commandOutputChannel.appendLine(`[ Error ] ${message}`)
        commandOutputChannel.show(true)
        void vscode.window.showErrorMessage(message)
      }
    })
  )

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      outlineProvider.refresh()
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (isActiveLmntalDocument(event.document)) {
        outlineProvider.refresh()
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      if (document.languageId === LMNTAL_LANGUAGE_ID) {
        outlineProvider.refresh()
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (!e.affectsConfiguration('lmntal')) {
        return
      }

      if (
        e.affectsConfiguration('lmntal.serverPath') ||
        e.affectsConfiguration('lmntal.customArgs')
      ) {
        await client.restart()
        return
      }

      await client.sendNotification('workspace/didChangeConfiguration', {
        settings: disableUpdateChecks(getLmntalSettings())
      })
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('lmntal.restartServer', async () => {
      await client.stop()
      await client.start()
    })
  )

  client = new LMNtalLanguageClient(outputChannel)
  client.start().catch((error) => {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to activate the LMNtal extension.'
    outputChannel.appendLine(`[ Error ] ${message}`)
    void vscode.window.showErrorMessage(message)
  })
}

export function deactivate (): void {
  void client.stop()
}

function isActiveLmntalDocument (document: vscode.TextDocument): boolean {
  return (
    vscode.window.activeTextEditor?.document.uri.toString() ===
      document.uri.toString() &&
    document.languageId === LMNTAL_LANGUAGE_ID
  )
}
