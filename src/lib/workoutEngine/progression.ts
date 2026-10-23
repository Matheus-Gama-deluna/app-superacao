import {
  WorkoutPlan,
  WorkoutSession,
  PersonalRecord,
  ProgressionItemUpgrade,
  SessionProgressionAnalysis,
  GentleReturnInfo,
  MovementLadderTrack,
  MovementLadderUserProgress,
  Exercise,
  UserProfile,
  SetEvent,
} from '../../types';
import { EXERCISE_METADATA_OVERRIDES } from '../../data/exerciseOverrides';
import { SPECIALIZED_EXERCISES } from '../../data/specializedExercises';
import { allExercises as baseAllExercises } from '../../data/catalog';
import { isExerciseSafeForUser, enrichExercise } from './filters';
import { getLocalDateStr } from '../dateUtils';

/**
 * Definições oficiais das 5 Escadas de Evolução Biomecânica do Superação.
 * Cada escada possui 4 degraus progressivos do nível mais restaurativo até o mais avançado.
 */
export const MOVEMENT_LADDERS: MovementLadderTrack[] = [
  {
    ladderId: 'pushup',
    title: 'Trilha de Empurrar (Flexões)',
    pattern: 'push_horizontal',
    steps: [
      {
        stepIndex: 1,
        name: 'Flexão na Parede',
        exerciseId: 'wall_pushup_controlled',
        exerciseName: 'Flexão na Parede',
        repsToLevelUp: 15,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Construa estabilidade articular dos ombros e punhos com controle total.',
      },
      {
        stepIndex: 2,
        name: 'Flexão Inclinada no Banco / Cadeira',
        exerciseId: 'incline_push-up',
        exerciseName: 'Flexão Inclinada na Cadeira/Banco',
        repsToLevelUp: 12,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Reduza a inclinação para aumentar a carga muscular no peitoral e tríceps.',
      },
      {
        stepIndex: 3,
        name: 'Flexão com Joelhos Apoiados',
        exerciseId: 'kneeling_pushup',
        exerciseName: 'Flexão com Joelhos Apoiados',
        repsToLevelUp: 12,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Aproxime-se do plano horizontal reforçando o core e linha abdominal.',
      },
      {
        stepIndex: 4,
        name: 'Flexão Tradicional no Solo',
        exerciseId: 'push-up',
        exerciseName: 'Flexão Tradicional no Solo',
        repsToLevelUp: 10,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'O padrão ouro de força corporal completa em cadeia cinética fechada.',
      },
    ],
  },
  {
    ladderId: 'squat',
    title: 'Trilha de Pernas (Agachamentos)',
    pattern: 'squat',
    steps: [
      {
        stepIndex: 1,
        name: 'Sentar e Levantar da Cadeira',
        exerciseId: 'chair_sit_to_stand_cross_arms',
        exerciseName: 'Sentar e Levantar da Cadeira',
        repsToLevelUp: 15,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Treine a amplitude e controle seguro dos joelhos com anteparo confiável.',
      },
      {
        stepIndex: 2,
        name: 'Agachamento Livre',
        exerciseId: 'bodyweight_squat',
        exerciseName: 'Agachamento Livre',
        repsToLevelUp: 15,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Domínio do peso corporal com profundidade funcional e coluna alinhada.',
      },
      {
        stepIndex: 3,
        name: 'Agachamento com Faixa Elástica',
        exerciseId: 'band_squat',
        exerciseName: 'Agachamento com Faixa Elástica',
        repsToLevelUp: 12,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Ativação intensa de glúteo médio e estabilidade lateral dos joelhos.',
      },
      {
        stepIndex: 4,
        name: 'Agachamento Goblet com Peso',
        exerciseId: 'goblet_squat_dumbbell',
        exerciseName: 'Agachamento Goblet com Halter',
        repsToLevelUp: 12,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Carga frontal que fortalece pernas e eretores da espinha com postura ereta.',
      },
    ],
  },
  {
    ladderId: 'row',
    title: 'Trilha de Puxar & Costas (Remadas)',
    pattern: 'pull_horizontal',
    steps: [
      {
        stepIndex: 1,
        name: 'Y-T-W Escapular em Pé',
        exerciseId: 'standing_scapular_y_t_w',
        exerciseName: 'Y-T-W Escapular em Pé',
        repsToLevelUp: 15,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Ativação postural dos trapézios e romboides sem necessidade de carga.',
      },
      {
        stepIndex: 2,
        name: 'Remada com Toalha na Porta',
        exerciseId: 'door_towel_row',
        exerciseName: 'Remada com Toalha na Porta',
        repsToLevelUp: 12,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Puxada horizontal segura usando o peso do corpo e uma porta firme.',
      },
      {
        stepIndex: 3,
        name: 'Crucifixo Invertido com Elástico',
        exerciseId: 'band_pull_apart',
        exerciseName: 'Crucifixo Invertido com Elástico',
        repsToLevelUp: 15,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Tensão elástica contínua para correção de ombros protusos do trabalho sentado.',
      },
      {
        stepIndex: 4,
        name: 'Remada Invertida na Mesa',
        exerciseId: 'table_inverted_row',
        exerciseName: 'Remada Invertida na Mesa',
        repsToLevelUp: 10,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Desenvolvimento potente de força de puxar em ângulo horizontal.',
      },
    ],
  },
  {
    ladderId: 'glute_bridge',
    title: 'Trilha de Quadril & Cadeia Posterior',
    pattern: 'hinge',
    steps: [
      {
        stepIndex: 1,
        name: 'Ponte de Glúteo no Solo',
        exerciseId: 'glute_bridge',
        exerciseName: 'Ponte de Glúteo no Solo',
        repsToLevelUp: 15,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Ativação isolada da extensão de quadril poupando a coluna lombar.',
      },
      {
        stepIndex: 2,
        name: 'Ponte de Glúteo com Elástico',
        exerciseId: 'band_glute_bridge',
        exerciseName: 'Ponte de Glúteo com Elástico',
        repsToLevelUp: 15,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Resistência elástica de abdução simultânea à extensão pélvica.',
      },
      {
        stepIndex: 3,
        name: 'Ponte de Glúteo Unilateral',
        exerciseId: 'single_leg_glute_bridge',
        exerciseName: 'Ponte Unilateral',
        repsToLevelUp: 10,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Correção de assimetrias de força entre os lados e controle de pelve.',
      },
      {
        stepIndex: 4,
        name: 'Elevação Pélvica com Peso / Halter',
        exerciseId: 'glute_bridge_dumbbell',
        exerciseName: 'Elevação Pélvica com Halter',
        repsToLevelUp: 12,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Carga progressiva direta para hipertrofia e potência de glúteos e isquiotibiais.',
      },
    ],
  },
  {
    ladderId: 'plank',
    title: 'Trilha de Core & Estabilidade Anti-Carga',
    pattern: 'core_anti_extension',
    steps: [
      {
        stepIndex: 1,
        name: 'Perdigueiro (Bird-Dog)',
        exerciseId: 'bird_dog_hold',
        exerciseName: 'Perdigueiro de Estabilização',
        repsToLevelUp: 10,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'O clássico de Stuart McGill: estabilidade lombar cruzada sem compressão discal.',
      },
      {
        stepIndex: 2,
        name: 'Prancha Frontal',
        exerciseId: 'plank',
        exerciseName: 'Prancha Frontal',
        repsToLevelUp: 45, // 45 segundos
        setsToLevelUp: 3,
        trackingMode: 'time',
        description: 'Sustentação isométrica sólida do complexo lombo-pélvico contra a gravidade.',
      },
      {
        stepIndex: 3,
        name: 'Prancha com Toque no Ombro',
        exerciseId: 'plank_shoulder_tap',
        exerciseName: 'Prancha com Toque no Ombro',
        repsToLevelUp: 16,
        setsToLevelUp: 3,
        trackingMode: 'reps',
        description: 'Resistência à rotação dinâmica: transfira o apoio sem oscilar o quadril.',
      },
      {
        stepIndex: 4,
        name: 'Prancha Lateral Sustentada',
        exerciseId: 'side_plank',
        exerciseName: 'Prancha Lateral',
        repsToLevelUp: 35, // 35 segundos por lado
        setsToLevelUp: 3,
        trackingMode: 'time',
        description: 'Blindagem do quadrado lombar e oblíquos para postura ereta inabalável.',
      },
    ],
  },
];

