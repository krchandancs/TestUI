export * from './serviceResult';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'pathologist' | 'admin' | 'lab-tech';
  initials?: string;
  voiceProfile?: string;
  // This is what's missing and causing the AuthContext errors:
  credentials?: {
    email?: string;
    password?: string;
  };
  participationTypeIds?: string[]; // Adding this here will also fix those other 20+ errors!
}

export interface VoiceMacro {
  id: string;
  keyword: string;
  expansion: string;
  category?: 'gross' | 'micro' | 'general';
}
// As you add more types (like VoiceMacro or AIConfig), add them here:
// export * from './voiceMacros';
