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
let isAnalyzing = false;
let lastAnalyzedText = '';
let lastAnalyzedLine = -1;

// ─── Gemini Setup ───────────────────────────────────────────
const apiKey = process.env.GOOGLE_GEN_AI_KEY || '';
if (!apiKey || apiKey === 'your_api_key_here') {
  console.warn('[Zenith] GOOGLE_GEN_AI_KEY not set — AI analysis will be disabled.');
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
  systemInstruction: `You are a C++ execution engine. Analyze the provided C++ code and determine the logical state of all data structures (Array, Stack, Tree, or LinkedList) EXACTLY at the line number indicated in the prompt.

Rules for execution tracing:
- If the indicated line is inside a loop, visualize the state during the FIRST iteration.
- Identify which specific node, index, or variable is being modified or accessed at the indicated line.
- The "highlightId" must match the "id" of the node currently in focus at that line. If no specific node is in focus, set it to null.
- The "traceInfo" should be a short human-readable string describing the variable state at that line (e.g. "curr = node[1], val = 20" or "i = 2, arr[2] = 30"). If nothing meaningful, set it to "".

Return ONLY a JSON object with this exact schema:
{
  "type": "LinkedList" | "BinaryTree" | "Array" | "Stack",
  "nodes": [{ "id": "string", "val": "string" }],
  "edges": [{ "from": "string", "to": "string" }],
  "highlightId": "string or null",
  "traceInfo": "string"
}

- "id" must be a unique stable identifier for each node (e.g. "n0", "n1", ...).
- "val" is the display value for that node.
- "edges" lists directed connections between node ids.
- For a LinkedList, edges go from each node to the next.
- For a BinaryTree, edges go from parent to left/right children.
- For an Array, create one node per element with no edges.
- For a Stack, create nodes from bottom to top with edges pointing upward.
- If the code is incomplete, mid-edit, or contains no recognizable data structure, return: { "type": "Empty", "nodes": [], "edges": [], "highlightId": null, "traceInfo": "" }
- Never include explanation text — return ONLY the JSON object.`,
});

// ─── AI Analysis ────────────────────────────────────────────
interface DSPayload {
  type: string;
  nodes: { id: string; val: string }[];
  edges: { from: string; to: string }[];
  highlightId: string | null;
  traceInfo: string;
}

async function analyzeCode(text: string, lineNumber: number): Promise<DSPayload | null> {
  if (!apiKey || apiKey === 'your_api_key_here') {
    return null;
  }

  try {
    const prompt = `Analyze this C++ code at line ${lineNumber}:\n\n${text}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonText = response.text();
    const parsed: DSPayload = JSON.parse(jsonText);

    if (!parsed.type || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      console.warn('[Zenith] Gemini returned malformed JSON:', jsonText);
      return null;
    }

    parsed.highlightId = parsed.highlightId ?? null;
    parsed.traceInfo = parsed.traceInfo ?? '';

    return parsed;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Zenith] Gemini API error:', message);
    return null;
  }
}

// ─── Panel Communication ────────────────────────────────────
function postToPanel(command: string, data?: unknown) {
  if (panel) {
    panel.webview.postMessage({ command, data });
  }
}

async function sendTraceToPanel(text: string, lineNumber: number) {
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

// ─── Debounced Watchers ─────────────────────────────────────
function onDocumentChange() {
  if (docDebounceTimer) { clearTimeout(docDebounceTimer); }

  docDebounceTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const line = editor.selection.active.line + 1;
      sendTraceToPanel(editor.document.getText(), line);
    }
  }, 500);
}

function onCursorMove() {
  if (cursorDebounceTimer) { clearTimeout(cursorDebounceTimer); }

  cursorDebounceTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const line = editor.selection.active.line + 1;
      sendTraceToPanel(editor.document.getText(), line);
    }
  }, 300);
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

    panel.onDidDispose(() => {
      panel = undefined;
    }, null, context.subscriptions);

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const line = editor.selection.active.line + 1;
      sendTraceToPanel(editor.document.getText(), line);
    }
  });

  const docWatcher = vscode.workspace.onDidChangeTextDocument(onDocumentChange);
  const cursorWatcher = vscode.window.onDidChangeTextEditorSelection(onCursorMove);

  context.subscriptions.push(disposable, docWatcher, cursorWatcher);
}

export function deactivate() {
  if (docDebounceTimer) { clearTimeout(docDebounceTimer); }
  if (cursorDebounceTimer) { clearTimeout(cursorDebounceTimer); }
}
