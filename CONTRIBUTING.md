# Contributing to Zenith

Thanks for your interest in contributing to Zenith! This guide walks you through setting up the development environment and explains how to add new data structure visualizations to the Ghost panel.

## Development Environment Setup

### Prerequisites

- [VS Code](https://code.visualstudio.com/) 1.85 or later
- [Node.js](https://nodejs.org/) 18 or later
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### First-Time Setup

```bash
# Clone the repository
git clone https://github.com/your-org/zenith.git
cd zenith

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
# Open .env and paste your Gemini API key
```

### Running the Extension

1. Open the `zenith/` folder as your workspace root in VS Code.
2. Press **F5** — this launches the Extension Development Host using the config in `.vscode/launch.json`.
3. In the new window, open the Command Palette (`Ctrl+Shift+P`) and run **Zenith: Open Ghost Visualizer**.
4. Open any `.cpp` file and start editing. The Ghost panel should appear on the right.

### Build & Watch

The project uses TypeScript compiled to `out/`. Two npm scripts are available:

| Command | Description |
|---------|-------------|
| `npm run compile` | One-shot compilation |
| `npm run watch` | Continuous background compilation (used by the F5 launch task) |

## Project Architecture

```
zenith/
├── src/
│   ├── extension.ts   ← VS Code activation, Gemini calls, editor listeners
│   └── webview.ts     ← Full HTML/CSS/JS returned as a string; contains p5.js canvas
├── media/
│   └── p5.min.js      ← Locally bundled p5.js for CSP-safe webview loading
├── .env               ← GOOGLE_GEN_AI_KEY (never committed)
└── package.json       ← Extension manifest and dependencies
```

**Data flow:** Editor events → debounced Gemini API call → JSON payload → `postMessage` to webview → p5.js renders nodes, edges, pointers.

## Adding a New Data Structure Visualization

Follow these steps to add support for a new structure (e.g., `Graph`, `Heap`, `HashMap`).

### 1. Update the AI Prompt

In `src/extension.ts`, find the `liveModel` and `playbackModel` system instructions. Add your new type to the `"type"` union:

```
"type": "LinkedList" | "BinaryTree" | "Array" | "Stack" | "YourNewType",
```

Also update the rules section so Gemini knows when to return this type and how to structure its nodes/edges.

### 2. Add a Layout Function

In `src/webview.ts`, create a new layout function following the existing pattern:

```js
function layoutYourNewType(nodes) {
  // Calculate targetX, targetY for each node
  // Call createOrMoveNode(n, tx, ty) for each
}
```

### 3. Wire It Into `applyPayload`

In the `applyPayload` function inside `webview.ts`, add an `else if` branch:

```js
else if (type === 'YourNewType') layoutYourNewType(nodes);
```

### 4. Test It

Write a C++ file that uses your data structure. Move your cursor through the code and verify that:

- Nodes appear in the correct layout
- Edges connect the right pairs
- Pointers track iterator variables
- Playback mode traces through the algorithm steps

## Code Style

- TypeScript for all extension logic; no raw JavaScript files.
- The webview is a single string template in `webview.ts` — keep p5.js logic inline there.
- Use `lerp`-based animations for all visual transitions; never snap positions.
- Follow existing naming: `GhostNode`, `GhostPointer`, `drawXxx()`, `layoutXxx()`.

## Commit Guidelines

- Use concise, descriptive commit messages focused on **why**, not what.
- One logical change per commit.
- Never commit `.env` or API keys.

## Reporting Issues

Open a GitHub issue with:

1. A short description of the bug or feature request.
2. The C++ code snippet that triggers it (if applicable).
3. A screenshot of the Ghost panel showing the incorrect behavior.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
