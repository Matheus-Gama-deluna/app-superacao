export type Modality = 'forca' | 'mobilidade' | 'alongamento' | 'cardio';
export type EquipmentType = 'nenhum' | 'peso_corporal' | 'cadeira' | 'parede' | 'mini_band' | 'faixa_longa' | 'tubos_elasticos' | 'halteres' | 'kettlebell' | 'colchonete';
export type ActivityType = 'strength' | 'active_recovery' | 'rest' | 'walk' | 'unassigned';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned' | 'parcial';
export type TrackingMode = 'reps' | 'time';

export type PreWorkoutMood = 'cansado' | 'tenso' | 'normal' | 'disposto';
export type PostWorkoutMood = 'renovado' | 'leve' | 'orgulhoso' | 'cansado_bem';

export type AchievementCoinType =
  | 'base_unlocked'
  | 'performance_pr'
  | 'efficiency_gain'
  | 'care_vitality'
  | 'habit_saved'
  | 'ladder_levelup';

export type FunctionalMovementPattern =
  | 'squat'
  | 'lunge'
  | 'hinge'
  | 'push_horizontal'
  | 'push_vertical'
  | 'pull_horizontal'
  | 'pull_vertical'
  | 'core_anti_extension'
  | 'core_anti_rotation'
  | 'core_flexion'
  | 'mobility_spine'
  | 'mobility_hip'
  | 'cardio_low_impact'
  | 'cardio_high_impact';

export interface JointStressRating {
  knee: 0 | 1 | 2;
  lumbar: 0 | 1 | 2;
  shoulder: 0 | 1 | 2;
  wrist: 0 | 1 | 2;
}

export interface MovementLadderStep {
  ladderId: 'pushup' | 'squat' | 'plank' | 'glute_bridge' | 'row' | 'lunge';
  stepIndex: number;
  name: string;
}

export interface SessionEfficiencyComparison {
  previousSessionId: string;
  previousEffort: number; // 1 a 5
  currentEffort: number;  // 1 a 5
  improved: boolean;
}

export type MicroChallengeType =
  | 'first_pr_from_base'
  | 'beat_pr_reps'
  | 'beat_pr_time'
  | 'establish_base'
  | 'mindful_mobility';

export interface DailyMicroChallenge {
  type: MicroChallengeType;
  exerciseId: string;
  exerciseName: string;
  badgeText: string;
  title: string;
  description: string;
  currentMark?: number;
  targetMark?: number;
  unit?: 'reps' | 'seconds';
}

export interface TomorrowBridgeInfo {
  tomorrowDayOfWeek: number;
  tomorrowDayLabel: string;
  tomorrowDateStr?: string;
  tomorrowActivityType: ActivityType;
  tomorrowPlanId?: string;
  tomorrowPlanTitle?: string;
  headline: string;
  bodyText: string;
  nextChallengePreview?: {
    exerciseName: string;
    currentMarkText: string;
    targetMarkText: string;
  };
  canScheduleOptionalMobility: boolean;
}

export interface WellbeingInsight {
  totalTrackedSessions: number;
  positiveTurnaroundCount: number;
  lastTurnaroundPreMood?: PreWorkoutMood;
  lastTurnaroundPostMood?: PostWorkoutMood;
  lastTurnaroundMinutes?: number;
  message: string;
}

export interface Exercise {
  id: string;
  name_pt: string;
  name_en?: string;
  modality: Modality;
  movement_pattern: string;
  equipment: string[];
  environment: string[];
  difficulty_candidate: 'iniciante' | 'intermediario' | 'avancado';
  tracking: TrackingMode;
  requires_anchor: boolean;
  requires_supports?: string[];
  is_curated_for_auto_proposal?: boolean;
  instructions_pt: string;
  caution_pt: string;
  review_status: string;
  media_url: string | null;
  images?: string[]; // URLs de fotos reais de execução (fase inicial 0 e final 1)
  target_muscle?: string;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  steps_pt?: string[]; // Passo a passo enumerado em português
  source_kind?: string;
  version?: string;
  functionalPattern?: FunctionalMovementPattern;
  jointStress?: JointStressRating;
  floorTransition?: boolean;
  movementComplexity?: 1 | 2 | 3;
  ladder?: MovementLadderStep;
}

