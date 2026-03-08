import { apiKey, DELTA_LINE_THRESHOLD, DELTA_CONTEXT_RADIUS } from './config';
import { DSPayload, PlaybackPayload } from './types';
import { liveModel, playbackModel } from './geminiModels';

export function sanitizePayload(p: DSPayload): void {
  p.highlightId = p.highlightId ?? null;
  p.traceInfo = p.traceInfo ?? '';
  p.pointers = Array.isArray(p.pointers) ? p.pointers : [];
  p.variables = Array.isArray(p.variables) ? p.variables : [];
  p.discardedNodeIds = Array.isArray(p.discardedNodeIds) ? p.discardedNodeIds : [];
  p.stepLabel = p.stepLabel ?? '';
  p.complexity = p.complexity ?? '';
  for (const n of p.nodes) {
    n.accessCount = typeof n.accessCount === 'number' ? n.accessCount : 0;
    n.isError = n.isError ?? false;
    n.isSuggestion = n.isSuggestion ?? false;
    n.errorMessage = n.errorMessage ?? '';
    n.suggestedFix = n.suggestedFix ?? '';
    n.fixStartLine = typeof n.fixStartLine === 'number' ? n.fixStartLine : 0;
    n.fixEndLine = typeof n.fixEndLine === 'number' ? n.fixEndLine : 0;
  }
  for (const e of p.edges) {
    e.isActivePath = e.isActivePath ?? false;
    e.isError = e.isError ?? false;
    e.isSuggestion = e.isSuggestion ?? false;
    e.errorMessage = e.errorMessage ?? '';
    e.isDangling = e.isDangling ?? false;
  }
}

export function buildPrompt(text: string, lineNumber: number): string {
  const lines = text.split('\n');
  if (lines.length <= DELTA_LINE_THRESHOLD) {
    return `Analyze this C++ code at line ${lineNumber}:\n\n${text}`;
  }
  const start = Math.max(0, lineNumber - 1 - DELTA_CONTEXT_RADIUS);
  const end = Math.min(lines.length, lineNumber - 1 + DELTA_CONTEXT_RADIUS);
  const contextLines = lines.slice(start, end);
  const numberedContext = contextLines.map((l, i) => `${start + i + 1}: ${l}`).join('\n');
  return `Analyze this C++ code at line ${lineNumber}. The file has ${lines.length} lines total. Only the relevant context window (lines ${start + 1}-${end}) is shown. Only update nodes/positions that changed — preserve stable layout for unchanged nodes.\n\n${numberedContext}`;
}

export async function analyzeCode(text: string, lineNumber: number): Promise<DSPayload | null> {
  if (!apiKey || apiKey === 'your_api_key_here') { return null; }
  try {
    const prompt = buildPrompt(text, lineNumber);
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

export async function analyzeSelection(fullText: string, selectedText: string, startLine: number, endLine: number): Promise<DSPayload[] | null> {
  if (!apiKey || apiKey === 'your_api_key_here') { return null; }
  try {
    const prompt = `The user has highlighted lines ${startLine}-${endLine} of their C++ code. Trace ONLY the highlighted block step-by-step, showing how the data structure changes as each line in the selection executes. Use the full code for context (to know the initial state of the data structure), but the frames should only cover the execution of the highlighted code.

FULL CODE:\n\n${fullText}\n\nHIGHLIGHTED CODE (lines ${startLine}-${endLine}):\n\n${selectedText}`;
    const result = await playbackModel.generateContent(prompt);
    const parsed: PlaybackPayload = JSON.parse(result.response.text());
    if (!Array.isArray(parsed.frames) || parsed.frames.length === 0) { return null; }
    for (const f of parsed.frames) { sanitizePayload(f); }
    return parsed.frames;
  } catch (err: unknown) {
    console.error('[Zenith] Selection trace error:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function analyzeFullPlayback(text: string): Promise<DSPayload[] | null> {
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
