# Zenith — Ghost Visualizer

A VS Code extension that renders a real-time, transparent, animated data structure overlay (the "Ghost") in a side panel as you type.

## Features

- **Live code watching** — detects changes with a 500ms debounce and sends data to the visualizer.
- **Smooth animations** — nodes slide into position using spring-based lerp instead of snapping.
- **Linked List & Binary Tree** layouts with neon-cyan glowing nodes and arrow edges.
- **Transparent canvas** — the Ghost floats over whatever is behind the panel.
- **State-preserving** — nodes are matched by `id` so the visualization morphs rather than resets.

## Getting Started

```bash
npm install
npm run compile
```

Then press **F5** to launch the Extension Development Host, and run the command:

> **Zenith: Open Ghost Visualizer**

## Project Structure

```
src/
  extension.ts   — activation, WebviewPanel, code watcher, mock data generator
  webview.ts     — returns the full HTML/CSS/JS for the p5.js canvas
out/               — compiled JS (generated)
```

## How It Works

1. `onDidChangeTextDocument` fires on every edit (debounced 500ms).
2. The active editor text is passed to `mockGenerateJSON()`, which returns a hardcoded LinkedList with 3 nodes.
3. The JSON payload is posted to the Webview via `postMessage`.
4. Inside the Webview, p5.js renders nodes as glowing cyan circles with arrow edges, smoothly animating to new positions when data changes.
