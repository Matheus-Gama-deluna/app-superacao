import { essentialProgramExercises } from './essentialProgramExercises';
import { useState, useEffect } from 'react';
import exercisesSeedJson from '../../data/exercicios_seed.json';
import templatesJson from '../../data/templates_seed.json';
import { Exercise, WorkoutPlan } from '../types';
import { specializedHomeExercises } from './specializedExercises';

// Exercícios dedicados de Recuperação Ativa (Mobilidade & Alongamento)
export const specializedRecoveryExercises: Exercise[] = [
  {
    id: 'mob_gato_vaca',
    name_pt: 'Gato e Vaca (Mobilidade da Coluna)',
    name_en: 'Cat-Cow Stretch',
    modality: 'mobilidade',
    movement_pattern: 'mobilidade_coluna',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'reps',
    requires_anchor: false,
    instructions_pt: 'Em quatro apoios, alterne suavemente entre arquear as costas para cima (expirando) e descer a barriga olhando à frente (inspirando).',
    caution_pt: 'Movimento lento e suave, sem forçar o pescoço.',
    review_status: 'revisado_mobilidade',
    media_url: null,
    images: [
      '/exercises/Cat_Stretch/0.jpg',
      '/exercises/Cat_Stretch/1.jpg',
    ],
    target_muscle: 'Coluna e Costas',
    primary_muscles: ['Coluna vertebral', 'Eretores da espinha'],
    secondary_muscles: ['Abdômen & Core', 'Pescoço'],
    steps_pt: [
      'Posicione-se em quatro apoios, mãos abaixo dos ombros e joelhos abaixo dos quadris.',
      'Inspire e afunde a coluna em direção ao chão, elevando o peito e o olhar (Vaca).',
      'Expire e curve a coluna para cima em direção ao teto, recolhendo o queixo ao peito (Gato).',
      'Mantenha a fluidez respiratória sem pressa por 8 a 10 ciclos.',
    ],
  },
  {
    id: 'along_abertura_quadril',
    name_pt: 'Alongamento em 90/90 para Quadril',
    name_en: '90/90 Hip Mobility',
    modality: 'mobilidade',
    movement_pattern: 'mobilidade_quadril',
    equipment: ['peso_corporal'],
    environment: ['casa', 'ar_livre'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    instructions_pt: 'Sentado no chão, posicione as pernas em ângulos de 90 graus. Incline suavemente o tronco à frente para soltar os quadris.',
    caution_pt: 'Respeite a amplitude confortável dos seus joelhos.',
    review_status: 'revisado_mobilidade',
    media_url: null,
    images: [
      '/exercises/IT_Band_and_Glute_Stretch/0.jpg',
      '/exercises/IT_Band_and_Glute_Stretch/1.jpg',
    ],
    target_muscle: 'Quadris e Glúteos',
    primary_muscles: ['Rotadores de quadril', 'Glúteo médio'],
    secondary_muscles: ['Lombar'],
    steps_pt: [
      'Sente-se no colchonete e posicione a perna da frente em 90 graus e a de trás também em 90 graus.',
      'Mantenha a coluna ereta e incline o tronco ligeiramente sobre a coxa dianteira.',
      'Respire fundo e sustente o alongamento por 30 a 45 segundos em cada lado.',
    ],
  },
  {
    id: 'along_crianca_lombar',
    name_pt: 'Postura da Criança (Descompressão Lombar)',
    name_en: "Child's Pose",
    modality: 'alongamento',
    movement_pattern: 'descompressao_lombar',
    equipment: ['peso_corporal'],
    environment: ['casa'],
    difficulty_candidate: 'iniciante',
    tracking: 'time',
    requires_anchor: false,
    instructions_pt: 'Ajoelhe-se, sente sobre os calcanhares e deslize os braços à frente no chão, relaxando o peito e a testa.',
    caution_pt: 'Respeite a sensibilidade dos joelhos e quadris.',
    review_status: 'revisado_alongamento',
    media_url: null,
    images: [
      '/exercises/Childs_Pose/0.jpg',
      '/exercises/Childs_Pose/1.jpg',
    ],
    target_muscle: 'Lombar e Costas',
    primary_muscles: ['Lombar', 'Costas & Romboides'],
    secondary_muscles: ['Quadris'],
    steps_pt: [
      'Ajoelhe-se no colchonete com os dedões dos pés juntos e joelhos confortavelmente afastados.',
      'Sente sobre os calcanhares e estenda os braços à frente no chão.',
      'Apoie a testa suavemente e respire fundo sentindo a lombar descomprimir.',
    ],
  },
];

export function normalizeFullCatalogItem(item: any): Exercise {
  let eq: string[] = Array.isArray(item.equipment) ? [...item.equipment] : ['peso_corporal'];

  const namePt = item.name_pt || item.name_en || '';
  const nameLower = (namePt + ' ' + (item.name_en || '') + ' ' + (item.instructions_pt || '')).toLowerCase();

  if (nameLower.includes('halter') && !eq.includes('halteres')) {
    eq = eq.filter((e) => e !== 'kettlebell' && e !== 'peso_corporal');
    eq.push('halteres');
  }

  const isMiniBand =
    nameLower.includes('mini band') ||
    nameLower.includes('miniband') ||
    nameLower.includes('faixa circular') ||
    nameLower.includes('glute band') ||
    nameLower.includes('monster walk') ||
    item.id?.includes('mini_band') ||
    ((eq.includes('elasticos') || eq.includes('band')) &&
      (nameLower.includes('abdu') || nameLower.includes('quadril') || nameLower.includes('glute') || nameLower.includes('lateral')));

  const isTubos =
    nameLower.includes('tubo') ||
    nameLower.includes('pegador') ||
    nameLower.includes('tubular');

  const isFaixaLonga =
    nameLower.includes('faixa longa') ||
    nameLower.includes('super band') ||
    nameLower.includes('superband') ||
    nameLower.includes('banda longa') ||
    nameLower.includes('resistencia longa') ||
    ((nameLower.includes('elástico') || nameLower.includes('elastico') || nameLower.includes('band') || eq.includes('band') || eq.includes('elasticos')) &&
      !isMiniBand &&
      !isTubos);

  if (isMiniBand && !eq.includes('mini_band')) eq.push('mini_band');
  if (isFaixaLonga && !eq.includes('faixa_longa')) eq.push('faixa_longa');
  if (isTubos && !eq.includes('tubos_elasticos')) eq.push('tubos_elasticos');

  const isPullUpBar =
    item.id === 'wind_sprints' ||
    nameLower.includes('barra suspensa') ||
    nameLower.includes('barra fixa') ||
    nameLower.includes('pull-up') ||
    nameLower.includes('pullup') ||
    nameLower.includes('chin-up') ||
    nameLower.includes('chinup') ||
    nameLower.includes('scapular pull') ||
    nameLower.includes('hanging leg') ||
    nameLower.includes('pendure-se');

  const requiresSupports: string[] = [];
  if (isPullUpBar) {
    if (!eq.includes('barra_fixa')) eq.push('barra_fixa');
    requiresSupports.push('barra_fixa');
  }

  const isParallelBars =
    nameLower.includes('paralela') ||
    nameLower.includes('parallel bar') ||
    nameLower.includes('dip bar');
  if (isParallelBars) {
    if (!eq.includes('paralelas')) eq.push('paralelas');
    requiresSupports.push('paralelas');
  }

  if (nameLower.includes('banco') || nameLower.includes('bench')) {
    if (!eq.includes('banco')) eq.push('banco');
    requiresSupports.push('banco');
  }
  if (nameLower.includes('cadeira') || nameLower.includes('chair')) {
    if (!eq.includes('cadeira')) eq.push('cadeira');
    requiresSupports.push('cadeira');
  }
  if (nameLower.includes('parede') || nameLower.includes('wall')) {
    if (!eq.includes('parede')) eq.push('parede');
    requiresSupports.push('parede');
  }

  let cleanNamePt = namePt;
  if (item.id === 'wind_sprints') {
    cleanNamePt = 'Elevação de Joelhos na Barra Suspensa (Wind Sprints)';
  } else if (item.id === 'pullups') {
    cleanNamePt = 'Barra Fixa Clássica';
  } else if (item.id === 'chin-up') {
    cleanNamePt = 'Barra Fixa com Pegada Supinada';
  } else if (item.id === 'scapular_pull-up') {
    cleanNamePt = 'Elevação Escapular na Barra Fixa';
  }

  let cleanInstructions = (item.instructions_pt || '')
    .replace(/Amasse o mais alto que puder/gi, 'Eleve o tronco na amplitude máxima confortável')
    .replace(/Amasse o tronco/gi, 'Eleve e flexione suavemente o tronco');

  let cleanSteps = (item.steps_pt || [cleanInstructions || 'Movimento com controle e ritmo.']).map((s: string) =>
    s.replace(/Amasse o mais alto que puder/gi, 'Eleve o tronco na amplitude máxima confortável')
     .replace(/Amasse o tronco/gi, 'Eleve e flexione suavemente o tronco')
  );

  const isCurated =
    item.review_status === 'catalogo_publico_verificado' ||
    item.review_status === 'revisado' ||
    item.source_kind === 'free_exercise_db_public_domain';

  return {
    id: item.id,
    name_pt: cleanNamePt,
    name_en: item.name_en,
    modality: item.modality || 'forca',
    movement_pattern: item.movement_pattern || 'funcional',
    equipment: eq,
    environment: item.environment || ['casa'],
    difficulty_candidate: item.difficulty_candidate || 'iniciante',
    tracking: item.tracking || 'reps',
    requires_anchor: isPullUpBar || Boolean(item.requires_anchor),
    requires_supports: requiresSupports,
    is_curated_for_auto_proposal: isCurated,
    instructions_pt: cleanInstructions,
    caution_pt: item.caution_pt || 'Execute com postura controlada e respiração fluida.',
    review_status: item.review_status || 'catalogo_publico_verificado',
    media_url: item.media_url,
    images: item.images || [],
    target_muscle: item.target_muscle || 'Corpo Todo',
    primary_muscles: item.primary_muscles || [item.target_muscle || 'Corpo Todo'],
    secondary_muscles: item.secondary_muscles || [],
    steps_pt: cleanSteps,
    source_kind: item.source_kind || 'free_exercise_db_public_domain',
    version: item.version || '1.0.0',
  };
}

// Mescla garantindo que exercícios essenciais estejam disponíveis no milissegundo zero (Camada 1 Instantânea)
const exerciseIdSet = new Set<string>();
export const allExercises: Exercise[] = [];

// 1. Exercícios especializados de recuperação ativa
specializedRecoveryExercises.forEach((ex) => {
  if (!exerciseIdSet.has(ex.id)) {
    exerciseIdSet.add(ex.id);
    allExercises.push(ex);
  }
});

// 2. Exercícios especializados de puxar, costas e fortalecimento em casa
specializedHomeExercises.forEach((ex) => {
  if (!exerciseIdSet.has(ex.id)) {
    exerciseIdSet.add(ex.id);
    allExercises.push(ex);
  }
});

// 3. Exercícios essenciais dos programas e fichas oficiais
essentialProgramExercises.forEach((ex) => {
  if (!exerciseIdSet.has(ex.id)) {
    exerciseIdSet.add(ex.id);
    allExercises.push(ex);
  }
});

// 4. Mecanismo de Carregamento Assíncrono Sob Demanda da Enciclopédia Completa (Camada 2)
let isFullCatalogLoaded = false;
let fullCatalogPromise: Promise<Exercise[]> | null = null;
const catalogListeners = new Set<() => void>();

export function isFullCatalogReady(): boolean {
  return isFullCatalogLoaded;
}

export async function ensureFullCatalogLoaded(): Promise<Exercise[]> {
  if (isFullCatalogLoaded) return allExercises;
  if (fullCatalogPromise) return fullCatalogPromise;

  fullCatalogPromise = (async () => {
    try {
      const mod = await import('../../data/catalog_full_pt.json');
      const rawList: any[] = mod.default || mod;
      for (const item of rawList) {
        if (!exerciseIdSet.has(item.id)) {
          const normalized = normalizeFullCatalogItem(item);
          exerciseIdSet.add(normalized.id);
          allExercises.push(normalized);
        }
      }
      isFullCatalogLoaded = true;
      catalogListeners.forEach((fn) => fn());
      return allExercises;
    } catch (err) {
      console.warn('Erro ao carregar catálogo completo sob demanda:', err);
      return allExercises;
    }
  })();

  return fullCatalogPromise;
}

export function useFullCatalog(): { isReady: boolean; totalCount: number } {
  const [ready, setReady] = useState<boolean>(isFullCatalogLoaded);
  useEffect(() => {
    if (isFullCatalogLoaded) {
      setReady(true);
      return;
    }
    const listener = () => setReady(true);
    catalogListeners.add(listener);
    void ensureFullCatalogLoaded();
    return () => {
      catalogListeners.delete(listener);
    };
  }, []);
  return { isReady: ready, totalCount: allExercises.length };
}

// Templates Seed do projeto oficial com etiqueta explícita de "modelo demonstrativo" (A17)
export const rawTemplates: WorkoutPlan[] = (templatesJson as any[]).map((t, idx) => {
  return {
    id: t.id || `template_seed_${idx}`,
    ownerUid: 'system_seed',
    title: t.name_pt || t.title_pt || t.title || 'Treino Modelo',
    description: t.note || t.description_pt || t.description || 'Modelo demonstrativo para referência e adaptação pessoal.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Demonstrativo)',
    sourceKind: 'modelo_demonstracao',
    reviewStatus: 'demonstrativo',
    isTemplate: true,
    estimatedDurationMinutes: t.estimated_minutes_example || t.estimated_duration_minutes || 20,
    category: t.environment === 'rua' ? 'caminhada' : t.modality === 'mobilidade' ? 'mobilidade' : (t.category || 'casa'),
    exercises: (t.items || []).map((item: any) => {
      const ex = allExercises.find((e) => e.id === item.exercise_id);
      return {
        exerciseId: item.exercise_id,
        exerciseName: ex ? ex.name_pt : item.exercise_id,
        targetSets: item.sets || item.target_sets || 3,
        targetReps: item.target_reps_example || item.target_reps || 10,
        targetDurationSeconds: item.target_duration_seconds || (item.tracking === 'time' ? 30 : undefined),
        restSeconds: item.rest_seconds || 45,
        notes: item.notes || '',
      };
    }),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
});

// Templates Verificados de Alta Qualidade construídos com os 876 exercícios reais do catálogo
export const verifiedTemplates: WorkoutPlan[] = [
  {
    id: 'template_forca_corpo_todo_casa',
    ownerUid: 'system_verified',
    title: 'Corpo Inteiro Essencial (Sem Equipamentos)',
    description: 'Rotina equilibrada de 20 minutos com os 4 pilares do treino funcional: agachar, empurrar, ponte de glúteos e estabilidade de core.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Curadoria)',
    isTemplate: true,
    category: 'casa',
    estimatedDurationMinutes: 20,
    exercises: [
      {
        exerciseId: 'bodyweight_squat',
        exerciseName: 'Agachamento Livre com Peso Corporal',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 60,
        notes: 'Pés na largura dos ombros, descida controlada',
      },
      {
        exerciseId: 'pushups',
        exerciseName: 'Flexão de Braços no Solo',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 60,
        notes: 'Mantenha o corpo em linha reta e abdômen firme',
      },
      {
        exerciseId: 'butt_lift_bridge',
        exerciseName: 'Ponte de Glúteos no Solo',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 45,
        notes: 'Aperte os glúteos no topo por 1 segundo',
      },
      {
        exerciseId: 'plank',
        exerciseName: 'Prancha Abdominal Isométrica',
        targetSets: 3,
        targetReps: 0,
        targetDurationSeconds: 35,
        restSeconds: 45,
        notes: 'Não prenda a respiração',
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template_halteres_superior',
    ownerUid: 'system_verified',
    title: 'Força Superior com Halteres',
    description: 'Trabalho completo de peitoral, costas, ombros e braços para desenvolver postura e força.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Curadoria)',
    isTemplate: true,
    category: 'academia',
    estimatedDurationMinutes: 28,
    exercises: [
      {
        exerciseId: 'dumbbell_bench_press',
        exerciseName: 'Supino Reto com Halteres',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 60,
      },
      {
        exerciseId: 'one-arm_dumbbell_row',
        exerciseName: 'Remada Unilateral com Halter (Serrote)',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 60,
      },
      {
        exerciseId: 'dumbbell_shoulder_press',
        exerciseName: 'Desenvolvimento de Ombros com Halteres',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 60,
      },
      {
        exerciseId: 'alternate_hammer_curl',
        exerciseName: 'Rosca Martelo Alternada com Halteres',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 45,
      },
      {
        exerciseId: 'bench_dips',
        exerciseName: 'Mergulho no Banco para Tríceps',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 45,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template_elasticos_funcional',
    ownerUid: 'system_verified',
    title: 'Força Funcional com Faixas Elásticas',
    description: 'Treino de resistência progressiva com elásticos, ideal para casa, viagens ou reabilitação articular.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Curadoria)',
    isTemplate: true,
    category: 'casa',
    estimatedDurationMinutes: 22,
    exercises: [
      {
        exerciseId: 'band_pull_apart',
        exerciseName: 'Abertura de Escápulas com Faixa Elástica (Band Pull-Apart)',
        targetSets: 3,
        targetReps: 15,
        restSeconds: 45,
      },
      {
        exerciseId: 'band_alternating_biceps_curl',
        exerciseName: 'Rosca Bíceps Alternada com Elástico',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 45,
      },
      {
        exerciseId: 'clam',
        exerciseName: 'Clamshell (Ostra para Ativação de Glúteo Médio)',
        targetSets: 3,
        targetReps: 15,
        restSeconds: 30,
      },
      {
        exerciseId: 'bodyweight_squat',
        exerciseName: 'Agachamento com Peso Corporal',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 45,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];


// Rotinas curtas de Recuperação Ativa (Descanso Ativo) pré-configuradas para os dias de pausa de força
export const activeRecoveryTemplates: WorkoutPlan[] = [
  {
    id: 'template_recuperacao_quadril_lombar',
    ownerUid: 'system_recovery',
    title: 'Recuperação Ativa: Quadril e Coluna',
    description: 'Rotina suave de 8 minutos para soltar a musculatura, aliviar a lombar e manter a circulação sem desgaste.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Recuperação)',
    isTemplate: true,
    category: 'mobilidade',
    estimatedDurationMinutes: 8,
    exercises: [
      {
        exerciseId: 'mob_gato_vaca',
        exerciseName: 'Gato e Vaca (Mobilidade da Coluna)',
        targetSets: 2,
        targetReps: 10,
        restSeconds: 30,
        notes: 'Respire fundo a cada transição',
      },
      {
        exerciseId: 'along_abertura_quadril',
        exerciseName: 'Alongamento em 90/90 para Quadril',
        targetSets: 2,
        targetReps: 0,
        targetDurationSeconds: 40,
        restSeconds: 30,
        notes: '40 segundos cada lado',
      },
      {
        exerciseId: 'along_crianca_lombar',
        exerciseName: 'Postura da Criança (Descompressão Lombar)',
        targetSets: 2,
        targetReps: 0,
        targetDurationSeconds: 45,
        restSeconds: 30,
        notes: 'Relaxamento profundo da lombar',
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'template_recuperacao_tronco_ombros',
    ownerUid: 'system_recovery',
    title: 'Recuperação Ativa: Postura e Ombros',
    description: 'Descompressão para quem trabalha sentado: alívio do peitoral, pescoço e respiração revigorante.',
    version: 1,
    isProfessional: false,
    authorName: 'Superação (Recuperação)',
    isTemplate: true,
    category: 'mobilidade',
    estimatedDurationMinutes: 6,
    exercises: [
      {
        exerciseId: 'mob_gato_vaca',
        exerciseName: 'Gato e Vaca (Mobilidade da Coluna)',
        targetSets: 2,
        targetReps: 8,
        restSeconds: 25,
      },
      {
        exerciseId: 'along_crianca_lombar',
        exerciseName: 'Postura da Criança (Descompressão Lombar)',
        targetSets: 2,
        targetReps: 0,
        targetDurationSeconds: 40,
        restSeconds: 20,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

import { premadeWorkouts } from './premadeWorkouts';

export const allTemplates: WorkoutPlan[] = [
  ...premadeWorkouts,
  ...verifiedTemplates,
  ...activeRecoveryTemplates,
  ...rawTemplates,
];

// Helper de normalização sem acentos para busca flexível
export const normalizeText = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

// Helpers de busca flexível e multifiltro (A09, A10)
export function searchExercises(

  query: string,
  filterEquipment?: string,
  filterMuscle?: string,
  filterModality?: string
): Exercise[] {
  const cleanQ = normalizeText(query);
  const isMiniBandSearch = cleanQ.includes('mini band') || cleanQ.includes('miniband') || cleanQ === 'band';

  return allExercises.filter((ex) => {
    // 1. Busca por texto (nome PT, nome EN, músculo, equipamento, padrão)
    if (cleanQ) {
      const matchName = normalizeText(ex.name_pt).includes(cleanQ);
      const matchNameEn = normalizeText(ex.name_en || '').includes(cleanQ);
      const matchMuscle = normalizeText(ex.target_muscle || '').includes(cleanQ);
      const matchPrimary = (ex.primary_muscles || []).some((m) => normalizeText(m).includes(cleanQ));
      const matchSecondary = (ex.secondary_muscles || []).some((m) => normalizeText(m).includes(cleanQ));
      const matchEquipment = ex.equipment.some((eq) => normalizeText(eq).includes(cleanQ));
      const matchMiniBand = isMiniBandSearch && (ex.equipment.includes('mini_band') || ex.id.includes('mini_band'));

      if (!matchName && !matchNameEn && !matchMuscle && !matchPrimary && !matchSecondary && !matchEquipment && !matchMiniBand) {
        return false;
      }
    }

    // 2. Filtro de Equipamento
    if (filterEquipment && filterEquipment !== 'todos') {
      if (filterEquipment === 'peso_corporal') {
        const matchesBodyweight = ex.equipment.includes('peso_corporal') || ex.equipment.includes('nenhum');
        if (!matchesBodyweight) return false;
      } else if (!ex.equipment.includes(filterEquipment)) {
        return false;
      }
    }

    // 3. Filtro de Músculo / Região
    if (filterMuscle && filterMuscle !== 'todos') {
      const target = normalizeText(ex.target_muscle || '');
      const pMuscles = (ex.primary_muscles || []).map((m) => normalizeText(m));
      const fClean = normalizeText(filterMuscle);

      const matchesMuscle = target.includes(fClean) || pMuscles.some((m) => m.includes(fClean));
      if (!matchesMuscle) return false;
    }

    // 4. Filtro de Modalidade
    if (filterModality && filterModality !== 'todas') {
      if (ex.modality !== filterModality) return false;
    }

    return true;
  });
}

export function getExerciseById(id: string): Exercise | undefined {
  return allExercises.find((e) => e.id === id);
}
