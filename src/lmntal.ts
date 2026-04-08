import path from 'path'

export const LMNTAL_LANGUAGE_ID = 'lmntal'

export const LMNTAL_DOCUMENT_SELECTORS = [
  { scheme: 'file', language: LMNTAL_LANGUAGE_ID },
  { scheme: 'untitled', language: LMNTAL_LANGUAGE_ID }
] as const

export interface LmntalSettings {
  slimPath: string
  slimArgs: string[]
  compilerPath: string
  compilerArgs: string[]
  serverPath: string | null
  customArgs: string[]
  checkForUpdates: boolean
}

export function disableUpdateChecks (
  settings: LmntalSettings
): LmntalSettings {
  return {
    ...settings,
    checkForUpdates: false
  }
}

export function resolveConfiguredServerPath (
  serverPath: string | null | undefined,
  workspaceFolderPath?: string
): string | undefined {
  const normalizedServerPath = serverPath?.trim()
  if (normalizedServerPath == null || normalizedServerPath === '') {
    return undefined
  }

  if (path.isAbsolute(normalizedServerPath)) {
    return normalizedServerPath
  }

  if (workspaceFolderPath == null || workspaceFolderPath === '') {
    return path.resolve(normalizedServerPath)
  }

  return path.resolve(workspaceFolderPath, normalizedServerPath)
}
