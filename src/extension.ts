import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getWebviewContent } from './webview';

const DOTENV_PATH = path.join(__dirname, '..', '.env');
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: DOTENV_PATH });

let panel: vscode.WebviewPanel | undefined;
let docDebounceTimer: NodeJS.Timeout | undefined;
let cursorDebounceTimer: NodeJS.Timeout | undefined;
let idleTimer: NodeJS.Timeout | undefined;
let isAnalyzing = false;
let lastAnalyzedText = '';
let lastAnalyzedLine = -1;
let lastPlaybackText = '';
let lastActiveEditor: vscode.TextEditor | undefined;

const MENTOR_RULES = `
ERROR DETECTION & BEST PRACTICE MENTOR:
In addition to data structure state, analyze the code for two categories:

CATEGORY 1 — HARD ERRORS (will cause runtime crash or compile error):
These set "isError": true, "isSuggestion": false.
- Null dereference: dereferencing a pointer that is null → "Error: Null pointer dereference — this will crash at runtime."
- Out-of-bounds access: array index beyond allocated size → "Error: Index out of bounds — undefined behavior at runtime."
- Use-after-free: accessing memory after delete → "Error: Use-after-free — accessing released memory."
- Dangling pointer dereference: reading/writing through a freed pointer → "Error: Dangling pointer access — undefined behavior."

CATEGORY 2 — BEST PRACTICE SUGGESTIONS (won't crash but should be improved):
These set "isError": false, "isSuggestion": true.
- Memory leak: allocated with new but never deleted → "Resource Management: Consider deallocating this node to optimize memory usage."
- Missing nullptr check (defensive): no null guard before access → "Defensive Coding: Adding a null check here would improve program stability."
- Unintended cycle: circular reference in an acyclic structure → "Structure Integrity: A circular reference was detected — verify this is intentional."
- Dangling pointer (not dereferenced): pointer to freed memory that isn't accessed → "Pointer Safety: This pointer currently references an inactive memory address."

For nodes:
  If "isError": true (hard error): set "isSuggestion": false, "errorMessage" to the error description, and provide "suggestedFix", "fixStartLine", "fixEndLine".
  If "isSuggestion": true (best practice): set "isError": false, "errorMessage" to the mentor suggestion, and provide "suggestedFix" prefixed with "// Optimized by Zenith Best Practice Mentor\\n", "fixStartLine", "fixEndLine".
  If neither: "isError": false, "isSuggestion": false, "errorMessage": "", "suggestedFix": "", "fixStartLine": 0, "fixEndLine": 0.
For edges:
  Hard error edges: "isError": true, "isSuggestion": false. Suggestion edges: "isError": false, "isSuggestion": true.
  Set "isDangling": true if the edge points to freed/non-existent memory.
  If neither: "isError": false, "isSuggestion": false, "errorMessage": "", "isDangling": false.`;

// ─── Gemini Setup ───────────────────────────────────────────
const apiKey = process.env.GOOGLE_GEN_AI_KEY || '';
if (!apiKey || apiKey === 'your_api_key_here') {
  console.warn('[Zenith] GOOGLE_GEN_AI_KEY not set — AI analysis will be disabled.');
}

const genAI = new GoogleGenerativeAI(apiKey);

