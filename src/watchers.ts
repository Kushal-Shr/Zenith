import * as vscode from 'vscode';
import { DOC_DEBOUNCE_MS, CURSOR_DEBOUNCE_MS, IDLE_TIMEOUT_MS, SELECTION_DEBOUNCE_MS, SELECTION_MIN_LINES } from './config';
import { postToPanel } from './panelManager';
import { sendLiveTrace, sendFullPlayback, sendSelectionPlayback } from './traceController';
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
  state.lastSelectionKey = '';
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
  const selectionSpan = selEndLine - selStartLine;

  postToPanel('cursorSync', {
    activeLine,
    selectedText,
    selStartLine,
    selEndLine,
  });

  if (selectionSpan >= SELECTION_MIN_LINES && selectedText.trim().length > 0) {
    if (state.cursorDebounceTimer) { clearTimeout(state.cursorDebounceTimer); }
    if (state.selectionDebounceTimer) { clearTimeout(state.selectionDebounceTimer); }

    state.selectionDebounceTimer = setTimeout(() => {
      const fullText = editor.document.getText();
      sendSelectionPlayback(fullText, selectedText, selStartLine, selEndLine);
    }, SELECTION_DEBOUNCE_MS);
    return;
  }

  if (state.selectionDebounceTimer) { clearTimeout(state.selectionDebounceTimer); }
  state.lastSelectionKey = '';

  if (state.cursorDebounceTimer) { clearTimeout(state.cursorDebounceTimer); }
  state.cursorDebounceTimer = setTimeout(() => {
    sendLiveTrace(editor.document.getText(), activeLine);
  }, CURSOR_DEBOUNCE_MS);
  resetIdleTimer();
}