export interface ExercisePlanItem {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetWeightKg?: number;
  targetDurationSeconds?: number;
  restSeconds: number;
  notes?: string;
  reason?: string;
}

export interface WorkoutPlan {
  id: string;
  ownerUid: string;
  title: string;
  description: string;
  version: number;
  isProfessional: boolean;
  authorName?: string;
  isTemplate?: boolean;
  sourceKind?: 'usuario' | 'modelo_revisado' | 'modelo_demonstracao' | 'profissional';
  reviewStatus?: 'em_revisao' | 'revisado' | 'demonstrativo';
  exercises: ExercisePlanItem[];
  estimatedDurationMinutes: number;
  category?: 'casa' | 'academia' | 'mini_band' | 'faixa_longa' | 'mobilidade' | 'caminhada' | 'geral';
  createdAt: number;
  updatedAt: number;
}

export interface SetEvent {
  id: string;
  ownerUid: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  setIndex: number; // 1-indexed
  targetReps: number;
  actualReps: number;
  actualWeightKg?: number; // Carga utilizada em kg
  targetWeightKg?: number;
  targetDurationSeconds?: number;
  actualDurationSeconds?: number;
  restDurationSeconds: number;
  isPR: boolean;
  prDetails?: string;
  clientEventId: string;
  recordedAt: number;
}

export interface WorkoutSession {
  id: string;
  ownerUid: string;
  planId: string;
  planTitle: string;
  status: SessionStatus;
  startedAt: number;
  completedAt?: number;
  durationSeconds: number;
  currentExerciseIndex: number;
  currentSetIndex: number;
  totalSetsPlanned: number;
  totalSetsCompleted: number;
  totalRepsCompleted: number;
  totalVolumeKg?: number; // Volume total levantado em kg (reps x peso)
  prsAchieved: number;
  feedbackEffort?: number; // 1 to 5 scale
  notes?: string;
  exercisesSnapshot: ExercisePlanItem[];
  scheduledDayId?: string;
  scheduledActivityId?: string;
  originType?: 'scheduled' | 'program_session' | 'ad_hoc' | 'express';
  isExpress?: boolean;
  wasPlannedHabit?: boolean;
  preMood?: PreWorkoutMood;
  postMood?: PostWorkoutMood;
  newBaselinesCount?: number;
  achievementCoins?: AchievementCoinType[];
  efficiencyComparison?: SessionEfficiencyComparison;
}

export type TimeOfDay = 'manha' | 'tarde' | 'noite' | 'livre';

export interface ScheduledDayActivity {
  id: string; // uuid unico da atividade no dia
  planId: string;
  planTitle: string;
  timeOfDay?: TimeOfDay;
  activityType: ActivityType;
  isCompleted: boolean;
  completedAt?: number;
  programId?: string;
  programTitle?: string;
}

