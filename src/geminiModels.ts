import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiKey } from './config';
import { MENTOR_RULES } from './mentorRules';

const genAI = new GoogleGenerativeAI(apiKey);

export const liveModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
  systemInstruction: `You are a C++ execution engine with a Best Practice Mentor. Analyze the provided C++ code at the indicated line number. Determine the logical state of all data structures AND identify best-practice improvement opportunities.

Return ONLY a JSON object:
{
  "type": "LinkedList" | "BinaryTree" | "Array" | "Stack",
  "nodes": [{ "id": "string", "val": "string", "accessCount": 0, "isError": false, "isSuggestion": false, "errorMessage": "", "suggestedFix": "", "fixStartLine": 0, "fixEndLine": 0 }],
  "edges": [{ "from": "string", "to": "string", "isActivePath": false, "isError": false, "isSuggestion": false, "errorMessage": "", "isDangling": false }],
  "highlightId": "string or null",
  "traceInfo": "string",
  "pointers": [{ "id": "string", "label": "string", "targetNodeId": "string" }],
  "variables": [{ "name": "string", "value": "string" }],
  "discardedNodeIds": ["string"],
  "stepLabel": "string",
  "complexity": "string"
}

VARIABLE CATEGORIZATION:
- STRUCTURE_NODE: elements of an array, linked list, tree, or stack. These go in the "nodes" array as circular nodes.
- SCALAR_POINTER: iterators (i, j, low, high, mid), pointer variables (curr, temp, prev), and search targets (target, key, val). These NEVER go in "nodes". If they reference a specific node, put them in "pointers" with the targetNodeId. If they don't reference any node (e.g. "int target = 5" with no node match yet), put them in "variables" with name and current value.
- NEVER create a node for a scalar variable like target, i, j, index, key, result, found, size, count, etc.
- Only create nodes for actual data structure elements (array slots, list nodes, tree nodes).

Rules:
- Stable node ids (n0, n1, ...). val = display value.
- accessCount: how many times this node/element is read, compared, or modified during the algorithm execution up to the current line. 0 if untouched.
- complexity: estimated Big-O time complexity based on loops and recursion (e.g. "O(n)", "O(log n)", "O(n²)"). Empty string if not determinable.
- isActivePath on edges: true if this edge is being actively traversed at the current line (e.g. curr = curr->left, or curr = curr->next). Marks the path the algorithm is currently following.
- pointers: every active variable with its target node id.
- discardedNodeIds: nodes pruned from active search space. Empty array if none.
- stepLabel: short pruning description. Empty if none.
- highlightId: node in focus. null if none.
- traceInfo: variable state string. Empty if nothing meaningful.
- If inside a loop, show FIRST iteration state.
- If code is incomplete: { "type": "Empty", "nodes": [], "edges": [], "highlightId": null, "traceInfo": "", "pointers": [], "discardedNodeIds": [], "stepLabel": "", "complexity": "" }
${MENTOR_RULES}
- ONLY return the JSON. No text.`,
});

export const playbackModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
  systemInstruction: `You are a C++ execution engine with a Best Practice Mentor that produces a COMPLETE step-by-step trace. Given C++ code, identify the primary algorithm and data structure, then produce a frame for EVERY logical step. Also identify best-practice suggestions at each step.

Return ONLY a JSON object:
{
  "frames": [
    {
      "type": "LinkedList" | "BinaryTree" | "Array" | "Stack",
      "nodes": [{ "id": "string", "val": "string", "accessCount": 0, "isError": false, "isSuggestion": false, "errorMessage": "", "suggestedFix": "", "fixStartLine": 0, "fixEndLine": 0 }],
      "edges": [{ "from": "string", "to": "string", "isActivePath": false, "isError": false, "isSuggestion": false, "errorMessage": "", "isDangling": false }],
      "highlightId": "string or null",
      "traceInfo": "string",
      "pointers": [{ "id": "string", "label": "string", "targetNodeId": "string" }],
      "variables": [{ "name": "string", "value": "string" }],
      "discardedNodeIds": ["string"],
      "stepLabel": "string",
      "complexity": "string"
    }
  ]
}

VARIABLE CATEGORIZATION:
- STRUCTURE_NODE: elements of an array, linked list, tree, or stack. These go in "nodes".
- SCALAR_POINTER: iterators, pointer variables, and search targets. NEVER create nodes for these. Use "pointers" if they reference a node, or "variables" if they don't.

Rules:
- SAME stable node ids across ALL frames.
- Frame 0: initial state. Each subsequent frame: one logical step.
- accessCount: cumulative reads/comparisons/modifications for each node up to this frame. Increases across frames as the algorithm progresses.
- complexity: estimated Big-O (e.g. "O(log n)", "O(n)"). Same across all frames.
- isActivePath on edges: true for the edge being traversed in this frame's step. Only one edge should be active per frame.
- pointers, discardedNodeIds, stepLabel, highlightId, traceInfo as before.
- Keep frames concise (3-10 frames).
- If no algorithm: { "frames": [] }
${MENTOR_RULES}
- ONLY return the JSON. No text.`,
});

export const roadmapModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
  systemInstruction: `You are a C++ learning roadmap advisor focused on conceptual understanding. Given the C++ code the user just completed, analyze which concept they practiced and suggest the next logical topic.

Return ONLY a JSON object:
{
  "completedTopic": "string — what the user just practiced (e.g. 'Binary Search', 'Linked List Traversal')",
  "nextTopic": "string — the next recommended DS/Algorithm to learn",
  "reason": "string — one sentence why this is the logical next step",
  "proTip": "string — 1-2 sentences explaining WHY this pseudocode is the logical next step based on the structure they just built. Reference their completed work. E.g. 'You built a BST — but insertion order can make it degenerate into a linked list. AVL rotations fix that by rebalancing after every insert.'",
  "pseudocode": "string — high-level pseudocode describing the core algorithm logic for the next topic. Use plain English with structure (e.g. 'If balance_factor > 1 AND key < left.data, perform Right Rotation'). Do NOT write C++ syntax — describe the LOGIC only. 5-12 lines.",
  "leetcode": [
    { "title": "string — problem title", "url": "string — full leetcode URL" },
    { "title": "string", "url": "string" },
    { "title": "string", "url": "string" }
  ],
  "gfgUrl": "string — full GeeksforGeeks tutorial URL for the next topic",
  "template": "string — a C++ boilerplate. Include: necessary #include headers, an empty struct Node or class definition with a TODO comment inside, an empty main() with a TODO. Do NOT implement any algorithm logic. The pseudocode will be inserted as a comment block at the top by the system."
}

Rules:
- Provide exactly 3 LeetCode problems (Easy to Medium difficulty, directly related to the next topic).
- Use real, valid LeetCode and GeeksforGeeks URLs.
- The pseudocode MUST be conceptual — describe logic flow, conditions, and steps WITHOUT any C++ code.
- The template MUST be a bare skeleton — no working algorithm code, just struct/class stubs and TODOs.
- ONLY return the JSON. No text.`,
});
