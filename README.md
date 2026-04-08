# lmntal-vscode README

Language support for LMNtal.

## Features

- Syntax highlighting for both LMNtal and IL.
- LMNtal Language Server support.
  - Diagnostics
  - Semantic highlighting
  - Document symbols
  - References
  - Document highlights
- LMNtal Explorer outline view backed by document symbols.
- `LMNtal: IL Viewer` for saved `.lmn` files.
- `LMNtal: Slim` for running the current document, including unsaved editor content.

## Get Started

1. Install the LMNtal compiler, runtime, and language server.
2. Set the LMNtal paths in VS Code settings if they are not already on your `PATH`.

## Requirements

- LMNtal compiler
    - [lmntal-compiler](https://github.com/lmntal/lmntal-compiler)
- LMNtal runtime
    - [slim](https://github.com/lmntal/slim)
- LMNtal language server
    - [lmntalc workspace](https://github.com/lmntal/lmntalc/tree/main/crates/lmntal-language-server)

## Extension Settings

| Setting                  | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `lmntal.slimPath`        | Path to the LMNtal runtime executable.                    |
| `lmntal.slimArgs`        | Arguments passed to the LMNtal runtime.                   |
| `lmntal.compilerPath`    | Path to the LMNtal compiler executable.                   |
| `lmntal.compilerArgs`    | Arguments passed to the LMNtal compiler.                  |
| `lmntal.serverPath`      | Optional custom LMNtal language server path.              |
| `lmntal.customArgs`      | Extra arguments passed when starting the language server. |
| `lmntal.checkForUpdates` | Whether to check crates.io for language server updates.   |

## Development

```sh
npm install
npm run lint
npx tsc --noEmit
npm test
```

## Known Issues

None
