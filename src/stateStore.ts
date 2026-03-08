import * as vscode from 'vscode';

export const state = {
  panel: undefined as vscode.WebviewPanel | undefined,
  docDebounceTimer: undefined as NodeJS.Timeout | undefined,
  cursorDebounceTimer: undefined as NodeJS.Timeout | undefined,
  idleTimer: undefined as NodeJS.Timeout | undefined,
  isAnalyzing: false,
  lastAnalyzedText: '',
  lastAnalyzedLine: -1,
  lastPlaybackText: '',
  lastActiveEditor: undefined as vscode.TextEditor | undefined,
  pendingTrace: null as { text: string; line: number } | null,
  pendingPlaybackText: null as string | null,
};

export function resetAnalysisState(): void {
  state.lastAnalyzedText = '';
  state.lastAnalyzedLine = -1;
  state.lastPlaybackText = '';
}
