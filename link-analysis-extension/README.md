# Link Analysis Extension MVP

Local-first VS Code extension for turning structured `.link.md` analyst notes into a live entity relationship graph.

## Features

- Scans the workspace for `*.link.md`
- Parses entities, relationships, and events line by line
- Publishes diagnostics to the Problems panel
- Renders a Cytoscape graph in a VS Code webview
- Reveals source lines from graph and tree selections
- Exports `.link-analysis/graph.json`
- Ships with a basic TextMate grammar for `.link.md`

## Project Structure

```text
link-analysis-extension/
  src/        Extension host code
  webview/    React + Cytoscape UI
  syntax/     TextMate grammar
  test/       Jest tests
```

## Install

```bash
cd link-analysis-extension
npm install
```

## Run

```bash
npm run build
```

Then open `link-analysis-extension` in VS Code and launch the extension host with `F5`.

Useful commands:

- `Link Analysis: Open Graph`
- `Link Analysis: Refresh Graph`
- `Link Analysis: Validate Workspace`
- `Link Analysis: Export Graph JSON`

## Sample File

Use [example.link.md](/Users/anthonybursae/Documents/GitHub/speculator/link-analysis-extension/example.link.md) for manual testing.

## Tests

```bash
npm test
```
