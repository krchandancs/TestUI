import { IVoiceMacroService } from './IVoiceMacroService';
import { VoiceMacro } from '../../types/voiceMacros';
import { db } from '../../firebase/config'; // <-- Verify this path matches your project
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData 
} from 'firebase/firestore';

export class FirestoreVoiceMacroService implements IVoiceMacroService {
  private collectionName = 'voice_macros';

  async getMacros(): Promise<VoiceMacro[]> {
    const querySnapshot = await getDocs(collection(db, this.collectionName));
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    } as VoiceMacro));
  }

  async addMacro(macro: Omit<VoiceMacro, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.collectionName), macro);
    return docRef.id;
  }

  async updateMacro(id: string, updates: Partial<VoiceMacro>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, updates);
  }

  async deleteMacro(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async bulkImport(macros: Omit<VoiceMacro, 'id'>[]): Promise<void> {
    const batch = writeBatch(db);
    macros.forEach((macro) => {
      const docRef = doc(collection(db, this.collectionName));
      batch.set(docRef, macro);
    });
    await batch.commit();
  }
}
