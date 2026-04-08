import * as vscode from 'vscode'
import { type LmntalSettings } from './lmntal'

export function getLmntalSettings (): LmntalSettings {
  const config = vscode.workspace.getConfiguration('lmntal')
  const serverPath = config.get<string | null>('serverPath') ?? null

  return {
    slimPath: config.get<string>('slimPath') ?? 'slim',
    slimArgs: config.get<string[]>('slimArgs') ?? [],
    compilerPath: config.get<string>('compilerPath') ?? 'lmntal',
    compilerArgs: config.get<string[]>('compilerArgs') ?? ['-O3'],
    serverPath:
      serverPath == null || serverPath.trim() === '' ? null : serverPath,
    customArgs: config.get<string[]>('customArgs') ?? [],
    checkForUpdates: config.get<boolean>('checkForUpdates') ?? true
  }
}
