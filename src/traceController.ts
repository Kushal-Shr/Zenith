import * as crypto from 'crypto';
import { MAX_CACHE_SIZE } from './config';
import { DSPayload } from './types';
import { analyzeCode, analyzeFullPlayback, analyzeSelection } from './analyzer';
import { postToPanel } from './panelManager';
import { state } from './stateStore';

const playbackCache = new Map<string, DSPayload[]>();

function getPlaybackCacheKey(text: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  return crypto.createHash('md5').update(trimmed).digest('hex');
}

export async function sendLiveTrace(text: string, lineNumber: number): Promise<void> {
  if (!state.panel) { return; }
  if (text === state.lastAnalyzedText && lineNumber === state.lastAnalyzedLine) { return; }

  if (state.isAnalyzing) {
    state.pendingTrace = { text, line: lineNumber };
    return;
  }

  state.isAnalyzing = true;
  postToPanel('loading', true);
  const payload = await analyzeCode(text, lineNumber);
  state.isAnalyzing = false;
  postToPanel('loading', false);
  if (payload) {
    state.lastAnalyzedText = text;
    state.lastAnalyzedLine = lineNumber;
    postToPanel('updateStructure', payload);
  }

  if (state.pendingTrace) {
    const next = state.pendingTrace;
    state.pendingTrace = null;
    sendLiveTrace(next.text, next.line);
  } else if (state.pendingPlaybackText) {
    const next = state.pendingPlaybackText;
    state.pendingPlaybackText = null;
    sendFullPlayback(next);
  }
}

export async function sendFullPlayback(text: string): Promise<void> {
  if (!state.panel) { return; }
  if (text === state.lastPlaybackText) { return; }

  if (state.isAnalyzing) {
    state.pendingPlaybackText = text;
    return;
  }

  const cacheKey = getPlaybackCacheKey(text);
  const cached = playbackCache.get(cacheKey);
  if (cached) {
    state.lastPlaybackText = text;
    postToPanel('playback', cached);
    return;
  }

  state.isAnalyzing = true;
  postToPanel('loading', true);
  const frames = await analyzeFullPlayback(text);
  state.isAnalyzing = false;
  postToPanel('loading', false);
  if (frames && frames.length > 0) {
    state.lastPlaybackText = text;
    if (playbackCache.size >= MAX_CACHE_SIZE) {
      const oldest = playbackCache.keys().next().value;
      if (oldest !== undefined) { playbackCache.delete(oldest); }
    }
    playbackCache.set(cacheKey, frames);
    postToPanel('playback', frames);
  }

  if (state.pendingPlaybackText) {
    const next = state.pendingPlaybackText;
    state.pendingPlaybackText = null;
    sendFullPlayback(next);
  }
}

export async function sendSelectionPlayback(
  fullText: string,
  selectedText: string,
  startLine: number,
  endLine: number
): Promise<void> {
  if (!state.panel) { return; }

  const selKey = `${startLine}:${endLine}:${selectedText.length}`;
  if (selKey === state.lastSelectionKey) { return; }

  if (state.isAnalyzing) { return; }

  const cacheKey = getPlaybackCacheKey(fullText + '::SEL::' + selectedText);
  const cached = playbackCache.get(cacheKey);
  if (cached) {
    state.lastSelectionKey = selKey;
    postToPanel('playback', cached);
    return;
  }

  state.isAnalyzing = true;
  postToPanel('loading', true);
  const frames = await analyzeSelection(fullText, selectedText, startLine, endLine);
  state.isAnalyzing = false;
  postToPanel('loading', false);

  if (frames && frames.length > 0) {
    state.lastSelectionKey = selKey;
    if (playbackCache.size >= MAX_CACHE_SIZE) {
      const oldest = playbackCache.keys().next().value;
      if (oldest !== undefined) { playbackCache.delete(oldest); }
    }
    playbackCache.set(cacheKey, frames);
    postToPanel('playback', frames);
  }
}
