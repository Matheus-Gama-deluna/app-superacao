import {
  Exercise,
  ExercisePlanItem,
  ExplainableProposal,
  OnboardingDraft,
  UserProfile,
  WorkoutPlan,
} from '../../types';
import { allExercises } from '../../data/catalog';
import { enrichExercise, isExerciseSafeForUser } from './filters';
import { getSlotsForGoal, normalizeGoalKey, RoutineTemplate } from './slots';
import { calculateRoutineDurationMinutes, prescribeExerciseItem } from './prescriptions';
import { EQUIPMENT_LABELS, AVOIDANCE_LABELS } from '../storage';

export interface GenerationOptions {
  seed?: string | number;
  forceVariant?: 'A' | 'B';
  routinePrefix?: string;
}

/**
 * Função de hash determinístico para ordenação estável (elimina Math.random).
 */
function deterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Converte para inteiro de 32 bits
  }
  return Math.abs(hash);
}

/**
 * Motor canônico de geração explicável e determinística v2.
 */
export function generateSmartWorkoutRoutine(
  profile: Partial<UserProfile>,
  draft?: Partial<OnboardingDraft>,
  options: GenerationOptions = {}
): ExplainableProposal {
  // Extração de parâmetros unificada (prioriza draft do onboarding, depois profile, depois padrões seguros)
  const targetDays = draft?.availableDays || profile.availableDays || [1, 3, 5];
  const targetDuration = draft?.sessionDurationMinutes || profile.sessionDurationMinutes || 20;
  const userEquipments = draft?.equipments || profile.equipments || ['peso_corporal'];
  const userAvoided = draft?.avoidedMovements || profile.avoidedMovements || [];
  const reportedLimitations = draft?.reportedLimitations || profile.reportedLimitations || [];
  const rawGoal = draft?.orderedGoals?.[0] || profile.primaryGoal || 'Construir o hábito e me sentir melhor';
  const goalKey = normalizeGoalKey(rawGoal);
  const experienceLevel = draft?.experienceLevel || profile.experienceLevel || 'iniciante';
  const environment = draft?.environmentPreference === 'academia' ? 'na academia' : 'em casa';
  const userSeed = `${options.seed || profile.uid || 'guest'}_${goalKey}_${experienceLevel}`;

  // 1. Filtragem preliminar de todos os exercícios seguros
  const safeCatalog: Exercise[] = allExercises
    .map(enrichExercise)
    .filter((ex) => {
      const check = isExerciseSafeForUser(ex, userEquipments, userAvoided, reportedLimitations);
      if (!check.safe) return false;

      // Salvaguarda para iniciantes: sem exercícios avançados ou complexidade extrema
      if (experienceLevel === 'iniciante') {
        if (ex.difficulty_candidate === 'avancado' || ex.movementComplexity === 3) {
          return false;
        }
      }
      return true;
    });

  // 2. Se o catálogo seguro estiver completamente vazio para os filtros
  if (safeCatalog.length === 0) {
    const equipText = userEquipments.map((e) => EQUIPMENT_LABELS[e] || e).join(', ');
    const noOptionText = `Não encontramos movimentos certificados para seus equipamentos informados (${equipText}) com suas restrições e limitações articulares. Você pode ajustar seus apoios ou cadastrar sua rotina manualmente.`;

    return {
      id: `proposal_${Date.now()}`,
      title: `Ajuste de Restrições Necessário`,
      description: noOptionText,
      targetDaysCount: targetDays.length,
      sessionDurationMinutes: targetDuration,
      environment,
      equipmentsUsed: userEquipments,
      avoidedMovements: userAvoided,
      justificationText: noOptionText,
      timeBreakdownText: 'Nenhuma ficha gerada para os critérios atuais.',
      routines: [],
      weeklySchedule: {},
      generatedAt: Date.now(),
      isConfirmed: false,
      hasCompatibleExercises: false,
      reasonIfUnavailable: noOptionText,
    };
  }

  // 3. Determina quantidade de slots com base no tempo de treino desejado
  let maxSlots = 4;
  if (targetDuration <= 15) {
    maxSlots = 3;
  } else if (targetDuration <= 20) {
    maxSlots = 4;
  } else if (targetDuration <= 30) {
    maxSlots = 5;
  } else {
    maxSlots = 6;
  }

  // 4. Construtor auxiliar para uma rotina (Treino A ou Treino B)
  const buildRoutine = (variant: 'A' | 'B'): WorkoutPlan => {
    const { template, slots } = getSlotsForGoal(goalKey, variant, maxSlots);
    const chosenItems: ExercisePlanItem[] = [];
    const usedExerciseIds = new Set<string>();

    for (const slot of slots) {
      // Procura primeiro pelo padrão primário
      let candidates = safeCatalog.filter(
        (ex) => !usedExerciseIds.has(ex.id) && ex.functionalPattern === slot.primaryPattern
      );

      // Se não encontrou no primário, tenta fallbacks em ordem
      if (candidates.length === 0) {
        for (const fbPattern of slot.fallbackPatterns) {
          candidates = safeCatalog.filter(
            (ex) => !usedExerciseIds.has(ex.id) && ex.functionalPattern === fbPattern
          );
          if (candidates.length > 0) break;
        }
      }

      // Se ainda não encontrou, busca qualquer exercício seguro ainda não usado
      if (candidates.length === 0) {
        candidates = safeCatalog.filter((ex) => !usedExerciseIds.has(ex.id));
      }

      if (candidates.length > 0) {
        // Função de afinidade funcional e curadoria pedagógica
        const getAffinityScore = (ex: Exercise): number => {
          let score = 0;
          const nameLower = (ex.name_pt || ex.name_en || '').toLowerCase();

          // 1. Exercícios com escada curada de progressão têm prioridade máxima de clareza
          if (ex.ladder) score += 50;

          // 2. Afinidade específica por padrão do slot
          if (slot.primaryPattern === 'squat' && (nameLower.includes('agachamento') || nameLower.includes('sentar e levantar') || nameLower.includes('cadeira'))) {
            score += 30;
          }
          if (slot.primaryPattern === 'push_horizontal' && (nameLower.includes('flexão') || nameLower.includes('push-up'))) {
            score += 30;
          }
          if (slot.primaryPattern === 'pull_horizontal' && (nameLower.includes('remada') || nameLower.includes('toalha') || nameLower.includes('escapular') || nameLower.includes('w de bruços'))) {
            score += 35;
          }
          if (slot.primaryPattern === 'pull_vertical' && (nameLower.includes('puxada') || nameLower.includes('lat pulldown'))) {
            score += 35;
          }
          if (slot.primaryPattern === 'hinge' && (nameLower.includes('ponte') || nameLower.includes('bridge') || nameLower.includes('super-homem'))) {
            score += 30;
          }
          if ((slot.primaryPattern === 'core_anti_extension' || slot.primaryPattern === 'core_anti_rotation') && (nameLower.includes('perdigueiro') || nameLower.includes('prancha') || nameLower.includes('dead bug'))) {
            score += 30;
          }
          if (slot.primaryPattern === 'mobility_spine' && (nameLower.includes('gato e vaca') || nameLower.includes('coluna') || nameLower.includes('torácic'))) {
            score += 30;
          }
          if (slot.primaryPattern === 'mobility_hip' && (nameLower.includes('90/90') || nameLower.includes('quadril'))) {
            score += 30;
          }

          // 3. Equipamentos adicionais confirmados
          const usesEquip = ex.equipment.some((eq) => eq !== 'peso_corporal' && eq !== 'nenhum');
          if (usesEquip) score += 15;

          // 4. Penaliza saltos se não for slot explícito de cardio
          if (nameLower.includes('jump') || nameLower.includes('salto') || nameLower.includes('skipping')) {
            score -= 100;
          }

          return score;
        };

        // Ordenação por maior afinidade, depois determinismo por hash
        const sorted = [...candidates].sort((a, b) => {
          const scoreDiff = getAffinityScore(b) - getAffinityScore(a);
          if (scoreDiff !== 0) return scoreDiff;

          // Desempate determinístico estável
          const hashA = deterministicHash(`${userSeed}_${slot.slotKey}_${a.id}`);
          const hashB = deterministicHash(`${userSeed}_${slot.slotKey}_${b.id}`);
          return hashA - hashB;
        });

        const selected = sorted[0];
        usedExerciseIds.add(selected.id);

        const normalizedExpLevel: 'iniciante' | 'intermediario' | 'avancado' =
          experienceLevel === 'pratica' ? 'avancado' : experienceLevel === 'retomando' ? 'intermediario' : (experienceLevel || 'iniciante');

        const planItem = prescribeExerciseItem(
          selected,
          {
            sessionDurationMinutes: targetDuration,
            experienceLevel: normalizedExpLevel,
            goalKey,
          },
          slot.rationale
        );
        chosenItems.push(planItem);
      }
    }

    const calculatedMinutes = calculateRoutineDurationMinutes(chosenItems);
    const routineId = `plan_${variant.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    return {
      id: routineId,
      ownerUid: profile.uid || 'guest_user',
      title: `${template.name} (${calculatedMinutes} min)`,
      description: template.description,
      version: 1,
      isProfessional: false,
      isTemplate: false,
      sourceKind: 'modelo_revisado',
      reviewStatus: 'revisado',
      exercises: chosenItems,
      estimatedDurationMinutes: calculatedMinutes,
      category: userEquipments.includes('mini_band') ? 'mini_band' : 'casa',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  // 5. Gera as rotinas necessárias
  // Se o usuário treina 3 ou mais dias por semana, geramos Treino A e Treino B alternados!
  const routines: WorkoutPlan[] = [];
  const weeklySchedule: { [dayOfWeek: number]: string } = {};

  const planA = buildRoutine('A');
  routines.push(planA);

  const shouldHavePlanB = targetDays.length >= 3 && !options.forceVariant;
  let planB: WorkoutPlan | null = null;
  if (shouldHavePlanB) {
    planB = buildRoutine('B');
    routines.push(planB);
  }

  // 6. Preenche a agenda semanal alternando A e B de forma previsível
  targetDays.forEach((dayIdx, i) => {
    if (planB && i % 2 === 1) {
      weeklySchedule[dayIdx] = planB.id;
    } else {
      weeklySchedule[dayIdx] = planA.id;
    }
  });

  // 7. Textos explicativos e honestos
  const daysText = targetDays.length === 1 ? '1 dia' : `${targetDays.length} dias`;
  const equipText = userEquipments.map((e) => EQUIPMENT_LABELS[e] || e).join(', ');
  const avoidanceText =
    userAvoided.length > 0
      ? ` e evitando ${userAvoided.map((a) => AVOIDANCE_LABELS[a] || a).join(', ')}`
      : '';
  const limitationsText =
    reportedLimitations.length > 0
      ? ` com cuidado especial para ${reportedLimitations.join(', ')}`
      : '';

  const justificationText = `Você informou ${daysText} por semana com ${targetDuration} minutos ${environment}, com foco em "${rawGoal}", utilizando apenas ${equipText}${avoidanceText}${limitationsText}. Esta proposta equilibra padrões de agachar, empurrar, puxar e core de forma 100% segura para você.`;

  const totalExercises = planA.exercises.length;
  const timeBreakdownText = planB
    ? `Treino A (${planA.exercises.length} movimentos em séries calibradas, ~${planA.estimatedDurationMinutes} min) e Treino B (${planB.exercises.length} movimentos em séries calibradas, ~${planB.estimatedDurationMinutes} min) alternados ao longo da semana.`
    : `${totalExercises} exercícios × séries calibradas para ~${planA.estimatedDurationMinutes} min por sessão com descansos e transições calculados.`;

  return {
    id: `proposal_${Date.now()}`,
    title: `Rotina Personalizada: ${rawGoal}`,
    description: justificationText,
    targetDaysCount: targetDays.length,
    sessionDurationMinutes: planA.estimatedDurationMinutes,
    environment,
    equipmentsUsed: userEquipments,
    avoidedMovements: userAvoided,
    justificationText,
    timeBreakdownText,
    routines,
    weeklySchedule,
    generatedAt: Date.now(),
    isConfirmed: false,
    hasCompatibleExercises: true,
  };
}
