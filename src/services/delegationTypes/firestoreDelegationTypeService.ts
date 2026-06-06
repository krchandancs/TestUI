import {
  collection, doc,
  getDocs, getDoc,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { IDelegationTypeService, DelegationType } from './IDelegationTypeService';
import { ServiceResult, ID } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COL = 'delegationTypes';

const ok  = <T>(data: T): ServiceResult<T>    => ({ ok: true,  data });
const err = <T>(msg: string): ServiceResult<T> => ({ ok: false, error: msg });

function fromDoc(id: string, data: Record<string, any>): DelegationType {
  return {
    id,
    label:              data.label              ?? '',
    description:        data.description        ?? '',
    transfersOwnership: data.transfersOwnership ?? false,
    requiresNote:       data.requiresNote       ?? false,
    multiAssign:        data.multiAssign        ?? false,
    color:              data.color              ?? '#94a3b8',
    active:             data.active             ?? true,
    isSystem:           data.isSystem           ?? false,
    sortOrder:          data.sortOrder          ?? 999,
    cptHint:            data.cptHint            ?? undefined,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const firestoreDelegationTypeService: IDelegationTypeService = {

  async getAll() {
    try {
      const snap = await getDocs(
        query(collection(db, COL), orderBy('sortOrder', 'asc'))
      );
      return ok(snap.docs.map(d => fromDoc(d.id, d.data())));
    } catch (e: any) {
      return err(e.message ?? 'getAll failed');
    }
  },

  async getActive() {
    try {
      const snap = await getDocs(
        query(collection(db, COL), where('active', '==', true), orderBy('sortOrder', 'asc'))
      );
      return ok(snap.docs.map(d => fromDoc(d.id, d.data())));
    } catch (e: any) {
      return err(e.message ?? 'getActive failed');
    }
  },

  async getById(id: ID) {
    try {
      const snap = await getDoc(doc(db, COL, id));
      if (!snap.exists()) return err(`DelegationType ${id} not found`);
      return ok(fromDoc(snap.id, snap.data()));
    } catch (e: any) {
      return err(e.message ?? 'getById failed');
    }
  },

  async add(dt) {
    try {
      const snap = await getDocs(query(collection(db, COL), orderBy('sortOrder', 'desc')));
      const maxOrder = snap.empty ? 0 : (snap.docs[0].data().sortOrder ?? 0);
      const ref = await addDoc(collection(db, COL), {
        ...dt,
        isSystem:  false,
        sortOrder: maxOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const created = await getDoc(ref);
      return ok(fromDoc(created.id, created.data()!));
    } catch (e: any) {
      return err(e.message ?? 'add failed');
    }
  },

  async update(id: ID, changes) {
    try {
      const ref = doc(db, COL, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return err(`DelegationType ${id} not found`);
      // Prevent callers from flipping isSystem
      const { isSystem: _ignored, ...safeChanges } = changes as any;
      await updateDoc(ref, { ...safeChanges, updatedAt: serverTimestamp() });
      const updated = await getDoc(ref);
      return ok(fromDoc(updated.id, updated.data()!));
    } catch (e: any) {
      return err(e.message ?? 'update failed');
    }
  },

  async deactivate(id: ID) {
    return firestoreDelegationTypeService.update(id, { active: false });
  },

  async reactivate(id: ID) {
    return firestoreDelegationTypeService.update(id, { active: true });
  },

  async remove(id: ID) {
    try {
      const ref  = doc(db, COL, id);
      const snap = await getDoc(ref);
      if (!snap.exists())       return err(`DelegationType ${id} not found`);
      if (snap.data().isSystem) return err(`Cannot delete system type "${id}"`);
      await deleteDoc(ref);
      return ok(undefined);
    } catch (e: any) {
      return err(e.message ?? 'remove failed');
    }
  },

};