/**
 * 1. Analisa os resultados de uma sessão concluída e identifica possíveis evoluções de treino.
 * Segue estritamente os invariantes:
 * - Se RPE <= 2 (muito fácil ou leve) e todas as séries atingiram a meta: sugere progressão (+1 rep ou +5s).
 * - Se atingiu o teto da escada biomecânica: sugere subir de degrau.
 * - Suporta tanto setEvents canônicos quanto session.sets retrocompatível.
 */
export function analyzeSessionProgression(
  session: WorkoutSession,
  plan: WorkoutPlan,
  prs: PersonalRecord[] = [],
  setEvents: SetEvent[] = []
): SessionProgressionAnalysis {
  const upgrades: ProgressionItemUpgrade[] = [];
  const rpe = session.feedbackEffort || session.rpeEffort || 3;

  for (const planEx of plan.exercises) {
    // Busca séries realizadas a partir de setEvents ou do objeto session.sets
    let performedSets: Array<{ completed: boolean; reps: number; isTime: boolean }> = [];

    const relatedEvents = setEvents.filter(
      ev => ev.sessionId === session.id && ev.exerciseId === planEx.exerciseId
    );

    if (relatedEvents.length > 0) {
      performedSets = relatedEvents.map(ev => {
        const isTime = Boolean(
          (planEx.targetDurationSeconds && planEx.targetDurationSeconds > 0) ||
          planEx.trackingMode === 'time' ||
          (ev.actualDurationSeconds && ev.actualDurationSeconds > 0)
        );
        return {
          completed: true,
          reps: isTime ? (ev.actualDurationSeconds || 0) : (ev.actualReps || 0),
          isTime,
        };
      });
    } else if (session.sets && session.sets[planEx.exerciseId]) {
      performedSets = session.sets[planEx.exerciseId].map(s => {
        const isTime = Boolean(
          (planEx.targetDurationSeconds && planEx.targetDurationSeconds > 0) ||
          planEx.trackingMode === 'time'
        );
        return {
          completed: s.completed !== false,
          reps: s.actualDurationSeconds || s.actualReps || s.reps || 0,
          isTime,
        };
      });
    }

    if (performedSets.length === 0) continue;

    const allCompleted = performedSets.every(s => s.completed);
    if (!allCompleted) continue;

    const isTimeMode = performedSets[0]?.isTime || Boolean(planEx.targetDurationSeconds && planEx.targetDurationSeconds > 0) || planEx.trackingMode === 'time';
    const avgCompleted =
      performedSets.reduce((sum: number, s) => sum + (s.reps || 0), 0) / performedSets.length;

    // Verificar se há uma escada biomecânica associada
    const ladderTrack = MOVEMENT_LADDERS.find(t =>
      t.steps.some(s => s.exerciseId === planEx.exerciseId)
    );

    if (ladderTrack) {
      const currentStepIndex = ladderTrack.steps.findIndex(s => s.exerciseId === planEx.exerciseId);
      if (currentStepIndex >= 0 && currentStepIndex < ladderTrack.steps.length - 1) {
        const stepDef = ladderTrack.steps[currentStepIndex];
        const nextStepDef = ladderTrack.steps[currentStepIndex + 1];

        // Se o usuário já faz a meta do degrau com conforto (RPE <= 3 e reps/segundos >= meta do degrau)
        if (avgCompleted >= stepDef.repsToLevelUp && rpe <= 3) {
          upgrades.push({
            exerciseId: planEx.exerciseId,
            exerciseName: planEx.exerciseName,
            type: 'ladder_step_up',
            currentValue: stepDef.stepIndex,
            suggestedValue: nextStepDef.stepIndex,
            unit: 'degrau',
            reason: `Você dominou o Degrau ${stepDef.stepIndex} (${stepDef.name}) com facilidade! Pronto para avançar para ${nextStepDef.name}.`,
            ladderInfo: {
              ladderId: ladderTrack.ladderId,
              fromStepIndex: stepDef.stepIndex,
              toStepIndex: nextStepDef.stepIndex,
              toStepName: nextStepDef.name,
              replacementExerciseId: nextStepDef.exerciseId,
            },
          });
          continue; // Já sugeriu subida de degrau para este exercício
        }
      }
    }

    // Se RPE foi muito leve/controlado (<= 2) ou <= 3 com meta cumprida com sobra
    if (rpe <= 2) {
      if (isTimeMode) {
        const currentTime = planEx.targetDurationSeconds || planEx.targetReps || 30; // segundos
        const suggestedTime = currentTime < 30 ? currentTime + 5 : currentTime + 10;
        upgrades.push({
          exerciseId: planEx.exerciseId,
          exerciseName: planEx.exerciseName,
          type: 'time_increase',
          currentValue: currentTime,
          suggestedValue: suggestedTime,
          unit: 'seconds',
          reason: `Você sentiu o treino fluido e sob controle (Esforço ${rpe}/5). Uma progressão de +${suggestedTime - currentTime}s estimula sua resistência isométrica.`,
        });
      } else {
        const currentReps = planEx.targetReps || 10;
        const suggestedReps = currentReps + 1;
        upgrades.push({
          exerciseId: planEx.exerciseId,
          exerciseName: planEx.exerciseName,
          type: 'rep_increase',
          currentValue: currentReps,
          suggestedValue: suggestedReps,
          unit: 'reps',
          reason: `Esforço relatado leve (${rpe}/5). Subir +1 repetição na sua meta oficial consolida seu ganho de força sem sobrecarga articular.`,
        });
      }
    }
  }

  let summaryMessage = 'Mantenha a consistência no ritmo atual!';
  if (upgrades.length > 0) {
    const hasLadder = upgrades.some(u => u.type === 'ladder_step_up');
    summaryMessage = hasLadder
      ? '🎉 Parabéns! Você atingiu critérios de evolução de nível em um dos movimentos fundamentais.'
      : '⚡ Seu corpo se adaptou ao estímulo. Sugerimos pequenas evoluções de reps/tempo para continuar evoluindo.';
  }

  return {
    workoutPlanId: plan.id,
    workoutTitle: plan.title,
    sessionRpe: rpe,
    upgrades,
    summaryMessage,
  };
}

