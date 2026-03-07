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

const LOGIC_GUARD_RULES = `
LOGIC-GUARD ERROR DETECTION & QUICK-FIX:
In addition to data structure state, analyze the code for logical errors:
- Memory leaks: nodes allocated with 'new' that have no pointer referencing them (orphaned).
- Dangling pointers: pointer variables that reference freed/deleted memory or uninitialized memory.
- Unintended cycles: circular references in linked lists or trees that should be acyclic.
- Out-of-bounds access: array index access beyond the allocated size.
- Use-after-free: accessing a node after it has been deleted.
- Null dereference: dereferencing a pointer that is null at this line.

For nodes: set "isError": true and "errorMessage": "description" on any node involved in an error.
  If isError is true, ALSO provide:
    "suggestedFix": the exact corrected C++ code that replaces the erroneous lines (e.g. "delete temp;\\ntemp = nullptr;").
    "fixStartLine": the 1-based line number where the erroneous code STARTS.
    "fixEndLine": the 1-based line number where the erroneous code ENDS (inclusive). The fix will REPLACE lines fixStartLine through fixEndLine.
  If isError is false: "errorMessage": "", "suggestedFix": "", "fixStartLine": 0, "fixEndLine": 0.
For edges: set "isError": true and "errorMessage": "description" on erroneous edges. Set "isDangling": true if the edge points to freed/non-existent memory. Otherwise "isError": false, "errorMessage": "", "isDangling": false.`;

// ─── Gemini Setup ───────────────────────────────────────────
const apiKey = process.env.GOOGLE_GEN_AI_KEY || '';
if (!apiKey || apiKey === 'your_api_key_here') {
  console.warn('[Zenith] GOOGLE_GEN_AI_KEY not set — AI analysis will be disabled.');
}

const genAI = new GoogleGenerativeAI(apiKey);

const liveModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
  systemInstruction: `You are a C++ execution engine with Logic-Guard. Analyze the provided C++ code at the indicated line number. Determine the logical state of all data structures AND detect logic errors.

Return ONLY a JSON object:
{
  "type": "LinkedList" | "BinaryTree" | "Array" | "Stack",
  "nodes": [{ "id": "string", "val": "string", "accessCount": 0, "isError": false, "errorMessage": "", "suggestedFix": "", "fixStartLine": 0, "fixEndLine": 0 }],
  "edges": [{ "from": "string", "to": "string", "isActivePath": false, "isError": false, "errorMessage": "", "isDangling": false }],
  "highlightId": "string or null",
  "traceInfo": "string",
  "pointers": [{ "id": "string", "label": "string", "targetNodeId": "string" }],
  "discardedNodeIds": ["string"],
  "stepLabel": "string",
  "complexity": "string"
}

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
${LOGIC_GUARD_RULES}
- ONLY return the JSON. No text.`,
});

const playbackModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
  systemInstruction: `You are a C++ execution engine with Logic-Guard that produces a COMPLETE step-by-step trace. Given C++ code, identify the primary algorithm and data structure, then produce a frame for EVERY logical step. Also detect logic errors at each step.

Return ONLY a JSON object:
{
  "frames": [
    {
      "type": "LinkedList" | "BinaryTree" | "Array" | "Stack",
      "nodes": [{ "id": "string", "val": "string", "accessCount": 0, "isError": false, "errorMessage": "", "suggestedFix": "", "fixStartLine": 0, "fixEndLine": 0 }],
      "edges": [{ "from": "string", "to": "string", "isActivePath": false, "isError": false, "errorMessage": "", "isDangling": false }],
      "highlightId": "string or null",
      "traceInfo": "string",
      "pointers": [{ "id": "string", "label": "string", "targetNodeId": "string" }],
      "discardedNodeIds": ["string"],
      "stepLabel": "string",
      "complexity": "string"
    }
  ]
}

Rules:
- SAME stable node ids across ALL frames.
- Frame 0: initial state. Each subsequent frame: one logical step.
- accessCount: cumulative reads/comparisons/modifications for each node up to this frame. Increases across frames as the algorithm progresses.
- complexity: estimated Big-O (e.g. "O(log n)", "O(n)"). Same across all frames.
- isActivePath on edges: true for the edge being traversed in this frame's step. Only one edge should be active per frame.
- pointers, discardedNodeIds, stepLabel, highlightId, traceInfo as before.
- Keep frames concise (3-10 frames).
- If no algorithm: { "frames": [] }
${LOGIC_GUARD_RULES}
- ONLY return the JSON. No text.`,
});

