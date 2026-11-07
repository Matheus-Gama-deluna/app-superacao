/**
 * AI Catalog Bridge & Multi-Purpose Program Engine (v9.5)
 * Conecta o Personal IA à enciclopédia de 900+ exercícios e gera:
 * 1. Treinos sob medida para propósitos específicos (Força, Mobilidade, Pós-Luta, Cardio Sem Impacto, Viagem)
 * 2. Programas de Longo Prazo (Mesociclos de 4 a 8 semanas em 4 Fases Progressivas)
 * 3. Kits de Contingência para Dias de Imprevisto (Express, Baixa Energia, Recuperação Ativa)
 */

import {
  Exercise,
  ExercisePlanItem,
  WorkoutPlan,
  WorkoutProgram,
  UserProfile,
  ExplainableProposal,
} from '../types';
import { allExercises, ensureFullCatalogLoaded } from '../data/catalog';
import { enrichExercise, isExerciseSafeForUser } from './workoutEngine/filters';
import { MOVEMENT_LADDERS } from './workoutEngine/progression';

export type WorkoutPurpose =
  | 'forca_hipertrofia'
  | 'mobilidade_alongamento'
  | 'pos_luta_artes_marciais'
  | 'pos_esporte_descompressao'
  | 'cardio_sem_impacto'
  | 'viagem_hotel'
  | 'pausa_escritorio_sem_chao'
  | 'core_estabilidade';

export interface CustomWorkoutOptions {
  purpose: WorkoutPurpose;
  durationMinutes?: number;
  targetMusclesOrFocus?: string[];
  equipmentOverride?: string[];
  avoidFloor?: boolean;
  notes?: string;
}

/**
 * Busca inteligente e sem restrições no catálogo para o Personal IA
 */
export async function searchCatalogForAgent(params: {
  query?: string;
  modality?: string;
  equipmentAllowed?: string[];
  avoidedMovements?: string[];
  reportedLimitations?: string[];
  avoidFloor?: boolean;
  limit?: number;
}): Promise<Exercise[]> {
  await ensureFullCatalogLoaded();

  const allowedEq = params.equipmentAllowed && params.equipmentAllowed.length > 0
    ? params.equipmentAllowed
    : ['peso_corporal'];

  const results = allExercises
    .map(enrichExercise)
    .filter((ex) => {
      // 1. Modalidade se especificada
      if (params.modality && params.modality !== 'todas') {
        if (ex.modality !== params.modality) return false;
      }

      // 2. Transição de solo se evitada
      if (params.avoidFloor && ex.floorTransition) {
        return false;
      }

      // 3. Segurança física e articular
      const check = isExerciseSafeForUser(
        ex,
        allowedEq,
        params.avoidedMovements || [],
        params.reportedLimitations || []
      );
      if (!check.safe) return false;

      // 4. Query textual se fornecida
      if (params.query) {
        const q = params.query.toLowerCase();
        const corpus = `${ex.name_pt} ${ex.name_en || ''} ${ex.target_muscle || ''} ${ex.instructions_pt || ''}`.toLowerCase();
        if (!corpus.includes(q)) return false;
      }

      return true;
    });

  return results.slice(0, params.limit || 30);
}

/**
 * Cria uma sessão sob medida para propósitos específicos (Personal IA Multi-Propósito)
 */
