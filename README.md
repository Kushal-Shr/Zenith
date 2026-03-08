# Zenith — Ghost Visualizer

A VS Code extension that renders a real-time, transparent, AI-powered data structure overlay as you write C++ code. The "Ghost" panel uses Gemini AI to analyze your code at the cursor's current line and draws animated visualizations of linked lists, binary trees, arrays, and stacks — complete with pointer tracking, algorithm tracing, error detection, and learning roadmaps.

## Features

### Data Structure Visualization
- **LinkedList** — horizontal chain of nodes with directional arrows
- **BinaryTree** — hierarchical tree layout derived from edges
- **Array** — centered horizontal row of elements
- **Stack** — vertical bottom-to-top layout

### Live Trace Mode
- Tracks your **cursor position** in real time (100ms debounce)
- Tracks **document edits** (200ms debounce)
- Gemini analyzes the code state **at the exact line** your cursor is on
- Highlighted node glows **Neon Gold** with a floating **traceInfo** tooltip
- Smart **state diffing** for files over 100 lines — only the delta is sent to the AI

### Algorithm Tracer (Pointer Tracking)
- Detects all active pointer/index variables (`curr`, `i`, `j`, `left`, `right`, `slow`, `fast`, etc.)
- Each pointer is drawn as a **colored arrow** pointing at its target node with a **label badge**
- **Smooth lerp animation** — pointers physically glide when they change targets
- **Multi-pointer support** — multiple pointers fan out around a node so they don't overlap
- **Unique color per label** — a palette of 8 neon colors auto-assigned to each variable name
- **Scalar variable tray** — variables like `target` or `result` that don't reference a node are displayed in a compact sidebar panel instead of cluttering the canvas

### Full Playback Mode
- After **2 seconds** of inactivity, Gemini generates a **complete step-by-step trace** of the algorithm
- Frames auto-advance with **transition-aware timing** — the next step waits for node animations to settle before proceeding
- **Step counter** and **step label** show the current operation (e.g., "Discarding left half")
- Discarded nodes dim out with a **strikethrough** effect
- Playback results are **cached** by code hash to avoid redundant API calls

### Pathfinder
- Edges actively being traversed are rendered as **thick, pulsing gold lines** with a glow effect
- When a node is reached via the active path, it triggers a **"Ping" animation** — an expanding concentric circle that fades out
- Playback waits for glide animations to complete before marking the next edge as active

### Big-O Heatmap
- Each node tracks its **access count** — how many times it has been read, compared, or modified
- Nodes are colored on a gradient from **Cool Blue** (`#00b4d8`, cold) to **Vibrant Orange/Red** (`#ff4d00`, hot) using `lerpColor()`
- Hot nodes emit a proportional **glow** via `drawingContext.shadowBlur`
- A floating **complexity badge** in the top-right shows the estimated Big-O (e.g., `O(log n)`)
- A **"Clear Heat"** button resets all access counts to zero

### Best Practice Mentor
- Detects **hard errors** (null dereference, use-after-free, out-of-bounds) and **best practice suggestions** (memory leaks, missing nullptr checks, dangling pointers)
- **Hard errors**: vibrant red pulsing nodes with jitter animation and red tooltips
- **Suggestions**: soft amber nodes with a gentle halo pulse and a "Suggestion Box" tooltip with a "Why?" link
- **Quick Fix / Apply Recommendation**: click a node's fix button to see the suggested code change, then apply it to the editor in one click — the fix replaces the problematic lines and adds a `// Optimized by Zenith Best Practice Mentor` comment

### Session Wrap-Up & Learning Roadmap
- A **"Finish & Reset Workspace"** button triggers a safety prompt, clears the editor, and asks Gemini to suggest the **next topic** to learn
- The roadmap includes **3 LeetCode problems**, a **GeeksforGeeks tutorial link**, a **Pro-Tip** explaining why this topic is next, and **pseudocode** for the new concept
- Clicking **"Start Next Topic"** inserts a boilerplate template with headers, an empty struct, and the pseudocode as a guiding comment block

### Visuals & Performance
- **Neon Cyan** nodes with pulsing outer glow
- **Spring-based lerp** animations — nodes, pointers, and highlights slide instead of snapping
- **Transparent canvas** — uses `clear()` every frame with `background: transparent`
- **Force-directed repulsion** prevents nodes from overlapping
- **Layout caching** and **playback caching** for snappy repeated interactions
- **Predictive ghost layout** shows a skeleton while the AI is thinking

---

## Demo Pitch Flow

This section is a step-by-step walkthrough designed for a live demo. It showcases three flagship features — **Pathfinder**, **Big-O Heatmap**, and **Best Practice Mentor** — using a single Binary Search Tree example.

### Setup (30 seconds)

1. Open the `zenith` folder in VS Code and press **F5** to launch the Extension Development Host.
2. In the new window, run `Ctrl+Shift+P` → **Zenith: Open Ghost Visualizer**. The Ghost panel opens on the right.
3. Create a new file called `demo.cpp`.

### Step 1 — Build the Tree (1 minute)

Paste this code into `demo.cpp`:

