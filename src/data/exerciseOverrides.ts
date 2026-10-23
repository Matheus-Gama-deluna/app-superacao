import { FunctionalMovementPattern, JointStressRating, MovementLadderStep } from '../types';

export interface ExerciseMetadataOverride {
  functionalPattern: FunctionalMovementPattern;
  jointStress: JointStressRating;
  floorTransition: boolean;
  movementComplexity: 1 | 2 | 3;
  ladder?: MovementLadderStep;
}

/**
 * Tabela de anotações curadas para os exercícios mais frequentes do catálogo.
 * Transforma termos vagos em dados estruturados estritos.
 */
export const EXERCISE_METADATA_OVERRIDES: Record<string, ExerciseMetadataOverride> = {
  // ─── ESCADA DE EMPURRAR (PUSH) ──────────────────────────────
  flexao_parede: {
    functionalPattern: 'push_horizontal',
    jointStress: { knee: 0, lumbar: 0, shoulder: 0, wrist: 1 },
    floorTransition: false,
    movementComplexity: 1,
    ladder: { ladderId: 'pushup', stepIndex: 1, name: 'Flexão na Parede' },
  },
  wall_pushup_controlled: {
    functionalPattern: 'push_horizontal',
    jointStress: { knee: 0, lumbar: 0, shoulder: 0, wrist: 1 },
    floorTransition: false,
    movementComplexity: 1,
    ladder: { ladderId: 'pushup', stepIndex: 1, name: 'Flexão na Parede' },
  },
  'incline_push-up': {
    functionalPattern: 'push_horizontal',
    jointStress: { knee: 0, lumbar: 0, shoulder: 1, wrist: 1 },
    floorTransition: false,
    movementComplexity: 1,
    ladder: { ladderId: 'pushup', stepIndex: 2, name: 'Flexão Inclinada na Cadeira/Banco' },
  },
  incline_pushup: {
    functionalPattern: 'push_horizontal',
    jointStress: { knee: 0, lumbar: 0, shoulder: 1, wrist: 1 },
    floorTransition: false,
    movementComplexity: 1,
    ladder: { ladderId: 'pushup', stepIndex: 2, name: 'Flexão Inclinada na Cadeira/Banco' },
  },
  kneeling_pushup: {
    functionalPattern: 'push_horizontal',
    jointStress: { knee: 0, lumbar: 0, shoulder: 1, wrist: 1 },
    floorTransition: true,
    movementComplexity: 1,
    ladder: { ladderId: 'pushup', stepIndex: 3, name: 'Flexão com Joelhos Apoiados' },
  },
  'push-up': {
    functionalPattern: 'push_horizontal',
    jointStress: { knee: 0, lumbar: 1, shoulder: 1, wrist: 2 },
    floorTransition: true,
    movementComplexity: 2,
    ladder: { ladderId: 'pushup', stepIndex: 4, name: 'Flexão Tradicional no Solo' },
  },
  push_up: {
    functionalPattern: 'push_horizontal',
    jointStress: { knee: 0, lumbar: 1, shoulder: 1, wrist: 2 },
    floorTransition: true,
    movementComplexity: 2,
    ladder: { ladderId: 'pushup', stepIndex: 4, name: 'Flexão Tradicional no Solo' },
  },

  // ─── ESCADA DE PERNAS / AGACHAR (SQUAT) ─────────────────────
  chair_sit_to_stand_cross_arms: {
    functionalPattern: 'squat',
    jointStress: { knee: 1, lumbar: 0, shoulder: 0, wrist: 0 },
    floorTransition: false,
    movementComplexity: 1,
    ladder: { ladderId: 'squat', stepIndex: 1, name: 'Sentar e Levantar da Cadeira' },
  },
  bodyweight_squat: {
    functionalPattern: 'squat',
    jointStress: { knee: 1, lumbar: 1, shoulder: 0, wrist: 0 },
    floorTransition: false,
    movementComplexity: 1,
    ladder: { ladderId: 'squat', stepIndex: 2, name: 'Agachamento Livre' },
  },
  agachamento_livre: {
    functionalPattern: 'squat',
    jointStress: { knee: 1, lumbar: 1, shoulder: 0, wrist: 0 },
    floorTransition: false,
    movementComplexity: 1,
    ladder: { ladderId: 'squat', stepIndex: 2, name: 'Agachamento Livre' },
  },
  band_squat: {
    functionalPattern: 'squat',
    jointStress: { knee: 1, lumbar: 1, shoulder: 0, wrist: 0 },
    floorTransition: false,
    movementComplexity: 1,
    ladder: { ladderId: 'squat', stepIndex: 3, name: 'Agachamento com Faixa Elástica' },
  },
  goblet_squat_dumbbell: {
    functionalPattern: 'squat',
    jointStress: { knee: 1, lumbar: 1, shoulder: 0, wrist: 1 },
    floorTransition: false,
    movementComplexity: 2,
    ladder: { ladderId: 'squat', stepIndex: 4, name: 'Agachamento Goblet com Halter' },
  },

  // ─── AFUNDOS / LUNGES (UNILATERAL) ──────────────────────────
  stationary_lunge: {
    functionalPattern: 'lunge',
    jointStress: { knee: 1, lumbar: 0, shoulder: 0, wrist: 0 },
    floorTransition: false,
    movementComplexity: 2,
    ladder: { ladderId: 'lunge', stepIndex: 1, name: 'Afundo Estático' },
  },
  bodyweight_walking_lunge: {
    functionalPattern: 'lunge',
    jointStress: { knee: 2, lumbar: 1, shoulder: 0, wrist: 0 },
    floorTransition: false,
    movementComplexity: 2,
    ladder: { ladderId: 'lunge', stepIndex: 2, name: 'Avanço / Passada' },
  },

  // ─── ESCADA DE PUXAR (ROW / PULL) ───────────────────────────
  standing_scapular_y_t_w: {
    functionalPattern: 'pull_horizontal',
    jointStress: { knee: 0, lumbar: 0, shoulder: 0, wrist: 0 },
    floorTransition: false,
    movementComplexity: 1,
    ladder: { ladderId: 'row', stepIndex: 1, name: 'Y-T-W Escapular em Pé' },
  },
  door_towel_row: {
    functionalPattern: 'pull_horizontal',
    jointStress: { knee: 0, lumbar: 0, shoulder: 1, wrist: 0 },
    floorTransition: false,
    movementComplexity: 1,
    ladder: { ladderId: 'row', stepIndex: 2, name: 'Remada com Toalha na Porta' },
  },
  band_pull_apart: {
    functionalPattern: 'pull_horizontal',
    jointStress: { knee: 0, lumbar: 0, shoulder: 0, wrist: 0 },
    floorTransition: false,
    movementComplexity: 1,
    ladder: { ladderId: 'row', stepIndex: 3, name: 'Crucifixo Invertido com Elástico' },
  },
  table_inverted_row: {
    functionalPattern: 'pull_horizontal',
    jointStress: { knee: 0, lumbar: 0, shoulder: 1, wrist: 1 },
    floorTransition: true,
    movementComplexity: 2,
    ladder: { ladderId: 'row', stepIndex: 4, name: 'Remada Invertida na Mesa' },
  },
  floor_towel_lat_pulldown: {
    functionalPattern: 'pull_vertical',
    jointStress: { knee: 0, lumbar: 1, shoulder: 1, wrist: 0 },
    floorTransition: true,
    movementComplexity: 1,
  },
  prone_w_extension: {
    functionalPattern: 'pull_horizontal',
    jointStress: { knee: 0, lumbar: 0, shoulder: 1, wrist: 0 },
    floorTransition: true,
    movementComplexity: 1,
  },

  // ─── ESCADA DE DOBRADIÇA / CADEIA POSTERIOR (GLUTE_BRIDGE / HINGE) ───
  glute_bridge: {
    functionalPattern: 'hinge',
    jointStress: { knee: 0, lumbar: 0, shoulder: 0, wrist: 0 },
    floorTransition: true,
    movementComplexity: 1,
    ladder: { ladderId: 'glute_bridge', stepIndex: 1, name: 'Ponte de Glúteo no Solo' },
  },
  superman_hold: {
    functionalPattern: 'hinge',
    jointStress: { knee: 0, lumbar: 1, shoulder: 1, wrist: 0 },
    floorTransition: true,
    movementComplexity: 1,
    ladder: { ladderId: 'glute_bridge', stepIndex: 1, name: 'Extensão Posterior Solo' },
  },
  band_glute_bridge: {
    functionalPattern: 'hinge',
    jointStress: { knee: 0, lumbar: 0, shoulder: 0, wrist: 0 },
    floorTransition: true,
    movementComplexity: 1,
    ladder: { ladderId: 'glute_bridge', stepIndex: 2, name: 'Ponte de Glúteo com Elástico' },
  },
  hamstring_bridge_walkout: {
    functionalPattern: 'hinge',
    jointStress: { knee: 0, lumbar: 0, shoulder: 0, wrist: 0 },
    floorTransition: true,
    movementComplexity: 1,
    ladder: { ladderId: 'glute_bridge', stepIndex: 2, name: 'Ponte Posterior Dinâmica' },
  },
  single_leg_glute_bridge: {
    functionalPattern: 'hinge',
    jointStress: { knee: 0, lumbar: 0, shoulder: 0, wrist: 0 },
    floorTransition: true,
    movementComplexity: 2,
    ladder: { ladderId: 'glute_bridge', stepIndex: 3, name: 'Ponte Unilateral' },
  },
  glute_bridge_dumbbell: {
    functionalPattern: 'hinge',
    jointStress: { knee: 0, lumbar: 1, shoulder: 0, wrist: 0 },
    floorTransition: true,
    movementComplexity: 2,
    ladder: { ladderId: 'glute_bridge', stepIndex: 4, name: 'Elevação Pélvica com Halter' },
  },

  // ─── CORE & ESTABILIDADE (PLANK / MC GILL) ───────────────────
  bird_dog_hold: {
    functionalPattern: 'core_anti_rotation',
    jointStress: { knee: 0, lumbar: 0, shoulder: 0, wrist: 1 },
    floorTransition: true,
    movementComplexity: 1,
    ladder: { ladderId: 'plank', stepIndex: 1, name: 'Perdigueiro de Estabilização' },
  },
  plank: {
    functionalPattern: 'core_anti_extension',
    jointStress: { knee: 0, lumbar: 1, shoulder: 1, wrist: 0 },
    floorTransition: true,
    movementComplexity: 1,
    ladder: { ladderId: 'plank', stepIndex: 2, name: 'Prancha Frontal' },
  },
  plank_shoulder_tap: {
    functionalPattern: 'core_anti_rotation',
    jointStress: { knee: 0, lumbar: 1, shoulder: 1, wrist: 1 },
    floorTransition: true,
    movementComplexity: 2,
    ladder: { ladderId: 'plank', stepIndex: 3, name: 'Prancha com Toque no Ombro' },
  },
  side_plank: {
    functionalPattern: 'core_anti_rotation',
    jointStress: { knee: 0, lumbar: 0, shoulder: 1, wrist: 0 },
    floorTransition: true,
    movementComplexity: 2,
    ladder: { ladderId: 'plank', stepIndex: 4, name: 'Prancha Lateral' },
  },
  dead_bug: {
    functionalPattern: 'core_anti_extension',
    jointStress: { knee: 0, lumbar: 0, shoulder: 0, wrist: 0 },
    floorTransition: true,
    movementComplexity: 1,
  },
  reverse_plank_bridge: {
    functionalPattern: 'core_anti_extension',
    jointStress: { knee: 0, lumbar: 0, shoulder: 1, wrist: 0 },
    floorTransition: true,
    movementComplexity: 2,
  },

  // ─── MOBILIDADE E RECUPERAÇÃO ────────────────────────────────
  mob_gato_vaca: {
    functionalPattern: 'mobility_spine',
    jointStress: { knee: 0, lumbar: 0, shoulder: 0, wrist: 1 },
    floorTransition: true,
    movementComplexity: 1,
  },
  along_abertura_quadril: {
    functionalPattern: 'mobility_hip',
    jointStress: { knee: 1, lumbar: 0, shoulder: 0, wrist: 0 },
    floorTransition: true,
    movementComplexity: 1,
  },
  along_crianca_lombar: {
    functionalPattern: 'mobility_spine',
    jointStress: { knee: 1, lumbar: 0, shoulder: 0, wrist: 0 },
    floorTransition: true,
    movementComplexity: 1,
  },
};
