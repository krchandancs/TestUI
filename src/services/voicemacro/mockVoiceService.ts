import { IVoiceMacroService } from './IVoiceMacroService';
import { VoiceMacro } from '../../types/voiceMacros';
import { PATHOLOGY_DEFAULTS } from '../../constants/defaultMacros';

export class MockVoiceMacroService implements IVoiceMacroService {
  private STORAGE_KEY = 'pathscribe_voice_macros';

  private getStoredMacros(): VoiceMacro[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    
    if (!data) {
      // Seed defaults using the correct 'spoken' and 'written' keys
      const seededMacros: VoiceMacro[] = PATHOLOGY_DEFAULTS.map((m: any) => ({
        id: Math.random().toString(36).substring(2, 11),
        spoken: m.spoken || m.name || '',
        written: m.written || m.replacement || '',
        isActive: m.isActive ?? true
      }));
      this.saveToStorage(seededMacros);
      return seededMacros;
    }
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse stored macros, resetting to defaults.");
      return [];
    }
  }

  private saveToStorage(macros: VoiceMacro[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(macros));
  }

  // --- Public API Methods ---

  async getMacros(): Promise<VoiceMacro[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.getStoredMacros()), 300);
    });
  }

  async addMacro(macro: Omit<VoiceMacro, 'id'>): Promise<string> {
    const macros = this.getStoredMacros();
    const newId = Math.random().toString(36).substring(2, 11);
    const newMacro: VoiceMacro = { ...macro, id: newId };
    this.saveToStorage([newMacro, ...macros]);
    return newId;
  }

  async updateMacro(id: string, updates: Partial<VoiceMacro>): Promise<void> {
    const macros = this.getStoredMacros();
    const updated = macros.map(m => (m.id === id ? { ...m, ...updates } : m));
    this.saveToStorage(updated);
  }

  async deleteMacro(id: string): Promise<void> {
    const macros = this.getStoredMacros();
    const filtered = macros.filter(m => m.id !== id);
    this.saveToStorage(filtered);
  }

  async bulkImport(macros: Omit<VoiceMacro, 'id'>[]): Promise<void> {
    const existing = this.getStoredMacros();
    const newEntries = macros.map(m => ({
      ...m,
      id: Math.random().toString(36).substring(2, 11)
    }));
    this.saveToStorage([...newEntries, ...existing]);
  }

  /**
   * REFINED: Uses 'spoken' as the trigger and 'written' as the result.
   */
  async refineTranscript(
    transcript: string, 
    _options?: { context?: string }
  ): Promise<{ success: boolean; data: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const macros = this.getStoredMacros();
        let refinedText = transcript;

        // 1. Filter active and sort by 'spoken' length (longest first)
        const activeMacros = macros
          .filter(m => m.isActive)
          .sort((a, b) => b.spoken.length - a.spoken.length);

        // 2. Perform replacements
        activeMacros.forEach(macro => {
          if (!macro.spoken) return;
          // Use word boundaries to ensure clean replacement
          const regex = new RegExp(`\\b${macro.spoken}\\b`, 'gi');
          refinedText = refinedText.replace(regex, macro.written);
        });

        resolve({
          success: true,
          data: refinedText
        });
      }, 200);
    });
  }
}