```cpp
#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* left;
    Node* right;
    Node(int val) : data(val), left(nullptr), right(nullptr) {}
};

Node* insert(Node* root, int val) {
    if (!root) return new Node(val);
    if (val < root->data) root->left = insert(root->left, val);
    else root->right = insert(root->right, val);
    return root;
}

Node* search(Node* root, int target) {
    if (!root || root->data == target) return root;
    if (target < root->data) return search(root->left, target);
    return search(root->right, target);
}

int main() {
    Node* root = nullptr;
    int values[] = {50, 30, 70, 20, 40, 60, 80};
    for (int v : values) root = insert(root, v);

    Node* result = search(root, 60);
    if (result) cout << "Found: " << result->data << endl;
    else cout << "Not found" << endl;

    return 0;
}
```

**What to show:** As soon as the code is pasted, the Ghost panel renders the BST with 7 nodes in a hierarchical layout. Point out the **neon cyan nodes**, the **directional edge arrows**, and the smooth fade-in animation.

### Step 2 — Pathfinder: Watch the Search (1 minute)

1. Place your cursor on the line `Node* result = search(root, 60);`.
2. The Ghost panel highlights the **active path** — the edges from `50 → 70 → 60` glow as **thick, pulsing gold lines**.
3. Each node along the path triggers a **Ping animation** (expanding circle) as it is reached.
4. The `target` variable appears in the **Variables tray** (top-right) showing `target = 60`, while the `root` pointer arrow tracks the current node.

**Talking point:** "Zenith doesn't just show the data structure — it shows the *algorithm in motion*. You can see exactly which path the search takes through the tree."

### Step 3 — Big-O Heatmap: See the Cost (30 seconds)

1. Wait 2 seconds for the **Full Playback** to trigger automatically.
2. As the playback steps through the search, watch the nodes change color:
   - **Root node (50)** turns warm — it's accessed on every search.
   - **Node 60** (the target) turns the hottest **orange/red**.
   - Untouched nodes like **20** and **40** stay **cool blue**.
3. Point out the **complexity badge** in the top-right corner showing `O(log n)`.
4. Click **"Clear Heat"** (bottom-left) to reset the heatmap for a fresh trace.

**Talking point:** "The heatmap makes Big-O *tangible*. Instead of memorizing that BST search is O(log n), you can *see* that only 3 out of 7 nodes get touched."

### Step 4 — Best Practice Mentor: Catch the Memory Leak (1 minute)

1. Notice that the tree allocates nodes with `new` but never deallocates them.
2. The Mentor detects this — affected nodes pulse with a **soft amber halo**.
3. Hover over a pulsing node to see the **Suggestion Box**: "Resource Management: Consider deallocating this node to optimize memory usage."
4. Click the **sparkle button** (✨) on the node to see the recommended fix.
5. Click **"Apply Recommendation"** — the fix is inserted directly into the editor with a `// Optimized by Zenith Best Practice Mentor` comment.

**Talking point:** "Zenith doesn't just find bugs — it *teaches* best practices. The amber glow means 'this works, but here's how to make it production-ready.' Red means a real crash risk."

### Step 5 — Wrap Up (30 seconds)

1. Click **"Finish & Reset Workspace"** at the bottom of the Ghost panel.
2. Confirm the prompt. The editor clears and the roadmap appears.
3. Show the **next topic suggestion** (e.g., "AVL Tree Rotations"), the **LeetCode links**, and the **pseudocode guide**.
4. Click **"Start Next Topic"** — a boilerplate template with the pseudocode as comments is inserted into the editor.

**Talking point:** "Zenith closes the loop. It doesn't just visualize what you built — it tells you what to build next."

---

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
    extension.ts        — activation, Gemini SDK, cursor/doc watchers, debounce, caching
    webview.ts          — HTML/CSS/JS with p5.js canvas, Node/Pointer classes, Variables tray
  out/                  — compiled JS (generated)
  package.json          — extension manifest, commands, dependencies
  tsconfig.json         — TypeScript config
  LICENSE               — MIT License
  CONTRIBUTING.md       — contributor guide
```

## How It Works

1. **Cursor moves** or **text changes** → debounced event fires.
2. For large files (>100 lines), only a context window around the cursor is sent. For smaller files, the full text is sent.
3. The code + current line number are sent to **Gemini 2.5 Flash** with a system prompt that acts as a C++ execution engine.
4. Gemini returns structured JSON: `{ type, nodes, edges, highlightId, traceInfo, pointers, variables, complexity, ... }`.
5. The JSON is posted to the Webview via `postMessage`.
6. Inside the Webview, **p5.js** renders:
   - Nodes as glowing circles in their layout positions, colored by access-count heatmap
   - Edges as lines with arrowheads, with active-path edges pulsing gold
   - The highlighted node in gold with a trace tooltip
   - Pointer arrows with colored labels pointing at their target nodes
   - Scalar variables in a sidebar tray
   - Error/suggestion indicators with fix buttons
7. All elements use **spring-based lerp** so transitions are smooth and animated.
8. After 2 seconds of inactivity, a **full playback trace** is generated and auto-played with transition-aware timing.

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

## License

This project is licensed under the [MIT License](./LICENSE).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and guidelines on adding new visualizations.
