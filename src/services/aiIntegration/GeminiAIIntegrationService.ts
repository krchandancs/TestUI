// src/services/aiIntegration/GeminiAIIntegrationService.ts
// ─────────────────────────────────────────────────────────────
// Concrete AI integration that routes through the configured
// provider (Anthropic, OpenAI, Azure, Bedrock, or custom) via
// aiProviderService — not hardcoded to Gemini/Google any more.
//
// The class name is kept for backwards compatibility with any
// existing instantiation sites. A type alias is exported so
// new code can use the clearer name.
// ─────────────────────────────────────────────────────────────

import { IAIIntegrationService, AIProcessingOptions, AiFieldSuggestionResult } from './IAIIntegrationService';
import { callAi } from './aiProviderService';
import { ServiceResult, VoiceMacro } from '../../types';

export class GeminiAIIntegrationService implements IAIIntegrationService {
  // apiKey kept in constructor signature for backwards compatibility,
  // but routing now goes through aiProviderService which reads from
  // aiProviderConfig (env vars → org config → user override).
  constructor(_apiKey?: string) {}

  // ── Transcript refinement ───────────────────────────────────
  async refineTranscript(
    text: string,
    options?: AIProcessingOptions
  ): Promise<ServiceResult<string>> {
    try {
      const { text: refined } = await callAi({
        system: 'You are an expert Pathology Transcription Assistant. Correct phonetic errors, format measurements, and use proper pathology capitalisation. Return ONLY the refined text.',
        prompt: `Context: ${options?.context ?? 'Pathology Report'}\nRaw Text: "${text}"`,
        maxTokens: 500,
      });
      return { success: true, data: refined.trim() };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ── Macro suggestions ───────────────────────────────────────
  async suggestMacros(text: string): Promise<ServiceResult<Partial<VoiceMacro>[]>> {
    try {
      const { text: raw } = await callAi({
        system: 'You are a pathology macro assistant. Analyse text and suggest useful shorthand macros as JSON only — no markdown.',
        prompt: `Suggest macros for this pathology text. Return JSON array: [{"id":"m1","keyword":"XX","expansion":"Full text"}]\n\nText: "${text}"`,
        maxTokens: 300,
      });
      const clean  = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return { success: true, data: Array.isArray(parsed) ? parsed : [] };
    } catch {
      // Graceful fallback — macro suggestions are non-critical
      return { success: true, data: [] };
    }
  }

  // ── Synoptic field suggestions ──────────────────────────────
  async suggestSynopticFields(
    caseText: { gross: string; microscopic: string; ancillary: string },
    fields: Array<{ id: string; label: string; options?: Array<{ id: string; label: string }> }>
  ): Promise<ServiceResult<Record<string, AiFieldSuggestionResult>>> {
    try {
      const fieldList = fields.map(f => {
        const opts = f.options?.map(o => `${o.id} (${o.label})`).join(', ');
        return opts
          ? `- ${f.id} | ${f.label} | options: [${opts}]`
          : `- ${f.id} | ${f.label} | free text`;
      }).join('\n');

      const { text: raw } = await callAi({
        system: 'You are a pathology AI assistant. Return only valid JSON — no markdown, no preamble.',
        prompt: `Analyse the following pathology case and suggest answers for each synoptic field.

GROSS: ${caseText.gross}
MICROSCOPIC: ${caseText.microscopic}
ANCILLARY: ${caseText.ancillary}

FIELDS (id | label | allowed option ids):
${fieldList}

Return JSON: { "field_id": { "value": "option_id_or_string", "confidence": 85, "source": "short quote" } }
Rules:
- value must be an option id when options are listed
- confidence 0–100
- source ≤12 words from the case text
- Only include fields you can answer with confidence ≥30`,
        maxTokens: 1000,
      });

      const clean  = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      return { success: true, data: parsed };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ── Narrative generation ────────────────────────────────────
  async generateNarrative(system: string, prompt: string): Promise<ServiceResult<string>> {
    try {
      const { text } = await callAi({ system, prompt, maxTokens: 1000 });
      return { success: true, data: text };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Cleaner alias for new code
export const PathScribeAIService = GeminiAIIntegrationService;