/**
 * 2. Aplica atualizações aprovadas pelo usuário na ficha de treino de maneira transparente e não-destrutiva.
 */
export function applyUpgradesToWorkoutPlan(
  plan: WorkoutPlan,
  approvedUpgrades: ProgressionItemUpgrade[]
): WorkoutPlan {
  const upgradedPlan: WorkoutPlan = {
    ...plan,
    exercises: plan.exercises.map(ex => {
      const upgrade = approvedUpgrades.find(u => u.exerciseId === ex.exerciseId);
      if (!upgrade) return { ...ex };

      if (upgrade.type === 'ladder_step_up' && upgrade.ladderInfo) {
        return {
          ...ex,
          exerciseId: upgrade.ladderInfo.replacementExerciseId,
          exerciseName: upgrade.ladderInfo.toStepName,
          targetReps: Math.max(6, Math.round(ex.targetReps * 0.75)), // Degrau novo começa calibrado
        };
      }

      if (upgrade.type === 'time_increase') {
        return {
          ...ex,
          targetDurationSeconds: upgrade.suggestedValue,
          targetReps: upgrade.suggestedValue,
        };
      }

      if (upgrade.type === 'rep_increase') {
        return {
          ...ex,
          targetReps: upgrade.suggestedValue,
        };
      }

      return { ...ex };
    }),
  };

  return upgradedPlan;
}

