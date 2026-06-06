import { ServiceResult, ID } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InternalNoteType =
  | 'informal_review'
  | 'clinical_observation'
  | 'consultation'
  | 'addendum_request'
  | 'other';

export type InternalNoteVisibility = 'private' | 'shared';

export const INTERNAL_NOTE_TYPE_LABELS: Record<InternalNoteType, string> = {
  informal_review:      'Informal Review',
  clinical_observation: 'Clinical Observation',
  consultation:         'Consultation',
  addendum_request:     'Addendum Request',
  other:                'Other',
};

export interface InternalNote {
  id: ID;
  accession: string;           // Case accession number e.g. 'S26-4401'
  authorId: ID;
  authorName: string;
  type: InternalNoteType;
  body: string;
  visibility: InternalNoteVisibility;
  messageThreadId?: ID;        // Optional — links back to a message thread
  timestamp: Date;
}

export type NewInternalNote = Omit<InternalNote, 'id' | 'timestamp'>;

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IInternalNoteService {
  /** Get all notes for a case visible to a given user.
   *  Returns: shared notes from all authors + private notes authored by userId */
  getForCase(accession: string, userId: ID): Promise<ServiceResult<InternalNote[]>>;

  /** Add a new case note */
  add(note: NewInternalNote): Promise<ServiceResult<InternalNote>>;

  /** Update an existing note (author only) */
  update(id: ID, authorId: ID, changes: Partial<Pick<InternalNote, 'body' | 'type' | 'visibility'>>): Promise<ServiceResult<InternalNote>>;

  /** Delete a note (author only) */
  remove(id: ID, authorId: ID): Promise<ServiceResult<void>>;
}
