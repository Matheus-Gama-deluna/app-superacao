import { getLocalDateStr } from './dateUtils';
import { generateSmartWorkoutRoutine, isExerciseSafeForUser } from './workoutEngine';
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
  CanonicalMetrics,
  PreWorkoutMood,
  PostWorkoutMood,
  AchievementCoinType,
  SessionEfficiencyComparison,
  DailyMicroChallenge,
  TomorrowBridgeInfo,
  WellbeingInsight,
  ActivityType,
} from '../types';
import { allTemplates, allExercises } from '../data/catalog';

export const APP_VERSION = '8.0.0';
export const APP_BUILD_DATE = '2026-10-22';
export const SCHEMA_VERSION = '8.0.0';

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
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

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
    const calendar = getLocal<CalendarDay[]>(STORAGE_KEYS.CALENDAR, []);
    const prs = getLocal<PersonalRecord[]>(STORAGE_KEYS.PERSONAL_RECORDS, []);

    // Reparo de estado v7 -> v8: corrigir dias de descanso erroneamente marcados como completed
    let calendarChanged = false;
    const fixedCalendar = calendar.map((day) => {
      if (day.isCompleted && (day.activityType === 'rest' || day.activityType === 'unassigned')) {
        calendarChanged = true;
        return {
          ...day,
          isCompleted: false,
          completedAt: undefined,
          planTitle: day.planTitle?.replace(' (Parcial)', ''),
        };
      }
      return day;
    });
    if (calendarChanged) {
      setLocal(STORAGE_KEYS.CALENDAR, fixedCalendar);
    }

    // Reparo de estado v7 -> v8: assegurar que primeira marca isolada seja isBaseline: true
    let prsChanged = false;
    const fixedPRs = prs.map((pr) => {
      if (pr.isBaseline === undefined) {
        prsChanged = true;
        // Se sessions.length <= 1 ou prCount é undefined/0, marca como baseline
        const count = pr.prCount ?? 0;
        return {
          ...pr,
          isBaseline: count === 0,
          prCount: count,
        };
      }
      return pr;
    });
    if (prsChanged) {
      setLocal(STORAGE_KEYS.PERSONAL_RECORDS, fixedPRs);
    }

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

// Função canônica única de compatibilidade estrita de equipamentos, apoios e restrições (Critérios 12 a 18)
export function isExerciseCompatibleWithUser(
  ex: any,
  userEquipments: string[],
  userAvoided: string[] = [],
  reportedLimitations: string[] = []
): boolean {
  return isExerciseSafeForUser(ex, userEquipments, userAvoided, reportedLimitations).safe;
}

export function generateExplainableProposal(
  profile: Partial<UserProfile>,
  draft?: Partial<OnboardingDraft>
): ExplainableProposal {
  return generateSmartWorkoutRoutine(profile, draft);
}

