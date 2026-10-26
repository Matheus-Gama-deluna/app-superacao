export type Modality = 'forca' | 'mobilidade' | 'alongamento' | 'cardio';
export type EquipmentType = 'nenhum' | 'peso_corporal' | 'cadeira' | 'parede' | 'mini_band' | 'faixa_longa' | 'tubos_elasticos' | 'halteres' | 'kettlebell' | 'colchonete';
export type ActivityType = 'strength' | 'active_recovery' | 'rest' | 'walk' | 'unassigned' | 'mobility';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned' | 'parcial';
export type TrackingMode = 'reps' | 'time';

export type PreWorkoutMood = 'cansado' | 'tenso' | 'normal' | 'disposto';
export type PostWorkoutMood = 'renovado' | 'leve' | 'orgulhoso' | 'cansado_bem' | 'neutro' | 'esgotado' | 'desconforto';
export type SessionEnjoyment = 'prazeroso' | 'neutro' | 'dificil';

export type MotivationStyle =
  | 'consistency' // Foco em hábito, agenda e cumprir a semana (T04, T05)
  | 'mastery'     // Foco em aprender o movimento, postura e confiança técnica (T03)
  | 'wellbeing'   // Foco em prazer, alívio de tensão e energia pós-prática (T08)
  | 'performance' // Foco em evolução de repetições, tempo e cargas (T02)
  | 'variety'     // Foco em exploração guiada e evitar monotonia (T10)
  | 'social'      // Foco em compromisso compartilhado com pessoa de confiança (T13)
  | 'none';       // Apenas executar o plano, sem desafios ou convites extras (C09)

export interface CopingPlanRule {
  obstacleId: 'falta_tempo' | 'dificuldade_comecar' | 'cansaco_mental' | 'desanimo_falhar' | 'exercicios_complexos' | 'dor_articular' | string;
  ifTriggerLabel: string;
  thenActionType: 'express_5min' | 'soften_25pct' | 'swap_mobility' | 'reschedule_day' | 'guided_form_focus';
  thenActionLabel: string;
}

export interface PreparationRitual {
  anchorTrigger: string;
  steps: string[];
  pleasureBundle?: string;
  enableGuidedImagery?: boolean;
  lastCompletedDateStr?: string;
}

export interface SessionFocusInvite {
  type: 'pr_challenge' | 'technical_mastery' | 'wellbeing_flow' | 'consistency_habit' | 'professional_respect';
  title: string;
  badgeText: string;
  description: string;
  targetMark?: number;
  unit?: 'reps' | 'seconds';
  exerciseId?: string;
  exerciseName?: string;
  cue?: string;
}

export interface WeeklyReviewSummary {
  weekStartDate: string;
  weekEndDate: string;
  completedCount: number;
  expressOrPartialCount: number;
  externalCount: number;
  averageRpe: number;
  predominantMood?: PostWorkoutMood;
  currentTargetDays: number;
  suggestedAction: 'maintain' | 'soften' | 'advance';
  suggestedDaysTarget: number;
}

export type AchievementCoinType =
  | 'base_unlocked'
  | 'performance_pr'
  | 'efficiency_gain'
  | 'care_vitality'
  | 'habit_saved'
  | 'ladder_levelup'
  | 'pr'
  | 'baseline'
  | 'efficiency_rpe'
  | 'consistency_rhythm';

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
  | 'core_anti_lateral_flexion'
  | 'core_flexion'
  | 'mobility_spine'
  | 'mobility_hip'
  | 'mobility_shoulder'
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
  tracking: 'reps' | 'time';
  requires_anchor?: boolean;
  requires_supports?: string[];
  target_muscle?: string;
  bodyPart?: string;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  instructions_pt?: string;
  caution_pt?: string;
  images?: string[];
  steps_pt?: string[]; // Passo a passo enumerado em português
  source_kind?: string;
  version?: string;
  review_status?: string | null;
  media_url?: string | null;
  is_curated_for_auto_proposal?: boolean;
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
  trackingMode?: TrackingMode;
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
  targetSets?: number;
  targetReps?: number;
  targetRepsRange?: string;
  category?: 'casa' | 'academia' | 'mini_band' | 'faixa_longa' | 'mobilidade' | 'caminhada' | 'geral' | 'forca' | 'hipertrofia';
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
  date?: string; // Formato YYYY-MM-DD para conveniência
  durationSeconds: number;
  currentExerciseIndex: number;
  currentSetIndex: number;
  totalSetsPlanned: number;
  totalSetsCompleted: number;
  totalRepsCompleted: number;
  totalVolumeKg?: number; // Volume total levantado em kg (reps x peso)
  prsAchieved: number;
  feedbackEffort?: number; // 1 to 5 scale
  rpeEffort?: number; // Aliás para feedbackEffort
  notes?: string;
  exercisesSnapshot: ExercisePlanItem[];
  scheduledDayId?: string;
  scheduledActivityId?: string;
  originType?: 'scheduled' | 'program_session' | 'ad_hoc' | 'express' | 'active_recovery' | 'external_practice';
  isExpress?: boolean;
  wasPlannedHabit?: boolean;
  wasSoftened?: boolean;
  externalModality?: 'caminhada_corrida' | 'forca_academia' | 'mobilidade_yoga' | 'esporte_coletivo' | 'ciclismo_natacao' | 'outra';
  externalDistanceKm?: number;
  preMood?: PreWorkoutMood;
  postMood?: PostWorkoutMood;
  sessionEnjoyment?: SessionEnjoyment;
  newBaselinesCount?: number;
  achievementCoins?: AchievementCoinType[];
  efficiencyComparison?: SessionEfficiencyComparison;
  sets?: Record<string, Array<{ completed: boolean; reps?: number; actualReps?: number; actualDurationSeconds?: number }>>;
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
  reps?: number; // Alias retrocompatível
  bestWeightKg?: number; // Maior carga registrada em kg
  bestRepsAtBestWeight?: number; // Repetições realizadas na maior carga registrada
  maxRepsUnloaded?: number; // Melhor marca em repetições sem carga externa
  recordedAt: number;
  sessionId: string;
  isBaseline?: boolean; // Marca inicial de referência (não é PR de superação)
  prCount?: number; // Número de vezes que superou a marca anterior
}

