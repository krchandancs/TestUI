import { ServiceResult, ID } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CaseNoteType =
  | 'informal_review'
  | 'clinical_observation'
  | 'consultation'
  | 'addendum_request'
  | 'other';

export type CaseNoteVisibility = 'private' | 'shared';

export const CASE_NOTE_TYPE_LABELS: Record<CaseNoteType, string> = {
  informal_review:      'Informal Review',
  clinical_observation: 'Clinical Observation',
  consultation:         'Consultation',
  addendum_request:     'Addendum Request',
  other:                'Other',
};

export interface CaseNote {
  id: ID;
  accession: string;           // Case accession number e.g. 'S26-4401'
  authorId: ID;
  authorName: string;
  type: CaseNoteType;
  body: string;
  visibility: CaseNoteVisibility;
  messageThreadId?: ID;        // Optional — links back to a message thread
  timestamp: Date;
}

export type NewCaseNote = Omit<CaseNote, 'id' | 'timestamp'>;

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ICaseNoteService {
  /** Get all notes for a case visible to a given user.
   *  Returns: shared notes from all authors + private notes authored by userId */
  getForCase(accession: string, userId: ID): Promise<ServiceResult<CaseNote[]>>;

  /** Add a new case note */
  add(note: NewCaseNote): Promise<ServiceResult<CaseNote>>;

  /** Update an existing note (author only) */
  update(id: ID, authorId: ID, changes: Partial<Pick<CaseNote, 'body' | 'type' | 'visibility'>>): Promise<ServiceResult<CaseNote>>;

  /** Delete a note (author only) */
  remove(id: ID, authorId: ID): Promise<ServiceResult<void>>;
}
