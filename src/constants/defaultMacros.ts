import { VoiceMacro } from '../types/voiceMacros';

export const PATHOLOGY_DEFAULTS: Omit<VoiceMacro, 'id'>[] = [
  // Staining & Lab Techniques
  { spoken: "h and e", written: "H&E", isActive: true },
  { spoken: "h n e", written: "H&E", isActive: true },
  { spoken: "i h c", written: "IHC", isActive: true },
  { spoken: "p a s", written: "PAS", isActive: true },
  { spoken: "f i s h", written: "FISH", isActive: true },
  
  // Staging & Classification
  { spoken: "p t", written: "pT", isActive: true },
  { spoken: "p n", written: "pN", isActive: true },
  { spoken: "p m", written: "pM", isActive: true },
  { spoken: "t n m", written: "TNM", isActive: true },
  { spoken: "l v i", written: "LVI", isActive: true },
  
  // Common Pathology Terms
  { spoken: "in situ", written: "in-situ", isActive: true },
  { spoken: "lymphovascular", written: "lymphovascular", isActive: true },
  { spoken: "perineural", written: "perineural", isActive: true },
  { spoken: "gleason", written: "Gleason score", isActive: true },
  { spoken: "carcinoma", written: "carcinoma", isActive: true },
  { spoken: "adenocarcinoma", written: "adenocarcinoma", isActive: true },
  
  // Report Section Headers
  { spoken: "specimen", written: "Specimen:", isActive: true },
  { spoken: "gross", written: "Gross Description:", isActive: true },
  { spoken: "micro", written: "Microscopic Examination:", isActive: true },
  { spoken: "diagnosis", written: "Final Diagnosis:", isActive: true },
  { spoken: "history", written: "Clinical History:", isActive: true },
];