const liveModel = genAI.getGenerativeModel({
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

const playbackModel = genAI.getGenerativeModel({
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

const roadmapModel = genAI.getGenerativeModel({
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

interface RoadmapPayload {
  completedTopic: string;
  nextTopic: string;
  reason: string;
  proTip: string;
  pseudocode: string;
  leetcode: { title: string; url: string }[];
  gfgUrl: string;
  template: string;
}

async function generateRoadmap(code: string): Promise<RoadmapPayload | null> {
  if (!apiKey || apiKey === 'your_api_key_here') { return null; }
  try {
    const prompt = `The user just finished writing this C++ code. Suggest what to learn next:\n\n${code}`;
    const result = await roadmapModel.generateContent(prompt);
    const parsed: RoadmapPayload = JSON.parse(result.response.text());
    if (!parsed.nextTopic || !Array.isArray(parsed.leetcode)) { return null; }
    return parsed;
  } catch (err: unknown) {
    console.error('[Zenith] Roadmap error:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ─── Types ──────────────────────────────────────────────────
interface PointerInfo { id: string; label: string; targetNodeId: string; }
interface VariableInfo { name: string; value: string; }
interface NodeInfo {
  id: string; val: string; accessCount?: number;
  isError?: boolean; isSuggestion?: boolean; errorMessage?: string;
  suggestedFix?: string; fixStartLine?: number; fixEndLine?: number;
}
interface EdgeInfo { from: string; to: string; isActivePath?: boolean; isError?: boolean; isSuggestion?: boolean; errorMessage?: string; isDangling?: boolean; }
interface DSPayload {
  type: string;
  nodes: NodeInfo[];
  edges: EdgeInfo[];
  highlightId: string | null;
  traceInfo: string;
  pointers: PointerInfo[];
  variables: VariableInfo[];
  discardedNodeIds: string[];
  stepLabel: string;
  complexity: string;
}
interface PlaybackPayload { frames: DSPayload[]; }

function sanitizePayload(p: DSPayload): void {
  p.highlightId = p.highlightId ?? null;
  p.traceInfo = p.traceInfo ?? '';
  p.pointers = Array.isArray(p.pointers) ? p.pointers : [];
  p.variables = Array.isArray(p.variables) ? p.variables : [];
  p.discardedNodeIds = Array.isArray(p.discardedNodeIds) ? p.discardedNodeIds : [];
  p.stepLabel = p.stepLabel ?? '';
  p.complexity = p.complexity ?? '';
  for (const n of p.nodes) {
    n.accessCount = typeof n.accessCount === 'number' ? n.accessCount : 0;
    n.isError = n.isError ?? false;
    n.isSuggestion = n.isSuggestion ?? false;
    n.errorMessage = n.errorMessage ?? '';
    n.suggestedFix = n.suggestedFix ?? '';
    n.fixStartLine = typeof n.fixStartLine === 'number' ? n.fixStartLine : 0;
    n.fixEndLine = typeof n.fixEndLine === 'number' ? n.fixEndLine : 0;
  }
  for (const e of p.edges) {
    e.isActivePath = e.isActivePath ?? false;
    e.isError = e.isError ?? false;
    e.isSuggestion = e.isSuggestion ?? false;
    e.errorMessage = e.errorMessage ?? '';
    e.isDangling = e.isDangling ?? false;
  }
}

// ─── Delta Extraction ────────────────────────────────────────
const DELTA_LINE_THRESHOLD = 100;
const DELTA_CONTEXT_RADIUS = 50;

function buildPrompt(text: string, lineNumber: number): string {
  const lines = text.split('\n');
  if (lines.length <= DELTA_LINE_THRESHOLD) {
    return `Analyze this C++ code at line ${lineNumber}:\n\n${text}`;
  }
  const start = Math.max(0, lineNumber - 1 - DELTA_CONTEXT_RADIUS);
  const end = Math.min(lines.length, lineNumber - 1 + DELTA_CONTEXT_RADIUS);
  const contextLines = lines.slice(start, end);
  const numberedContext = contextLines.map((l, i) => `${start + i + 1}: ${l}`).join('\n');
  return `Analyze this C++ code at line ${lineNumber}. The file has ${lines.length} lines total. Only the relevant context window (lines ${start + 1}-${end}) is shown. Only update nodes/positions that changed — preserve stable layout for unchanged nodes.\n\n${numberedContext}`;
}

// ─── Live Analysis ──────────────────────────────────────────
async function analyzeCode(text: string, lineNumber: number): Promise<DSPayload | null> {
  if (!apiKey || apiKey === 'your_api_key_here') { return null; }
  try {
    const prompt = buildPrompt(text, lineNumber);
    const result = await liveModel.generateContent(prompt);
    const parsed: DSPayload = JSON.parse(result.response.text());
    if (!parsed.type || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) { return null; }
    sanitizePayload(parsed);
    return parsed;
  } catch (err: unknown) {
    console.error('[Zenith] Live trace error:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ─── Full Playback Analysis ─────────────────────────────────
async function analyzeFullPlayback(text: string): Promise<DSPayload[] | null> {
  if (!apiKey || apiKey === 'your_api_key_here') { return null; }
  try {
    const prompt = `Trace the complete algorithm execution for this C++ code:\n\n${text}`;
    const result = await playbackModel.generateContent(prompt);
    const parsed: PlaybackPayload = JSON.parse(result.response.text());
    if (!Array.isArray(parsed.frames) || parsed.frames.length === 0) { return null; }
    for (const f of parsed.frames) { sanitizePayload(f); }
    return parsed.frames;
  } catch (err: unknown) {
    console.error('[Zenith] Playback trace error:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ─── Panel Communication ────────────────────────────────────
function postToPanel(command: string, data?: unknown) {
  if (panel) { panel.webview.postMessage({ command, data }); }
}

let pendingTrace: { text: string; line: number } | null = null;

async function sendLiveTrace(text: string, lineNumber: number) {
  if (!panel) { return; }
  if (text === lastAnalyzedText && lineNumber === lastAnalyzedLine) { return; }

  if (isAnalyzing) {
    pendingTrace = { text, line: lineNumber };
    return;
  }

  isAnalyzing = true;
  postToPanel('loading', true);
  const payload = await analyzeCode(text, lineNumber);
  isAnalyzing = false;
  postToPanel('loading', false);
  if (payload) {
    lastAnalyzedText = text;
    lastAnalyzedLine = lineNumber;
    postToPanel('updateStructure', payload);
  }

  if (pendingTrace) {
    const next = pendingTrace;
    pendingTrace = null;
    sendLiveTrace(next.text, next.line);
  } else if (pendingPlaybackText) {
    const next = pendingPlaybackText;
    pendingPlaybackText = null;
    sendFullPlayback(next);
  }
}

let pendingPlaybackText: string | null = null;

const playbackCache = new Map<string, DSPayload[]>();
const MAX_CACHE_SIZE = 5;

function getPlaybackCacheKey(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return crypto.createHash('md5').update(trimmed).digest('hex');
}

async function sendFullPlayback(text: string) {
  if (!panel) { return; }
  if (text === lastPlaybackText) { return; }

  if (isAnalyzing) {
    pendingPlaybackText = text;
    return;
  }

  const cacheKey = getPlaybackCacheKey(text);
  const cached = playbackCache.get(cacheKey);
  if (cached) {
    lastPlaybackText = text;
    postToPanel('playback', cached);
    return;
  }

  isAnalyzing = true;
  postToPanel('loading', true);
  const frames = await analyzeFullPlayback(text);
  isAnalyzing = false;
  postToPanel('loading', false);
  if (frames && frames.length > 0) {
    lastPlaybackText = text;
    if (playbackCache.size >= MAX_CACHE_SIZE) {
      const oldest = playbackCache.keys().next().value;
      if (oldest !== undefined) { playbackCache.delete(oldest); }
    }
    playbackCache.set(cacheKey, frames);
    postToPanel('playback', frames);
  }

  if (pendingPlaybackText) {
    const next = pendingPlaybackText;
    pendingPlaybackText = null;
    sendFullPlayback(next);
  }
}

// ─── Apply Fix to Editor ────────────────────────────────────
async function applyFixToEditor(fix: string, startLine: number, endLine: number) {
  const editor = vscode.window.activeTextEditor ?? lastActiveEditor;
  if (!editor || editor.document.isClosed) {
    vscode.window.showWarningMessage('Zenith: No active editor to apply fix.');
    return;
  }
  await vscode.window.showTextDocument(editor.document, editor.viewColumn);

  const lineCount = editor.document.lineCount;
  const startIdx = Math.max(0, startLine - 1);
  const endIdx = Math.min(endLine, lineCount);

  const refLineIdx = Math.min(startIdx, lineCount - 1);
  const indentMatch = editor.document.lineAt(refLineIdx).text.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : '    ';
  const indentedFix = fix.split('\n').map(l => indent + l).join('\n') + '\n';

  const rangeStart = new vscode.Position(startIdx, 0);
  const rangeEnd = new vscode.Position(endIdx, 0);
  const replaceRange = new vscode.Range(rangeStart, rangeEnd);

  const success = await editor.edit(editBuilder => {
    editBuilder.replace(replaceRange, indentedFix);
  });

  if (!success) {
    vscode.window.showWarningMessage('Zenith: Failed to apply fix — editor may be read-only.');
    return;
  }

  editor.revealRange(new vscode.Range(rangeStart, rangeStart), vscode.TextEditorRevealType.InCenter);

  lastAnalyzedText = '';
  lastAnalyzedLine = -1;
  lastPlaybackText = '';

  vscode.window.showInformationMessage(`Zenith Mentor: Recommendation applied — lines ${startLine}-${endLine} optimized.`);
}

// ─── Debounced Watchers ─────────────────────────────────────
function resetIdleTimer() {
  if (idleTimer) { clearTimeout(idleTimer); }
  idleTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) { sendFullPlayback(editor.document.getText()); }
  }, 2000);
}

function onDocumentChange() {
  if (docDebounceTimer) { clearTimeout(docDebounceTimer); }
  postToPanel('stopPlayback');
  lastPlaybackText = '';
  lastAnalyzedText = '';
  lastAnalyzedLine = -1;
  pendingPlaybackText = null;
  docDebounceTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      sendLiveTrace(editor.document.getText(), editor.selection.active.line + 1);
    }
  }, 200);
  resetIdleTimer();
}

function onCursorMove() {
  if (cursorDebounceTimer) { clearTimeout(cursorDebounceTimer); }
  cursorDebounceTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      sendLiveTrace(editor.document.getText(), editor.selection.active.line + 1);
    }
  }, 100);
  resetIdleTimer();
}

// ─── Activation ─────────────────────────────────────────────
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('zenith.openGhost', () => {
    if (panel) { panel.reveal(vscode.ViewColumn.Two); return; }

    const mediaFolder = vscode.Uri.file(path.join(context.extensionPath, 'media'));
    panel = vscode.window.createWebviewPanel('zenithGhost', 'Zenith Ghost', vscode.ViewColumn.Two, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [mediaFolder],
    });

    const p5Uri = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'media', 'p5.min.js'))
    );
    const nonce = crypto.randomBytes(16).toString('base64');
    panel.webview.html = getWebviewContent(p5Uri.toString(), nonce, panel.webview.cspSource);
    panel.onDidDispose(() => { panel = undefined; }, null, context.subscriptions);

    panel.webview.onDidReceiveMessage(
      async (msg: { command: string; data?: unknown }) => {
        if (msg.command === 'applyFix' && msg.data) {
          const fixData = msg.data as { fix: string; startLine: number; endLine: number };
          applyFixToEditor(fixData.fix, fixData.startLine, fixData.endLine);
        } else if (msg.command === 'clearHeat') {
          postToPanel('clearHeat');
        } else if (msg.command === 'finishSession') {
          const answer = await vscode.window.showWarningMessage(
            'Zenith: Are you sure you want to clear your code and finish this session?',
            { modal: true },
            'Yes, Finish'
          );
          if (answer !== 'Yes, Finish') { return; }

          const editor = vscode.window.activeTextEditor ?? lastActiveEditor;
          if (!editor || editor.document.isClosed) { return; }

          const code = editor.document.getText();
          await vscode.window.showTextDocument(editor.document, editor.viewColumn);

          postToPanel('loading', true);
          const roadmap = await generateRoadmap(code);
          postToPanel('loading', false);

          const fullRange = new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(editor.document.lineCount, 0)
          );
          await editor.edit(eb => { eb.replace(fullRange, ''); });

          lastAnalyzedText = '';
          lastAnalyzedLine = -1;
          lastPlaybackText = '';

          if (roadmap) {
            postToPanel('roadmap', roadmap);
          } else {
            vscode.window.showWarningMessage('Zenith: Could not generate roadmap. Please try again.');
          }
        } else if (msg.command === 'startNextTopic') {
          const payload = msg.data as { template: string; pseudocode: string; nextTopic: string };
          const editor = vscode.window.activeTextEditor ?? lastActiveEditor;
          if (!editor || editor.document.isClosed || !payload?.template) { return; }

          let fileContent = '';
          if (payload.pseudocode) {
            const pseudoLines = payload.pseudocode.split('\n').map(l => ' * ' + l).join('\n');
            fileContent += '/*\n * ═══════════════════════════════════════════════\n';
            fileContent += ' *  ZENITH GUIDE: ' + (payload.nextTopic || 'Next Topic') + '\n';
            fileContent += ' * ═══════════════════════════════════════════════\n';
            fileContent += ' *\n' + pseudoLines + '\n *\n';
            fileContent += ' * ═══════════════════════════════════════════════\n';
            fileContent += ' *  Implement the logic above using C++.\n';
            fileContent += ' *  Use the LeetCode / GFG links for reference.\n';
            fileContent += ' * ═══════════════════════════════════════════════\n */\n\n';
          }
          fileContent += payload.template;

          await vscode.window.showTextDocument(editor.document, editor.viewColumn);
          const fullRange = new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(editor.document.lineCount, 0)
          );
          await editor.edit(eb => { eb.replace(fullRange, fileContent); });

          lastAnalyzedText = '';
          lastAnalyzedLine = -1;
          lastPlaybackText = '';

          postToPanel('hideRoadmap');
        }
      },
      undefined,
      context.subscriptions
    );

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      sendLiveTrace(editor.document.getText(), editor.selection.active.line + 1);
      resetIdleTimer();
    }
  });

  if (vscode.window.activeTextEditor) {
    lastActiveEditor = vscode.window.activeTextEditor;
  }

  context.subscriptions.push(
    disposable,
    vscode.workspace.onDidChangeTextDocument(onDocumentChange),
    vscode.window.onDidChangeTextEditorSelection(onCursorMove),
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) { lastActiveEditor = editor; }
    }),
  );
}

export function deactivate() {
  if (docDebounceTimer) { clearTimeout(docDebounceTimer); }
  if (cursorDebounceTimer) { clearTimeout(cursorDebounceTimer); }
  if (idleTimer) { clearTimeout(idleTimer); }
}