/**
 * 3. Detecção de Retomada Gentil (Ausência prolongada >= 7 dias).
 * Aceita uma data em string YYYY-MM-DD ou uma lista de sessões de treino.
 */
export function detectGentleReturn(
  lastWorkoutDateOrSessions: string | WorkoutSession[] | null | undefined,
  todayStr: string
): GentleReturnInfo {
  let lastWorkoutDate: string | null = null;

  if (Array.isArray(lastWorkoutDateOrSessions)) {
    if (lastWorkoutDateOrSessions.length > 0) {
      const latest = lastWorkoutDateOrSessions[0];
      const timestamp = latest.completedAt || latest.startedAt;
      if (timestamp) {
        lastWorkoutDate = getLocalDateStr(new Date(timestamp));
      } else if (latest.date) {
        lastWorkoutDate = latest.date;
      }
    }
  } else if (typeof lastWorkoutDateOrSessions === 'string') {
    lastWorkoutDate = lastWorkoutDateOrSessions;
  }

  if (!lastWorkoutDate) {
    return {
      isEligible: false,
      daysAbsent: 0,
      headline: '',
      message: '',
      suggestedSetsScale: 1,
      suggestedVolumeScale: 1,
    };
  }

  const lastDate = new Date(lastWorkoutDate + 'T00:00:00');
  const currDate = new Date(todayStr + 'T00:00:00');
  const diffMs = currDate.getTime() - lastDate.getTime();
  const daysAbsent = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysAbsent >= 7) {
    return {
      isEligible: true,
      daysAbsent,
      headline: `Bem-vindo(a) de volta! Sentimos sua falta há ${daysAbsent} dias`,
      message:
        'Para seu retorno ser seguro e sem dores no dia seguinte, preparamos uma sessão de readaptação gentil: 2 séries por exercício e volume ligeiramente reduzido.',
      suggestedSetsScale: 0.67, // Teto em 2 séries
      suggestedVolumeScale: 0.8, // 80% das reps
    };
  }

  return {
    isEligible: false,
    daysAbsent,
    headline: '',
    message: '',
    suggestedSetsScale: 1,
    suggestedVolumeScale: 1,
  };
}

