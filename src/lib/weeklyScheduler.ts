import { CalendarDay, WorkoutPlan, WorkoutSession } from '../types';
import {
  MONDAY_FIRST_DAYS,
  getMondayFirstIndex,
  getDayOfWeekFromMondayIndex,
  getCurrentWeekMondayDate,
  getCurrentWeekMondayStr,
  getWeekDatesMondayFirst,
  getLocalDateStr,
} from './dateUtils';

export interface SchedulerOptions {
  avoidMonday?: boolean;
  preferredDays?: number[];
}

/**
 * Calcula a distribuição fisiológica ideal de treinos de Segunda a Domingo (1..0)
 * intercalando descansos programados e respeitando a proteção pós-Domingo quando avoidMonday=true.
 */
export function computeIdealTrainingDays(
  targetCount: number,
  options?: SchedulerOptions
): number[] {
  const count = Math.max(1, Math.min(7, Math.round(targetCount)));
  const avoidMonday = Boolean(options?.avoidMonday);

  // Matrizes fisiológicas padrão (Segunda a Domingo: 1, 2, 3, 4, 5, 6, 0)
  if (!avoidMonday) {
    switch (count) {
      case 1:
        return [1]; // Seg
      case 2:
        return [1, 4]; // Seg, Qui
      case 3:
        return [1, 3, 5]; // Seg, Qua, Sex (1 descanso entre treinos)
      case 4:
        return [1, 2, 4, 5]; // Seg, Ter (A/B), Qua (Descanso), Qui, Sex (A/B), Sáb-Dom (Descanso)
      case 5:
        return [1, 2, 4, 5, 6]; // Seg, Ter, Qui, Sex, Sáb
      case 6:
        return [1, 2, 3, 4, 5, 6]; // Seg a Sáb, Dom livre
      case 7:
        return [1, 2, 3, 4, 5, 6, 0];
      default:
        return [1, 3, 5];
    }
  }

  // Quando avoidMonday === true (aluno treinou Força no Domingo anterior):
  // Desloca o início para Terça-feira (2) para assegurar descanso muscular regenerativo
  switch (count) {
    case 1:
      return [2]; // Ter
    case 2:
      return [2, 5]; // Ter, Sex
    case 3:
      return [2, 4, 6]; // Ter, Qui, Sáb
    case 4:
      return [2, 3, 5, 6]; // Ter, Qua, Sex, Sáb
    case 5:
      return [2, 3, 4, 6, 0]; // Ter, Qua, Qui, Sáb, Dom
    case 6:
      return [2, 3, 4, 5, 6, 0]; // Ter a Dom
    case 7:
      return [1, 2, 3, 4, 5, 6, 0];
    default:
      return [2, 4, 6];
  }
}

export interface BuildSmartWeeklyCalendarParams {
  uid: string;
  plans: WorkoutPlan[];
  targetDays?: number[];
  avoidMonday?: boolean;
  nextPlanIndex?: number;
  preferredTime?: 'manha' | 'tarde' | 'noite' | 'livre' | string;
  referenceDate?: Date;
}

/**
 * Constrói a grade canônica semanal (7 dias) na ordem Segunda a Domingo ([1, 2, 3, 4, 5, 6, 0])
 * com rotação contínua de fichas A/B e marcação explícita de descansos planejados pós-treino.
 */
