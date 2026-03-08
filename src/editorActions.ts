import * as vscode from 'vscode';
import { state, resetAnalysisState } from './stateStore';

export async function applyFixToEditor(fix: string, startLine: number, endLine: number): Promise<void> {
  const editor = vscode.window.activeTextEditor ?? state.lastActiveEditor;
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
  resetAnalysisState();
  vscode.window.showInformationMessage(`Zenith Mentor: Recommendation applied — lines ${startLine}-${endLine} optimized.`);
}
