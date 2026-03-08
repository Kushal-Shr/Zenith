import * as vscode from 'vscode';
import { DOC_DEBOUNCE_MS, CURSOR_DEBOUNCE_MS, IDLE_TIMEOUT_MS } from './config';
import { postToPanel } from './panelManager';
import { sendLiveTrace, sendFullPlayback } from './traceController';
import { state } from './stateStore';

export function resetIdleTimer(): void {
  if (state.idleTimer) { clearTimeout(state.idleTimer); }
  state.idleTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) { sendFullPlayback(editor.document.getText()); }
  }, IDLE_TIMEOUT_MS);
}

export function onDocumentChange(): void {
  if (state.docDebounceTimer) { clearTimeout(state.docDebounceTimer); }
  postToPanel('stopPlayback');
  state.lastPlaybackText = '';
  state.lastAnalyzedText = '';
  state.lastAnalyzedLine = -1;
  state.pendingPlaybackText = null;
  state.docDebounceTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      sendLiveTrace(editor.document.getText(), editor.selection.active.line + 1);
    }
  }, DOC_DEBOUNCE_MS);
  resetIdleTimer();
}

export function onCursorMove(event: vscode.TextEditorSelectionChangeEvent): void {
  const editor = event.textEditor;

  const activeLine = editor.selection.active.line + 1;
  const sel = editor.selection;
  const selectedText = sel.isEmpty ? '' : editor.document.getText(sel);
  const selStartLine = sel.isEmpty ? 0 : sel.start.line + 1;
  const selEndLine = sel.isEmpty ? 0 : sel.end.line + 1;

  postToPanel('cursorSync', {
    activeLine,
    selectedText,
    selStartLine,
    selEndLine,
  });

  if (state.cursorDebounceTimer) { clearTimeout(state.cursorDebounceTimer); }
  state.cursorDebounceTimer = setTimeout(() => {
    sendLiveTrace(editor.document.getText(), activeLine);
  }, CURSOR_DEBOUNCE_MS);
  resetIdleTimer();
}
