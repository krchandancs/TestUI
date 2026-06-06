export interface INarrativeService {
  getNarrative(caseId: string): Promise<string>;
  saveNarrative(caseId: string, html: string): Promise<void>;
  deleteNarrative(caseId: string): Promise<void>;
}