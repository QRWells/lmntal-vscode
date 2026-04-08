import * as assert from 'node:assert/strict'
import path from 'node:path'
import { test } from 'node:test'
import {
  disableUpdateChecks,
  LMNTAL_DOCUMENT_SELECTORS,
  resolveConfiguredServerPath
} from './lmntal'

void test('document selectors cover file and untitled LMNtal documents', () => {
  assert.deepStrictEqual(LMNTAL_DOCUMENT_SELECTORS, [
    { scheme: 'file', language: 'lmntal' },
    { scheme: 'untitled', language: 'lmntal' }
  ])
})

void test('resolveConfiguredServerPath resolves relative paths from the workspace', () => {
  assert.strictEqual(
    resolveConfiguredServerPath('bin/server', 'C:\\workspace'),
    path.resolve('C:\\workspace', 'bin/server')
  )
})

void test('resolveConfiguredServerPath falls back to the current process cwd', () => {
  assert.strictEqual(
    resolveConfiguredServerPath('bin/server'),
    path.resolve('bin/server')
  )
})

void test('disableUpdateChecks preserves settings while disabling update checks', () => {
  assert.deepStrictEqual(
    disableUpdateChecks({
      slimPath: 'slim',
      slimArgs: ['--hl'],
      compilerPath: 'lmntal',
      compilerArgs: ['-O3'],
      serverPath: null,
      customArgs: ['--stdio'],
      checkForUpdates: true
    }),
    {
      slimPath: 'slim',
      slimArgs: ['--hl'],
      compilerPath: 'lmntal',
      compilerArgs: ['-O3'],
      serverPath: null,
      customArgs: ['--stdio'],
      checkForUpdates: false
    }
  )
})