export interface CanonicalMetrics {
  completedWorkoutsCount: number;
  partialWorkoutsCount: number;
  totalWorkoutsCount: number;
  totalVolumeKg: number;
  prsAchievedCount: number;
  realPRCount?: number;
  efficiencyImprovedCount: number;
  weeklyCompletedCount: number;
  weeklyCommittedCount: number;
  baselineMarksCount: number;
  careMinutesTotal: number;
  careSessionsCount: number;
  weeklyVitalityLinksCount: number;
  savedHabitSessionsCount: number;
}

export interface UserPreferences {
  availableEquipments?: string[];
  equipments?: string[];
  reportedLimitations?: string[];
  avoidedMovements?: string[];
  primaryGoal?: string;
  experienceLevel?: 'iniciante' | 'retomando' | 'pratica' | 'intermediario' | 'avancado';
  daysPerWeek?: number;
  sessionMinutes?: number;
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
  experienceLevel: 'iniciante' | 'retomando' | 'pratica' | 'intermediario' | 'avancado';
  availableDays: number[];
  sessionDurationMinutes?: number;
  equipments: string[];
  availableEquipments?: string[];
  planSourcePreference?: 'criar' | 'modelo_revisado' | 'profissional';
  habitAnchor: string;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  voiceGuideEnabled?: boolean;
  exerciseReason?: string;
  preferredTime?: 'manha' | 'tarde' | 'noite' | 'flexivel';
  environmentPreference?: 'casa' | 'academia' | 'ar_livre' | 'qualquer';
  hasFlexibleSchedule?: boolean;
  reportedLimitations?: string[];
  avoidedMovements?: string[];
  healthNotes?: string;
  practiceObstacles?: string[];
  motivationStyle?: MotivationStyle;
  preparationRitual?: PreparationRitual;
  copingPlans?: CopingPlanRule[];
  pleasureBundle?: string;
  completedWeeklyReviews?: string[];
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
  experienceLevel: 'iniciante' | 'retomando' | 'pratica' | 'intermediario' | 'avancado';
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

export type ProgramObjective = 'habito' | 'postura' | 'vitalidade' | 'hipertrofia' | 'forca' | 'calistenia' | 'corrida' | 'longevidade' | 'sono' | 'gluteos' | 'alivio_dores';

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

export type ProgressionItemUpgradeType = 'rep_increase' | 'time_increase' | 'ladder_step_up' | 'deload_suggested';

export interface ProgressionItemUpgrade {
  exerciseId: string;
  exerciseName: string;
  type: ProgressionItemUpgradeType;
  currentValue: number;
  suggestedValue: number;
  unit: 'reps' | 'seconds' | 'degrau';
  reason: string;
  ladderInfo?: {
    ladderId: string;
    fromStepIndex: number;
    toStepIndex: number;
    toStepName: string;
    replacementExerciseId: string;
  };
}

export interface SessionProgressionAnalysis {
  workoutPlanId: string;
  workoutTitle: string;
  sessionRpe: number; // 1-5
  upgrades: ProgressionItemUpgrade[];
  summaryMessage: string;
}

export interface GentleReturnInfo {
  isEligible: boolean;
  daysAbsent: number;
  headline: string;
  message: string;
  suggestedSetsScale: number;
  suggestedVolumeScale: number;
}

export interface LadderStepDefinition {
  stepIndex: number;
  name: string;
  exerciseId: string;
  exerciseName: string;
  repsToLevelUp: number;
  setsToLevelUp: number;
  trackingMode?: TrackingMode;
  description: string;
}

export interface MovementLadderTrack {
  ladderId: 'pushup' | 'squat' | 'plank' | 'glute_bridge' | 'row';
  title: string;
  pattern: FunctionalMovementPattern;
  steps: LadderStepDefinition[];
}

export interface MovementLadderUserProgress {
  ladderId: 'pushup' | 'squat' | 'plank' | 'glute_bridge' | 'row';
  title: string;
  currentStepIndex: number;
  currentStepName: string;
  bestMarkText: string;
  isCompleted: boolean;
  steps: {
    stepIndex: number;
    name: string;
    exerciseId: string;
    exerciseName: string;
    status: 'completed' | 'current' | 'locked';
  }[];
}
