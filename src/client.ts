import * as vscode from 'vscode'
import {
  LanguageClient,
  type LanguageClientOptions,
  RevealOutputChannelOn,
  type ServerOptions,
  State
} from 'vscode-languageclient/node'
import { getLmntalSettings } from './config'
import { LMNTAL_DOCUMENT_SELECTORS } from './lmntal'
import { findServer } from './server'

export class LMNtalLanguageClient {
  private client?: LanguageClient
  private readonly outputChannel: vscode.OutputChannel
  private isStopping = false

  constructor (outputChannel: vscode.OutputChannel) {
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

    const settings = getLmntalSettings()
    this.isStopping = false

    const serverOptions: ServerOptions = {
      command,
      args: settings.customArgs
    }

    const clientOptions: LanguageClientOptions = {
      documentSelector: [...LMNTAL_DOCUMENT_SELECTORS],
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
      if (stateChangeEvent.newState === State.Stopped && !this.isStopping) {
        await vscode.window.showErrorMessage(
          'Failed to initialize the extension'
        )
      }
    })

    await this.client.start()
  }

  async stop (): Promise<void> {
    if (this.client === undefined) {
      return
    }

    this.isStopping = true
    this.client.diagnostics?.clear()

    try {
      await this.client.stop()
    } finally {
      this.client = undefined
      this.isStopping = false
    }
  }

  async restart (): Promise<void> {
    await this.stop()
    await this.start()
  }

  async sendNotification (method: string, params: unknown): Promise<void> {
    await this.client?.sendNotification(method, params)
  }
}
