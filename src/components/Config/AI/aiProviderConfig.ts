// src/components/Config/AI/aiProviderConfig.ts
// ─────────────────────────────────────────────────────────────
// Defines which AI providers PathScribe supports and how to
// resolve the active config at runtime.
//
// Priority order (highest wins):
//   1. User-level override (localStorage, dev/testing only)
//   2. Org-level setting   (fetched from your admin API / Firestore)
//   3. Environment variable defaults (set at deploy time)
//
// Keys NEVER live in the browser in production. The browser sends
// requests to /api/ai-proxy, which injects the key server-side.
// The apiKey field here is only populated in local dev mode where
// VITE_AI_DEV_MODE=true and VITE_AI_API_KEY is set.
// ─────────────────────────────────────────────────────────────

export type AiProviderId =
  | 'anthropic'
  | 'openai'
  | 'azure_openai'
  | 'aws_bedrock'
  | 'mock'        // Demo / offline testing — no API calls
  | 'custom';

// ─── Per-provider model options ───────────────────────────────

export const PROVIDER_MODELS: Record<AiProviderId, { id: string; label: string }[]> = {
  anthropic: [
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (recommended)' },
    { id: 'claude-opus-4-20250514',   label: 'Claude Opus 4 (highest accuracy)' },
    { id: 'claude-haiku-4-5-20251001',label: 'Claude Haiku 4.5 (fastest)' },
  ],
  openai: [
    { id: 'gpt-4o',        label: 'GPT-4o (recommended)' },
    { id: 'gpt-4-turbo',   label: 'GPT-4 Turbo' },
    { id: 'gpt-4',         label: 'GPT-4' },
  ],
  azure_openai: [
    { id: 'gpt-4o',      label: 'GPT-4o (Azure)' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo (Azure)' },
  ],
  aws_bedrock: [
    { id: 'anthropic.claude-sonnet-4-20250514-v1:0', label: 'Claude Sonnet 4 via Bedrock' },
    { id: 'anthropic.claude-opus-4-20250514-v1:0',   label: 'Claude Opus 4 via Bedrock' },
    { id: 'amazon.nova-pro-v1:0',                    label: 'Amazon Nova Pro' },
  ],
  mock: [
    { id: 'mock-v1', label: 'Mock (instant, no API cost — demo only)' },
  ],
  custom: [
    { id: 'custom', label: 'Custom model (set in endpoint config)' },
  ],
};

// ─── Config shape ─────────────────────────────────────────────

export interface AiProviderConfig {
  /** Which provider to use */
  providerId: AiProviderId;

  /** Model ID — must be valid for the chosen provider */
  modelId: string;

  /**
   * Only for azure_openai: your deployment name.
   * e.g. 'my-gpt4-deployment'
   */
  azureDeploymentName?: string;

  /**
   * Only for azure_openai: your resource endpoint.
   * e.g. 'https://my-org.openai.azure.com'
   */
  azureEndpoint?: string;

  /**
   * Only for aws_bedrock: AWS region.
   * e.g. 'us-east-1'
   */
  awsRegion?: string;

  /**
   * Only for custom: full base URL of the OpenAI-compatible endpoint.
   * e.g. 'https://my-llm.hospital.internal/v1'
   */
  customEndpoint?: string;

  /**
   * LOCAL DEV ONLY — populated from VITE_AI_API_KEY when
   * VITE_AI_DEV_MODE=true. Never set this in production.
   */
  apiKey?: string;

  /**
   * In production, all AI calls are routed through your backend proxy
   * so the real API key never reaches the browser.
   * Set VITE_AI_PROXY_URL to your proxy base, e.g. '/api/ai'
   */
  proxyUrl?: string;

  /** Max tokens for completions (default 1000) */
  maxTokens?: number;
}

// ─── Environment-variable defaults ───────────────────────────
// Set these in your .env / deployment config.
// VITE_ prefix makes them available to the Vite build.
//
//   VITE_AI_PROVIDER=anthropic
//   VITE_AI_MODEL=claude-sonnet-4-20250514
//   VITE_AI_PROXY_URL=/api/ai
//   VITE_AI_DEV_MODE=true          # enables direct browser→API calls
//   VITE_AI_API_KEY=sk-ant-...     # only used when DEV_MODE=true
//   VITE_AI_AZURE_ENDPOINT=https://...
//   VITE_AI_AZURE_DEPLOYMENT=...
//   VITE_AI_AWS_REGION=us-east-1
//   VITE_AI_CUSTOM_ENDPOINT=https://...

function envDefaults(): AiProviderConfig {
  const providerId = (import.meta.env.VITE_AI_PROVIDER ?? 'anthropic') as AiProviderId;
  const isDevMode  = import.meta.env.VITE_AI_DEV_MODE === 'true';

  return {
    providerId,
    modelId:              import.meta.env.VITE_AI_MODEL ?? PROVIDER_MODELS[providerId]?.[0]?.id ?? 'claude-sonnet-4-20250514',
    proxyUrl:             import.meta.env.VITE_AI_PROXY_URL ?? '/api/ai',
    apiKey:               isDevMode ? (import.meta.env.VITE_AI_API_KEY ?? '') : undefined,
    azureDeploymentName:  import.meta.env.VITE_AI_AZURE_DEPLOYMENT,
    azureEndpoint:        import.meta.env.VITE_AI_AZURE_ENDPOINT,
    awsRegion:            import.meta.env.VITE_AI_AWS_REGION ?? 'us-east-1',
    customEndpoint:       import.meta.env.VITE_AI_CUSTOM_ENDPOINT,
    maxTokens:            Number(import.meta.env.VITE_AI_MAX_TOKENS ?? 1000),
  };
}

// ─── Org-level config (loaded from your admin API / Firestore) ─
// Shape of the document stored in your org settings collection.
export interface OrgAiConfig {
  providerId: AiProviderId;
  modelId: string;
  azureDeploymentName?: string;
  azureEndpoint?: string;
  awsRegion?: string;
  customEndpoint?: string;
  maxTokens?: number;
  // Note: API keys are NEVER stored here — they live in your backend secrets manager
}

// ─── Storage keys ─────────────────────────────────────────────
const USER_OVERRIDE_KEY = 'pathscribe_ai_user_config';
const ORG_CONFIG_KEY    = 'pathscribe_ai_org_config';   // populated by your auth/org bootstrap

// ─── Config resolution ────────────────────────────────────────

/**
 * Returns the active AI provider config, respecting the priority chain:
 *   user override > org config > env defaults
 *
 * Call this wherever you need to make an AI request.
 */
export function resolveAiConfig(): AiProviderConfig {
  const base = envDefaults();

  // Layer 2: org config (written by your org-bootstrap code after login)
  try {
    const orgRaw = localStorage.getItem(ORG_CONFIG_KEY);
    if (orgRaw) {
      const org: OrgAiConfig = JSON.parse(orgRaw);
      Object.assign(base, org);
    }
  } catch { /* corrupt storage — fall through */ }

  // Layer 1: user override (dev/testing only)
  try {
    const userRaw = localStorage.getItem(USER_OVERRIDE_KEY);
    if (userRaw) {
      const user: Partial<AiProviderConfig> = JSON.parse(userRaw);
      Object.assign(base, user);
    }
  } catch { /* corrupt storage — fall through */ }

  return base;
}

/**
 * Saves a user-level override config.
 * Intended for dev/QA use — admins should configure at org level.
 */
export function setUserAiConfig(config: Partial<AiProviderConfig>): void {
  localStorage.setItem(USER_OVERRIDE_KEY, JSON.stringify(config));
}

/**
 * Saves the org-level config fetched from your backend after login.
 * Call this from your auth bootstrap / org context provider.
 */
export function setOrgAiConfig(config: OrgAiConfig): void {
  localStorage.setItem(ORG_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Clears the user-level override, reverting to org/env defaults.
 */
export function clearUserAiConfig(): void {
  localStorage.removeItem(USER_OVERRIDE_KEY);
}

/**
 * Returns true when running in local dev mode with direct API access.
 * Production must always use the proxy.
 */
export function isDevMode(): boolean {
  return import.meta.env.VITE_AI_DEV_MODE === 'true';
}