// Gera agenda semanal a partir de uma proposta confirmada
export function generateWeeklyCalendarFromProposal(
  uid: string,
  proposal: ExplainableProposal,
  preferredTime?: 'manha' | 'tarde' | 'noite' | 'flexivel' | string
): CalendarDay[] {
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek);

  let mappedTimeOfDay: CalendarDay['timeOfDay'] = undefined;
  if (preferredTime === 'manha' || preferredTime === 'tarde' || preferredTime === 'noite' || preferredTime === 'livre') {
    mappedTimeOfDay = preferredTime as CalendarDay['timeOfDay'];
  } else if (preferredTime === 'flexivel') {
    mappedTimeOfDay = 'livre';
  }

  const days: CalendarDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = getLocalDateStr(d);
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
      timeOfDay: mappedTimeOfDay,
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
    const dateStr = getLocalDateStr(d);
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
// Regra canônica (E01 / Seção 5): Primeira marca é apenas linha de base (isBaseline: true, isPR: false).
// Novo PR só ocorre quando supera estritamente uma marca prévia sob condição equivalente.
export function checkAndRegisterPR(
  exerciseId: string,
  exerciseName: string,
  actualReps: number,
  actualDurationSeconds: number | undefined,
  existingPRs: PersonalRecord[],
  sessionId: string,
  actualWeightKg?: number
): { isPR: boolean; isNewBaseline?: boolean; updatedPRs: PersonalRecord[]; prText?: string } {
  const currentPR = existingPRs.find((p) => p.exerciseId === exerciseId);

  let isPR = false;
  let prText = '';
  const weight = actualWeightKg && actualWeightKg > 0 ? actualWeightKg : 0;

  if (!currentPR) {
    if (actualReps > 0 || (actualDurationSeconds && actualDurationSeconds > 0) || weight > 0) {
      // Primeira execução: registra linha de base inicial, NÃO é PR
      isPR = false;
      prText = 'Marca de referência inicial registrada.';
      const newPR: PersonalRecord = {
        exerciseId,
        exerciseName,
        bestReps: actualReps,
        bestDurationSeconds: actualDurationSeconds || 0,
        bestWeightKg: weight,
        bestRepsAtBestWeight: weight > 0 ? actualReps : undefined,
        maxRepsUnloaded: weight === 0 ? actualReps : undefined,
        recordedAt: Date.now(),
        sessionId,
        isBaseline: true,
        prCount: 0,
      };
      return { isPR: false, isNewBaseline: true, updatedPRs: [...existingPRs, newPR], prText };
    }
  } else {
    const prevWeight = currentPR.bestWeightKg || 0;
    const isTimeMode = actualDurationSeconds !== undefined && actualDurationSeconds > 0;

    const isWeightPR = weight > prevWeight && actualReps >= 1;
    // PR de repetições estrito: exige condição de carga mantida ou aumentada
    const isRepPR =
      !isTimeMode &&
      ((weight >= prevWeight && actualReps > currentPR.bestReps) ||
        (weight === 0 && prevWeight > 0 && currentPR.maxRepsUnloaded !== undefined && actualReps > currentPR.maxRepsUnloaded));

    const isTimePR = isTimeMode && actualDurationSeconds > currentPR.bestDurationSeconds;

    if (isWeightPR && isRepPR) {
      isPR = true;
      prText = `Superação dupla: ${weight} kg (+${weight - prevWeight}kg) e ${actualReps} reps!`;
    } else if (isWeightPR) {
      isPR = true;
      prText = `Superou carga: de ${prevWeight}kg para ${weight}kg (+${weight - prevWeight}kg)!`;
    } else if (isRepPR) {
      isPR = true;
      const prevCompare = weight === 0 && prevWeight > 0 ? (currentPR.maxRepsUnloaded || 0) : currentPR.bestReps;
      prText = `Superou repetições: de ${prevCompare} para ${actualReps} reps (+${actualReps - prevCompare})!`;
    } else if (isTimePR) {
      isPR = true;
      prText = `Superou tempo: de ${currentPR.bestDurationSeconds}s para ${actualDurationSeconds}s (+${actualDurationSeconds - currentPR.bestDurationSeconds}s)!`;
    }

    if (isPR) {
      const updatedPRs = existingPRs.map((p) => {
        if (p.exerciseId !== exerciseId) return p;

        const newBestWeight = isWeightPR ? weight : (p.bestWeightKg || 0);
        const newBestRepsAtWeight = isWeightPR
          ? actualReps
          : (p.bestRepsAtBestWeight || (weight === p.bestWeightKg ? Math.max(p.bestRepsAtBestWeight || 0, actualReps) : undefined));
        const newMaxRepsUnloaded =
          weight === 0
            ? Math.max(p.maxRepsUnloaded || 0, actualReps)
            : (p.maxRepsUnloaded !== undefined ? p.maxRepsUnloaded : (prevWeight === 0 && p.bestReps > 0 ? p.bestReps : undefined));
        const newBestReps = weight >= prevWeight ? Math.max(p.bestReps, actualReps) : p.bestReps;

        return {
          ...p,
          bestReps: newBestReps,
          bestDurationSeconds: Math.max(p.bestDurationSeconds, actualDurationSeconds || 0),
          bestWeightKg: newBestWeight,
          bestRepsAtBestWeight: newBestRepsAtWeight,
          maxRepsUnloaded: newMaxRepsUnloaded,
          recordedAt: Date.now(),
          sessionId,
          isBaseline: false,
          prCount: (p.prCount || 0) + 1,
        };
      });
      return { isPR, isNewBaseline: false, updatedPRs, prText };
    }
  }

  return { isPR: false, isNewBaseline: false, updatedPRs: existingPRs };
}