export function buildSmartWeeklyCalendar(params: BuildSmartWeeklyCalendarParams): CalendarDay[] {
  const {
    uid,
    plans,
    avoidMonday = false,
    nextPlanIndex = 0,
    preferredTime,
    referenceDate = new Date(),
  } = params;

  const targetDays =
    params.targetDays && params.targetDays.length > 0
      ? params.targetDays
      : computeIdealTrainingDays(plans.length >= 2 ? 3 : 2, { avoidMonday });

  const weekDates = getWeekDatesMondayFirst(referenceDate);

  let mappedTimeOfDay: CalendarDay['timeOfDay'] = undefined;
  if (preferredTime === 'manha' || preferredTime === 'tarde' || preferredTime === 'noite' || preferredTime === 'livre') {
    mappedTimeOfDay = preferredTime as CalendarDay['timeOfDay'];
  } else if (preferredTime === 'flexivel') {
    mappedTimeOfDay = 'livre';
  }

  let currentPlanRotation = nextPlanIndex;
  const days: CalendarDay[] = [];

  // Ordenação rígida: Segunda (1), Terça (2), Quarta (3), Quinta (4), Sexta (5), Sábado (6), Domingo (0)
  for (let idx = 0; idx < MONDAY_FIRST_DAYS.length; idx++) {
    const dow = MONDAY_FIRST_DAYS[idx];
    const dateStr = weekDates[dow];
    const isTrainingDay = targetDays.includes(dow);

    if (isTrainingDay && plans.length > 0) {
      const selectedPlan = plans[currentPlanRotation % plans.length];
      currentPlanRotation++;

      days.push({
        id: `${uid}_day_${dateStr}`,
        ownerUid: uid,
        dateStr,
        dayOfWeek: dow,
        activityType: 'strength',
        planId: selectedPlan.id,
        planTitle: selectedPlan.title,
        isCompleted: false,
        timeOfDay: mappedTimeOfDay,
        notes: selectedPlan.description || undefined,
      });
    } else {
      // Dia de Descanso & Recuperação
      const prevDow = idx > 0 ? MONDAY_FIRST_DAYS[idx - 1] : 0;
      const prevWasTraining = targetDays.includes(prevDow);

      let restNotes = 'Descanso Consciente & Recuperação';
      if (dow === 1 && avoidMonday) {
        restNotes = 'Descanso Planejado Pós-Treino (Recuperação após treino no Domingo)';
      } else if (prevWasTraining) {
        restNotes = 'Descanso Planejado Pós-Treino';
      }

      days.push({
        id: `${uid}_day_${dateStr}`,
        ownerUid: uid,
        dateStr,
        dayOfWeek: dow,
        activityType: 'rest',
        planId: undefined,
        planTitle: 'Dia de Descanso & Recuperação',
        isCompleted: false,
        timeOfDay: mappedTimeOfDay,
        notes: restNotes,
      });
    }
  }

  return days;
}

export interface RolloverParams {
  calendar: CalendarDay[];
  sessions: WorkoutSession[];
  plans: WorkoutPlan[];
  uid: string;
  referenceDate?: Date;
}

/**
 * Executa a virada inteligente de semana na Segunda-feira 00:00:
 * - Detecta virada de ciclo comparando o YYYY-MM-DD da Segunda atual;
 * - Verifica se houve treino de Força no Domingo anterior;
 * - Dá continuidade à fila de fichas A/B a partir do último treino concluído;
 * - Gera a nova semana com isCompleted: false mantendo integridade histórica em sessions.
 */
