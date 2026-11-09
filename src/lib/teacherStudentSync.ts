import {
  TeacherStudentLink,
  TeacherDayPrescription,
  WorkoutPlan,
  CalendarDay,
  UserProfile,
  StudentActivityLogItem,
  StudentDiscomfortReport,
  CoreBiopsychosocialMemory,
} from '../types';
import { getLocal, setLocal, STORAGE_KEYS } from './storage';
import { ANAMNESIS_STORAGE_KEYS } from './anamnesisEngine';
import { MONDAY_FIRST_DAYS, getWeekDatesMondayFirst } from './dateUtils';
import { db } from './firebase';
import { doc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';

export type LiveSyncEventType =
  | 'PLAN_UPDATED'
  | 'ANAMNESIS_SUBMITTED'
  | 'LINK_STATUS_CHANGED'
  | 'STUDENT_TELEMETRY_UPDATED'
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

  // 3. Tenta sincronizar com Firestore sem prender execução local
  try {
    if (db) {
      const linkRef = doc(db, 'teacher_student_links', link.id);
      await Promise.race([
        setDoc(linkRef, link, { merge: true }),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
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
 * Registra atividades, sessões e relatos de dor do aluno no vínculo do professor
 */
export async function logStudentActivityToTeacherLink(
  studentUid: string,
  activity: Omit<StudentActivityLogItem, 'id' | 'timestamp'>,
  discomfort?: Omit<StudentDiscomfortReport, 'id' | 'timestamp'>
): Promise<void> {
  const link = getStudentActiveLink(studentUid);
  if (!link) return;

  const now = Date.now();
  const newActivityItem: StudentActivityLogItem = {
    ...activity,
    id: `act_${now}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now,
  };

  const updatedActivities = [newActivityItem, ...(link.studentRecentActivity || [])].slice(0, 30);
  let updatedDiscomfort = link.studentDiscomfortReports || [];

  if (discomfort) {
    const newDiscomfortItem: StudentDiscomfortReport = {
      ...discomfort,
      id: `disc_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
    };
    updatedDiscomfort = [newDiscomfortItem, ...updatedDiscomfort].slice(0, 20);
  }

  const updatedLink: TeacherStudentLink = {
    ...link,
    studentRecentActivity: updatedActivities,
    studentDiscomfortReports: updatedDiscomfort,
    updatedAt: now,
  };

  await saveTeacherStudentLink(updatedLink);

  broadcastLiveSync({
    type: 'STUDENT_TELEMETRY_UPDATED',
    teacherUid: link.teacherUid,
    studentUid: link.studentUid,
    timestamp: now,
    payload: updatedLink,
  });
}

/**
 * Sincroniza a memória M2 (preferências, limitações) do aluno para a ficha no professor
 */
export async function syncStudentCoreMemoryToTeacherLink(
  studentUid: string,
  memory: CoreBiopsychosocialMemory
): Promise<void> {
  const link = getStudentActiveLink(studentUid);
  if (!link) return;

  const updatedLink: TeacherStudentLink = {
    ...link,
    studentCoreMemory: memory,
    updatedAt: Date.now(),
  };

  await saveTeacherStudentLink(updatedLink);

  broadcastLiveSync({
    type: 'STUDENT_TELEMETRY_UPDATED',
    teacherUid: link.teacherUid,
    studentUid: link.studentUid,
    timestamp: Date.now(),
    payload: updatedLink,
  });
}

/**
 * Aplica uma prescrição semanal do professor na agenda semanal (CalendarDay[]) do aluno
 */
export function applyTeacherPrescriptionToCalendar(
  studentUid: string,
  prescriptions: TeacherDayPrescription[],
  assignedPlans: WorkoutPlan[],
  existingCalendar: CalendarDay[],
  referenceDate: Date = new Date()
): CalendarDay[] {
  const weekDates = getWeekDatesMondayFirst(referenceDate);

  return MONDAY_FIRST_DAYS.map((dayOfWeek) => {
    const dateStr = weekDates[dayOfWeek];

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
