import {
  TeacherStudentLink,
  TeacherDayPrescription,
  WorkoutPlan,
  CalendarDay,
  UserProfile,
} from '../types';
import { getLocal, setLocal, STORAGE_KEYS } from './storage';
import { ANAMNESIS_STORAGE_KEYS } from './anamnesisEngine';
import { db } from './firebase';
import { doc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';

export type LiveSyncEventType =
  | 'PLAN_UPDATED'
  | 'ANAMNESIS_SUBMITTED'
  | 'LINK_STATUS_CHANGED'
  | 'PING';

export interface LiveSyncMessage {
  type: LiveSyncEventType;
  teacherUid: string;
  studentUid: string;
  timestamp: number;
  payload?: any;
}

// Cria canal BroadcastChannel resiliente para sincronização entre abas do mesmo navegador
let liveChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    liveChannel = new BroadcastChannel('superacao_live_sync');
  } catch (e) {
    console.warn('BroadcastChannel não suportado neste ambiente:', e);
  }
}

/**
 * Notifica ouvintes locais (outras abas) sobre alterações de prescrição ou anamnese
 */
export function broadcastLiveSync(message: LiveSyncMessage): void {
  try {
    if (liveChannel) {
      liveChannel.postMessage(message);
    }
    // Dispara evento sintético de storage para compatibilidade total
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('superacao_live_sync_event', { detail: message })
      );
    }
  } catch (err) {
    console.warn('Erro ao emitir live sync:', err);
  }
}

/**
 * Assina atualizações em tempo real para um aluno ou professor específico
 */
export function subscribeToLiveSync(
  currentUid: string,
  onMessage: (msg: LiveSyncMessage) => void
): () => void {
  const handleMsg = (event: MessageEvent) => {
    const data = event.data as LiveSyncMessage;
    if (data && (data.studentUid === currentUid || data.teacherUid === currentUid)) {
      onMessage(data);
    }
  };

  const handleCustom = (event: Event) => {
    const custom = event as CustomEvent<LiveSyncMessage>;
    if (
      custom.detail &&
      (custom.detail.studentUid === currentUid || custom.detail.teacherUid === currentUid)
    ) {
      onMessage(custom.detail);
    }
  };

  if (liveChannel) {
    liveChannel.addEventListener('message', handleMsg);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('superacao_live_sync_event', handleCustom);
  }

  return () => {
    if (liveChannel) {
      liveChannel.removeEventListener('message', handleMsg);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('superacao_live_sync_event', handleCustom);
    }
  };
}

/**
 * Salva ou atualiza o vínculo entre Professor e Aluno (local + Firestore)
 */
export async function saveTeacherStudentLink(link: TeacherStudentLink): Promise<void> {
  // 1. Salva no Storage Local
  const links = getLocal<Record<string, TeacherStudentLink>>(
    ANAMNESIS_STORAGE_KEYS.LINKS,
    {}
  );
  links[link.id] = { ...link, updatedAt: Date.now() };
  setLocal(ANAMNESIS_STORAGE_KEYS.LINKS, links);

  // 2. Notifica canal local
  broadcastLiveSync({
    type: 'PLAN_UPDATED',
    teacherUid: link.teacherUid,
    studentUid: link.studentUid,
    timestamp: Date.now(),
    payload: link,
  });

  // 3. Tenta sincronizar com Firestore
  try {
    if (db) {
      const linkRef = doc(db, 'teacher_student_links', link.id);
      await setDoc(linkRef, link, { merge: true });
    }
  } catch (err) {
    console.warn('Superação: Aviso ao sincronizar vínculo no Firestore (offline tolerado):', err);
  }
}

/**
 * Busca todos os vínculos de um professor
 */
export function getTeacherLinks(teacherUid: string): TeacherStudentLink[] {
  const links = getLocal<Record<string, TeacherStudentLink>>(
    ANAMNESIS_STORAGE_KEYS.LINKS,
    {}
  );
  return Object.values(links).filter((l) => l.teacherUid === teacherUid);
}

/**
 * Busca o vínculo ativo de um aluno
 */
export function getStudentActiveLink(studentUid: string): TeacherStudentLink | null {
  const links = getLocal<Record<string, TeacherStudentLink>>(
    ANAMNESIS_STORAGE_KEYS.LINKS,
    {}
  );
  const found = Object.values(links).find(
    (l) => l.studentUid === studentUid && l.status === 'active'
  );
  return found || null;
}

/**
 * Aplica uma prescrição semanal do professor na agenda semanal (CalendarDay[]) do aluno
 */
export function applyTeacherPrescriptionToCalendar(
  studentUid: string,
  prescriptions: TeacherDayPrescription[],
  assignedPlans: WorkoutPlan[],
  existingCalendar: CalendarDay[]
): CalendarDay[] {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 a 6
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek);

  return [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + dayOfWeek);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const existingDay = existingCalendar.find((c) => c.dayOfWeek === dayOfWeek);
    const presc = prescriptions.find((p) => p.dayOfWeek === dayOfWeek);

    if (!presc || presc.regime === 'unassigned') {
      return {
        id: `${studentUid}_day_${dateStr}`,
        ownerUid: studentUid,
        dateStr,
        dayOfWeek,
        activityType: 'unassigned',
        isCompleted: existingDay?.isCompleted || false,
      };
    }

    if (presc.regime === 'rest_total') {
      return {
        id: `${studentUid}_day_${dateStr}`,
        ownerUid: studentUid,
        dateStr,
        dayOfWeek,
        activityType: 'rest',
        isCompleted: false,
        notes: presc.teacherNotes || 'Descanso total orientado pelo seu professor. Recuperação consciente!',
      };
    }

    if (presc.regime === 'rest_active') {
      const activityLabel = presc.activeRestCustomLabel || presc.activeRestActivity || 'Caminhada leve ou mobilidade';
      const combinedNotes = presc.teacherNotes
        ? `${activityLabel} · ${presc.teacherNotes}`
        : `Descanso ativo: ${activityLabel}`;

      return {
        id: `${studentUid}_day_${dateStr}`,
        ownerUid: studentUid,
        dateStr,
        dayOfWeek,
        activityType: 'active_recovery',
        isCompleted: existingDay?.isCompleted || false,
        notes: combinedNotes,
      };
    }

    // Regime = workout
    const plan = assignedPlans.find((p) => p.id === presc.planId) || assignedPlans[0];
    return {
      id: `${studentUid}_day_${dateStr}`,
      ownerUid: studentUid,
      dateStr,
      dayOfWeek,
      activityType: 'strength',
      planId: plan ? plan.id : presc.planId,
      planTitle: plan ? plan.title : presc.planTitle || 'Treino Prescrito',
      isCompleted: existingDay?.isCompleted || false,
      notes: presc.teacherNotes,
    };
  });
}
