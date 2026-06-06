import { INarrativeService } from './INarrativeService';

const KEY_PREFIX = 'mock_narrative_';

export const mockNarrativeService: INarrativeService = {
  async getNarrative(caseId: string): Promise<string> {
    return localStorage.getItem(KEY_PREFIX + caseId) ?? '';
  },

  async saveNarrative(caseId: string, html: string): Promise<void> {
    localStorage.setItem(KEY_PREFIX + caseId, html);
  },

  async deleteNarrative(caseId: string): Promise<void> {
    localStorage.removeItem(KEY_PREFIX + caseId);
  }
};