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

const LOGIC_GUARD_RULES = `
LOGIC-GUARD ERROR DETECTION:
In addition to data structure state, analyze the code for logical errors:
- Memory leaks: nodes allocated with 'new' that have no pointer referencing them (orphaned).
- Dangling pointers: pointer variables that reference freed/deleted memory or uninitialized memory.
- Unintended cycles: circular references in linked lists or trees that should be acyclic.
- Out-of-bounds access: array index access beyond the allocated size.
- Use-after-free: accessing a node after it has been deleted.
- Null dereference: dereferencing a pointer that is null at this line.

For nodes: set "isError": true and "errorMessage": "description" on any node involved in an error. Otherwise "isError": false, "errorMessage": "".
For edges: set "isError": true and "errorMessage": "description" on erroneous edges (e.g. cycle-causing edge, dangling pointer edge). Set "isDangling": true if the edge points to freed/non-existent memory. Otherwise "isError": false, "errorMessage": "", "isDangling": false.`;

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
  "nodes": [{ "id": "string", "val": "string", "isError": false, "errorMessage": "" }],
  "edges": [{ "from": "string", "to": "string", "isError": false, "errorMessage": "", "isDangling": false }],
  "highlightId": "string or null",
  "traceInfo": "string",
  "pointers": [{ "id": "string", "label": "string", "targetNodeId": "string" }],
  "discardedNodeIds": ["string"],
  "stepLabel": "string"
}

Rules:
- Stable node ids (n0, n1, ...). val = display value.
- pointers: every active variable with its target node id.
- discardedNodeIds: nodes pruned from active search space. Empty array if none.
- stepLabel: short pruning description. Empty if none.
- highlightId: node in focus. null if none.
- traceInfo: variable state string. Empty if nothing meaningful.
- If inside a loop, show FIRST iteration state.
- If code is incomplete: { "type": "Empty", "nodes": [], "edges": [], "highlightId": null, "traceInfo": "", "pointers": [], "discardedNodeIds": [], "stepLabel": "" }
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
      "nodes": [{ "id": "string", "val": "string", "isError": false, "errorMessage": "" }],
      "edges": [{ "from": "string", "to": "string", "isError": false, "errorMessage": "", "isDangling": false }],
      "highlightId": "string or null",
      "traceInfo": "string",
      "pointers": [{ "id": "string", "label": "string", "targetNodeId": "string" }],
      "discardedNodeIds": ["string"],
      "stepLabel": "string"
    }
  ]
}

Rules:
- SAME stable node ids across ALL frames.
- Frame 0: initial state. Each subsequent frame: one logical step.
- pointers, discardedNodeIds, stepLabel, highlightId, traceInfo as before.
- Keep frames concise (3-10 frames).
- If no algorithm: { "frames": [] }
${LOGIC_GUARD_RULES}
- ONLY return the JSON. No text.`,
});

// ─── Types ──────────────────────────────────────────────────
interface PointerInfo { id: string; label: string; targetNodeId: string; }
interface NodeInfo { id: string; val: string; isError?: boolean; errorMessage?: string; }
interface EdgeInfo { from: string; to: string; isError?: boolean; errorMessage?: string; isDangling?: boolean; }
interface DSPayload {
  type: string;
  nodes: NodeInfo[];
  edges: EdgeInfo[];
  highlightId: string | null;
  traceInfo: string;
  pointers: PointerInfo[];
  discardedNodeIds: string[];
  stepLabel: string;
}
interface PlaybackPayload { frames: DSPayload[]; }

function sanitizePayload(p: DSPayload): void {
  p.highlightId = p.highlightId ?? null;
  p.traceInfo = p.traceInfo ?? '';
  p.pointers = Array.isArray(p.pointers) ? p.pointers : [];
  p.discardedNodeIds = Array.isArray(p.discardedNodeIds) ? p.discardedNodeIds : [];
  p.stepLabel = p.stepLabel ?? '';
  for (const n of p.nodes) {
    n.isError = n.isError ?? false;
    n.errorMessage = n.errorMessage ?? '';
  }
  for (const e of p.edges) {
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

async function sendLiveTrace(text: string, lineNumber: number) {
  if (!panel || isAnalyzing) { return; }
  if (text === lastAnalyzedText && lineNumber === lastAnalyzedLine) { return; }
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
}

async function sendFullPlayback(text: string) {
  if (!panel || isAnalyzing) { return; }
  if (text === lastPlaybackText) { return; }
  isAnalyzing = true;
  postToPanel('loading', true);
  const frames = await analyzeFullPlayback(text);
  isAnalyzing = false;
  postToPanel('loading', false);
  if (frames && frames.length > 0) {
    lastPlaybackText = text;
    postToPanel('playback', frames);
  }
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
  docDebounceTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      sendLiveTrace(editor.document.getText(), editor.selection.active.line + 1);
    }
  }, 300);
  resetIdleTimer();
}

function onCursorMove() {
  if (cursorDebounceTimer) { clearTimeout(cursorDebounceTimer); }
  cursorDebounceTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      sendLiveTrace(editor.document.getText(), editor.selection.active.line + 1);
    }
  }, 200);
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

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      sendLiveTrace(editor.document.getText(), editor.selection.active.line + 1);
      resetIdleTimer();
    }
  });

  context.subscriptions.push(
    disposable,
    vscode.workspace.onDidChangeTextDocument(onDocumentChange),
    vscode.window.onDidChangeTextEditorSelection(onCursorMove),
  );
}

export function deactivate() {
  if (docDebounceTimer) { clearTimeout(docDebounceTimer); }
  if (cursorDebounceTimer) { clearTimeout(cursorDebounceTimer); }
  if (idleTimer) { clearTimeout(idleTimer); }
}
