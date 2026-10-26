import { Exercise, ExercisePlanItem } from '../../types';

export interface PrescriptionOptions {
  sessionDurationMinutes?: number;
  experienceLevel?: 'iniciante' | 'intermediario' | 'avancado' | 'retomando' | 'pratica';
  goalKey?: string;
  extraRestSeconds?: number;
}

/**
 * Calcula a prescrição de séries, repetições, sustentação isométrica e descanso
 * para um exercício baseado no perfil do praticante e tempo da sessão.
 */
export function prescribeExerciseItem(
  ex: Exercise,
  options: PrescriptionOptions,
  slotRationale?: string
): ExercisePlanItem {
  const duration = options.sessionDurationMinutes || 20;
  const level = options.experienceLevel || 'iniciante';
  const isBeginnerOrReturning = level === 'iniciante' || level === 'retomando';
  const isMicro = duration <= 5;
  const isExpress = duration > 5 && duration <= 10;
  const isFifteen = duration > 10 && duration <= 15;
  const isLong = duration >= 30;

  // 1. Determinação de Séries
  let sets = 2;
  if (ex.modality === 'mobilidade' || ex.modality === 'alongamento') {
    sets = (isMicro || isExpress) ? 1 : 2;
  } else {
    if (isMicro || isExpress) {
      sets = 2;
    } else if (isFifteen) {
      // Se houver descanso extra (cansaço mental/físico) ou for iniciante/retomada,
      // 2 séries asseguram que 4 movimentos caibam confortavelmente dentro dos 15 minutos
      sets = (isBeginnerOrReturning || (options.extraRestSeconds && options.extraRestSeconds > 0)) ? 2 : 3;
    } else if (isLong) {
      sets = level === 'avancado' || level === 'pratica' ? 4 : 3;
    } else {
      // 16 a 29 min
      sets = isBeginnerOrReturning ? 2 : 3;
    }
  }

  // 2. Determinação de Repetições ou Tempo de Isometria
  const isTimeTracking = ex.tracking === 'time' || ex.modality === 'alongamento';
  let targetReps = 0;
  let targetDurationSeconds: number | undefined = undefined;

  if (isTimeTracking) {
    if (ex.modality === 'alongamento' || ex.modality === 'mobilidade') {
      targetDurationSeconds = 30;
    } else {
      // Isometria de força (ex: Prancha, Perdigueiro sustentado, Parede isométrica)
      if (isBeginnerOrReturning) {
        targetDurationSeconds = 20;
      } else if (level === 'intermediario') {
        targetDurationSeconds = 30;
      } else {
        targetDurationSeconds = 45;
      }
    }
  } else {
    // Repetições dinâmicas
    if (options.goalKey === 'forca') {
      targetReps = isBeginnerOrReturning ? 8 : level === 'intermediario' ? 10 : 12;
    } else if (options.goalKey === 'vitalidade') {
      targetReps = isBeginnerOrReturning ? 10 : 12;
    } else {
      // habito, postura, alivio_dores
      targetReps = isBeginnerOrReturning ? 8 : 10;
    }
  }

  // 3. Descanso entre séries (segundos)
  let restSeconds = 45;
  if (ex.modality === 'mobilidade' || ex.modality === 'alongamento') {
    restSeconds = 20;
  } else if (options.goalKey === 'forca') {
    restSeconds = isBeginnerOrReturning ? 60 : 50;
  } else if (options.goalKey === 'vitalidade') {
    restSeconds = 35;
  } else {
    restSeconds = isExpress ? 35 : 45;
  }

  // 4. Justificativa honesta (reason)
  if (options.extraRestSeconds) {
    restSeconds += options.extraRestSeconds;
  }

  let reason = slotRationale || ex.caution_pt || 'Movimento selecionado para compor o equilíbrio articular da rotina.';

  return {
    exerciseId: ex.id,
    exerciseName: ex.name_pt,
    targetSets: sets,
    targetReps,
    targetDurationSeconds,
    restSeconds,
    notes: ex.caution_pt || undefined,
    reason,
  };
}

/**
 * Calcula a duração realista de uma sessão com base na soma das séries,
 * durações de execução, intervalos de descanso e transições entre aparelhos/chão.
 */
export function calculateRoutineDurationMinutes(items: ExercisePlanItem[]): number {
  if (items.length === 0) return 0;

  const totalSeconds = items.reduce((acc, item) => {
    // Estimativa de tempo sob tensão por série:
    // Se for tempo marcado, usa o valor. Se for reps, assume ~4s por repetição em cadência controlada e segura.
    const execTimePerSet = item.targetDurationSeconds || (item.targetReps > 0 ? item.targetReps * 4 : 30);
    // Cada série tem execução + descanso
    const timeForSets = item.targetSets * (execTimePerSet + item.restSeconds);
    return acc + timeForSets;
  }, 0);

  // Preparação de postura inicial e transição calma entre exercícios (~25 segundos por movimento)
  const transitionsTotalSeconds = items.length * 25;
  const totalMinutes = Math.round((totalSeconds + transitionsTotalSeconds) / 60);

  return Math.max(5, totalMinutes);
}

/**
 * Calibra rigorosamente o volume e séries dos exercícios para assegurar que a duração estimada
 * da rotina respeite o teto da janela informada pelo usuário (ex.: <= 15 min para janela de 15 min),
 * sem frustrar a expectativa de tempo declarada no onboarding.
 */
export function fitRoutineToTargetDuration(
  items: ExercisePlanItem[],
  targetDuration: number
): ExercisePlanItem[] {
  if (items.length === 0) return items;

  const adjusted = items.map((it) => ({ ...it }));
  let currentMinutes = calculateRoutineDurationMinutes(adjusted);

  // 1. Se a duração calculada exceder o teto desejado, ajusta séries dos exercícios complementares
  if (currentMinutes > targetDuration) {
    // Passada A: reduz séries de 3 para 2, começando do último exercício para preservar o estímulo primário
    for (let i = adjusted.length - 1; i >= 0 && currentMinutes > targetDuration; i--) {
      if (adjusted[i].targetSets > 2) {
        adjusted[i].targetSets -= 1;
        currentMinutes = calculateRoutineDurationMinutes(adjusted);
      }
    }

    // Passada B: se ainda exceder (ex: descansos estendidos de cansaço mental/dor em janelas curtas),
    // reduz para 1 série em exercícios de alongamento/mobilidade ou acessórios (índice > 0)
    for (let i = adjusted.length - 1; i >= 1 && currentMinutes > targetDuration; i--) {
      if (adjusted[i].targetSets > 1) {
        adjusted[i].targetSets -= 1;
        currentMinutes = calculateRoutineDurationMinutes(adjusted);
      }
    }
  }

  return adjusted;
}
