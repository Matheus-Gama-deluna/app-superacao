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
  variationSeed?: number;
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
 * Extrai de forma determinística os padrões biomecânicos reais presentes nos itens de uma rotina.
 */
export function buildRoutinePatternsText(exercises: ExercisePlanItem[]): string {
  const patternsSet = new Set<string>();
  for (const item of exercises) {
    const rawMatched = allExercises.find((e) => e.id === item.exerciseId);
    const matched = rawMatched ? enrichExercise(rawMatched) : undefined;
    const pat = matched?.functionalPattern || '';
    if (pat.includes('squat') || pat.includes('lunge')) patternsSet.add('agachar');
    else if (pat.includes('push')) patternsSet.add('empurrar');
    else if (pat.includes('pull')) patternsSet.add('puxar');
    else if (pat.includes('hinge')) patternsSet.add('quadril e posterior');
    else if (pat.includes('core')) patternsSet.add('core e estabilidade');
    else if (pat.includes('mobility')) patternsSet.add('mobilidade articular');
    else if (pat.includes('cardio')) patternsSet.add('ativação cardiovascular');
  }
  return patternsSet.size > 0
    ? `foco nos padrões de ${Array.from(patternsSet).join(', ')}`
    : 'movimentos equilibrados';
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
  const secondaryGoals = draft?.orderedGoals?.slice(1) || profile.secondaryGoals || [];
  const goalFocus = draft?.goalFocus || profile.goalFocus || 'foco_unico';
  const practiceObstacles = draft?.practiceObstacles || profile.practiceObstacles || [];
  const healthNotes = draft?.healthNotes ?? profile.healthNotes ?? '';
  const userContextNotes = draft?.userContextNotes ?? profile.userContextNotes ?? '';
  const exerciseReason = draft?.exerciseReason ?? profile.exerciseReason ?? '';
  const experienceLevel = draft?.experienceLevel || profile.experienceLevel || 'iniciante';
  const environment = (draft?.environmentPreference || profile.environmentPreference) === 'academia' ? 'na academia' : 'em casa';
  const userSeed = `${options.seed || profile.uid || 'guest'}_${goalKey}_${experienceLevel}`;
  const variationSeed = options.variationSeed || 0;
  const extraRestSeconds =
    practiceObstacles.includes('dor') ||
    practiceObstacles.includes('cansaco') ||
    practiceObstacles.includes('cansaco_mental')
      ? 15
      : 0;

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
  if (targetDuration <= 5) {
    maxSlots = 2;
  } else if (targetDuration <= 10) {
    maxSlots = 3;
  } else if (targetDuration <= 15) {
    maxSlots = 4;
  } else if (targetDuration <= 20) {
    maxSlots = 5;
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

        // Ordenação por maior afinidade ou rotação por variação
        const sorted = [...candidates].sort((a, b) => {
          if (variationSeed && variationSeed > 0) {
            // Rotaciona genuinamente entre os candidatos seguros quando solicitada nova variação
            const hashA = deterministicHash(`${variationSeed}_${userSeed}_${slot.slotKey}_${a.id}`);
            const hashB = deterministicHash(`${variationSeed}_${userSeed}_${slot.slotKey}_${b.id}`);
            return hashA - hashB;
          }

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
            extraRestSeconds,
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
  const cleanLimitations = reportedLimitations.filter((l) => l && l.toLowerCase() !== 'nenhuma');
  const limitationsText =
    cleanLimitations.length > 0
      ? ` com cuidado especial para ${cleanLimitations.join(', ')}`
      : '';

  // Identifica os padrões funcionais reais presentes nos exercícios da rotina principal
  const patternsText = buildRoutinePatternsText(planA.exercises);

  let justificationText = `Você informou ${daysText} por semana com ${targetDuration} minutos ${environment}, com foco em "${rawGoal}", utilizando ${equipText}${avoidanceText}${limitationsText}. Esta proposta foi adaptada aos cuidados e preferências que você compartilhou, priorizando conforto articular e progresso gradual com ${patternsText}.`;
  if (experienceLevel === 'retomando') {
    justificationText += ` Reconhecemos seu momento de retorno: calibramos um ritmo progressivo e acolhedor para você readquirir o hábito sem pressa nem cobrança excessiva.`;
  }
  if (exerciseReason && exerciseReason.trim()) {
    justificationText += ` Seu motivo pessoal ("${exerciseReason.trim()}") inspira o ritmo desta jornada.`;
  }
  if (userContextNotes && userContextNotes.trim()) {
    justificationText += ` Observação pessoal acolhida: "${userContextNotes.trim()}".`;
  }
  if (healthNotes && healthNotes.trim()) {
    justificationText += ` Consideração de saúde: Levamos em conta suas observações ("${healthNotes.trim().slice(0, 70)}${healthNotes.length > 70 ? '...' : ''}"), priorizando movimentos articulares gentis.`;
  }
  if (practiceObstacles.length > 0) {
    if (
      practiceObstacles.includes('dor') ||
      practiceObstacles.includes('cansaco') ||
      practiceObstacles.includes('cansaco_mental') ||
      practiceObstacles.includes('falta_tempo')
    ) {
      justificationText += ' Intervalos de descanso foram ampliados para garantir recuperação tranquila sem exaustão.';
    }
    if (practiceObstacles.includes('dificuldade_comecar') || practiceObstacles.includes('desanimo_falhar')) {
      justificationText += ' Pensada para vencer a inércia sem cobrança: qualquer prática parcial ou versão de 5 min já mantém sua constância viva.';
    }
    if (practiceObstacles.includes('exercicios_complexos')) {
      justificationText += ' Priorizamos movimentos de execução direta e intuitiva, com instruções claras passo a passo.';
    }
  }

  const totalExercises = planA.exercises.length;
  const timeBreakdownText = planB
    ? `Treino A (${planA.exercises.length} movimentos em séries calibradas, ~${planA.estimatedDurationMinutes} min) e Treino B (${planB.exercises.length} movimentos em séries calibradas, ~${planB.estimatedDurationMinutes} min) alternados ao longo da semana.`
    : `${totalExercises} exercícios × séries calibradas para ~${planA.estimatedDurationMinutes} min por sessão com descansos e transições calculados.`;

  return {
    id: `proposal_${Date.now()}`,
    title: `Rotina Personalizada: ${rawGoal}`,
    description: justificationText,
    targetDaysCount: targetDays.length,
    sessionDurationMinutes: targetDuration,
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
