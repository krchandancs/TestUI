// src/services/aiIntegration/aiProviderService.ts
// ─────────────────────────────────────────────────────────────
// Unified AI completion layer for PathScribe.
//
// All providers route through the Vite dev proxy in development,
// and through your backend proxy in production. This avoids CORS
// issues — Anthropic blocks direct browser-to-API calls entirely.
//
// Proxy config lives in vite.config.ts → server.proxy.
// ─────────────────────────────────────────────────────────────

import {
  resolveAiConfig,
  isDevMode,
  type AiProviderConfig,
  type AiProviderId,
} from '@/components/Config/AI/aiProviderConfig';

export interface AiCallOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
  configOverride?: Partial<AiProviderConfig>;
}

export interface AiCallResult {
  text: string;
  provider: AiProviderId;
  model: string;
}

// ─── Provider-specific request builders ──────────────────────

function buildAnthropicRequest(cfg: AiProviderConfig, opts: AiCallOptions): { url: string; headers: Record<string, string>; body: object } {
  // Anthropic blocks direct browser→API calls with CORS.
  // Always route through the Vite proxy → vite.config.ts injects x-api-key server-side.
  return {
    url: '/api/ai/anthropic/v1/messages',
    headers: { 'Content-Type': 'application/json' },
    body: {
      model:      cfg.modelId,
      max_tokens: opts.maxTokens ?? cfg.maxTokens ?? 1000,
      system:     opts.system,
      messages:   [{ role: 'user', content: opts.prompt }],
    },
  };
}

function buildOpenAiRequest(cfg: AiProviderConfig, opts: AiCallOptions): { url: string; headers: Record<string, string>; body: object } {
  return {
    url: '/api/ai/openai/v1/chat/completions',
    headers: { 'Content-Type': 'application/json' },
    body: {
      model:      cfg.modelId,
      max_tokens: opts.maxTokens ?? cfg.maxTokens ?? 1000,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user',   content: opts.prompt },
      ],
    },
  };
}

function buildAzureRequest(cfg: AiProviderConfig, opts: AiCallOptions): { url: string; headers: Record<string, string>; body: object } {
  const devMode = isDevMode() && !!cfg.apiKey;
  const url = devMode
    ? `${cfg.azureEndpoint}/openai/deployments/${cfg.azureDeploymentName}/chat/completions?api-version=2024-02-15-preview`
    : `${cfg.proxyUrl}/azure/chat/completions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (devMode) headers['api-key'] = cfg.apiKey!;
  return {
    url,
    headers,
    body: {
      max_tokens: opts.maxTokens ?? cfg.maxTokens ?? 1000,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user',   content: opts.prompt },
      ],
    },
  };
}

function buildBedrockRequest(cfg: AiProviderConfig, opts: AiCallOptions): { url: string; headers: Record<string, string>; body: object } {
  return {
    url: `${cfg.proxyUrl}/bedrock/invoke`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      modelId:   cfg.modelId,
      region:    cfg.awsRegion ?? 'us-east-1',
      maxTokens: opts.maxTokens ?? cfg.maxTokens ?? 1000,
      system:    opts.system,
      prompt:    opts.prompt,
    },
  };
}

function buildCustomRequest(cfg: AiProviderConfig, opts: AiCallOptions): { url: string; headers: Record<string, string>; body: object } {
  const devMode = isDevMode() && !!cfg.apiKey;
  const base    = cfg.customEndpoint ?? cfg.proxyUrl ?? '/api/ai/custom';
  const url     = devMode ? `${base}/chat/completions` : `${cfg.proxyUrl}/custom/chat/completions`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (devMode && cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;
  return {
    url,
    headers,
    body: {
      model:      cfg.modelId,
      max_tokens: opts.maxTokens ?? cfg.maxTokens ?? 1000,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user',   content: opts.prompt },
      ],
    },
  };
}

// ─── Response parsers ─────────────────────────────────────────

function parseAnthropicResponse(data: any): string {
  return (data.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('');
}

function parseOpenAiResponse(data: any): string {
  return data.choices?.[0]?.message?.content ?? '';
}

const parseAzureResponse  = parseOpenAiResponse;
const parseCustomResponse = parseOpenAiResponse;

function parseBedrockResponse(data: any): string {
  if (data.content) return parseAnthropicResponse(data);
  if (data.output?.message?.content?.[0]?.text) return data.output.message.content[0].text;
  return data.generation ?? data.results?.[0]?.outputText ?? '';
}

// ─── Main entry point ─────────────────────────────────────────

export async function callAi(opts: AiCallOptions): Promise<AiCallResult> {
  const cfg: AiProviderConfig = {
    ...resolveAiConfig(),
    ...opts.configOverride,
  };

  let request: { url: string; headers: Record<string, string>; body: object };
  let parseResponse: (data: any) => string;

  switch (cfg.providerId) {
    case 'anthropic':
      request       = buildAnthropicRequest(cfg, opts);
      parseResponse = parseAnthropicResponse;
      break;
    case 'openai':
      request       = buildOpenAiRequest(cfg, opts);
      parseResponse = parseOpenAiResponse;
      break;
    case 'azure_openai':
      request       = buildAzureRequest(cfg, opts);
      parseResponse = parseAzureResponse;
      break;
    case 'aws_bedrock':
      request       = buildBedrockRequest(cfg, opts);
      parseResponse = parseBedrockResponse;
      break;
    case 'custom':
      request       = buildCustomRequest(cfg, opts);
      parseResponse = parseCustomResponse;
      break;
    default:
      throw new Error(`[PathScribe AI] Unknown provider: ${(cfg as any).providerId}`);
  }

  const response = await fetch(request.url, {
    method:  'POST',
    headers: request.headers,
    body:    JSON.stringify(request.body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `[PathScribe AI] ${cfg.providerId} returned ${response.status}: ${errorBody.slice(0, 200)}`
    );
  }

  const data = await response.json();
  const text = parseResponse(data);

  return { text, provider: cfg.providerId, model: cfg.modelId };
}
