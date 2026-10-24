import fs from 'fs';

const full = JSON.parse(fs.readFileSync('data/catalog_full_pt.json', 'utf8'));
const fullMap = new Map(full.map(x => [x.id, x]));

const targetIds = [
  "bodyweight_squat",
  "plank",
  "butt_lift_bridge",
  "incline_push-up",
  "pelvic_tilt_into_bridge",
  "crunches",
  "single_leg_glute_bridge",
  "pushups",
  "mountain_climbers",
  "split_squats",
  "bench_dips",
  "reverse_crunch",
  "dumbbell_bench_press",
  "barbell_shoulder_press",
  "bent_over_barbell_row",
  "close-grip_front_lat_pulldown",
  "alternate_hammer_curl",
  "barbell_curl",
  "barbell_squat",
  "romanian_deadlift",
  "barbell_glute_bridge",
  "band_pull_apart"
];

function normalizeItem(item) {
  let eq = Array.isArray(item.equipment) ? [...item.equipment] : ['peso_corporal'];
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

  const requiresSupports = [];
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
  if (item.id === 'pullups') cleanNamePt = 'Barra Fixa Clássica';
  else if (item.id === 'chin-up') cleanNamePt = 'Barra Fixa com Pegada Supinada';
  else if (item.id === 'scapular_pull-up') cleanNamePt = 'Elevação Escapular na Barra Fixa';

  let cleanInstructions = (item.instructions_pt || '')
    .replace(/Amasse o mais alto que puder/gi, 'Eleve o tronco na amplitude máxima confortável')
    .replace(/Amasse o tronco/gi, 'Eleve e flexione suavemente o tronco');

  let cleanSteps = (item.steps_pt || [cleanInstructions || 'Movimento com controle e ritmo.']).map((s) =>
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
    media_url: item.media_url || null,
    images: item.images || [],
    target_muscle: item.target_muscle || 'Corpo Todo',
    primary_muscles: item.primary_muscles || [item.target_muscle || 'Corpo Todo'],
    secondary_muscles: item.secondary_muscles || [],
    steps_pt: cleanSteps,
    source_kind: item.source_kind || 'free_exercise_db_public_domain',
    version: item.version || '1.0.0',
  };
}

const essentialItems = targetIds.map(id => {
  const raw = fullMap.get(id);
  if (!raw) throw new Error('Not found: ' + id);
  return normalizeItem(raw);
});

const fileContent = `import { Exercise } from '../types';

// 22 Exercícios Essenciais pré-carregados das fichas e programas oficiais
export const essentialProgramExercises: Exercise[] = ${JSON.stringify(essentialItems, null, 2)};
`;

fs.writeFileSync('src/data/essentialProgramExercises.ts', fileContent, 'utf8');
console.log('Successfully wrote src/data/essentialProgramExercises.ts with', essentialItems.length, 'exercises.');
