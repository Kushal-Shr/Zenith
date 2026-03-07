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

// ─── Gemini Setup ───────────────────────────────────────────
const apiKey = process.env.GOOGLE_GEN_AI_KEY || '';
if (!apiKey || apiKey === 'your_api_key_here') {
  console.warn('[Zenith] GOOGLE_GEN_AI_KEY not set — AI analysis will be disabled.');
}

const genAI = new GoogleGenerativeAI(apiKey);

const liveModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
  systemInstruction: `You are a C++ execution engine. Analyze the provided C++ code and determine the logical state of all data structures (Array, Stack, BinaryTree, or LinkedList) EXACTLY at the line number indicated.

Return ONLY a JSON object:
{
  "type": "LinkedList" | "BinaryTree" | "Array" | "Stack",
  "nodes": [{ "id": "string", "val": "string" }],
  "edges": [{ "from": "string", "to": "string" }],
  "highlightId": "string or null",
  "traceInfo": "string",
  "pointers": [{ "id": "string", "label": "string", "targetNodeId": "string" }],
  "discardedNodeIds": ["string"],
  "stepLabel": "string"
}

Rules:
- Stable node ids (n0, n1, ...). val = display value.
- pointers: every active variable (i, j, low, high, mid, curr, prev, next, head, etc.) with its target node id.
- discardedNodeIds: nodes pruned from active search space at this line. Empty array if none.
- stepLabel: short pruning description (e.g. "target > 50 → discard left"). Empty if none.
- highlightId: node in focus. null if none.
- traceInfo: variable state string. Empty if nothing meaningful.
- If inside a loop, show FIRST iteration state.
- If code is incomplete: { "type": "Empty", "nodes": [], "edges": [], "highlightId": null, "traceInfo": "", "pointers": [], "discardedNodeIds": [], "stepLabel": "" }
- ONLY return the JSON. No text.`,
});

const playbackModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
  systemInstruction: `You are a C++ execution engine that produces a COMPLETE step-by-step trace of an algorithm. Given C++ code, identify the primary algorithm and data structure, then produce a frame for EVERY logical step of execution with a sample test case.

Return ONLY a JSON object:
{
  "frames": [
    {
      "type": "LinkedList" | "BinaryTree" | "Array" | "Stack",
      "nodes": [{ "id": "string", "val": "string" }],
      "edges": [{ "from": "string", "to": "string" }],
      "highlightId": "string or null",
      "traceInfo": "string",
      "pointers": [{ "id": "string", "label": "string", "targetNodeId": "string" }],
      "discardedNodeIds": ["string"],
      "stepLabel": "string"
    }
  ]
}

Rules:
- Use the SAME stable node ids (n0, n1, ...) across ALL frames so animation is smooth.
- Frame 0: the initial state showing the full data structure with all pointers at starting positions.
- Each subsequent frame: one logical step of the algorithm (one loop iteration, one comparison, one swap, one pointer move).
- For binary search: show each iteration with low/mid/high pointers moving and discarded halves.
- For linked list traversal: show curr pointer advancing each step.
- For sorting: show each swap/comparison.
- pointers: every active variable at that step.
- discardedNodeIds: nodes eliminated from active consideration at that step.
- stepLabel: what happened ("mid=4, arr[4]=50 < 63 → discard left" or "curr moves to node 2").
- highlightId: the node being examined.
- traceInfo: variable state summary.
- Keep frames concise. Typically 3-10 frames for most algorithms.
- If no algorithm is found: { "frames": [] }
- ONLY return the JSON. No text.`,
});

// ─── Types ──────────────────────────────────────────────────
interface PointerInfo { id: string; label: string; targetNodeId: string; }
interface DSPayload {
  type: string;
  nodes: { id: string; val: string }[];
  edges: { from: string; to: string }[];
  highlightId: string | null;
  traceInfo: string;
  pointers: PointerInfo[];
  discardedNodeIds: string[];
  stepLabel: string;
}
interface PlaybackPayload { frames: DSPayload[]; }

