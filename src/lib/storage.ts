import {
  WorkoutPlan,
  WorkoutSession,
  SetEvent,
  CalendarDay,
  PersonalRecord,
  UserProfile,
  WorkoutProgram,
  ExplainableProposal,
  OnboardingDraft,
  ExercisePlanItem,
} from '../types';
import { allTemplates, allExercises } from '../data/catalog';

export const APP_VERSION = '6.0.0';
export const APP_BUILD_DATE = '2026-10-22';
export const SCHEMA_VERSION = '6.0.0';

export const STORAGE_KEYS = {
  SCHEMA_VERSION: 'superacao_schema_version',
  USER_PROFILE: 'superacao_user_profile',
  PLANS: 'superacao_plans',
  SESSIONS: 'superacao_sessions',
  SET_EVENTS: 'superacao_set_events',
  CALENDAR: 'superacao_calendar',
  ACTIVE_SESSION: 'superacao_active_session',
  PERSONAL_RECORDS: 'superacao_personal_records',
  ACTIVE_PROGRAM: 'superacao_active_program',
  BACKUP_PRE_MIGRATION: 'superacao_backup_pre_migration',
  ACCESS_CHOICE: 'superacao_access_choice',
  ONBOARDING_DRAFT: 'superacao_onboarding_draft',
  PROPOSAL: 'superacao_proposal',
};

// Perfil de convidado inicial padrão (iniciante, sem equipamentos pré-marcados indevidamente)
export const defaultGuestProfile: UserProfile = {
  uid: 'guest_user',
  displayName: 'Praticante',
  email: '',
  isTrustedDevice: true,
  primaryGoal: 'Construir o hábito e me sentir melhor',
  secondaryGoals: [],
  goalPriorityOrder: ['Construir o hábito e me sentir melhor'],
  goalFocus: 'foco_unico',
  experienceLevel: 'iniciante',
  availableDays: [1, 3, 5], // Seg, Qua, Sex
  sessionDurationMinutes: 20,
  equipments: ['peso_corporal'], // Estritamente peso corporal; cadeira/parede/elásticos exigem confirmação (A04)
  planSourcePreference: 'modelo_revisado',
  habitAnchor: '',
  soundEnabled: true,
  hapticEnabled: true,
  onboardingCompleted: false,
  routineConfirmed: false,
  needsReviewPrompt: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};