// Cálculo unificado de métricas canônicas (E03 / Seção 5 / T18)
// Garante consistência absoluta entre Home, Histórico e Evolução
export function calculateCanonicalMetrics(
  sessions: WorkoutSession[],
  calendar: CalendarDay[],
  prs: PersonalRecord[]
): CanonicalMetrics {
  const completedWorkoutsCount = sessions.filter(
    (s) => s.status === 'completed' || s.originType === 'external_practice'
  ).length;
  const partialWorkoutsCount = sessions.filter((s) => s.status === 'parcial').length;
  const totalWorkoutsCount = completedWorkoutsCount + partialWorkoutsCount;
  const realPRCount = prs.filter((p) => !p.isBaseline && (p.prCount || 0) > 0).length;
  const baselineMarksCount = prs.filter((p) => p.isBaseline).length;
  const totalVolumeKg = sessions.reduce((acc, s) => acc + (s.totalVolumeKg || 0), 0);
  const weeklyCommittedCount = calendar.filter(
    (c) => c.activityType !== 'unassigned' && c.activityType !== 'rest'
  ).length;
  const weeklyCompletedCount = calendar.filter(
    (c) => c.isCompleted && c.activityType !== 'unassigned' && c.activityType !== 'rest'
  ).length;

  // Minutos e sessões de cuidado e regeneração (Estratégia A e E)
  const careSessions = sessions.filter(
    (s) =>
      s.status === 'completed' &&
      ((s.planId && s.planId.includes('mobilidade')) ||
        (s.planId && s.planId.includes('walk')) ||
        s.originType === 'active_recovery' ||
        s.externalModality === 'mobilidade_yoga' ||
        (s.planTitle && s.planTitle.toLowerCase().includes('mobilidade')) ||
        (s.planTitle && s.planTitle.toLowerCase().includes('caminhada')) ||
        (s.planTitle && s.planTitle.toLowerCase().includes('alongamento')))
  );
  const careSessionsCount = careSessions.length;
  const careMinutesTotal = careSessions.reduce(
    (acc, s) => acc + Math.max(1, Math.round(s.durationSeconds / 60)),
    0
  );

  // Elos de vitalidade na semana atual (dias de descanso/livres com caminhada ou mobilidade)
  const weeklyVitalityLinksCount = calendar.filter(
    (c) =>
      c.vitalityBonusCompleted ||
      ((c.activityType === 'rest' || c.activityType === 'unassigned') &&
        sessions.some(
          (s) =>
            (s.status === 'completed' || s.originType === 'external_practice') &&
            (s.scheduledDayId === c.id ||
              (s.completedAt && getLocalDateStr(new Date(s.completedAt)) === c.dateStr)) &&
            ((s.planId && s.planId.includes('mobilidade')) ||
              (s.planId && s.planId.includes('walk')) ||
              s.originType === 'active_recovery' ||
              s.externalModality === 'mobilidade_yoga' ||
              (s.planTitle && s.planTitle.toLowerCase().includes('mobilidade')) ||
              (s.planTitle && s.planTitle.toLowerCase().includes('caminhada')) ||
              (s.planTitle && s.planTitle.toLowerCase().includes('alongamento')))
        ))
  ).length;

  const savedHabitSessionsCount = sessions.filter(
    (s) => s.status === 'completed' && (s.isExpress || s.wasPlannedHabit)
  ).length;

  return {
    completedWorkoutsCount,
    partialWorkoutsCount,
    totalWorkoutsCount,
    prsAchievedCount: realPRCount,
    realPRCount,
    totalVolumeKg,
    efficiencyImprovedCount: 0,
    weeklyCommittedCount,
    weeklyCompletedCount,
    baselineMarksCount,
    careMinutesTotal,
    careSessionsCount,
    weeklyVitalityLinksCount,
    savedHabitSessionsCount,
  };
}

