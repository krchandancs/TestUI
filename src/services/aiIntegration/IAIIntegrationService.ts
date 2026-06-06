import { ServiceResult, VoiceMacro } from '../../types';

export interface AIProcessingOptions {
  context?: string;
  templateId?: string;
}

/** Structured completion for a single synoptic field */
export interface AiFieldSuggestionResult {
  value: string | string[];
  confidence: number;   // 0–100
  source: string;       // short quote from case text
}

export interface IAIIntegrationService {
  /**
   * Refines a raw transcript into a professional pathology format.
   * Example: "Rose description" -> "Gross Description"
   */
  refineTranscript(
    text: string,
    options?: AIProcessingOptions
  ): Promise<ServiceResult<string>>;

  /**
   * Analyzes text to suggest potential new macros or shortcuts.
   */
  suggestMacros(
    text: string
  ): Promise<ServiceResult<Partial<VoiceMacro>[]>>;

  /**
   * Given case text (gross/micro/ancillary) and a list of synoptic
   * fields, returns AI-suggested values with confidence scores.
   * Used by the synoptic panel to pre-populate fields on template load.
   */
  suggestSynopticFields(
    caseText: { gross: string; microscopic: string; ancillary: string },
    fields: Array<{ id: string; label: string; options?: Array<{ id: string; label: string }> }>
  ): Promise<ServiceResult<Record<string, AiFieldSuggestionResult>>>;

  /**
   * Generates a full narrative pathology report from synoptic answers.
   */
  generateNarrative(
    system: string,
    prompt: string
  ): Promise<ServiceResult<string>>;
}
