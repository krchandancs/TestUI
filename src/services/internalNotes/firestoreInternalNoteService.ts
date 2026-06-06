import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { ServiceResult, ID } from '../types';
import { InternalNote, NewInternalNote, IInternalNoteService } from './IInternalNoteService';
import { firestoreAuditService } from '../auditLog/firestoreAuditService';

// ─── Audit Helper ─────────────────────────────────────────────────────────────

const audit = (
  event: string,
  detail: string,
  user: string,
  caseId: string | null = null
) => firestoreAuditService.logEvent({ type: 'user', event, detail, user, caseId, confidence: null });

const COLLECTION = 'internal_notes';

// ─── Converter ────────────────────────────────────────────────────────────────

const fromDoc = (id: string, data: any): InternalNote => ({
  id,
  accession:       data.accession,
  authorId:        data.authorId,
  authorName:      data.authorName,
  type:            data.type,
  body:            data.body,
  visibility:      data.visibility,
  messageThreadId: data.messageThreadId ?? undefined,
  timestamp:       data.timestamp instanceof Timestamp
    ? data.timestamp.toDate()
    : new Date(data.timestamp),
});

// ─── Service ──────────────────────────────────────────────────────────────────

export const firestoreInternalNoteService: IInternalNoteService = {

  async getForCase(accession: string, userId: ID) {
    try {
      // Fetch shared notes + private notes authored by this user in parallel
      const [sharedSnap, privateSnap] = await Promise.all([
        getDocs(query(
          collection(db, COLLECTION),
          where('accession', '==', accession),
          where('visibility', '==', 'shared'),
          orderBy('timestamp', 'desc')
        )),
        getDocs(query(
          collection(db, COLLECTION),
          where('accession', '==', accession),
          where('visibility', '==', 'private'),
          where('authorId', '==', userId),
          orderBy('timestamp', 'desc')
        )),
      ]);

      const seen = new Set<string>();
      const notes: InternalNote[] = [];

      for (const snap of [sharedSnap, privateSnap]) {
        snap.docs.forEach(d => {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            notes.push(fromDoc(d.id, d.data()));
          }
        });
      }

      notes.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return { ok: true, data: notes };
    } catch (e: any) {
      return { ok: false, error: e.message ?? 'Failed to fetch internal notes' };
    }
  },

  async add(note: NewInternalNote) {
    try {
      const payload = { ...note, timestamp: serverTimestamp() };
      const ref = await addDoc(collection(db, COLLECTION), payload);
      const snap = await getDoc(ref);
      const added = fromDoc(snap.id, snap.data());
      await audit(
        'INTERNAL_NOTE_ADDED',
        `${note.type.replace('_', ' ')} note added to Case ${note.accession}${note.visibility === 'private' ? ' [private]' : ''}`,
        note.authorName,
        note.accession
      );
      return { ok: true, data: added };
    } catch (e: any) {
      return { ok: false, error: e.message ?? 'Failed to add case note' };
    }
  },

  async update(id: ID, authorId: ID, changes) {
    try {
      const ref = doc(db, COLLECTION, id);
      const before = await getDoc(ref);
      if (!before.exists()) return { ok: false, error: `Note ${id} not found` };
      const existing = fromDoc(before.id, before.data());
      if (existing.authorId !== authorId) return { ok: false, error: 'Not authorised to edit this note' };
      await updateDoc(ref, changes);
      const updated = fromDoc(id, { ...before.data(), ...changes });
      await audit(
        'INTERNAL_NOTE_UPDATED',
        `Case note updated on Case ${existing.accession}`,
        existing.authorName,
        existing.accession
      );
      return { ok: true, data: updated };
    } catch (e: any) {
      return { ok: false, error: e.message ?? 'Failed to update case note' };
    }
  },

  async remove(id: ID, authorId: ID) {
    try {
      const ref = doc(db, COLLECTION, id);
      const before = await getDoc(ref);
      if (!before.exists()) return { ok: false, error: `Note ${id} not found` };
      const existing = fromDoc(before.id, before.data());
      if (existing.authorId !== authorId) return { ok: false, error: 'Not authorised to delete this note' };
      await deleteDoc(ref);
      await audit(
        'INTERNAL_NOTE_DELETED',
        `Case note deleted from Case ${existing.accession}`,
        existing.authorName,
        existing.accession
      );
      return { ok: true, data: undefined };
    } catch (e: any) {
      return { ok: false, error: e.message ?? 'Failed to delete case note' };
    }
  },
};
