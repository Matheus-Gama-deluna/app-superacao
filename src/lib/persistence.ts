import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { CalendarDay, WorkoutProgram, UserProfile } from '../types';

/**
 * Persiste um documento em subcoleção do usuário injetando ownerUid de forma canônica.
 */
export async function persistUserDoc<T extends Record<string, any>>(
  uid: string,
  subCollection: string,
  docId: string,
  data: T,
  options?: { merge?: boolean }
): Promise<void> {
  const path = `users/${uid}/${subCollection}/${docId}`;
  try {
    const docRef = doc(db, 'users', uid, subCollection, docId);
    const payload = {
      ...data,
      ownerUid: data.ownerUid || uid,
    };
    await setDoc(docRef, payload, { merge: options?.merge });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Remove um documento de subcoleção do usuário.
 */
export async function deleteUserDoc(
  uid: string,
  subCollection: string,
  docId: string
): Promise<void> {
  const path = `users/${uid}/${subCollection}/${docId}`;
  try {
    const docRef = doc(db, 'users', uid, subCollection, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Persiste uma lista de dias do calendário no Firestore em lote.
 */
export async function persistCalendarDays(
  uid: string,
  days: CalendarDay[]
): Promise<void> {
  if (!uid || days.length === 0) return;
  try {
    // Firestore batch suporta até 500 operações por commit
    const batch = writeBatch(db);
    for (const day of days) {
      const docRef = doc(db, 'users', uid, 'calendar', day.id);
      batch.set(docRef, {
        ...day,
        ownerUid: day.ownerUid || uid,
      }, { merge: true });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/calendar`);
  }
}

/**
 * Persiste o programa ativo do praticante no Firestore (ou remove se for null).
 */
export async function persistActiveProgram(
  uid: string,
  program: WorkoutProgram | null
): Promise<void> {
  if (!uid) return;
  const path = `users/${uid}/programs/active_program`;
  try {
    const docRef = doc(db, 'users', uid, 'programs', 'active_program');
    if (program) {
      await setDoc(docRef, {
        ...program,
        ownerUid: uid,
        updatedAt: Date.now(),
      });
    } else {
      await deleteDoc(docRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Atualiza campos parciais do perfil do usuário na raiz de seu documento users/{uid}.
 */
export async function persistUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  if (!uid) return;
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
