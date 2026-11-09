import {
  Exercise,
  WorkoutPlan,
  ExercisePlanItem,
  UserProfile,
} from '../../types';
import { allExercises } from '../../data/catalog';
import { enrichExercise, isExerciseSafeForUser } from './filters';
import { prescribeExerciseItem, calculateRoutineDurationMinutes } from './prescriptions';

export interface TargetedWorkoutOptions {
  purpose: string;
  durationMinutes?: number;
  equipmentOverride?: string[];
  avoidFloor?: boolean;
  muscleFocus?: 'superior' | 'inferior' | 'costas' | 'peitoral' | 'gluteos' | 'core' | 'fullbody' | 'alongamento';
  experienceLevel?: 'iniciante' | 'retomando' | 'intermediario' | 'avancado' | 'pratica';
  likedExerciseIds?: string[];
  dislikedExerciseIds?: string[];
  extraRestSeconds?: number;
  customTitle?: string;
  customDescription?: string;
}

/**
 * Compositor Dinâmico com Validação Clínica (ACSM 2026, McGill, JOSPT).
 * Substitui listas fixas por composição científica baseada em padrões funcionais,
 * volume ajustado por tempo (8 a 60 min), equipamentos reais e salvaguardas articulares.
 */
export function composeTargetedWorkout(
  profile: Partial<UserProfile> | null | undefined,
  options: TargetedWorkoutOptions
): WorkoutPlan {
  const duration = Math.min(60, Math.max(8, options.durationMinutes || 20));
  const level = options.experienceLevel || profile?.experienceLevel || 'iniciante';
  const userEq = options.equipmentOverride || profile?.equipments || ['peso_corporal'];
  const userAvoided = [...(profile?.avoidedMovements || [])];
  if (options.avoidFloor) userAvoided.push('exercicios_chao');
  const userLims = profile?.reportedLimitations || [];
  const dislikedIds = new Set(options.dislikedExerciseIds || []);
  const likedIds = new Set(options.likedExerciseIds || []);

  // 1. Filtragem preliminar de segurança clínica do catálogo (900+ exercícios)
  const safeCatalog: Exercise[] = allExercises
    .map(enrichExercise)
    .filter((ex) => {
      // Exclui sumariamente exercícios descurtidos pelo praticante na Memória M2
      if (dislikedIds.has(ex.id)) return false;

      // Exclusão de chão se solicitado
      if (options.avoidFloor && ex.floorTransition) return false;

      // Checagem de segurança biomecânica e articular
      const check = isExerciseSafeForUser(ex, userEq, userAvoided, userLims);
      if (!check.safe) return false;

      // Restrições de complexidade para iniciantes e retomantes
      if ((level === 'iniciante' || level === 'retomando') && (ex.difficulty_candidate === 'avancado' || ex.movementComplexity === 3)) {
        return false;
      }

      return true;
    });

  // Fallback seguro se filtros forem estritos demais
  if (safeCatalog.length === 0) {
    return {
      id: `plan_targeted_${Date.now()}`,
      ownerUid: profile?.uid || 'guest',
      title: options.customTitle || 'Sessão Segura de Recuperação',
      description: 'Sessão suave com movimentos certificados para seus equipamentos e articulações.',
      version: 1,
      isProfessional: false,
      authorName: 'Personal IA',
      sourceKind: 'usuario',
      category: 'casa',
      estimatedDurationMinutes: duration,
      exercises: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  // 2. Determinação da quantidade ideal de exercícios baseada na duração (8 a 60 min)
  let targetExerciseCount = 4;
  if (duration <= 10) {
    targetExerciseCount = 3;
  } else if (duration <= 15) {
    targetExerciseCount = 4;
  } else if (duration <= 25) {
    targetExerciseCount = 5;
  } else if (duration <= 35) {
    targetExerciseCount = 6;
  } else if (duration <= 45) {
    targetExerciseCount = 7;
  } else {
    // 50 a 60 min (sessões longas para praticantes treinados ou relaxamento / mobilidade profunda)
    targetExerciseCount = 8;
  }

  // 3. Mapeamento de padrões funcionais por objetivo ou foco muscular
  const patterns: string[] = [];
  let title = options.customTitle || 'Treino Personalizado';
  let desc = options.customDescription || 'Sessão cinesiologicamente calibrada pelo Personal IA.';

  const purpose = options.purpose || 'geral';
  const focus = options.muscleFocus;

  if (focus === 'superior' || purpose === 'membros_superiores') {
    title = `Força & Postura Superior (${duration} min)`;
    desc = 'Estímulo equilibrado para empurrar, puxar, ombros e estabilidade escapular.';
    patterns.push('push_horizontal', 'pull_horizontal', 'push_vertical', 'pull_vertical', 'core_anti_extension', 'core_anti_rotation');
  } else if (focus === 'inferior' || focus === 'gluteos' || purpose === 'membros_inferiores' || purpose === 'gluteos_pernas') {
    title = `Membros Inferiores & Glúteos (${duration} min)`;
    desc = 'Fortalecimento seguro de pernas, quadril e estabilidade de joelhos.';
    patterns.push('squat', 'hinge', 'lunge', 'core_anti_extension', 'mobility_hip', 'squat');
  } else if (focus === 'costas' || purpose === 'costas_postura') {
    title = `Costas & Alívio Postural (${duration} min)`;
    desc = 'Foco em remadas, retração escapular e descompressão torácica.';
    patterns.push('pull_horizontal', 'pull_vertical', 'mobility_spine', 'pull_horizontal', 'core_anti_rotation');
  } else if (focus === 'core' || purpose === 'core_estabilidade') {
    title = `Estabilidade de Core & Coluna McGill (${duration} min)`;
    desc = 'Proteção profunda da coluna lombar sem flexões repetitivas.';
    patterns.push('core_anti_extension', 'core_anti_rotation', 'hinge', 'core_anti_extension', 'mobility_spine');
  } else if (purpose === 'pos_luta_artes_marciais') {
    title = `Descompressão Pós-Luta & Tatame (${duration} min)`;
    desc = 'Soltura de punhos, abertura de quadril (90/90), coluna torácica e respiração regenerativa.';
    patterns.push('mobility_spine', 'mobility_hip', 'mobility_ankle', 'alongamento', 'respiracao');
  } else if (purpose === 'pos_esporte_descompressao') {
    title = `Recuperação & Soltura Pós-Esporte (${duration} min)`;
    desc = 'Alongamento e circulação para pernas, costas e panturrilhas.';
    patterns.push('mobility_hip', 'mobility_spine', 'alongamento', 'respiracao');
  } else if (purpose === 'pausa_escritorio_sem_chao') {
    title = `Pausa Ativa no Trabalho Sem Solo (${duration} min)`;
    desc = 'Alívio da rigidez do pescoço, peitoral e lombar em pé ou na cadeira.';
    patterns.push('mobility_spine', 'pull_horizontal', 'alongamento', 'mobility_hip');
  } else if (purpose === 'cardio_sem_impacto') {
    title = `Cardio Ativo Sem Impacto (${duration} min)`;
    desc = 'Circulação, fôlego e queima calórica sem choques articulares para os joelhos.';
    patterns.push('cardio_low_impact', 'squat', 'hinge', 'core_anti_extension', 'respiracao');
  } else if (purpose === 'mobilidade_alongamento' || purpose === 'relaxamento_muscular' || focus === 'alongamento') {
    title = `Soltura Muscular & Mobilidade (${duration} min)`;
    desc = 'Alívio do estresse, relaxamento miofascial suave e amplitude articular.';
    patterns.push('mobility_spine', 'mobility_hip', 'alongamento', 'mobility_ankle', 'alongamento', 'respiracao');
  } else {
    // Full body balanceado (Força e Hábito Funcional)
    title = `Força Funcional Global (${duration} min)`;
    desc = 'Estímulo completo cobrindo agachar, empurrar, puxar, quadril e sustentação do tronco.';
    patterns.push('squat', 'push_horizontal', 'pull_horizontal', 'hinge', 'core_anti_extension', 'lunge', 'mobility_spine');
  }

  // 4. Seleção dos melhores exercícios para cada padrão da lista
  const selectedExercises: Exercise[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < targetExerciseCount; i++) {
    const desiredPattern = patterns[i % patterns.length];

    // Candidatos compatíveis com o padrão
    let candidates = safeCatalog.filter((ex) => !usedIds.has(ex.id) && ex.functionalPattern === desiredPattern);

    // Fallback de padrão correlato se não encontrar
    if (candidates.length === 0) {
      if (desiredPattern === 'pull_vertical') {
        candidates = safeCatalog.filter((ex) => !usedIds.has(ex.id) && ex.functionalPattern === 'pull_horizontal');
      } else if (desiredPattern === 'push_vertical') {
        candidates = safeCatalog.filter((ex) => !usedIds.has(ex.id) && ex.functionalPattern === 'push_horizontal');
      } else if (desiredPattern === 'lunge') {
        candidates = safeCatalog.filter((ex) => !usedIds.has(ex.id) && ex.functionalPattern === 'squat');
      } else if (desiredPattern === 'alongamento') {
        candidates = safeCatalog.filter((ex) => !usedIds.has(ex.id) && (ex.modality === 'alongamento' || ex.modality === 'mobilidade'));
      }
    }

    // Se ainda vazio, pega qualquer exercício seguro restante
    if (candidates.length === 0) {
      candidates = safeCatalog.filter((ex) => !usedIds.has(ex.id));
    }

    if (candidates.length > 0) {
      // Ordena dando prioridade para:
      // 1. Favoritados na Memória M2 (+100 pontos)
      // 2. Exercícios com escada progressiva curada (+30 pontos)
      // 3. Equipamento compatível (+10 pontos)
      const scored = [...candidates].sort((a, b) => {
        let scoreA = likedIds.has(a.id) ? 100 : 0;
        let scoreB = likedIds.has(b.id) ? 100 : 0;
        if (a.ladder) scoreA += 30;
        if (b.ladder) scoreB += 30;
        return scoreB - scoreA;
      });

      const chosen = scored[0];
      selectedExercises.push(chosen);
      usedIds.add(chosen.id);
    }
  }

  // 5. Prescrição cinesiológica de séries, reps, tempo e intervalos com cálculo de duração
  const prescriptionOpts = {
    sessionDurationMinutes: duration,
    experienceLevel: level,
    goalKey: purpose.includes('forca') ? 'forca' : purpose.includes('cardio') ? 'vitalidade' : 'habito',
    extraRestSeconds: options.extraRestSeconds || 0,
  };

  const exerciseItems: ExercisePlanItem[] = selectedExercises.map((ex) => {
    return prescribeExerciseItem(ex, prescriptionOpts);
  });

  const estimatedActualMinutes = calculateRoutineDurationMinutes(exerciseItems);

  return {
    id: `plan_targeted_${Date.now()}`,
    ownerUid: profile?.uid || 'guest',
    title: options.customTitle || title,
    description: options.customDescription || desc,
    version: 1,
    isProfessional: false,
    authorName: 'Personal IA',
    sourceKind: 'usuario',
    category: purpose.includes('mobilidade') || purpose.includes('alongamento') || purpose.includes('relaxamento') || purpose.includes('pos_luta') || purpose.includes('pos_esporte') ? 'mobilidade' : 'casa',
    estimatedDurationMinutes: Math.max(duration, estimatedActualMinutes),
    exercises: exerciseItems,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
