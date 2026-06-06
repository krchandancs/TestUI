// src/services/aiIntegration/aiNormalisationService.ts
// ─────────────────────────────────────────────────────────────────────────────
//
// AI SUGGESTION NORMALISATION SERVICE
//
// PURPOSE
// ───────
// This service sits between the LLM output and the synoptic field panel.
// Its job is to convert free-text LLM responses into structured field values
// that match the exact option IDs defined in each CAP/RCPath template.
//
// THE PROBLEM IT SOLVES
// ─────────────────────
// When an LLM analyses pathology text it returns natural language:
//   "invasive ductal carcinoma, nottingham grade 2"
//
// The synoptic panel needs structured option IDs:
//   { histologic_type: 'invasive_nst', histologic_grade: '2 (score 6)' }
//
// Without normalisation, AI suggestions are silently ignored because the
// values don't match any dropdown option. The user sees blank fields even
// though the AI made a suggestion.
//
// ARCHITECTURE
// ────────────
//
//   Case arrives
//       ↓
//   LLM analyses gross + micro + ancillary text
//   Returns: Record<fieldId, { rawValue: string, confidence: number, source: string }>
//       ↓
//   aiNormalisationService.normalise(rawSuggestions, template)
//       ↓
//   For each field:
//     1. Exact match against option IDs        → use directly, confidence unchanged
//     2. Exact match against option labels     → map to ID, confidence unchanged
//     3. Fuzzy/semantic match against labels   → map to best match, reduce confidence
//     4. No match                              → omit from suggestions (don't guess)
//       ↓
//   Returns: Record<fieldId, AiFieldSuggestion>   (ready for RightSynopticPanel)
//
// ─────────────────────────────────────────────────────────────────────────────
//
// ENGINEERING NOTE — LLM MODULE IMPLEMENTATION
// ════════════════════════════════════════════════════════════════════════════
//
// This section documents everything the LLM engineer needs to implement
// the suggestion pipeline. Read this before writing any LLM integration code.
//
//
// 1. WHAT THE LLM RECEIVES
// ────────────────────────
// The LLM should receive a structured prompt containing:
//
//   a) SYSTEM CONTEXT
//      "You are a board-certified pathologist assistant analysing surgical
//       pathology reports. Extract structured data elements from the provided
//       pathology text. Return only what is explicitly stated — never infer
//       or assume findings that are not documented."
//
//   b) CASE TEXT
//      - Gross description (verbatim from LIS/dictation)
//      - Microscopic description (verbatim)
//      - Ancillary studies (verbatim)
//      - Clinical indication (for context only, not for extraction)
//
//   c) TEMPLATE FIELDS (the extraction targets)
//      For each field in the active template, provide:
//      - Field ID (e.g. "histologic_type")
//      - Field label (e.g. "Histologic Type")
//      - Field type (dropdown | text | multiselect | number)
//      - For dropdowns: the list of valid option labels
//        (NOT option IDs — the LLM should return labels, not internal IDs)
//
//   Example prompt fragment:
//   ┌─────────────────────────────────────────────────────────────────────┐
//   │ Extract the following fields from the pathology report below.       │
//   │ Return a JSON object with field IDs as keys.                        │
//   │ For dropdown fields, return EXACTLY one of the provided options.    │
//   │ If a field cannot be determined from the text, omit it.            │
//   │                                                                     │
//   │ Fields to extract:                                                  │
//   │ - histologic_type (dropdown):                                       │
//   │     "Invasive carcinoma of no special type (NST/ductal)"            │
//   │     "Invasive lobular carcinoma"                                    │
//   │     "Mucinous carcinoma"                                            │
//   │     ... (all options from template)                                 │
//   │                                                                     │
//   │ - tumor_size (text): free text measurement                          │
//   │ - histologic_grade (dropdown):                                      │
//   │     "Grade 1 (score 3-5)"                                           │
//   │     "Grade 2 (score 6-7)"                                           │
//   │     "Grade 3 (score 8-9)"                                           │
//   └─────────────────────────────────────────────────────────────────────┘
//
//
// 2. WHAT THE LLM SHOULD RETURN
// ──────────────────────────────
// A JSON object (not markdown, not prose) of this shape:
//
//   {
//     "histologic_type": {
//       "value": "Invasive carcinoma of no special type (NST/ductal)",
//       "confidence": 0.97,
//       "source": "Micro: \"invasive carcinoma of no special type\""
//     },
//     "tumor_size": {
//       "value": "2.3 cm",
//       "confidence": 0.96,
//       "source": "Gross: \"2.3 × 1.8 × 1.5 cm\""
//     }
//   }
//
//   Rules for the LLM:
//   - value: for dropdowns, EXACTLY match one of the provided option labels
//   - confidence: 0.0–1.0, reflecting certainty from the source text
//   - source: a short verbatim quote from the pathology text that supports
//             the extraction (max ~60 chars). Used to highlight the source
//             text in the LeftReportPanel.
//   - Omit fields entirely if the answer is not in the text. Never guess.
//   - For multi-select fields, value should be an array of label strings.
//
//
// 3. THE NORMALISATION STEP (THIS SERVICE)
// ─────────────────────────────────────────
// After the LLM returns its JSON, this service:
//
//   a) VALIDATES the structure (catches malformed JSON, missing fields)
//
//   b) MAPS labels → IDs for dropdown fields:
//      LLM returns: "Invasive carcinoma of no special type (NST/ductal)"
//      Template has: { id: 'invasive_nst', label: 'Invasive carcinoma of no special type (NST/ductal)' }
//      We store:     { value: 'invasive_nst', confidence: 0.97, ... }
//
//   c) FUZZY FALLBACK for near-matches:
//      LLM returns: "invasive ductal carcinoma NST"
//      No exact label match found
//      Fuzzy match finds: 'invasive_nst' at 0.89 similarity
//      We store: { value: 'invasive_nst', confidence: min(0.97, 0.89) = 0.89 }
//
//   d) DROPS unresolvable values rather than guessing:
//      LLM returns: "I'm not sure"
//      No match found above threshold (0.6)
//      Field is omitted from suggestions entirely
//
//   e) PASSES THROUGH free-text fields unchanged:
//      tumor_size, distances, counts — no option mapping needed
//
//
// 4. CONFIDENCE THRESHOLDS
// ─────────────────────────
//   0.90+  High confidence — auto-pre-fill, show green badge
//   0.75–0.89  Medium — pre-fill, show amber badge, require confirm
//   0.60–0.74  Low — show suggestion but do not pre-fill
//   <0.60  Omit — not worth showing
//
//   The threshold is configurable per-institution in System config.
//   Default: 0.75 for pre-fill.
//
//
// 5. MULTI-SPECIMEN CASES
// ────────────────────────
// Each specimen has its own SynopticReportInstance with its own aiSuggestions.
// The LLM should be called once per specimen, with the specimen description
// and the relevant section of the gross/microscopic text for that specimen.
//
// The panel passes specimenId in the extraction request so the service
// can scope the text correctly.
//
//
// 6. FEEDBACK LOOP
// ─────────────────
// The panel already records AI feedback (see recordAiFeedback in RightSynopticPanel):
//   - 'confirmed'  — user accepted the AI suggestion
//   - 'disputed'   — user changed the AI value
//   - 'missed'     — user filled a field the AI had no suggestion for
//
// These records are stored in localStorage under 'ps_ai_feedback'.
// The LLM module should eventually consume this data to improve prompts
// and identify systematic gaps per template.
//
//
// 7. WHEN TO CALL THE LLM FOR SUGGESTIONS
// ─────────────────────────────────────────
// Current: suggestions are generated at case creation (hardcoded in mock)
// Target:  suggestions should be generated when:
//   a) Case is first opened (on-demand if not yet generated)
//   b) Microscopic description is updated/finalised
//   c) Ancillary studies are received
//   d) User explicitly clicks "Re-analyse"
//
// The trigger point is in RightSynopticPanel — look for the useEffect
// that calls loadAiSuggestions (currently loads from case data).
// Replace the mock load with a call to generateSuggestions() when
// aiSuggestions is empty or stale.
//
//
// 8. TEMPLATE AWARENESS
// ──────────────────────
// Templates are loaded via getTemplate(templateId) in RightSynopticPanel.
// The EditorTemplate shape has:
//   sections: EditorSection[]
//     fields: EditorField[]
//       id: string           ← the field ID used as suggestion key
//       label: string        ← human label for LLM prompting
//       type: 'select' | 'multiselect' | 'text' | 'number' | 'checkbox'
//       options?: { id: string, label: string }[]  ← for dropdowns
//       required?: boolean
//
// Pass the active template to this service so it can build the option
// label→ID mapping dynamically. Never hardcode option IDs in the LLM prompt.
//
// ════════════════════════════════════════════════════════════════════════════

