/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { outputChannel } from './extension'
import { execFile, type ExecException, spawn } from 'child_process'
import { stat } from 'fs/promises'
import fetch, { AbortError } from 'node-fetch'
import { join } from 'path'
import { promisify } from 'util'
import { type Progress, ProgressLocation, window, workspace } from 'vscode'
import { getLmntalSettings } from './config'
import { resolveConfiguredServerPath } from './lmntal'

interface CratesIoResponse {
  crate?: {
    max_version?: string
  }
}

export async function findServer (): Promise<string | undefined> {
  const serverPath = await findServerPath()

  if (serverPath == null || !(await checkValidity(serverPath))) {
    return undefined
  }

  outputChannel.appendLine(`[ Info ] Using server path ${serverPath}.`)

  const settings = getLmntalSettings()

  const currentVersion = await promisify(execFile)(serverPath, ['--version']).then(
    ({ stdout }) =>
      stdout
        .toString()
        .trim()
        .match(/[0-9]+\.[0-9]+\.[0-9]+/)?.[0] ?? 'unknown'
  )
  outputChannel.appendLine(`[ Info ] Server version: v${currentVersion}`)

  if (settings.checkForUpdates && settings.serverPath === null) {
    outputChannel.appendLine('[ Info ] Checking for updates...')

    try {
      const abortController = new AbortController()
      const timeout = setTimeout(() => {
        abortController.abort()
      }, 2500)
      let res

      try {
        const response = await fetch(
          'https://crates.io/api/v1/crates/lmntal-language-server',
          { signal: abortController.signal }
        )
        res = (await response.json()) as CratesIoResponse
      } catch (e) {
        if (e instanceof AbortError) {
          outputChannel.appendLine(
            '[ Error ] Update check timed out after 2500ms.'
          )
          return serverPath
        } else {
          throw e
        }
      } finally {
        clearTimeout(timeout)
      }

      const latestVersion = res.crate?.max_version

      if (latestVersion != null && currentVersion !== latestVersion) {
        const choice = await window.showInformationMessage(
          `A new version of the LMNtal Language Server is available (v${currentVersion} --> v${latestVersion}). Would you like to update automatically?`,
          'Yes'
        )

        if (choice === 'Yes') {
          if (!(await installBinaryViaCargoInstall())) {
            await window.showErrorMessage(
              'Failed to update LMNtal Language Server.'
            )
          }
        }
      }
    } catch (_) {
      outputChannel.appendLine('[ Error ] Failed to run update check.')
    }
  }

  return serverPath
}

async function findServerPath (): Promise<string | undefined> {
  const settings = getLmntalSettings()
  const workspaceFolderPath = workspace.workspaceFolders?.[0]?.uri.fsPath
  const configuredServerPath = resolveConfiguredServerPath(
    settings.serverPath,
    workspaceFolderPath
  )

  if (configuredServerPath !== undefined) {
    outputChannel.appendLine(
      `[ Info ] Trying configured server path ${configuredServerPath}...`
    )
    return configuredServerPath
  }

  const cargoBinDirectory = getCargoBinDirectory()

  if (cargoBinDirectory == null) {
    outputChannel.appendLine('[ Error ] Could not find cargo bin directory.')
    return undefined
  }

  const expectedPath = join(cargoBinDirectory, getExpectedBinaryName())
  outputChannel.appendLine(`[ Info ] Trying path ${expectedPath}...`)

  if (await checkValidity(expectedPath)) {
    return expectedPath
  }

  const choice = await window.showWarningMessage(
    'Failed to find an installed LMNtal Language Server. Would you like to install one using `cargo install`?',
    'Yes'
  )

  if (choice !== 'Yes') {
    outputChannel.appendLine('[ Error ] Not installing server.')
    return undefined
  }

  if (await installBinaryViaCargoInstall()) {
    return expectedPath
  } else {
    await window.showErrorMessage(
      'Failed to install LMNtal Language Server. Please either run `cargo install lmntal-language-server`, or set a custom path using the configuration `lmntal.serverPath`.'
    )
  }

  return undefined
}

function getCargoBinDirectory (): string | undefined {
  const cargoInstallRoot = process.env.CARGO_INSTALL_ROOT

  if (cargoInstallRoot != null) {
    return cargoInstallRoot
  }

  const cargoHome = process.env.CARGO_HOME

  if (cargoHome != null) {
    return join(cargoHome, 'bin')
  }

  let home = process.env.HOME

  if (process.platform === 'win32') {
    home = process.env.USERPROFILE
  }

  if (home != null) {
    return join(home, '.cargo', 'bin')
  }

  return undefined
}

function getExpectedBinaryName (): string {
  switch (process.platform) {
    case 'win32':
      return 'lmntal-language-server.exe'
    default:
      return 'lmntal-language-server'
  }
}

async function checkValidity (candidatePath: string): Promise<boolean> {
  try {
    await stat(candidatePath)
    return true
  } catch (_) {
    return false
  }
}

async function installBinaryViaCargoInstall (): Promise<boolean> {
  outputChannel.appendLine('[ Info ] Installing server.')

  return await window.withProgress(
    {
      location: ProgressLocation.Notification,
      cancellable: true,
      title: 'Installing LMNtal Language Server'
    },
    async (progress, token) => {
      try {
        progress.report({ message: 'spawning `cargo install` command' })

        const process = spawn('cargo', ['install', 'lmntal-language-server'], {
          shell: true
        })

        token.onCancellationRequested(() => {
          process.kill()
        })

        process.stderr.on('data', (data) => {
          logCargoInstallProgress(data.toString(), progress)
        })

        process.stdout.on('data', (data) => {
          logCargoInstallProgress(data.toString(), progress)
        })

        const exitCode: number = await new Promise((resolve, reject) => {
          process.on('close', resolve)
          process.on('error', reject)
        })

        outputChannel.appendLine(
          `[ Info ]: Cargo process exited with code ${exitCode}`
        )

        if (exitCode === 0) {
          progress.report({ increment: 100, message: 'installed' })

          return true
        } else {
          throw new Error(`Received non-zero exit code: ${exitCode}`)
        }
      } catch (e) {
        outputChannel.appendLine(`[ Error ] ${(e as ExecException).message}`)
        progress.report({ message: 'An error occurred.' })
        return false
      }
    }
  )
}

function logCargoInstallProgress (
  data: string,
  progress: Progress<{
    message?: string | undefined
    increment?: number | undefined
  }>
): void {
  data = data.trim()

  let msg
  const versionRegex = /v[0-9]+\.[0-9]+\.[0-9]+/

  if (data === 'Updating crates.io index') {
    msg = 'updating crates.io index'
  } else if (data.startsWith('Compiling')) {
    msg = `compiling ${data.split('Compiling ')[1].split(versionRegex)[0]}`
  }

  if (msg != null) {
    outputChannel.appendLine(`[ Info ] \t${msg}`)
    progress.report({ message: `\t${msg}` })
  }
}
