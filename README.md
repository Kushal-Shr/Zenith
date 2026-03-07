# Zenith — Ghost Visualizer

A VS Code extension that renders a real-time, transparent, AI-powered data structure overlay as you write C++ code. The "Ghost" panel uses Gemini AI to analyze your code at the cursor's current line and draws animated visualizations of linked lists, binary trees, arrays, and stacks — complete with pointer tracking and algorithm tracing.

## Features

### Data Structure Visualization
- **LinkedList** — horizontal chain of nodes with directional arrows
- **BinaryTree** — hierarchical tree layout derived from edges
- **Array** — centered horizontal row of elements
- **Stack** — vertical bottom-to-top layout

### Live Trace Mode
- Tracks your **cursor position** in real time (300ms debounce)
- Tracks **document edits** (500ms debounce)
- Gemini analyzes the code state **at the exact line** your cursor is on
- Shows a **"Trace Mode Active"** gold indicator in the panel
- Highlighted node glows **Neon Gold** with a floating **traceInfo** tooltip

### Algorithm Tracer (Pointer Tracking)
- Detects all active pointer/index variables (`curr`, `i`, `j`, `left`, `right`, `slow`, `fast`, etc.)
- Each pointer is drawn as a **colored arrow** pointing at its target node with a **label badge**
- **Smooth lerp animation** — pointers physically glide when they change targets
- **Multi-pointer support** — multiple pointers fan out around a node so they don't overlap
- **Unique color per label** — a palette of 8 neon colors auto-assigned to each variable name

### Visuals
- **Neon Cyan** nodes with pulsing outer glow
- **Spring-based lerp** animations (`factor 0.1`) — nodes and pointers slide instead of snapping
- **Transparent canvas** — uses `clear()` every frame with `background: transparent`
- **Arrow edges** with triangle heads between connected nodes

## Getting Started

### Prerequisites
- VS Code 1.85+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### Setup

```bash
# Install dependencies
npm install

# Set your API key
# Edit .env and replace 'your_api_key_here' with your real key
```

### Running

1. Open the `zenith` folder as your workspace root in VS Code.
2. Press **F5** to launch the Extension Development Host.
3. In the new window, open the Command Palette (`Ctrl+Shift+P`) and run:
   **Zenith: Open Ghost Visualizer**
4. Open or create a `.cpp` file and start coding — the Ghost panel will visualize data structures as you type and move your cursor.

## Project Structure

```
zenith/
  .env                  — GOOGLE_GEN_AI_KEY (gitignored)
  .vscode/
    launch.json         — F5 debug configuration
    tasks.json          — background tsc watch task
  media/
    p5.min.js           — bundled p5.js (loaded via webview URI)
  src/
    extension.ts        — activation, Gemini SDK, cursor/doc watchers, debounce
    webview.ts          — HTML/CSS/JS with p5.js canvas, Node/Pointer classes
  out/                  — compiled JS (generated)
  package.json          — extension manifest, commands, dependencies
  tsconfig.json         — TypeScript config
```

## How It Works

1. **Cursor moves** or **text changes** → debounced event fires.
2. The full editor text + current line number are sent to **Gemini 2.5 Flash** with a system prompt that acts as a C++ execution engine.
3. Gemini returns structured JSON: `{ type, nodes, edges, highlightId, traceInfo, pointers }`.
4. The JSON is posted to the Webview via `postMessage`.
5. Inside the Webview, **p5.js** renders:
   - Nodes as glowing circles in their layout positions
   - Edges as lines with arrowheads
   - The highlighted node in gold with a trace tooltip
   - Pointer arrows with colored labels pointing at their target nodes
6. All elements use **spring-based lerp** so transitions are smooth and animated.

## Example C++ Code

```cpp
#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

int main() {
    Node* head = new Node(10);
    head->next = new Node(20);
    head->next->next = new Node(30);
    head->next->next->next = new Node(40);

    Node* curr = head;
    while (curr) {
        cout << curr->data << " -> ";
        curr = curr->next;
    }
    cout << "NULL" << endl;

    return 0;
}
```

Move your cursor between the lines to see the linked list build up, the `curr` pointer arrow glide across nodes, and the trace tooltip update in real time.
