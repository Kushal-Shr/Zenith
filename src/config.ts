import * as path from 'path';

const DOTENV_PATH = path.join(__dirname, '..', '.env');
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: DOTENV_PATH });

export const apiKey = process.env.GOOGLE_GEN_AI_KEY || '';

if (!apiKey || apiKey === 'your_api_key_here') {
  console.warn('[Zenith] GOOGLE_GEN_AI_KEY not set — AI analysis will be disabled.');
}

export const DELTA_LINE_THRESHOLD = 100;
export const DELTA_CONTEXT_RADIUS = 50;
export const DOC_DEBOUNCE_MS = 200;
export const CURSOR_DEBOUNCE_MS = 100;
export const IDLE_TIMEOUT_MS = 2000;
export const MAX_CACHE_SIZE = 5;
