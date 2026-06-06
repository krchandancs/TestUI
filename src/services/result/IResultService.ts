// PathScribe — IResultService
// Fetches live ComputationalResult data for a given flag + case.
// Implementations: MockResultService (dev) / FirestoreResultService (prod).

import { ComputationalResult } from '../../types/smarttag.types';

export interface IResultService {
  /**
   * Returns the current ComputationalResult for a flag's data source
   * bound to a specific case.
   *
   * @param sourceId  Flag's dataSource.sourceId — stable identifier for the assay.
   * @param caseId    The case the result belongs to.
   */
  getResult(sourceId: string, caseId: string): Promise<ComputationalResult>;
}
