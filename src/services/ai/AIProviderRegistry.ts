// src/services/ai/AIProviderRegistry.ts
// ─────────────────────────────────────────────────────────────
// Resolves the active IAIProvider from the configured AiProviderConfig.
//
// This is the single place that maps provider IDs to concrete
// implementations. The rest of the codebase only imports IAIProvider —
// never ClaudeProvider or MockProvider directly.
//
// Usage:
//   const provider = AIProviderRegistry.getActive();
//   const result   = await provider.generateStream(request, onToken);
// ─────────────────────────────────────────────────────────────

import { resolveAiConfig } from '../../components/Config/AI/aiProviderConfig';
import type { IAIProvider }  from './IAIProvider';
import { ClaudeProvider }    from './providers/ClaudeProvider';
import { MockProvider }      from './providers/MockProvider';

export class AIProviderRegistry {

  /**
   * Returns the currently configured IAIProvider.
   *
   * Priority chain (highest wins):
   *   user override > org config > env defaults
   *
   * Call this at the start of any AI generation request.
   */
  static getActive(): IAIProvider {
    const config = resolveAiConfig();

    switch (config.providerId) {

      case 'mock':
        return new MockProvider();

      case 'anthropic':
        return new ClaudeProvider(config.modelId);

      // Future providers — implementations pending
      case 'openai':
      case 'azure_openai':
      case 'aws_bedrock':
      case 'custom':
        console.warn(
          `[AIProviderRegistry] Provider '${config.providerId}' is configured ` +
          `but not yet implemented. Falling back to MockProvider to prevent ` +
          `broken state. Wire the implementation in AIProviderRegistry.getActive().`,
        );
        return new MockProvider(0); // instant mock, no delay

      default:
        console.error(
          `[AIProviderRegistry] Unknown provider '${(config as any).providerId}'. ` +
          `Falling back to MockProvider.`,
        );
        return new MockProvider(0);
    }
  }

  /**
   * Returns a specific provider by ID, ignoring org config.
   * Used for the "Test Connection" button in AiProviderSettings.
   */
  static getById(providerId: string, modelId?: string): IAIProvider {
    switch (providerId) {
      case 'mock':
        return new MockProvider(0); // instant for test
      case 'anthropic':
        return new ClaudeProvider(modelId ?? 'claude-sonnet-4-20250514');
      default:
        return new MockProvider(0);
    }
  }
}
