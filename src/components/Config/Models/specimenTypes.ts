export interface Subspecialty {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export interface Specimen {
  id: string;
  name: string;
  description: string;
  subspecialtyId: string;
  subspecialtyName: string;
  specimenCode?: string;
  active: boolean;
  version: number;
  updatedBy: string;
  updatedAt: string;
}