/**
 * Retorna o cálculo canônico e unificado da meta semanal para todo o aplicativo.
 * Garante que HomeView, ProgressView e relatórios de processo apresentem exatamente os mesmos números.
 */
export function getCanonicalWeeklyGoal(
  profile: Partial<UserProfile> | null | undefined,
  calendar: CalendarDay[] = [],
  activeProgramFrequency?: number
): {
  targetWeeklyGoal: number;
  scheduledCommittedCount: number;
  personalCommittedDays: number;
} {
  const scheduledCommittedCount = calendar.filter(
    (c) => c.activityType !== 'unassigned' && c.activityType !== 'rest'
  ).length;

  const personalCommittedDays = profile?.availableDays?.length || 0;

  // Se há treinos planejados na agenda da semana, a meta ativa da semana reflete os compromissos agendados.
  // Caso a agenda ainda não esteja preenchida, utiliza a disponibilidade do perfil ou do programa ativo (mínimo 2).
  const targetWeeklyGoal = scheduledCommittedCount > 0
    ? scheduledCommittedCount
    : personalCommittedDays > 0
    ? personalCommittedDays
    : activeProgramFrequency || 3;

  return {
    targetWeeklyGoal,
    scheduledCommittedCount,
    personalCommittedDays,
  };
}

export const PRE_MOOD_LABELS: Record<PreWorkoutMood, { label: string; icon: string }> = {
  cansado: { label: 'Sem energia / Cansado', icon: '🔋' },
  tenso: { label: 'Corpo preso / Tenso', icon: '🧘' },
  normal: { label: 'Normal / No ritmo', icon: '🙂' },
  disposto: { label: 'Bem disposto', icon: '⚡' },
};

export const POST_MOOD_LABELS: Record<PostWorkoutMood, { label: string; icon: string }> = {
  renovado: { label: 'Com mais energia', icon: '✨' },
  leve: { label: 'Mais leve e solto', icon: '🌿' },
  orgulhoso: { label: 'Dever cumprido', icon: '🏅' },
  cansado_bem: { label: 'Cansado, mas feliz', icon: '💪' },
  neutro: { label: 'Igual / Neutro', icon: '🙂' },
  esgotado: { label: 'Exausto / Pesado', icon: '🥱' },
  desconforto: { label: 'Com desconforto', icon: '⚠️' },
};

