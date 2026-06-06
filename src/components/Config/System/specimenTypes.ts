export interface SpecimenEntry {
  id: string;
  name: string;            // Add this line
  description?: string;   // Add this
  subspecialty?: string;  // Add this
  type: string;
  procedure: string;
  site?: string;
  laterality?: string;
  normalizedLabel: string;
  synonyms: string[];
  active: boolean;
  version: number;
  updatedBy: string;
  updatedAt: string;
}
