import { VoiceMacro } from '../../types/voiceMacros';

export interface IVoiceMacroService {
  getMacros(): Promise<VoiceMacro[]>;
  addMacro(macro: Omit<VoiceMacro, 'id'>): Promise<string>;
  updateMacro(id: string, updates: Partial<VoiceMacro>): Promise<void>;
  deleteMacro(id: string): Promise<void>;
  bulkImport(macros: Omit<VoiceMacro, 'id'>[]): Promise<void>;
}
