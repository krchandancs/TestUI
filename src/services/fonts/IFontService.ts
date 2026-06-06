import { ServiceResult } from '../types';

export interface EditorFont {
  id: string;
  name: string;            // Display name e.g. "Arial"
  family: string;          // CSS font-family value
  source: 'system' | 'google' | 'custom';
  status: 'Active' | 'Inactive';
}

export interface EditorFontConfig {
  defaultFont: string;     // font id
  defaultSize: number;     // pt e.g. 12
  availableFonts: string[]; // font ids enabled for the editor toolbar
}

export interface IFontService {
  getAll(): Promise<ServiceResult<EditorFont[]>>;
  getConfig(): Promise<ServiceResult<EditorFontConfig>>;
  updateConfig(changes: Partial<EditorFontConfig>): Promise<ServiceResult<EditorFontConfig>>;
  add(font: Omit<EditorFont, 'id'>): Promise<ServiceResult<EditorFont>>;
  deactivate(id: string): Promise<ServiceResult<EditorFont>>;
  reactivate(id: string): Promise<ServiceResult<EditorFont>>;
}