export function performSmartWeeklyRollover(params: RolloverParams): {
  needsRollover: boolean;
  updatedCalendar: CalendarDay[];
} {
  const { calendar, sessions, plans, uid, referenceDate = new Date() } = params;
  const currentMondayStr = getCurrentWeekMondayStr(referenceDate);

  // Se a agenda estiver vazia, gera a semana corrente
  if (!calendar || calendar.length === 0) {
    const updatedCalendar = buildSmartWeeklyCalendar({
      uid,
      plans,
      referenceDate,
    });
    return { needsRollover: true, updatedCalendar };
  }

  // Verifica se o calendário atual já está na semana de referência
  const calMonday = calendar.find((c) => c.dayOfWeek === 1);
  const todayStr = getLocalDateStr(referenceDate);
  const hasToday = calendar.some((c) => c.dateStr === todayStr);
  const isCurrentWeek = Boolean((calMonday && calMonday.dateStr === currentMondayStr) || hasToday);

  if (isCurrentWeek) {
    return { needsRollover: false, updatedCalendar: calendar };
  }

  // Identifica a data do Domingo imediatamente anterior a esta Segunda
  const mondayDate = getCurrentWeekMondayDate(referenceDate);
  const prevSundayDate = new Date(mondayDate);
  prevSundayDate.setDate(prevSundayDate.getDate() - 1);
  const prevSundayStr = getLocalDateStr(prevSundayDate);

  // Checa se o usuário treinou Força no Domingo anterior
  const trainedSundayInSessions = sessions.some((s) => {
    if (s.status !== 'completed' && s.totalSetsCompleted === 0) return false;
    const sessionDate = s.date || getLocalDateStr(new Date(s.completedAt || s.startedAt));
    return sessionDate === prevSundayStr;
  });

  const trainedSundayInCalendar = calendar.some(
    (c) => c.dayOfWeek === 0 && c.dateStr === prevSundayStr && c.isCompleted && c.activityType === 'strength'
  );

  const trainedSunday = trainedSundayInSessions || trainedSundayInCalendar;

  // Continuidade da Fila de Fichas (A/B):
  // Descobre qual ficha foi feita por último para iniciar pela próxima
  let nextPlanIndex = 0;
  if (plans.length > 1) {
    const sortedCompleted = [...sessions]
      .filter((s) => s.status === 'completed' && s.planId)
      .sort((a, b) => (b.completedAt || b.startedAt) - (a.completedAt || a.startedAt));

    if (sortedCompleted.length > 0) {
      const lastPlanId = sortedCompleted[0].planId;
      const foundIdx = plans.findIndex((p) => p.id === lastPlanId);
      if (foundIdx >= 0) {
        nextPlanIndex = (foundIdx + 1) % plans.length;
      }
    }
  }

  // Determina a meta / dias alvo a partir da agenda anterior ou do número de treinos
  const prevStrengthDays = calendar.filter((c) => c.activityType === 'strength');
  const targetCount = prevStrengthDays.length > 0 ? prevStrengthDays.length : Math.max(plans.length, 3);

  const targetDays = computeIdealTrainingDays(targetCount, {
    avoidMonday: trainedSunday,
  });

  const updatedCalendar = buildSmartWeeklyCalendar({
    uid,
    plans,
    targetDays,
    avoidMonday: trainedSunday,
    nextPlanIndex,
    referenceDate,
  });

  return { needsRollover: true, updatedCalendar };
}

export interface RebalanceParams {
  calendar: CalendarDay[];
  todayDow: number;
  plans: WorkoutPlan[];
  sessions?: WorkoutSession[];
  referenceDate?: Date;
  routineConfirmedAt?: number;
}

/**
 * Rebalanceia dinamicamente os dias restantes da semana (Hoje até Domingo)
 * mantendo o espaçamento fisiológico de descanso quando o aluno descansa em dia planejado
 * ou treina em dia de descanso.
 */
