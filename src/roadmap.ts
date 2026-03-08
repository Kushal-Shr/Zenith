import { apiKey } from './config';
import { RoadmapPayload } from './types';
import { roadmapModel } from './geminiModels';

export async function generateRoadmap(code: string): Promise<RoadmapPayload | null> {
  if (!apiKey || apiKey === 'your_api_key_here') { return null; }
  try {
    const prompt = `The user just finished writing this C++ code. Suggest what to learn next:\n\n${code}`;
    const result = await roadmapModel.generateContent(prompt);
    const parsed: RoadmapPayload = JSON.parse(result.response.text());
    if (!parsed.nextTopic || !Array.isArray(parsed.leetcode)) { return null; }
    return parsed;
  } catch (err: unknown) {
    console.error('[Zenith] Roadmap error:', err instanceof Error ? err.message : String(err));
    return null;
  }
}
