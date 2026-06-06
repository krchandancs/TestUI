import { IUserService, StaffUser } from './IUserService';
import { ServiceResult, ID } from '../types';
import { db } from '../../firebase/config';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
} from 'firebase/firestore';

const COLLECTION_NAME = 'users';

export const firestoreUserService: IUserService = {
  async getAll(): Promise<ServiceResult<StaffUser[]>> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffUser[];
      return { ok: true, data: users };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch users' };
    }
  },

  async getById(id: ID): Promise<ServiceResult<StaffUser>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ok: true, data: { id: docSnap.id, ...docSnap.data() } as StaffUser };
      }
      return { ok: false, error: 'User not found' };
    } catch (error) {
      return { ok: false, error: 'Failed to fetch user' };
    }
  },

  async add(user: Omit<StaffUser, 'id'>): Promise<ServiceResult<StaffUser>> {
    try {
      // Note: voiceProfile will be undefined here if "System Default" was picked, 
      // which is exactly what we want for the Firestore document.
      const docRef = await addDoc(collection(db, COLLECTION_NAME), user);
      return { ok: true, data: { id: docRef.id, ...user } as StaffUser };
    } catch (error) {
      return { ok: false, error: 'Failed to add user' };
    }
  },

  async update(id: ID, changes: Partial<Omit<StaffUser, 'id'>>): Promise<ServiceResult<StaffUser>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, changes);
      // Fetch updated data to return
      const updated = await this.getById(id);
      return updated;
    } catch (error) {
      return { ok: false, error: 'Failed to update user' };
    }
  },

  async deactivate(id: ID): Promise<ServiceResult<StaffUser>> {
    return this.update(id, { status: 'Inactive' });
  },

  async reactivate(id: ID): Promise<ServiceResult<StaffUser>> {
    return this.update(id, { status: 'Active' });
  }
};