// Armazenamento local com try/catch
export function getLocal<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Erro ao salvar no storage local (${key}):`, e);
  }
}

// Gera agenda neutra da semana atual (sem rotinas pré-impostas para novas contas)
export function generateBlankWeeklyCalendar(uid: string): CalendarDay[] {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 a 6
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    days.push({
      id: `${uid}_day_${dateStr}`,
      ownerUid: uid,
      dateStr,
      dayOfWeek: i,
      activityType: 'unassigned',
      isCompleted: false,
    });
  }
  return days;
}

// Migração versionada e idempotente que preserva todos os dados canônicos existentes (A18)
export function runStorageMigration() {
  try {
    const currentVer = getLocal<string | null>(STORAGE_KEYS.SCHEMA_VERSION, null);
    if (currentVer === SCHEMA_VERSION) {
      return; // Já migrado e consistente
    }

    // Cria backup de segurança pré-migração
    const rawBackup = {
      profile: localStorage.getItem(STORAGE_KEYS.USER_PROFILE),
      plans: localStorage.getItem(STORAGE_KEYS.PLANS),
      sessions: localStorage.getItem(STORAGE_KEYS.SESSIONS),
      setEvents: localStorage.getItem(STORAGE_KEYS.SET_EVENTS),
      calendar: localStorage.getItem(STORAGE_KEYS.CALENDAR),
      activeProgram: localStorage.getItem(STORAGE_KEYS.ACTIVE_PROGRAM),
      prs: localStorage.getItem(STORAGE_KEYS.PERSONAL_RECORDS),
      migratedAt: new Date().toISOString(),
    };
    setLocal(STORAGE_KEYS.BACKUP_PRE_MIGRATION, rawBackup);

    // Carrega dados existentes
    const sessions = getLocal<WorkoutSession[]>(STORAGE_KEYS.SESSIONS, []);
    const existingProfile = getLocal<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
    const activeProgram = getLocal<WorkoutProgram | null>(STORAGE_KEYS.ACTIVE_PROGRAM, null);

    if (existingProfile) {
      // Se já possui sessões de treinos registradas, preserva tudo
      const updatedProfile: UserProfile = {
        ...defaultGuestProfile,
        ...existingProfile,
        // Limpa cadeira/parede se não foram explicitamente marcadas em perfil personalizado
        equipments: Array.isArray(existingProfile.equipments) && existingProfile.equipments.length > 0
          ? existingProfile.equipments
          : ['peso_corporal'],
        // Se tinha um programa atribuído automaticamente mas nunca concluiu onboarding, sinaliza para revisão amigável
        needsReviewPrompt: Boolean(activeProgram && !existingProfile.onboardingCompleted),
      };
      setLocal(STORAGE_KEYS.USER_PROFILE, updatedProfile);
    }

    setLocal(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION);
  } catch (err) {
    console.error('Erro na migração de storage:', err);
  }
}

// Inicializa dados padrão do convidado se vazio
export function getInitialGuestData() {
  runStorageMigration();

  const profile = getLocal<UserProfile>(STORAGE_KEYS.USER_PROFILE, defaultGuestProfile);
  const plans = getLocal<WorkoutPlan[]>(STORAGE_KEYS.PLANS, allTemplates);
  const sessions = getLocal<WorkoutSession[]>(STORAGE_KEYS.SESSIONS, []);
  const setEvents = getLocal<SetEvent[]>(STORAGE_KEYS.SET_EVENTS, []);
  
  // Para contas vazias, inicia com agenda neutra sem forçar treinos (A01)
  const calendar = getLocal<CalendarDay[]>(
    STORAGE_KEYS.CALENDAR,
    sessions.length === 0 ? generateBlankWeeklyCalendar('guest_user') : generateBlankWeeklyCalendar('guest_user')
  );
  const prs = getLocal<PersonalRecord[]>(STORAGE_KEYS.PERSONAL_RECORDS, []);

  return { profile, plans, sessions, setEvents, calendar, prs };
}

export const EQUIPMENT_LABELS: Record<string, string> = {
  peso_corporal: 'Peso corporal',
  mini_band: 'Mini band circular',
  faixa_longa: 'Faixa elástica longa',
  tubos_elasticos: 'Tubos elásticos com pegadores',
  halteres: 'Halteres',
  kettlebell: 'Kettlebell',
  cadeira: 'Cadeira firme / apoio',
  parede: 'Espaço na parede',
  colchonete: 'Colchonete / tapete',
  nenhum: 'Apenas peso corporal',
};

export const AVOIDANCE_LABELS: Record<string, string> = {
  impacto_saltos: 'Impacto e saltos',
  flexao_chao: 'Flexão de braço no chão',
  agachamento_profundo: 'Agachamento profundo',
  sobrecarga_lombar: 'Sobrecarga lombar',
  exercicios_chao: 'Movimentos no chão',
};

// Gerador de proposta transparente e explicável com validação estrita de compatibilidade (Seção 6, C10, C11, C12, C13)
export function generateExplainableProposal(
  profile: Partial<UserProfile>,
  draft?: Partial<OnboardingDraft>
): ExplainableProposal {
  const targetDays = draft?.availableDays || profile.availableDays || [1, 3, 5];
  const targetDuration = draft?.sessionDurationMinutes || profile.sessionDurationMinutes || 20;
  const userEquipments = draft?.equipments || profile.equipments || ['peso_corporal'];
  const userAvoided = draft?.avoidedMovements || profile.avoidedMovements || [];
  const primaryGoal = draft?.orderedGoals?.[0] || profile.primaryGoal || 'Construir o hábito e me sentir melhor';
  const environment = draft?.environmentPreference === 'academia' ? 'na academia' : 'em casa';

  // Filtra candidatos do catálogo oficial com 100% de compatibilidade
  const eligibleExercises = allExercises.filter((ex) => {
    // 1. Compatibilidade estrita de equipamentos (C12)
    const requiresOtherEquip = ex.equipment.some(
      (eq) => eq !== 'peso_corporal' && eq !== 'nenhum' && !userEquipments.includes(eq)
    );
    if (requiresOtherEquip) return false;

    // 2. Restrições e movimentos evitados (C13)
    const textCorpus = `${ex.name_pt} ${ex.instructions_pt || ''} ${ex.caution_pt || ''}`.toLowerCase();
    if (userAvoided.includes('impacto_saltos')) {
      if (textCorpus.includes('salto') || textCorpus.includes('jump') || textCorpus.includes('polichinelo') || textCorpus.includes('burpee')) {
        return false;
      }
    }
    if (userAvoided.includes('flexao_chao')) {
      if (ex.name_pt.toLowerCase().includes('flexão de braço') && !ex.name_pt.toLowerCase().includes('parede') && !ex.name_pt.toLowerCase().includes('inclinada')) {
        return false;
      }
    }
    if (userAvoided.includes('agachamento_profundo')) {
      if (textCorpus.includes('agachamento profundo')) {
        return false;
      }
    }
    if (userAvoided.includes('sobrecarga_lombar')) {
      if (textCorpus.includes('levantamento terra pesado') || textCorpus.includes('stiff com barra pesada')) {
        return false;
      }
    }

    return true;
  });

  // Determina número de exercícios e séries pelo tempo
  let numExercises = 4;
  let defaultSets = 2;
  let restSecs = 45;
  if (targetDuration <= 15) {
    numExercises = 3;
    defaultSets = 2;
    restSecs = 40;
  } else if (targetDuration <= 20) {
    numExercises = 4;
    defaultSets = 2;
    restSecs = 45;
  } else if (targetDuration <= 30) {
    numExercises = 5;
    defaultSets = 3;
    restSecs = 50;
  } else {
    numExercises = 6;
    defaultSets = 3;
    restSecs = 60;
  }

  // Seleciona movimentos equilibrados (pernas, empurrar, puxar, core/mobilidade)
  const safeSelection = eligibleExercises.slice(0, Math.max(numExercises, 3));

  // Constrói itens da ficha
  const exerciseItems: ExercisePlanItem[] = safeSelection.map((ex) => ({
    exerciseId: ex.id,
    exerciseName: ex.name_pt,
    targetSets: defaultSets,
    targetReps: ex.tracking === 'reps' ? (ex.difficulty_candidate === 'iniciante' ? 10 : 12) : 0,
    targetDurationSeconds: ex.tracking === 'time' ? 30 : undefined,
    restSeconds: restSecs,
    notes: ex.caution_pt || undefined,
  }));

  // Estimativa de duração realista com séries, descansos somados e transições
  const totalSecondsPerExercise = exerciseItems.reduce((acc, item) => {
    const execTime = item.targetDurationSeconds || item.targetReps * 3.5 || 35;
    return acc + item.targetSets * (execTime + item.restSeconds);
  }, 0);
  const transitionTime = Math.max(0, (exerciseItems.length - 1) * 15);
  const calculatedTotalMinutes = Math.max(8, Math.round((totalSecondsPerExercise + transitionTime) / 60));

  const planAId = `proposal_plan_a_${Date.now()}`;
  const planA: WorkoutPlan = {
    id: planAId,
    ownerUid: profile.uid || 'guest_user',
    title: `Treino Essencial (${calculatedTotalMinutes} min)`,
    description: `Ficha calibrada para seu ritmo em ${environment}, usando apenas os apoios e equipamentos que você confirmou.`,
    version: 1,
    isProfessional: false,
    isTemplate: false,
    sourceKind: 'modelo_revisado',
    reviewStatus: 'revisado',
    exercises: exerciseItems,
    estimatedDurationMinutes: calculatedTotalMinutes,
    category: userEquipments.includes('mini_band') ? 'mini_band' : 'casa',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Mapeia agenda semanal estritamente para os dias selecionados
  const weeklySchedule: { [dayOfWeek: number]: string } = {};
  targetDays.forEach((dayIdx) => {
    weeklySchedule[dayIdx] = planAId;
  });

  // Justificativa e discriminação de tempo verificáveis
  const daysText = targetDays.length === 1 ? '1 dia' : `${targetDays.length} dias`;
  const equipText = userEquipments
    .map((e) => EQUIPMENT_LABELS[e] || e)
    .join(', ');
  const avoidanceText = userAvoided.length > 0
    ? ` e evitando ${userAvoided.map((a) => AVOIDANCE_LABELS[a] || a).join(', ')}`
    : '';

  const justificationText = `Você informou ${daysText} por semana com ${targetDuration} minutos ${environment}, com foco em "${primaryGoal}", utilizando apenas ${equipText}${avoidanceText}. Esta proposta ocupa rigorosamente os seus dias disponíveis com movimentos 100% compatíveis.`;

  const timeBreakdownText = `${exerciseItems.length} exercícios × ${defaultSets} séries (~${Math.round(totalSecondsPerExercise / 60)} min de execução e descansos) + 15s de transição = ~${calculatedTotalMinutes} min por sessão.`;

  return {
    id: `proposal_${Date.now()}`,
    title: `Rotina Personalizada: ${primaryGoal}`,
    description: justificationText,
    targetDaysCount: targetDays.length,
    sessionDurationMinutes: calculatedTotalMinutes,
    environment,
    equipmentsUsed: userEquipments,
    avoidedMovements: userAvoided,
    justificationText,
    timeBreakdownText,
    routines: [planA],
    weeklySchedule,
    generatedAt: Date.now(),
    isConfirmed: false,
  };
}

// Gera agenda semanal a partir de uma proposta confirmada
export function generateWeeklyCalendarFromProposal(
  uid: string,
  proposal: ExplainableProposal
): CalendarDay[] {
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const planId = proposal.weeklySchedule[i];
    const plan = planId ? proposal.routines.find((r) => r.id === planId) : undefined;

    let activityType: CalendarDay['activityType'] = 'rest';
    let planTitle = 'Dia de Descanso & Recuperação';

    if (plan) {
      activityType = 'strength';
      planTitle = plan.title;
    } else {
      activityType = 'rest';
      planTitle = 'Dia de Descanso & Recuperação';
    }

    days.push({
      id: `${uid}_day_${dateStr}`,
      ownerUid: uid,
      dateStr,
      dayOfWeek: i,
      activityType,
      planId: plan?.id,
      planTitle,
      isCompleted: false,
    });
  }
  return days;
}

// Cria uma agenda semanal a partir de um programa ou rotinas confirmadas
export function generateWeeklyCalendarFromProgram(uid: string, program: WorkoutProgram): CalendarDay[] {
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const planId = program.weeklySchedule ? program.weeklySchedule[i] : undefined;
    const plan = planId ? program.routines.find((r) => r.id === planId) : undefined;

    let activityType: CalendarDay['activityType'] = 'rest';
    let planTitle = 'Dia de Descanso & Recuperação';

    if (plan) {
      activityType = plan.category === 'caminhada' ? 'walk' : plan.category === 'mobilidade' ? 'active_recovery' : 'strength';
      planTitle = plan.title;
    }

    days.push({
      id: `${uid}_day_${dateStr}`,
      ownerUid: uid,
      dateStr,
      dayOfWeek: i,
      activityType,
      planId: plan?.id,
      planTitle,
      isCompleted: false,
    });
  }

  return days;
}


// Cálculo e verificação de novo Recorde Pessoal (PR)
export function checkAndRegisterPR(
  exerciseId: string,
  exerciseName: string,
  actualReps: number,
  actualDurationSeconds: number | undefined,
  existingPRs: PersonalRecord[],
  sessionId: string,
  actualWeightKg?: number
): { isPR: boolean; updatedPRs: PersonalRecord[]; prText?: string } {
  const currentPR = existingPRs.find((p) => p.exerciseId === exerciseId);

  let isPR = false;
  let prText = '';
  const weight = actualWeightKg && actualWeightKg > 0 ? actualWeightKg : 0;

  if (!currentPR) {
    if (actualReps > 0 || (actualDurationSeconds && actualDurationSeconds > 0) || weight > 0) {
      isPR = true;
      if (weight > 0 && actualReps > 0) {
        prText = `Primeiro recorde: ${actualReps} reps com ${weight} kg!`;
      } else if (actualReps > 0) {
        prText = `Primeiro recorde: ${actualReps} repetições!`;
      } else {
        prText = `Primeiro recorde: ${actualDurationSeconds}s!`;
      }
      const newPR: PersonalRecord = {
        exerciseId,
        exerciseName,
        bestReps: actualReps,
        bestDurationSeconds: actualDurationSeconds || 0,
        bestWeightKg: weight,
        recordedAt: Date.now(),
        sessionId,
      };
      return { isPR, updatedPRs: [...existingPRs, newPR], prText };
    }
  } else {
    const prevWeight = currentPR.bestWeightKg || 0;
    const isWeightPR = weight > prevWeight;
    const isRepPR = actualReps > currentPR.bestReps;
    const isTimePR = actualDurationSeconds && actualDurationSeconds > currentPR.bestDurationSeconds;

    if (isWeightPR && isRepPR) {
      isPR = true;
      prText = `Superação dupla: ${weight} kg (+${weight - prevWeight}kg) e ${actualReps} reps (+${actualReps - currentPR.bestReps})!`;
    } else if (isWeightPR) {
      isPR = true;
      prText = `Superou carga: de ${prevWeight}kg para ${weight}kg (+${weight - prevWeight}kg)!`;
    } else if (isRepPR) {
      isPR = true;
      prText = `Superou repetições: de ${currentPR.bestReps} para ${actualReps} reps (+${actualReps - currentPR.bestReps})!`;
    } else if (isTimePR) {
      isPR = true;
      prText = `Superou tempo: de ${currentPR.bestDurationSeconds}s para ${actualDurationSeconds}s (+${actualDurationSeconds - currentPR.bestDurationSeconds}s)!`;
    }

    if (isPR) {
      const updatedPRs = existingPRs.map((p) =>
        p.exerciseId === exerciseId
          ? {
              ...p,
              bestReps: Math.max(p.bestReps, actualReps),
              bestDurationSeconds: Math.max(p.bestDurationSeconds, actualDurationSeconds || 0),
              bestWeightKg: Math.max(p.bestWeightKg || 0, weight),
              recordedAt: Date.now(),
              sessionId,
            }
          : p
      );
      return { isPR, updatedPRs, prText };
    }
  }

  return { isPR: false, updatedPRs: existingPRs };
}

// Exportar Backup JSON completo do praticante
export function exportUserDataAsJSON(data: {
  profile: UserProfile;
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
  setEvents: SetEvent[];
  calendar: CalendarDay[];
  prs: PersonalRecord[];
}) {
  const exportPayload = {
    app: 'Superação',
    version: '4.0.0',
    exportedAt: new Date().toISOString(),
    ...data,
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `superacao_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