// ─── Live Analysis ──────────────────────────────────────────
async function analyzeCode(text: string, lineNumber: number): Promise<DSPayload | null> {
  if (!apiKey || apiKey === 'your_api_key_here') { return null; }

  try {
    const prompt = `Analyze this C++ code at line ${lineNumber}:\n\n${text}`;
    const result = await liveModel.generateContent(prompt);
    const jsonText = result.response.text();
    const parsed: DSPayload = JSON.parse(jsonText);

    if (!parsed.type || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) { return null; }

    parsed.highlightId = parsed.highlightId ?? null;
    parsed.traceInfo = parsed.traceInfo ?? '';
    parsed.pointers = Array.isArray(parsed.pointers) ? parsed.pointers : [];
    parsed.discardedNodeIds = Array.isArray(parsed.discardedNodeIds) ? parsed.discardedNodeIds : [];
    parsed.stepLabel = parsed.stepLabel ?? '';
    return parsed;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Zenith] Live trace error:', message);
    return null;
  }
}

// ─── Full Playback Analysis ─────────────────────────────────
async function analyzeFullPlayback(text: string): Promise<DSPayload[] | null> {
  if (!apiKey || apiKey === 'your_api_key_here') { return null; }

  try {
    const prompt = `Trace the complete algorithm execution for this C++ code:\n\n${text}`;
    const result = await playbackModel.generateContent(prompt);
    const jsonText = result.response.text();
    const parsed: PlaybackPayload = JSON.parse(jsonText);

    if (!Array.isArray(parsed.frames) || parsed.frames.length === 0) { return null; }

    for (const f of parsed.frames) {
      f.highlightId = f.highlightId ?? null;
      f.traceInfo = f.traceInfo ?? '';
      f.pointers = Array.isArray(f.pointers) ? f.pointers : [];
      f.discardedNodeIds = Array.isArray(f.discardedNodeIds) ? f.discardedNodeIds : [];
      f.stepLabel = f.stepLabel ?? '';
    }

    return parsed.frames;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Zenith] Playback trace error:', message);
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
    if (editor) {
      sendFullPlayback(editor.document.getText());
    }
  }, 2000);
}

function onDocumentChange() {
  if (docDebounceTimer) { clearTimeout(docDebounceTimer); }

  postToPanel('stopPlayback');
  lastPlaybackText = '';

  docDebounceTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const line = editor.selection.active.line + 1;
      sendLiveTrace(editor.document.getText(), line);
    }
  }, 300);

  resetIdleTimer();
}

function onCursorMove() {
  if (cursorDebounceTimer) { clearTimeout(cursorDebounceTimer); }

  cursorDebounceTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const line = editor.selection.active.line + 1;
      sendLiveTrace(editor.document.getText(), line);
    }
  }, 200);
}

// ─── Activation ─────────────────────────────────────────────
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('zenith.openGhost', () => {
    if (panel) {
      panel.reveal(vscode.ViewColumn.Two);
      return;
    }

    const mediaFolder = vscode.Uri.file(path.join(context.extensionPath, 'media'));

    panel = vscode.window.createWebviewPanel(
      'zenithGhost',
      'Zenith Ghost',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [mediaFolder],
      }
    );

    const p5Uri = panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'media', 'p5.min.js'))
    );
    const nonce = crypto.randomBytes(16).toString('base64');
    panel.webview.html = getWebviewContent(p5Uri.toString(), nonce, panel.webview.cspSource);

    panel.onDidDispose(() => { panel = undefined; }, null, context.subscriptions);

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const line = editor.selection.active.line + 1;
      sendLiveTrace(editor.document.getText(), line);
      resetIdleTimer();
    }
  });

  const docWatcher = vscode.workspace.onDidChangeTextDocument(onDocumentChange);
  const cursorWatcher = vscode.window.onDidChangeTextEditorSelection(onCursorMove);

  context.subscriptions.push(disposable, docWatcher, cursorWatcher);
}

export function deactivate() {
  if (docDebounceTimer) { clearTimeout(docDebounceTimer); }
  if (cursorDebounceTimer) { clearTimeout(cursorDebounceTimer); }
  if (idleTimer) { clearTimeout(idleTimer); }
}