// ─── Types ──────────────────────────────────────────────────
interface PointerInfo { id: string; label: string; targetNodeId: string; }
interface NodeInfo {
  id: string; val: string; accessCount?: number;
  isError?: boolean; errorMessage?: string;
  suggestedFix?: string; fixStartLine?: number; fixEndLine?: number;
}
interface EdgeInfo { from: string; to: string; isActivePath?: boolean; isError?: boolean; errorMessage?: string; isDangling?: boolean; }
interface DSPayload {
  type: string;
  nodes: NodeInfo[];
  edges: EdgeInfo[];
  highlightId: string | null;
  traceInfo: string;
  pointers: PointerInfo[];
  discardedNodeIds: string[];
  stepLabel: string;
  complexity: string;
}
interface PlaybackPayload { frames: DSPayload[]; }

function sanitizePayload(p: DSPayload): void {
  p.highlightId = p.highlightId ?? null;
  p.traceInfo = p.traceInfo ?? '';
  p.pointers = Array.isArray(p.pointers) ? p.pointers : [];
  p.discardedNodeIds = Array.isArray(p.discardedNodeIds) ? p.discardedNodeIds : [];
  p.stepLabel = p.stepLabel ?? '';
  p.complexity = p.complexity ?? '';
  for (const n of p.nodes) {
    n.accessCount = typeof n.accessCount === 'number' ? n.accessCount : 0;
    n.isError = n.isError ?? false;
    n.errorMessage = n.errorMessage ?? '';
    n.suggestedFix = n.suggestedFix ?? '';
    n.fixStartLine = typeof n.fixStartLine === 'number' ? n.fixStartLine : 0;
    n.fixEndLine = typeof n.fixEndLine === 'number' ? n.fixEndLine : 0;
  }
  for (const e of p.edges) {
    e.isActivePath = e.isActivePath ?? false;
    e.isError = e.isError ?? false;
    e.errorMessage = e.errorMessage ?? '';
    e.isDangling = e.isDangling ?? false;
  }
}

// ─── Live Analysis ──────────────────────────────────────────
async function analyzeCode(text: string, lineNumber: number): Promise<DSPayload | null> {
  if (!apiKey || apiKey === 'your_api_key_here') { return null; }
  try {
    const prompt = `Analyze this C++ code at line ${lineNumber}:\n\n${text}`;
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

async function sendFullPlayback(text: string) {
  if (!panel) { return; }
  if (text === lastPlaybackText) { return; }

  if (isAnalyzing) {
    pendingPlaybackText = text;
    return;
  }

  isAnalyzing = true;
  postToPanel('loading', true);
  const frames = await analyzeFullPlayback(text);
  isAnalyzing = false;
  postToPanel('loading', false);
  if (frames && frames.length > 0) {
    lastPlaybackText = text;
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

  vscode.window.showInformationMessage(`Zenith: Fix applied — replaced lines ${startLine}-${endLine}`);
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
  }, 50);
  resetIdleTimer();
}

function onCursorMove() {
  if (cursorDebounceTimer) { clearTimeout(cursorDebounceTimer); }
  cursorDebounceTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      sendLiveTrace(editor.document.getText(), editor.selection.active.line + 1);
    }
  }, 50);
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
      (msg: { command: string; data?: { fix: string; startLine: number; endLine: number } }) => {
        if (msg.command === 'applyFix' && msg.data) {
          applyFixToEditor(msg.data.fix, msg.data.startLine, msg.data.endLine);
        } else if (msg.command === 'clearHeat') {
          postToPanel('clearHeat');
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