/**
 * Cria uma cópia da rotina calibrada para Retomada Gentil (apenas para a sessão em andamento).
 * Mantém o mesmo id do plano para vincular corretamente com a agenda e estatísticas.
 */
export function createGentleReturnPlanSnapshot(plan: WorkoutPlan): WorkoutPlan {
  return {
    ...plan,
    title: `${plan.title} (Retomada Gentil)`,
    description: `${plan.description || ''} • Readaptação ativa com volume protetivo.`,
    exercises: plan.exercises.map(ex => ({
      ...ex,
      targetSets: Math.min(2, Math.max(1, ex.targetSets)),
      targetReps: Math.max(5, Math.round(ex.targetReps * 0.8)),
      targetDurationSeconds: ex.targetDurationSeconds ? Math.max(15, Math.round(ex.targetDurationSeconds * 0.8)) : undefined,
    })),
  };
}

/**
 * 4. Troca de Exercício "Ao Vivo" com Compatibilidade Estrita.
 * Encontra substitutos seguros do mesmo padrão biomecânico respeitando equipamentos e limitações.
 */
export function findSafeEquivalentExercises(
  currentExerciseId: string,
  userPreferences: Partial<UserProfile>,
  allExercises: Exercise[] = []
): Exercise[] {
  const currentMeta = EXERCISE_METADATA_OVERRIDES[currentExerciseId];
  const targetPattern = currentMeta?.functionalPattern;

  // Se não passar catálogo, usa o catálogo base completo
  const sourceExercises = allExercises.length > 0 ? allExercises : baseAllExercises;

  // Unifica exercícios da base e especializados
  const pool = [...sourceExercises, ...SPECIALIZED_EXERCISES];
  const seenIds = new Set<string>();
  const uniquePool: Exercise[] = [];

  for (const ex of pool) {
    if (!seenIds.has(ex.id)) {
      seenIds.add(ex.id);
      uniquePool.push(enrichExercise(ex));
    }
  }

  const userEquipments =
    userPreferences.equipments ||
    userPreferences.availableEquipments ||
    ['peso_corporal'];

  return uniquePool
    .filter(candidate => {
      if (candidate.id === currentExerciseId) return false;

      // Invariante: Segurança Estrita
      const safety = isExerciseSafeForUser(
        candidate,
        userEquipments,
        userPreferences.avoidedMovements || [],
        userPreferences.reportedLimitations || []
      );
      if (!safety.safe) return false;

      const candidateMeta = EXERCISE_METADATA_OVERRIDES[candidate.id];
      const candPattern = candidate.functionalPattern || candidateMeta?.functionalPattern;

      if (targetPattern && candPattern) {
        return candPattern === targetPattern;
      }

      // Se não tiver meta de padrão estrito, compara por grupo muscular primário
      const currentEx = uniquePool.find(e => e.id === currentExerciseId);
      if (currentEx && (currentEx.target_muscle === candidate.target_muscle || currentEx.bodyPart === candidate.bodyPart)) {
        return true;
      }

      return false;
    })
    .slice(0, 3);
}

