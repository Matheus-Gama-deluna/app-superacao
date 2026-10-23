import { Exercise, ExercisePlanItem } from '../../types';

export interface PrescriptionOptions {
  sessionDurationMinutes?: number;
  experienceLevel?: 'iniciante' | 'intermediario' | 'avancado';
  goalKey?: string;
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
  const isExpress = duration <= 15;
  const isLong = duration >= 30;

  // 1. Determinação de Séries
  let sets = 2;
  if (ex.modality === 'mobilidade' || ex.modality === 'alongamento') {
    sets = isExpress ? 1 : 2;
  } else {
    if (isExpress) {
      sets = 2;
    } else if (isLong) {
      sets = level === 'avancado' ? 4 : 3;
    } else {
      // 16 a 29 min
      sets = level === 'iniciante' ? 2 : 3;
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
      if (level === 'iniciante') {
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
      targetReps = level === 'iniciante' ? 8 : level === 'intermediario' ? 10 : 12;
    } else if (options.goalKey === 'vitalidade') {
      targetReps = level === 'iniciante' ? 10 : 12;
    } else {
      // habito, postura, alivio_dores
      targetReps = level === 'iniciante' ? 8 : 10;
    }
  }

  // 3. Descanso entre séries (segundos)
  let restSeconds = 45;
  if (ex.modality === 'mobilidade' || ex.modality === 'alongamento') {
    restSeconds = 20;
  } else if (options.goalKey === 'forca') {
    restSeconds = level === 'iniciante' ? 60 : 50;
  } else if (options.goalKey === 'vitalidade') {
    restSeconds = 35;
  } else {
    restSeconds = isExpress ? 35 : 45;
  }

  // 4. Justificativa honesta (reason)
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
    // Se for tempo marcado, usa o valor. Se for reps, assume ~3.5s por repetição controlada.
    const execTimePerSet = item.targetDurationSeconds || (item.targetReps > 0 ? item.targetReps * 3.5 : 30);
    // Cada série tem execução + descanso
    const timeForSets = item.targetSets * (execTimePerSet + item.restSeconds);
    return acc + timeForSets;
  }, 0);

  // Transições entre exercícios (~15 segundos para mudar de posição ou beber água)
  const transitionsTotalSeconds = Math.max(0, (items.length - 1) * 15);
  const totalMinutes = Math.round((totalSeconds + transitionsTotalSeconds) / 60);

  return Math.max(5, totalMinutes);
}
