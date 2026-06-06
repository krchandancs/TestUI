import { ServiceResult, ID } from '../types';

export type ModelStatus = 'Active' | 'Beta' | 'Retired';
export type ModelType   = 'Gross Only' | 'Micro Only' | 'Gross + Micro' | 'Diagnosis Only';

export interface AIModel {
  id: ID;
  name: string;
  version: string;
  type: ModelType;
  accuracy: number;          // 0-100 percent
  casesProcessed: number;
  releaseDate: string;       // ISO date string
  retiredDate?: string;
  status: ModelStatus;
  subspecialtyIds: string[]; // empty = all subspecialties
  notes: string;
  isDefault: boolean;        // the model used for new cases
}

export interface IModelService {
  getAll(): Promise<ServiceResult<AIModel[]>>;
  getById(id: ID): Promise<ServiceResult<AIModel>>;
  getActive(): Promise<ServiceResult<AIModel[]>>;
  getDefault(): Promise<ServiceResult<AIModel | null>>;
  setDefault(id: ID): Promise<ServiceResult<AIModel>>;
  update(id: ID, changes: Partial<Omit<AIModel, 'id'>>): Promise<ServiceResult<AIModel>>;
  retire(id: ID): Promise<ServiceResult<AIModel>>;
}
