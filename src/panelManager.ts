import { state } from './stateStore';

export function postToPanel(command: string, data?: unknown): void {
  if (state.panel) {
    state.panel.webview.postMessage({ command, data });
  }
}
