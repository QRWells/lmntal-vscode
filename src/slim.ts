import * as vscode from 'vscode'
import { getLmntalSettings } from './config'
import { runProcess } from './process'

function getSlimPath (): string | undefined {
  const { slimPath } = getLmntalSettings()

  if (slimPath.trim() === '') {
    void vscode.window.showErrorMessage(
      'Slim not found. Set `lmntal.slimPath` in the workspace settings.'
    )
    return undefined
  }

  return slimPath
}

export const Slim = {
  async run (source: vscode.Uri, args: string[]): Promise<string | undefined> {
    const slimPath = getSlimPath()
    if (slimPath === undefined) {
      return undefined
    }

    return await runProcess(slimPath, [...args, source.fsPath])
  },

  async runWithInput (
    input: string,
    args: string[]
  ): Promise<string | undefined> {
    const slimPath = getSlimPath()
    if (slimPath === undefined) {
      return undefined
    }

    return await runProcess(slimPath, args, { input })
  }
}
