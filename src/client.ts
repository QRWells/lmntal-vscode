import * as vscode from 'vscode'
import {
  LanguageClient,
  type LanguageClientOptions,
  RevealOutputChannelOn,
  type ServerOptions,
  State
} from 'vscode-languageclient/node'
import { findServer } from './server'

export class LMNtalLanguageClient {
  private client?: LanguageClient
  private readonly context: vscode.ExtensionContext
  private readonly outputChannel: vscode.OutputChannel

  constructor (
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel
  ) {
    this.context = context
    this.outputChannel = outputChannel
  }

  async start (): Promise<void> {
    const command = await findServer()

    if (command === undefined) {
      this.outputChannel.appendLine('[ Info ] Aborting server start.')
      await vscode.window.showErrorMessage(
        'Not starting LMNtal Language Server as a suitable binary was not found.'
      )
      return
    }

    // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
    const customArgs = vscode.workspace
      .getConfiguration('lmntal')
      .get('customArgs') as string[]

    const serverOptions: ServerOptions = {
      command,
      args: customArgs
    }

    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: 'file', language: 'lmntal' }],
      synchronize: {
        fileEvents: vscode.workspace.createFileSystemWatcher('**/.lmntal')
      },
      outputChannel: this.outputChannel,
      revealOutputChannelOn: RevealOutputChannelOn.Error
    }

    this.client = new LanguageClient(
      'lmntal-lc',
      'LMNtal Language Client',
      serverOptions,
      clientOptions
    )

    this.client.onDidChangeState(async (stateChangeEvent) => {
      if (stateChangeEvent.newState === State.Stopped) {
        await vscode.window.showErrorMessage(
          'Failed to initialize the extension'
        )
      } else if (stateChangeEvent.newState === State.Running) {
        await vscode.window.showInformationMessage(
          'Extension initialized successfully!'
        )
      }
    })

    await this.client.start()
  }

  async stop (): Promise<void> {
    this.client?.diagnostics?.clear()
    await this.client?.stop()
  }

  async restart (): Promise<void> {
    await this.stop()
    await this.start()
  }

  async sendNotification (method: string, params: any): Promise<void> {
    await this.client?.sendNotification(method, params)
  }
}
