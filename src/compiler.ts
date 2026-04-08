import * as vscode from 'vscode'
import { getLmntalSettings } from './config'
import { runProcess } from './process'

function getCompilerPath (): string | undefined {
  const { compilerPath } = getLmntalSettings()

  if (compilerPath.trim() === '') {
    void vscode.window.showErrorMessage(
      'Compiler not found. Set `lmntal.compilerPath` in the workspace settings.'
    )
    return undefined
  }

  return compilerPath
}

export const Compiler = {
  async compile (source: vscode.Uri): Promise<string | undefined> {
    const compilerPath = getCompilerPath()
    if (compilerPath === undefined) {
      return undefined
    }

    const { compilerArgs } = getLmntalSettings()
    return await runProcess(compilerPath, [...compilerArgs, source.fsPath])
  },

  async compileWithArgs (
    source: vscode.Uri,
    args: string[]
  ): Promise<string | undefined> {
    const compilerPath = getCompilerPath()
    if (compilerPath === undefined) {
      return undefined
    }

    return await runProcess(compilerPath, [...args, source.fsPath])
  }
}
