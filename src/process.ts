import { spawn } from 'child_process'

interface RunProcessOptions {
  input?: string
}

export async function runProcess (
  command: string,
  args: string[],
  options: RunProcessOptions = {}
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args)
    let output = ''

    child.stdout.on('data', (data: Buffer | string) => {
      output += data.toString()
    })

    child.stderr.on('data', (data: Buffer | string) => {
      output += data.toString()
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output)
        return
      }

      reject(
        new Error(
          output.trim() === ''
            ? `Process exited with code ${String(code)}.`
            : output.trim()
        )
      )
    })

    if (options.input === undefined) {
      child.stdin.end()
    } else {
      child.stdin.end(options.input)
    }
  })
}