// Estratégia C: Micro-Desafio do Dia
export function generateDailyMicroChallenge(
  plan: WorkoutPlan | null,
  personalRecords: PersonalRecord[]
): DailyMicroChallenge | null {
  if (!plan || !plan.exercises || plan.exercises.length === 0) return null;

  const isMobility =
    plan.category === 'mobilidade' ||
    plan.title.toLowerCase().includes('mobilidade') ||
    plan.title.toLowerCase().includes('alongamento');

  if (isMobility) {
    const ex = plan.exercises[0];
    return {
      type: 'mindful_mobility',
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      badgeText: 'Foco de Cuidado & Presença',
      title: `Soltura Consciente em ${ex.exerciseName}`,
      description: 'Concentre-se em soltar o ar lentamente a cada repetição ou segundo, soltando tensões com calma.',
    };
  }

  // 1. Prioridade máxima: Exercício com Marca Base que está pronto para o 1º PR real
  const exerciseWithBase = plan.exercises.find((ex) => {
    const pr = personalRecords.find((p) => p.exerciseId === ex.exerciseId);
    return pr && pr.isBaseline;
  });

  if (exerciseWithBase) {
    const pr = personalRecords.find((p) => p.exerciseId === exerciseWithBase.exerciseId)!;
    if (exerciseWithBase.targetDurationSeconds && exerciseWithBase.targetDurationSeconds > 0) {
      return {
        type: 'beat_pr_time',
        exerciseId: exerciseWithBase.exerciseId,
        exerciseName: exerciseWithBase.exerciseName,
        badgeText: 'Oportunidade do 1º Recorde (PR)',
        title: `Superar sua Marca Base em ${exerciseWithBase.exerciseName}`,
        description: `Sua marca de referência é ${pr.bestDurationSeconds}s. Tente sustentar ${pr.bestDurationSeconds + 5} segundos com boa postura!`,
        currentMark: pr.bestDurationSeconds,
        targetMark: pr.bestDurationSeconds + 5,
        unit: 'seconds',
      };
    }
    const currentReps = pr.bestReps || exerciseWithBase.targetReps || 10;
    return {
      type: 'first_pr_from_base',
      exerciseId: exerciseWithBase.exerciseId,
      exerciseName: exerciseWithBase.exerciseName,
      badgeText: 'Oportunidade do 1º Recorde (PR)',
      title: `Superar sua Marca Base em ${exerciseWithBase.exerciseName}`,
      description: `Sua marca de referência é ${currentReps} reps. Tente buscar ${currentReps + 1} repetições na última série para conquistar seu primeiro PR!`,
      currentMark: currentReps,
      targetMark: currentReps + 1,
      unit: 'reps',
    };
  }

  // 2. Exercício que já tem PR (busca o com recordedAt mais antigo para rotação saudável)
  const exercisesWithPR = plan.exercises
    .map((ex) => ({
      ex,
      pr: personalRecords.find((p) => p.exerciseId === ex.exerciseId && !p.isBaseline && (p.prCount || 0) > 0),
    }))
    .filter((item): item is { ex: ExercisePlanItem; pr: PersonalRecord } => item.pr !== undefined)
    .sort((a, b) => a.pr.recordedAt - b.pr.recordedAt);

  if (exercisesWithPR.length > 0) {
    const { ex, pr } = exercisesWithPR[0];
    if (ex.targetDurationSeconds && ex.targetDurationSeconds > 0) {
      return {
        type: 'beat_pr_time',
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        badgeText: 'Micro-Desafio de Superação',
        title: `Superar Recorde em ${ex.exerciseName}`,
        description: `Seu recorde atual é ${pr.bestDurationSeconds}s. Tente sustentar ${pr.bestDurationSeconds + 5}s hoje!`,
        currentMark: pr.bestDurationSeconds,
        targetMark: pr.bestDurationSeconds + 5,
        unit: 'seconds',
      };
    }
    const targetReps = (pr.bestReps || 10) + 1;
    return {
      type: 'beat_pr_reps',
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      badgeText: 'Micro-Desafio de Superação',
      title: `Buscar +1 Repetição em ${ex.exerciseName}`,
      description: `Seu recorde atual é ${pr.bestReps} reps. Que tal tentar alcançar ${targetReps} reps hoje na última série?`,
      currentMark: pr.bestReps,
      targetMark: targetReps,
      unit: 'reps',
    };
  }

  // 3. Ficha totalmente inédita: estabelecer a 1ª Marca Base
  const firstEx = plan.exercises[0];
  return {
    type: 'establish_base',
    exerciseId: firstEx.exerciseId,
    exerciseName: firstEx.exerciseName,
    badgeText: 'Missão de Estreia',
    title: `Inaugurar sua Marca Base em ${firstEx.exerciseName}`,
    description: 'Hoje o foco é controle articular e técnica confortável. Registre suas repetições reais para criar sua referência inicial.',
  };
}

