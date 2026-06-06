import { ServiceResult, ID } from '../types';
import { DataSourceBinding, StatusColorRule, IconKey } from '../../types/smarttag.types';

export type TagClass = 'ADMINISTRATIVE' | 'COMPUTATIONAL';

/**
 * How the computational result is sourced.
 *   lis        — PathScribe calls the LIS REST endpoint directly
 *   ai-extract — PathScribe AI proxy fetches + parses unstructured LIS output
 *   pathscribe — Result captured by the pathologist in the synoptic checklist
 */
export type DataSourceType = 'lis' | 'ai-extract' | 'pathscribe';

export interface Flag {
  id:          ID;
  name:        string;
  lisCode:     string;
  description: string;
  level:       'Case' | 'Specimen';
  severity:    1 | 2 | 3 | 4 | 5;
  status:      'Active' | 'Inactive';

  // Set true when the flag was auto-generated from an unrecognised LIS code.
  // Prompts admin review via the AutoCreatedBanner on FlagConfigPage.
  autoCreated?: boolean;

  // Computational enhancement — undefined on ADMINISTRATIVE flags
  tagClass:      TagClass;
  dataSourceType?: DataSourceType;

  /**
   * Maps this computational flag to one or more synoptic field IDs.
   * Used to cross-reference the discrete result against the AI pre-fill
   * for the same field and show a concordance indicator in SidecarDisplay.
   * Field IDs must match the id values in the synoptic template schema.
   *
   * Examples:
   *   her2-ihc  → ['her2_ihc_result', 'her2_status']
   *   mol-panel → ['kras_mutation', 'braf_mutation', 'nras_mutation']
   */
  synopticFieldIds?: string[];

  /**
   * Protocol/template IDs to automatically suggest when this computational
   * flag is ordered. Set by admins in Flag Maintenance.
   * Maps to templateService.listTemplates() IDs.
   * e.g. ['cap-her2-ish-v2024', 'cap-breast-core-biopsy-v2024']
   */
  defaultProtocolIds?: string[];
  iconKey?:     IconKey;
  dataSource?:  DataSourceBinding;
  statusRules?: StatusColorRule[];
  meta?:        Record<string, unknown>;
}

export interface IFlagService {
  getAll():                                            Promise<ServiceResult<Flag[]>>;
  getById(id: ID):                                     Promise<ServiceResult<Flag>>;
  getByClass(tagClass: TagClass):                      Promise<ServiceResult<Flag[]>>;
  add(flag: Omit<Flag, 'id'>):                        Promise<ServiceResult<Flag>>;
  update(id: ID, changes: Partial<Omit<Flag, 'id'>>): Promise<ServiceResult<Flag>>;
  deactivate(id: ID):                                  Promise<ServiceResult<Flag>>;
  reactivate(id: ID):                                  Promise<ServiceResult<Flag>>;
}