export async function buildCustomWorkoutForPurpose(
  profile: Partial<UserProfile> | null | undefined,
  options: CustomWorkoutOptions
): Promise<WorkoutPlan> {
  await ensureFullCatalogLoaded();

  const duration = options.durationMinutes || (options.purpose === 'pausa_escritorio_sem_chao' ? 8 : 15);
  const userEq = options.equipmentOverride || profile?.equipments || ['peso_corporal'];
  const userAvoided = [...(profile?.avoidedMovements || [])];
  if (options.avoidFloor) userAvoided.push('exercicios_chao');
  const userLims = profile?.reportedLimitations || [];

  const safeCatalog = allExercises
    .map(enrichExercise)
    .filter((ex) => {
      if (options.avoidFloor && ex.floorTransition) return false;
      return isExerciseSafeForUser(ex, userEq, userAvoided, userLims).safe;
    });

  let selectedExercises: Exercise[] = [];
  let title = 'Treino Personalizado';
  let desc = 'Sessão elaborada pelo seu Personal IA.';

  switch (options.purpose) {
    case 'pos_luta_artes_marciais':
    case 'pos_esporte_descompressao': {
      title = options.purpose === 'pos_luta_artes_marciais'
        ? 'Descompressão Pós-Arte Marcial & Luta'
        : 'Recuperação & Soltura Pós-Esporte';
      desc = 'Soltura de punhos, abertura de quadril (90/90), descompressão torácica e respiração regenerativa.';
      const priorityIds = [
        'mob_punhos_antebracos_tatame',
        'along_abertura_quadril',
        'mob_rotacao_toracica_livro',
        'along_flexor_quadril_semi_ajoelhado',
        'along_crianca_lombar',
        'respiracao_diafragmatica_recuperacao',
      ];
      for (const id of priorityIds) {
        const found = safeCatalog.find((e) => e.id === id);
        if (found) selectedExercises.push(found);
      }
      break;
    }

    case 'mobilidade_alongamento': {
      title = `Recuperação Ativa & Mobilidade (${duration} min)`;
      desc = 'Soltura muscular progressiva, amplitude articular e alívio do estresse diário.';
      const priorityIds = [
        'mob_gato_vaca',
        'along_abertura_quadril',
        'mob_rotacao_toracica_livro',
        'along_peitoral_parede_porta',
        'along_piriforme_cadeira',
        'along_crianca_lombar',
        'respiracao_diafragmatica_recuperacao',
      ];
      for (const id of priorityIds) {
        const found = safeCatalog.find((e) => e.id === id);
        if (found && selectedExercises.length < 5) selectedExercises.push(found);
      }
      break;
    }

    case 'pausa_escritorio_sem_chao': {
      title = 'Pausa Ativa no Trabalho (Sem Solo)';
      desc = 'Alívio da rigidez do pescoço, peitoral e lombar em pé ou na cadeira em poucos minutos.';
      const priorityIds = [
        'mob_descompressao_cervical_trapezio',
        'along_peitoral_parede_porta',
        'along_piriforme_cadeira',
        'along_isquiotibiais_em_pe',
        'standing_scapular_y_t_w',
        'mob_tornozelo_parede',
      ];
      for (const id of priorityIds) {
        const found = safeCatalog.find((e) => e.id === id);
        if (found && selectedExercises.length < 5) selectedExercises.push(found);
      }
      break;
    }

    case 'cardio_sem_impacto': {
      title = `Cardio Ativo Sem Impacto (${duration} min)`;
      desc = 'Circulação, fôlego e queima calórica com impacto articular zero para proteger joelhos e coluna.';
      const priorityIds = [
        'cardio_step_jack_sem_salto',
        'cardio_shadow_boxing_tatame',
        'bodyweight_squat',
        'butt_lift_bridge',
        'respiracao_diafragmatica_recuperacao',
      ];
      for (const id of priorityIds) {
        const found = safeCatalog.find((e) => e.id === id);
        if (found) selectedExercises.push(found);
      }
      break;
    }

    case 'core_estabilidade': {
      title = `Estabilidade de Core & Lombar McGill (${duration} min)`;
      desc = 'Firmeza abdominal profunda e proteção da coluna sem flexões repetitivas.';
      const priorityIds = [
        'bird_dog_hold',
        'core_dead_bug_mcgill',
        'butt_lift_bridge',
        'plank',
        'along_crianca_lombar',
      ];
      for (const id of priorityIds) {
        const found = safeCatalog.find((e) => e.id === id);
        if (found) selectedExercises.push(found);
      }
      break;
    }

    default: {
      // Força / Viagem / Geral
      title = `Força Funcional Personalizada (${duration} min)`;
      desc = 'Sessão balanceada cobrindo empurrar, agachar, quadril e estabilização de tronco.';
      const pushEx = safeCatalog.find((e) => e.functionalPattern === 'push_horizontal' || e.functionalPattern === 'push_vertical') || safeCatalog[0];
      const squatEx = safeCatalog.find((e) => e.functionalPattern === 'squat' || e.functionalPattern === 'lunge') || safeCatalog[1];
      const hingeEx = safeCatalog.find((e) => e.functionalPattern === 'hinge') || safeCatalog[2];
      const coreEx = safeCatalog.find((e) => e.functionalPattern?.includes('core')) || safeCatalog[3];
      if (pushEx) selectedExercises.push(pushEx);
      if (squatEx && !selectedExercises.includes(squatEx)) selectedExercises.push(squatEx);
      if (hingeEx && !selectedExercises.includes(hingeEx)) selectedExercises.push(hingeEx);
      if (coreEx && !selectedExercises.includes(coreEx)) selectedExercises.push(coreEx);
      break;
    }
  }

  // Se a lista ainda for menor que 3, completa com qualquer movimento seguro
  if (selectedExercises.length < 3) {
    for (const ex of safeCatalog) {
      if (!selectedExercises.some((s) => s.id === ex.id)) {
        selectedExercises.push(ex);
        if (selectedExercises.length >= 3) break;
      }
    }
  }

  const items: ExercisePlanItem[] = selectedExercises.map((ex) => {
    const isMobility = ex.modality === 'alongamento' || ex.modality === 'mobilidade';
    const isCardioTime = ex.tracking === 'time';
    return {
      exerciseId: ex.id,
      exerciseName: ex.name_pt,
      targetSets: isMobility ? 2 : 3,
      targetReps: isMobility || isCardioTime ? 0 : 10,
      targetDurationSeconds: isMobility ? 35 : isCardioTime ? 45 : undefined,
      restSeconds: isMobility ? 20 : 45,
      notes: ex.caution_pt || '',
    };
  });

  return {
    id: `plan_custom_${Date.now()}`,
    ownerUid: profile?.uid || 'guest',
    title,
    description: desc,
    version: 1,
    isProfessional: false,
    authorName: 'Personal IA',
    sourceKind: 'usuario',
    category: options.purpose.includes('mobilidade') ? 'mobilidade' : 'casa',
    estimatedDurationMinutes: duration,
    exercises: items,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Monta um Programa de Longo Prazo Completo (Mesociclo de 4 ou 8 semanas em 4 fases)
 * acompanhado de seu Kit Completo de Contingência para Dias de Imprevisto
 */
export async function buildEvolvingWorkoutProgram(
  profile: Partial<UserProfile> | null | undefined,
  proposal: ExplainableProposal,
  durationWeeks = 8
): Promise<{
  program: WorkoutProgram;
  emergencyPlan: WorkoutPlan;
  softenedPlan: WorkoutPlan;
  activeRecoveryPlan: WorkoutPlan;
}> {
  await ensureFullCatalogLoaded();

  // 1. Ficha de Imprevisto / Pouco Tempo (Express 8-10 min)
  const baseRoutineA = proposal.routines[0];
  const expressExercises: ExercisePlanItem[] = (baseRoutineA?.exercises || []).slice(0, 3).map((item) => ({
    ...item,
    targetSets: 2,
    restSeconds: 30,
    notes: 'Execução express focada em manter a constância diária.',
  }));

  const emergencyPlan: WorkoutPlan = {
    id: `plan_express_${proposal.id}`,
    ownerUid: profile?.uid || 'guest',
    title: '⚡ Opção Imprevisto: Salvar o Hábito (8 min)',
    description: 'Versão condensada com os 3 padrões essenciais do seu programa para dias corridos.',
    version: 1,
    isProfessional: false,
    authorName: 'Personal IA',
    sourceKind: 'usuario',
    category: 'casa',
    estimatedDurationMinutes: 8,
    exercises: expressExercises.length > 0 ? expressExercises : (baseRoutineA?.exercises || []),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // 2. Ficha de Baixa Energia / Cansaço (-25% volume e ritmo suave)
  const softenedExercises: ExercisePlanItem[] = (baseRoutineA?.exercises || []).map((item) => ({
    ...item,
    targetSets: Math.max(1, item.targetSets - 1),
    targetReps: item.targetReps > 0 ? Math.max(6, Math.round(item.targetReps * 0.8)) : 0,
    restSeconds: (item.restSeconds || 45) + 15,
    notes: 'Ritmo suave para manter o movimento sem desgaste excessivo.',
  }));

  const softenedPlan: WorkoutPlan = {
    id: `plan_soft_${proposal.id}`,
    ownerUid: profile?.uid || 'guest',
    title: '🔋 Opção Baixa Energia: Treino Suave',
    description: 'Volume reduzido e descanso mais amplo para dias de sono ruim ou cansaço mental.',
    version: 1,
    isProfessional: false,
    authorName: 'Personal IA',
    sourceKind: 'usuario',
    category: 'casa',
    estimatedDurationMinutes: Math.max(10, proposal.sessionDurationMinutes - 5),
    exercises: softenedExercises,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // 3. Ficha de Recuperação Ativa & Pós-Luta/Esporte (8 min)
  const activeRecoveryPlan = await buildCustomWorkoutForPurpose(profile, {
    purpose: 'mobilidade_alongamento',
    durationMinutes: 8,
  });
  activeRecoveryPlan.id = `plan_recovery_${proposal.id}`;
  activeRecoveryPlan.title = '🌿 Recuperação Ativa & Soltura (8 min)';
  activeRecoveryPlan.description = 'Descompressão articular e fluidez motora para os dias de descanso ou pós-luta/esporte.';

  // 4. Estrutura Periodizada de 4 Fases (Mesociclo de 4 a 8 Semanas)
  const isEightWeeks = durationWeeks >= 8;
  const program: WorkoutProgram = {
    id: `program_${proposal.id}`,
    title: proposal.title,
    description: proposal.description,
    objective: (proposal as any).objective || 'habito',
    environment: proposal.environment === 'na academia' ? 'academia' : 'casa',
    durationWeeks: isEightWeeks ? 8 : 4,
    currentWeek: 1,
    splitType: proposal.routines.length > 2 ? 'abc' : 'full_body',
    weeklyFrequency: proposal.targetDaysCount,
    emergencyPlanId: emergencyPlan.id,
    phases: isEightWeeks
      ? [
          {
            name: 'Fase 1: Adaptação & Base Técnica',
            weeks: [1, 2],
            description: 'Domínio dos movimentos fundamentais e ativação articular sem dores.',
            focusNotes: 'Foco na respiração e no ritmo controlado de cada exercício.',
          },
          {
            name: 'Fase 2: Acúmulo de Volume & Consistência',
            weeks: [3, 4],
            description: 'Aumento gradual de estímulo (+1 série ou repetições extras nos padrões principais).',
            focusNotes: 'Sustente a constância semanal no horário planejado.',
          },
          {
            name: 'Fase 3: Progressão de Degrau Biomecânico',
            weeks: [5, 6, 7],
            description: 'Subida de degrau nas Escadas Biomecânicas e maior firmeza muscular.',
            focusNotes: 'Desafie-se nas variações sem perder a forma técnica.',
          },
          {
            name: 'Fase 4: Consolidação & Deload Regenerativo',
            weeks: [8],
            description: 'Volume reduzido pela metade para recuperação articular e supercompensação neural.',
            focusNotes: 'Semana de alívio e renovação do próximo ciclo.',
          },
        ]
      : [
          {
            name: 'Fase 1: Construção do Hábito e Adaptação',
            weeks: [1, 2],
            description: proposal.description,
            focusNotes: 'Aparecer e cumprir as sessões sem pressa.',
          },
          {
            name: 'Fase 2: Consolidação e Evolução',
            weeks: [3, 4],
            description: 'Constância consolidada com evolução gradual de conforto e força.',
            focusNotes: 'Mantenha a fluidez respiratória e o prazer no movimento.',
          },
        ],
    routines: [
      ...proposal.routines,
      emergencyPlan,
      softenedPlan,
      activeRecoveryPlan,
    ],
    weeklySchedule: proposal.weeklySchedule,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCustom: true,
  };

  return {
    program,
    emergencyPlan,
    softenedPlan,
    activeRecoveryPlan,
  };
}
