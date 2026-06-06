// src/services/aiIntegration/index.ts
// Barrel export — import AI services from this single entry point.

export type { IAIIntegrationService, AIProcessingOptions, AiFieldSuggestionResult } from './IAIIntegrationService';
export { GeminiAIIntegrationService, PathScribeAIService } from './GeminiAIIntegrationService';
export { MockAIIntegrationService } from './MockAIIntegrationService';
export { callAi } from './aiProviderService';
export type { AiCallOptions, AiCallResult } from './aiProviderService';
