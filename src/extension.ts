import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import { getWebviewContent } from './webview';
import { state, resetAnalysisState } from './stateStore';
import { postToPanel } from './panelManager';
import { applyFixToEditor } from './editorActions';
import { generateRoadmap } from './roadmap';
import { sendLiveTrace } from './traceController';
import { onDocumentChange, onCursorMove, resetIdleTimer } from './watchers';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('zenith.openGhost', () => {
    if (state.panel) { state.panel.reveal(vscode.ViewColumn.Two); return; }

    const mediaFolder = vscode.Uri.file(path.join(context.extensionPath, 'media'));
    state.panel = vscode.window.createWebviewPanel('zenithGhost', 'Zenith Ghost', vscode.ViewColumn.Two, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [mediaFolder],
    });

    const p5Uri = state.panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'media', 'p5.min.js'))
    );
    const nonce = crypto.randomBytes(16).toString('base64');
    state.panel.webview.html = getWebviewContent(p5Uri.toString(), nonce, state.panel.webview.cspSource);
    state.panel.onDidDispose(() => { state.panel = undefined; }, null, context.subscriptions);

    state.panel.webview.onDidReceiveMessage(
      async (msg: { command: string; data?: unknown }) => {
        if (msg.command === 'applyFix' && msg.data) {
          const fixData = msg.data as { fix: string; startLine: number; endLine: number };
          applyFixToEditor(fixData.fix, fixData.startLine, fixData.endLine);
        } else if (msg.command === 'clearHeat') {
          postToPanel('clearHeat');
        } else if (msg.command === 'finishSession') {
          await handleFinishSession();
        } else if (msg.command === 'startNextTopic') {
          await handleStartNextTopic(msg.data as { template: string; pseudocode: string; nextTopic: string });
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
    state.lastActiveEditor = vscode.window.activeTextEditor;
  }

  context.subscriptions.push(
    disposable,
    vscode.workspace.onDidChangeTextDocument(onDocumentChange),
    vscode.window.onDidChangeTextEditorSelection(e => onCursorMove(e)),
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) { state.lastActiveEditor = editor; }
    }),
  );
}

async function handleFinishSession(): Promise<void> {
  const answer = await vscode.window.showWarningMessage(
    'Zenith: Are you sure you want to clear your code and finish this session?',
    { modal: true },
    'Yes, Finish'
  );
  if (answer !== 'Yes, Finish') { return; }

  const editor = vscode.window.activeTextEditor ?? state.lastActiveEditor;
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
  resetAnalysisState();

  if (roadmap) {
    postToPanel('roadmap', roadmap);
  } else {
    vscode.window.showWarningMessage('Zenith: Could not generate roadmap. Please try again.');
  }
}

async function handleStartNextTopic(payload: { template: string; pseudocode: string; nextTopic: string }): Promise<void> {
  const editor = vscode.window.activeTextEditor ?? state.lastActiveEditor;
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
  resetAnalysisState();
  postToPanel('hideRoadmap');
}

export function deactivate() {
  if (state.docDebounceTimer) { clearTimeout(state.docDebounceTimer); }
  if (state.cursorDebounceTimer) { clearTimeout(state.cursorDebounceTimer); }
  if (state.idleTimer) { clearTimeout(state.idleTimer); }
}