export interface CalendarDay {
  id: string; // YYYY-MM-DD
  ownerUid: string;
  dateStr: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, etc.
  activityType: ActivityType;
  planId?: string;
  planTitle?: string;
  isCompleted: boolean;
  completedAt?: number;
  timeOfDay?: TimeOfDay;
  notes?: string;
  vitalityBonusCompleted?: boolean;
  vitalityActivityLabel?: string;
  hasCareRoutine?: boolean;
  careRoutineTitle?: string;
  careMinutes?: number;
  additionalActivities?: ScheduledDayActivity[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  bestReps: number;
  bestDurationSeconds: number;
  bestWeightKg?: number; // Maior carga registrada em kg
  recordedAt: number;
  sessionId: string;
  isBaseline?: boolean; // Marca inicial de referência (não é PR de superação)
  prCount?: number; // Número de vezes que superou a marca anterior
}

export interface CanonicalMetrics {
  completedWorkoutsCount: number;
  partialWorkoutsCount: number;
  totalWorkoutsCount: number;
  realPRCount: number;
  totalVolumeKg: number;
  weeklyCommittedCount: number;
  weeklyCompletedCount: number;
  baselineMarksCount: number;
  careMinutesTotal: number;
  careSessionsCount: number;
  weeklyVitalityLinksCount: number;
  savedHabitSessionsCount: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  isTrustedDevice: boolean;
  primaryGoal: string;
  secondaryGoals: string[];
  goalPriorityOrder?: string[];
  goalFocus?: 'foco_unico' | 'equilibrado';
  experienceLevel: 'iniciante' | 'retomando' | 'pratica' | 'intermediario';
  availableDays: number[];
  sessionDurationMinutes?: number;
  equipments: string[];
  planSourcePreference?: 'criar' | 'modelo_revisado' | 'profissional';
  habitAnchor: string;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  exerciseReason?: string;
  preferredTime?: 'manha' | 'tarde' | 'noite' | 'flexivel';
  environmentPreference?: 'casa' | 'academia' | 'ar_livre' | 'qualquer';
  hasFlexibleSchedule?: boolean;
  reportedLimitations?: string[];
  avoidedMovements?: string[];
  healthNotes?: string;
  practiceObstacles?: string[];
  userContextNotes?: string;
  routineConfirmed?: boolean;
  accessChoice?: 'guest' | 'login' | 'signup' | null;
  onboardingCompleted?: boolean;
  needsReviewPrompt?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface OnboardingDraft {
  step: number;
  displayName: string;
  experienceLevel: 'iniciante' | 'retomando' | 'pratica';
  exerciseReason: string;
  orderedGoals: string[];
  goalFocus: 'foco_unico' | 'equilibrado';
  availableDays: number[];
  sessionDurationMinutes: number;
  preferredTime?: 'manha' | 'tarde' | 'noite' | 'flexivel';
  environmentPreference?: 'casa' | 'academia' | 'ar_livre' | 'qualquer';
  hasFlexibleSchedule?: boolean;
  habitAnchor: string;
  equipments: string[];
  reportedLimitations: string[];
  avoidedMovements: string[];
  healthNotes: string;
  practiceObstacles: string[];
  userContextNotes: string;
  planSourcePreference: 'criar' | 'modelo_revisado' | 'profissional';
  savedAt: number;
}

export interface ExplainableProposal {
  id: string;
  title: string;
  description: string;
  targetDaysCount: number;
  sessionDurationMinutes: number;
  environment: string;
  equipmentsUsed: string[];
  avoidedMovements: string[];
  justificationText: string;
  timeBreakdownText: string;
  routines: WorkoutPlan[];
  weeklySchedule: { [dayOfWeek: number]: string };
  generatedAt: number;
  isConfirmed: boolean;
  hasCompatibleExercises?: boolean;
  reasonIfUnavailable?: string;
}

export interface SyncStatusState {
  hasPendingWrites: boolean;
  fromCache: boolean;
  isOnline: boolean;
  isFirebaseReady: boolean;
  lastSyncTime?: number;
  error?: string;
}

export type ProgramObjective = 'habito' | 'postura' | 'vitalidade' | 'hipertrofia' | 'forca' | 'calistenia' | 'corrida' | 'longevidade' | 'sono' | 'gluteos';

export interface ProgramPhase {
  name: string;
  weeks: number[]; // ex: [1, 2, 3, 4]
  description: string;
  focusNotes?: string;
}

export interface WorkoutProgram {
  id: string;
  title: string;
  description: string;
  objective: ProgramObjective;
  environment: 'casa' | 'academia' | 'qualquer';
  durationWeeks: number;
  currentWeek: number;
  splitType: 'full_body' | 'upper_lower' | 'abc' | 'abcd' | 'habito_express';
  weeklyFrequency: number; // ex: 3 ou 4 treinos por semana
  habitAnchor?: string;
  phases: ProgramPhase[];
  routines: WorkoutPlan[]; // As fichas filhas coordenadas (A, B, C...)
  weeklySchedule: { [dayOfWeek: number]: string }; // Mapeamento dia da semana (0-6) -> planId
  emergencyPlanId?: string; // ID da rotina de 5 minutos 'Salvar o Hábito'
  createdAt: number;
  updatedAt: number;
  isCustom?: boolean;
}

