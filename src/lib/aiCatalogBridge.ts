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
import { composeTargetedWorkout } from './workoutEngine/composer';

export type WorkoutPurpose =
  | 'forca_hipertrofia'
  | 'mobilidade_alongamento'
  | 'relaxamento_muscular'
  | 'membros_superiores'
  | 'membros_inferiores'
  | 'costas_postura'
  | 'gluteos_pernas'
  | 'pos_luta_artes_marciais'
  | 'pos_esporte_descompressao'
  | 'cardio_sem_impacto'
  | 'viagem_hotel'
  | 'pausa_escritorio_sem_chao'
  | 'core_estabilidade'
  | string;

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
 * com cálculo cinesiológico dinâmico de volume e adequação motora.
 */
export async function buildCustomWorkoutForPurpose(
  profile: Partial<UserProfile> | null | undefined,
  options: CustomWorkoutOptions
): Promise<WorkoutPlan> {
  await ensureFullCatalogLoaded();

  let muscleFocus: any = undefined;
  if (options.targetMusclesOrFocus && options.targetMusclesOrFocus.length > 0) {
    const raw = options.targetMusclesOrFocus[0].toLowerCase();
    if (raw.includes('superior') || raw.includes('braco') || raw.includes('peito')) muscleFocus = 'superior';
    else if (raw.includes('costas')) muscleFocus = 'costas';
    else if (raw.includes('gluteo') || raw.includes('perna') || raw.includes('inferior')) muscleFocus = 'inferior';
    else if (raw.includes('core') || raw.includes('abd')) muscleFocus = 'core';
    else if (raw.includes('along') || raw.includes('relax')) muscleFocus = 'alongamento';
  }

  return composeTargetedWorkout(profile, {
    purpose: options.purpose,
    durationMinutes: options.durationMinutes,
    equipmentOverride: options.equipmentOverride,
    avoidFloor: options.avoidFloor,
    muscleFocus,
    experienceLevel: profile?.experienceLevel,
  });
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