import type { AiFieldSuggestion } from '../../types/case/Case';

// ─── Template field shape (subset needed for normalisation) ───────────────────

export interface NormalisationField {
  id:       string;
  label:    string;
  type:     'select' | 'multiselect' | 'text' | 'number' | 'checkbox';
  options?: { id: string; label: string }[];
}

// ─── Raw LLM output shape ─────────────────────────────────────────────────────
// This is what the LLM returns before normalisation.
// Values are human-readable labels (not option IDs).

export interface RawLlmSuggestion {
  value:      string | string[];
  confidence: number;           // 0.0–1.0
  source:     string;           // verbatim quote from source text
}

export type RawLlmSuggestions = Record<string, RawLlmSuggestion>;

// ─── Normalisation result ─────────────────────────────────────────────────────

export interface NormalisationResult {
  suggestions: Record<string, AiFieldSuggestion>;
  unmapped:    { fieldId: string; rawValue: string; reason: string }[];
  stats: {
    total:    number;
    mapped:   number;
    fuzzy:    number;
    dropped:  number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FUZZY_THRESHOLD   = 0.6;   // minimum similarity to attempt fuzzy mapping
const CONFIDENCE_SCALE  = 0.95;  // multiply confidence by this for fuzzy matches

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseText(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple word-overlap similarity score between two strings.
 * Good enough for option label matching — does not require an LLM.
 */
function similarityScore(a: string, b: string): number {
  const aWords = new Set(normaliseText(a).split(' ').filter(Boolean));
  const bWords = new Set(normaliseText(b).split(' ').filter(Boolean));
  if (aWords.size === 0 || bWords.size === 0) return 0;
  const intersection = [...aWords].filter(w => bWords.has(w)).length;
  const union        = new Set([...aWords, ...bWords]).size;
  return intersection / union;
}

/**
 * Maps a raw label value to a template option ID.
 * Tries exact match first, then case-insensitive, then fuzzy.
 * Returns null if no match above threshold.
 */
function mapLabelToId(
  rawValue: string,
  options: { id: string; label: string }[],
): { id: string; method: 'exact' | 'case_insensitive' | 'fuzzy'; score: number } | null {
  const norm = normaliseText(rawValue);

  // 1. Exact match on ID (LLM sometimes returns IDs directly)
  const byId = options.find(o => o.id === rawValue);
  if (byId) return { id: byId.id, method: 'exact', score: 1.0 };

  // 2. Exact match on label
  const byExactLabel = options.find(o => o.label === rawValue);
  if (byExactLabel) return { id: byExactLabel.id, method: 'exact', score: 1.0 };

  // 3. Case-insensitive label match
  const byCiLabel = options.find(o => normaliseText(o.label) === norm);
  if (byCiLabel) return { id: byCiLabel.id, method: 'case_insensitive', score: 0.99 };

  // 4. Fuzzy match — best similarity score above threshold
  let best: { id: string; score: number } | null = null;
  for (const opt of options) {
    const score = similarityScore(rawValue, opt.label);
    if (score >= FUZZY_THRESHOLD && (!best || score > best.score)) {
      best = { id: opt.id, score };
    }
  }
  if (best) return { ...best, method: 'fuzzy' };

  return null;
}

// ─── Main normalisation function ──────────────────────────────────────────────

/**
 * Normalise raw LLM suggestions against a template's field definitions.
 *
 * @param raw       - Raw suggestions from the LLM (label-based values)
 * @param fields    - Template fields with option definitions
 * @returns         - Normalised suggestions ready for RightSynopticPanel
 *
 * @example
 * const result = normaliseAiSuggestions(llmOutput, template.sections.flatMap(s => s.fields));
 * // Use result.suggestions as aiSuggestions in SynopticReportInstance
 */
export function normaliseAiSuggestions(
  raw:    RawLlmSuggestions,
  fields: NormalisationField[],
): NormalisationResult {
  const suggestions: Record<string, AiFieldSuggestion> = {};
  const unmapped: NormalisationResult['unmapped']       = [];
  let mapped = 0, fuzzy = 0, dropped = 0;

  const fieldMap = new Map(fields.map(f => [f.id, f]));

  for (const [fieldId, rawSug] of Object.entries(raw)) {
    const field = fieldMap.get(fieldId);

    // Unknown field — skip
    if (!field) {
      unmapped.push({ fieldId, rawValue: String(rawSug.value), reason: 'Field not in template' });
      dropped++;
      continue;
    }

    // Free-text fields — pass through unchanged
    if (!field.options || field.options.length === 0) {
      suggestions[fieldId] = {
        value:        rawSug.value,
        confidence:   Math.round(rawSug.confidence * 100),
        source:       rawSug.source,
        verification: 'unverified',
      };
      mapped++;
      continue;
    }

    // Dropdown / multiselect — map labels to IDs
    const rawValues = Array.isArray(rawSug.value) ? rawSug.value : [rawSug.value as string];
    const mappedIds: string[] = [];
    let minScore = rawSug.confidence;
    let isFuzzy  = false;

    for (const rv of rawValues) {
      const match = mapLabelToId(rv, field.options);
      if (!match) {
        unmapped.push({ fieldId, rawValue: rv, reason: 'No matching option found' });
        continue;
      }
      mappedIds.push(match.id);
      if (match.method === 'fuzzy') {
        isFuzzy  = true;
        minScore = Math.min(minScore, match.score * CONFIDENCE_SCALE);
      }
    }

    if (mappedIds.length === 0) {
      dropped++;
      continue;
    }

    suggestions[fieldId] = {
      value:        field.type === 'multiselect' ? mappedIds : mappedIds[0],
      confidence:   Math.round(minScore * 100),
      source:       rawSug.source,
      verification: 'unverified',
    };

    if (isFuzzy) fuzzy++;
    else mapped++;
  }

  return {
    suggestions,
    unmapped,
    stats: { total: Object.keys(raw).length, mapped, fuzzy, dropped },
  };
}

// ─── Stub: generate suggestions via LLM ──────────────────────────────────────
//
// TODO (LLM engineer): Replace this stub with a real implementation.
// See engineering notes at the top of this file for full spec.
//
// The implementation should:
//   1. Build a structured prompt from the template fields + case text
//   2. Call callAi() from aiProviderService
//   3. Parse the JSON response into RawLlmSuggestions
//   4. Call normaliseAiSuggestions() to resolve option IDs
//   5. Return the normalised suggestions
//
// The stub currently returns empty suggestions — cases will show no
// AI pre-fill until this is implemented. Mock cases have suggestions
// hardcoded directly on the SynopticReportInstance for demo purposes.

export async function generateAiSuggestions(
  _caseId:       string,
  _instanceId:   string,
  _templateId:   string,
  _fields:       NormalisationField[],
): Promise<Record<string, AiFieldSuggestion>> {
  // STUB — returns empty until LLM module is implemented
  // Replace with:
  //   const raw = await callLlmForSuggestions(caseText, fields);
  //   const { suggestions } = normaliseAiSuggestions(raw, fields);
  //   return suggestions;
  console.warn('[aiNormalisationService] generateAiSuggestions is a stub — implement LLM call');
  return {};
}
