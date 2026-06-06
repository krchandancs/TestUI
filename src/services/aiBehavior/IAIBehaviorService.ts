/**
 * IAIBehaviorService.ts
 * src/services/aiIntegration/IAIBehaviorService.ts
 */
import type { ServiceResult } from '../types';

export interface AIBehaviorConfig {
  confidenceThreshold:    number;
  autoInsertSuggestions:  boolean;
  showConfidenceScores:   boolean;
  subspecialtyRouting:    boolean;
  grossEnabled:           boolean;
  microscopicEnabled:     boolean;
  macroSuggestions:       boolean;
}

export const DEFAULT_AI_BEHAVIOR_CONFIG: AIBehaviorConfig = {
  confidenceThreshold:   75,
  autoInsertSuggestions: false,
  showConfidenceScores:  true,
  subspecialtyRouting:   true,
  grossEnabled:          true,
  microscopicEnabled:    true,
  macroSuggestions:      false,
};

// Alias for existing code that imports AI_BEHAVIOR_DEFAULTS
export const AI_BEHAVIOR_DEFAULTS = DEFAULT_AI_BEHAVIOR_CONFIG;

export interface IAIBehaviorService {
  get():                                    Promise<ServiceResult<AIBehaviorConfig>>;
  update(patch: Partial<AIBehaviorConfig>): Promise<ServiceResult<AIBehaviorConfig>>;
  reset():                                  Promise<ServiceResult<AIBehaviorConfig>>;
}

// ── Mock implementation ───────────────────────────────────────

const LS_KEY = 'ps_ai_behavior_config_v1';

const load = (): AIBehaviorConfig => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT_AI_BEHAVIOR_CONFIG, ...JSON.parse(raw) } : { ...DEFAULT_AI_BEHAVIOR_CONFIG };
  } catch { return { ...DEFAULT_AI_BEHAVIOR_CONFIG }; }
};

const save = (config: AIBehaviorConfig) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(config)); } catch {}
};

export const aiBehaviorService: IAIBehaviorService = {
  async get() {
    return { ok: true, data: load() };
  },
  async update(patch) {
    const merged = { ...load(), ...patch };
    save(merged);
    return { ok: true, data: merged };
  },
  async reset() {
    localStorage.removeItem(LS_KEY);
    return { ok: true, data: { ...DEFAULT_AI_BEHAVIOR_CONFIG } };
  },
};