// Estratégia B: Ponte de Continuidade para Amanhã
export function generateTomorrowBridge(
  completedSession: WorkoutSession,
  calendar: CalendarDay[],
  plans: WorkoutPlan[],
  personalRecords: PersonalRecord[],
  referenceDate: Date = new Date()
): TomorrowBridgeInfo {
  const daysLabels = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const tomorrowDayOfWeek = (referenceDate.getDay() + 1) % 7;
  const tomorrowDayLabel = daysLabels[tomorrowDayOfWeek];

  const tomorrowSchedule = calendar.find((c) => c.dayOfWeek === tomorrowDayOfWeek);
  const tomorrowPlan = tomorrowSchedule?.planId
    ? plans.find((p) => p.id === tomorrowSchedule.planId)
    : undefined;

  const tomorrowActivityType: ActivityType = tomorrowSchedule?.activityType || 'rest';

  // Cenário 1: Amanhã é dia de descanso / livre
  if (tomorrowActivityType === 'rest' || tomorrowActivityType === 'unassigned') {
    return {
      tomorrowDayOfWeek,
      tomorrowDayLabel,
      tomorrowDateStr: tomorrowSchedule?.dateStr,
      tomorrowActivityType,
      headline: `Amanhã (${tomorrowDayLabel}): Dia de Regeneração & Cuidado Leve`,
      bodyText: `Hoje você estimulou seus músculos em '${completedSession.planTitle}'. Amanhã é dia de descanso muscular, mas você pode fazer 6 a 8 minutos de mobilidade ou uma caminhada tranquila para soltar as articulações e manter seu ritmo diário aceso!`,
      canScheduleOptionalMobility: true,
    };
  }

  // Cenário 2: Amanhã é treino de força
  if (tomorrowActivityType === 'strength' && tomorrowPlan) {
    const nextChallenge = generateDailyMicroChallenge(tomorrowPlan, personalRecords);
    const challengePreview = nextChallenge
      ? {
          exerciseName: nextChallenge.exerciseName,
          currentMarkText: nextChallenge.currentMark ? `${nextChallenge.currentMark} ${nextChallenge.unit || 'reps'}` : 'Marca inicial',
          targetMarkText: nextChallenge.targetMark ? `${nextChallenge.targetMark} ${nextChallenge.unit || 'reps'}` : 'Nova referência',
        }
      : undefined;

    return {
      tomorrowDayOfWeek,
      tomorrowDayLabel,
      tomorrowDateStr: tomorrowSchedule?.dateStr,
      tomorrowActivityType,
      tomorrowPlanId: tomorrowPlan.id,
      tomorrowPlanTitle: tomorrowPlan.title,
      headline: `Amanhã (${tomorrowDayLabel}): ${tomorrowPlan.title}`,
      bodyText: `Corpo solto e preparado! Amanhã voltamos à ação com '${tomorrowPlan.title}'. Seu foco especial já está definido: ${nextChallenge?.description || 'Dê o seu melhor na execução!'}`,
      nextChallengePreview: challengePreview,
      canScheduleOptionalMobility: false,
    };
  }

  // Cenário 3: Amanhã é caminhada ou mobilidade já agendada
  return {
    tomorrowDayOfWeek,
    tomorrowDayLabel,
    tomorrowDateStr: tomorrowSchedule?.dateStr,
    tomorrowActivityType,
    tomorrowPlanId: tomorrowPlan?.id,
    tomorrowPlanTitle: tomorrowPlan?.title || (tomorrowActivityType === 'walk' ? 'Caminhada' : 'Mobilidade'),
    headline: `Amanhã (${tomorrowDayLabel}): ${tomorrowSchedule?.planTitle || 'Atividade Regenerativa'}`,
    bodyText: 'Tudo pronto na sua agenda! Amanhã temos um encontro leve de movimento para manter sua constância viva sem sobrecarregar o corpo.',
    canScheduleOptionalMobility: false,
  };
}