/**
 * 5. Calcula o progresso do usuário nas 5 Escadas Biomecânicas
 * baseado nas sessões concluídas e PRs acumulados.
 */
export function calculateMovementLaddersProgress(
  sessions: WorkoutSession[] = [],
  prs: PersonalRecord[] = [],
  setEvents: SetEvent[] = []
): MovementLadderUserProgress[] {
  return MOVEMENT_LADDERS.map(track => {
    let currentStepIndex = 1;
    let bestMarkText = 'Ainda não registrado';

    // Determina qual é o degrau atual com base nas sessões e PRs
    for (let i = 0; i < track.steps.length; i++) {
      const step = track.steps[i];
      const pr = prs.find(p => p.exerciseId === step.exerciseId);

      const hasCompletedInEvents = setEvents.some(
        ev => ev.exerciseId === step.exerciseId && (
          (step.trackingMode === 'time' && (ev.actualDurationSeconds || 0) >= step.repsToLevelUp) ||
          (step.trackingMode !== 'time' && (ev.actualReps || 0) >= step.repsToLevelUp)
        )
      );

      const hasCompletedInSession = sessions.some(s => {
        const sets = (s as any).sets?.[step.exerciseId] || [];
        return sets.some((st: any) => {
          const val = st.actualDurationSeconds || st.actualReps || st.reps || 0;
          return st.completed && val >= step.repsToLevelUp;
        });
      });

      const bestValue = pr ? (step.trackingMode === 'time' ? pr.bestDurationSeconds : pr.bestReps) : 0;
      const isStepMastered = hasCompletedInEvents || hasCompletedInSession || bestValue >= step.repsToLevelUp;

      if (isStepMastered) {
        currentStepIndex = Math.min(track.steps.length, step.stepIndex + 1);
      }

      if (pr && (pr.bestReps > 0 || pr.bestDurationSeconds > 0)) {
        bestMarkText = step.trackingMode === 'time'
          ? `${pr.bestDurationSeconds}s (PR)`
          : `${pr.bestReps} reps (PR)`;
      }
    }

    const currentStepDef = track.steps.find(s => s.stepIndex === currentStepIndex) || track.steps[0];
    const isCompleted = currentStepIndex > track.steps.length;

    const stepsWithStatus = track.steps.map(step => {
      let status: 'completed' | 'current' | 'locked' = 'locked';
      if (step.stepIndex < currentStepIndex) {
        status = 'completed';
      } else if (step.stepIndex === currentStepIndex) {
        status = 'current';
      }

      return {
        stepIndex: step.stepIndex,
        name: step.name,
        exerciseId: step.exerciseId,
        exerciseName: step.exerciseName,
        status,
      };
    });

    return {
      ladderId: track.ladderId,
      title: track.title,
      currentStepIndex: Math.min(currentStepIndex, track.steps.length),
      currentStepName: currentStepDef.name,
      bestMarkText,
      isCompleted,
      steps: stepsWithStatus,
    };
  });
}
