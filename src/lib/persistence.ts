import { doc, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { CalendarDay, WorkoutProgram, UserProfile, WorkoutPlan, WorkoutSession, SetEvent, PersonalRecord } from '../types';
import { getLocal, setLocal, STORAGE_KEYS } from './storage';

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


/**
 * Persiste mapa consolidado de recordes pessoais (PRs) no Firestore.
 */
export async function persistPersonalRecords(
  uid: string,
  records: PersonalRecord[]
): Promise<void> {
  if (!uid || records.length === 0) return;
  const path = `users/${uid}/stats/records`;
  try {
    const docRef = doc(db, 'users', uid, 'stats', 'records');
    const recordsMap: Record<string, PersonalRecord> = {};
    records.forEach((r) => {
      recordsMap[r.exerciseId] = r;
    });
    await setDoc(docRef, { records: recordsMap, updatedAt: Date.now(), ownerUid: uid }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Migra dados locais gerados no modo convidado para o Firestore quando o usuário cria conta ou faz login.
 * Garante que nenhuma sessão, plano customizado ou registro de treino seja perdido.
 */
export async function migrateGuestDataToFirestore(targetUid: string): Promise<{
  migratedSessions: number;
  migratedPlans: number;
  migratedEvents: number;
}> {
  if (!targetUid) return { migratedSessions: 0, migratedPlans: 0, migratedEvents: 0 };

  const localProfile = getLocal<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
  const localSessions = getLocal<WorkoutSession[]>(STORAGE_KEYS.SESSIONS, []);
  const localPlans = getLocal<WorkoutPlan[]>(STORAGE_KEYS.PLANS, []);
  const localEvents = getLocal<SetEvent[]>(STORAGE_KEYS.SET_EVENTS, []);
  const localCalendar = getLocal<CalendarDay[]>(STORAGE_KEYS.CALENDAR, []);
  const localActiveProgram = getLocal<WorkoutProgram | null>(STORAGE_KEYS.ACTIVE_PROGRAM, null);
  const localPRs = getLocal<PersonalRecord[]>(STORAGE_KEYS.PERSONAL_RECORDS, []);

  // Se não houver dados locais de convidado, não há nada a migrar
  const isGuestData = !localProfile || localProfile.uid === 'guest_user' || localProfile.uid.startsWith('guest_') || localSessions.length > 0;
  if (!isGuestData && localSessions.length === 0) {
    return { migratedSessions: 0, migratedPlans: 0, migratedEvents: 0 };
  }

  try {
    // 1. Perfil
    if (localProfile) {
      const userDocRef = doc(db, 'users', targetUid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        const migratedProfile: UserProfile = {
          ...localProfile,
          uid: targetUid,
          updatedAt: Date.now(),
        };
        await setDoc(userDocRef, migratedProfile, { merge: true });
        setLocal(STORAGE_KEYS.USER_PROFILE, migratedProfile);
      }
    }

    // 2. Sessões
    if (localSessions.length > 0) {
      const batch = writeBatch(db);
      localSessions.forEach((s) => {
        const sRef = doc(db, 'users', targetUid, 'sessions', s.id);
        batch.set(sRef, {
          ...s,
          userId: targetUid,
          ownerUid: targetUid,
        }, { merge: true });
      });
      await batch.commit();
    }

    // 3. Planos
    if (localPlans.length > 0) {
      const batch = writeBatch(db);
      localPlans.forEach((p) => {
        const pRef = doc(db, 'users', targetUid, 'plans', p.id);
        batch.set(pRef, {
          ...p,
          userId: targetUid,
          ownerUid: targetUid,
        }, { merge: true });
      });
      await batch.commit();
    }

    // 4. SetEvents
    if (localEvents.length > 0) {
      const recentEvents = localEvents.slice(-300);
      const batch = writeBatch(db);
      recentEvents.forEach((ev) => {
        const evRef = doc(db, 'users', targetUid, 'setEvents', ev.id);
        batch.set(evRef, {
          ...ev,
          ownerUid: targetUid,
        }, { merge: true });
      });
      await batch.commit();
    }

    // 5. Calendário
    if (localCalendar.length > 0) {
      await persistCalendarDays(
        targetUid,
        localCalendar.map((d) => ({ ...d, userId: targetUid, ownerUid: targetUid }))
      );
    }

    // 6. Programa Ativo
    if (localActiveProgram) {
      await persistActiveProgram(targetUid, localActiveProgram);
    }

    // 7. Recordes Pessoais
    if (localPRs.length > 0) {
      await persistPersonalRecords(targetUid, localPRs);
    }

    return {
      migratedSessions: localSessions.length,
      migratedPlans: localPlans.length,
      migratedEvents: localEvents.length,
    };
  } catch (error) {
    console.error('Erro ao migrar dados de convidado para o Firestore:', error);
    return { migratedSessions: 0, migratedPlans: 0, migratedEvents: 0 };
  }
}