// Estratégia D: Espelho de Bem-Estar (Termômetro Antes vs Depois com Denominador Explícito)
export function generateWellbeingInsight(sessions: WorkoutSession[]): WellbeingInsight | null {
  const tracked = sessions.filter((s) => s.preMood && s.postMood);
  if (tracked.length === 0) return null;

  const difficultStarts = tracked.filter((s) => s.preMood === 'cansado' || s.preMood === 'tenso');
  const positiveEndsAfterDifficult = difficultStarts.filter(
    (s) =>
      s.postMood === 'renovado' ||
      s.postMood === 'leve' ||
      s.postMood === 'orgulhoso' ||
      s.postMood === 'cansado_bem'
  );

  if (difficultStarts.length > 0) {
    const latest =
      positiveEndsAfterDifficult[positiveEndsAfterDifficult.length - 1] ||
      difficultStarts[difficultStarts.length - 1];
    const mins = Math.max(1, Math.round(latest.durationSeconds / 60));
    const preLabel = PRE_MOOD_LABELS[latest.preMood!].label;
    const postLabel = POST_MOOD_LABELS[latest.postMood!].label;

    return {
      totalTrackedSessions: tracked.length,
      positiveTurnaroundCount: positiveEndsAfterDifficult.length,
      lastTurnaroundPreMood: latest.preMood,
      lastTurnaroundPostMood: latest.postMood,
      lastTurnaroundMinutes: mins,
      message: `Em ${positiveEndsAfterDifficult.length} de ${difficultStarts.length} ${
        difficultStarts.length === 1 ? 'prática registrada' : 'práticas registradas'
      } em que você começou '${preLabel}', apenas ${mins} min de prática fizeram você terminar '${postLabel}'. Comece no seu ritmo hoje!`,
    };
  }

  const latest = tracked[tracked.length - 1];
  const postLabel = POST_MOOD_LABELS[latest.postMood!].label;
  return {
    totalTrackedSessions: tracked.length,
    positiveTurnaroundCount: 0,
    message: `Em ${tracked.length} ${
      tracked.length === 1 ? 'prática recente registrada' : 'práticas recentes registradas'
    }, você terminou se sentindo '${postLabel}'. Reserve alguns minutos para cuidar de você hoje!`,
  };
}

// Estratégia A: Avaliação de Superação de Fluidez com Equivalência Estrita de Trabalho
export function evaluateSessionEfficiency(
  currentSession: WorkoutSession,
  allSessions: WorkoutSession[]
): SessionEfficiencyComparison | null {
  if (
    currentSession.status !== 'completed' ||
    !currentSession.feedbackEffort ||
    currentSession.isExpress ||
    currentSession.wasSoftened ||
    currentSession.totalSetsCompleted < currentSession.totalSetsPlanned
  ) {
    return null;
  }

  const previousEquivalent = allSessions
    .filter(
      (s) =>
        s.id !== currentSession.id &&
        s.planId === currentSession.planId &&
        s.status === 'completed' &&
        !s.isExpress &&
        !s.wasSoftened &&
        s.feedbackEffort !== undefined &&
        s.totalSetsCompleted >= s.totalSetsPlanned &&
        currentSession.totalRepsCompleted >= s.totalRepsCompleted &&
        (currentSession.totalVolumeKg || 0) >= (s.totalVolumeKg || 0)
    )
    .sort((a, b) => (b.completedAt || b.startedAt) - (a.completedAt || a.startedAt))[0];

  if (!previousEquivalent || !previousEquivalent.feedbackEffort) return null;

  if (currentSession.feedbackEffort < previousEquivalent.feedbackEffort) {
    return {
      previousSessionId: previousEquivalent.id,
      previousEffort: previousEquivalent.feedbackEffort,
      currentEffort: currentSession.feedbackEffort,
      improved: true,
    };
  }

  return {
    previousSessionId: previousEquivalent.id,
    previousEffort: previousEquivalent.feedbackEffort,
    currentEffort: currentSession.feedbackEffort,
    improved: false,
  };
}

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
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    ...data,
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `superacao_backup_${getLocalDateStr()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