export function rebalanceRemainingWeek(params: RebalanceParams): {
  rebalanced: boolean;
  updatedCalendar: CalendarDay[];
  message?: string;
  previousCalendar?: CalendarDay[];
} {
  const { calendar, todayDow, plans, referenceDate, routineConfirmedAt } = params;
  const todayIndex = getMondayFirstIndex(todayDow);

  // Não rebalanceia na Segunda-feira inicial nem no Domingo à noite
  if (todayIndex <= 0 || todayIndex >= 6 || calendar.length < 7) {
    return { rebalanced: false, updatedCalendar: calendar };
  }

  // Se a rotina foi confirmada hoje (ou após ontem), o usuário não perdeu o treino de ontem
  const todayDate = referenceDate || new Date();
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDateStr = getLocalDateStr(yesterdayDate);

  if (routineConfirmedAt) {
    const confirmedDateStr = getLocalDateStr(new Date(routineConfirmedAt));
    if (confirmedDateStr > yesterdayDateStr) {
      return { rebalanced: false, updatedCalendar: calendar };
    }
  }

  const yesterdayDow = getDayOfWeekFromMondayIndex(todayIndex - 1);
  const yesterdaySchedule = calendar.find((c) => c.dayOfWeek === yesterdayDow);
  const todaySchedule = calendar.find((c) => c.dayOfWeek === todayDow);

  if (!yesterdaySchedule || !todaySchedule) {
    return { rebalanced: false, updatedCalendar: calendar };
  }

  // Cenário 1: Ontem era treino de Força mas o aluno descansou (não completou)
  // E hoje está como descanso, deixando treinos restantes sem espaçamento
  const missedYesterday =
    yesterdaySchedule.activityType === 'strength' &&
    !yesterdaySchedule.isCompleted;

  if (missedYesterday && todaySchedule.activityType === 'rest' && !todaySchedule.isCompleted) {
    // Conta quantos treinos de força ainda faltam na semana
    const remainingDaysList = MONDAY_FIRST_DAYS.slice(todayIndex); // ex.: [2, 3, 4, 5, 6, 0]
    const scheduledAhead = calendar.filter(
      (c) => remainingDaysList.includes(c.dayOfWeek as any) && c.activityType === 'strength'
    ).length;

    // Queremos realocar 1 treino a mais hoje para recuperar o dia perdido sem sobrecarga
    const neededInWindow = Math.min(scheduledAhead + 1, remainingDaysList.length);

    // Seleciona dias na janela restante mantendo 1 descanso entre eles
    const newActiveDows: number[] = [];
    for (let i = 0; i < remainingDaysList.length; i += 2) {
      if (newActiveDows.length < neededInWindow) {
        newActiveDows.push(remainingDaysList[i]);
      }
    }

    let planCursor = 0;
    const updated = calendar.map((c) => {
      const idx = getMondayFirstIndex(c.dayOfWeek);
      if (idx < todayIndex) return c; // Preserva passado

      if (newActiveDows.includes(c.dayOfWeek)) {
        const plan = plans[planCursor % plans.length] || plans[0];
        planCursor++;
        return {
          ...c,
          activityType: 'strength' as const,
          planId: plan?.id,
          planTitle: plan?.title || 'Treino de Força',
          isCompleted: false,
          notes: plan?.description,
        };
      } else {
        return {
          ...c,
          activityType: 'rest' as const,
          planId: undefined,
          planTitle: 'Dia de Descanso & Recuperação',
          notes: 'Descanso Planejado Pós-Treino',
          isCompleted: false,
        };
      }
    });

    return {
      rebalanced: true,
      updatedCalendar: updated,
      previousCalendar: calendar,
      message:
        'Como ontem foi dia de descanso, reorganizamos seus treinos restantes da semana mantendo seus intervalos de recuperação.',
    };
  }

  // Cenário 2: Ontem o aluno treinou (estava concluído) e hoje estava planejado treino de força
  // Para evitar sobrecarga articular consecutiva, se o treino não for uma divisão A/B intencional
  const yesterdayTrained =
    yesterdaySchedule.isCompleted && yesterdaySchedule.activityType === 'strength';

  if (yesterdayTrained && todaySchedule.activityType === 'strength' && !todaySchedule.isCompleted) {
    // Se o dia seguinte (amanhã) existir e for descanso, desloca o treino de hoje para amanhã
    const tomorrowDow = getDayOfWeekFromMondayIndex(todayIndex + 1);
    const tomorrowSchedule = calendar.find((c) => c.dayOfWeek === tomorrowDow);

    if (tomorrowSchedule && tomorrowSchedule.activityType === 'rest') {
      const updated = calendar.map((c) => {
        if (c.dayOfWeek === todayDow) {
          return {
            ...c,
            activityType: 'rest' as const,
            planId: undefined,
            planTitle: 'Dia de Descanso & Recuperação',
            notes: 'Descanso Planejado Pós-Treino',
            isCompleted: false,
          };
        }
        if (c.dayOfWeek === tomorrowDow) {
          return {
            ...c,
            activityType: 'strength' as const,
            planId: todaySchedule.planId,
            planTitle: todaySchedule.planTitle,
            isCompleted: false,
          };
        }
        return c;
      });

      return {
        rebalanced: true,
        updatedCalendar: updated,
        previousCalendar: calendar,
        message:
          'Como você treinou ontem, hoje é seu Descanso Planejado Pós-Treino. Seu treino foi transferido para amanhã.',
      };
    }
  }

  return { rebalanced: false, updatedCalendar: calendar };
}
