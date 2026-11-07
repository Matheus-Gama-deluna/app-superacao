/**
 * Shared AI & Clinical Types
 * Contratos compartilhados entre Frontend PWA e Backend Cloud Functions
 */

export type AgentServiceId =
  | 'master_personal'
  | 'teacher_copilot'
  | 'telemetry_analyst'
  | 'habit_companion'
  | 'voice_asr'
  | 'memory_embedder';

export interface ClinicalMemoryFact {
  id: string; // chave canônica ex: 'knee_right_patellofemoral' | 'neck_acute_stiffness'
  labelPt: string; // exibido ao usuário: "Sensibilidade no joelho direito ao descer escadas"
  persistence: 'chronic' | 'temporary';
  avoidedMovements: string[];
  protectiveCuePt: string;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number; // Para temporary (ex: +4 dias)
  sourceHash?: string;
}

export interface CoreBiopsychosocialMemory {
  schemaVersion: 1;
  updatedAt: number;
  clinicalFacts: ClinicalMemoryFact[];
  likedExerciseIds: string[];
  dislikedExerciseIds: string[];
  routineInsights: {
    realisticDurationMinutes?: number;
    mainAdherenceBarriers: string[];
    preferredCoachingTone: 'direto_cientifico' | 'acolhedor_suave' | 'motivador_energetico';
    personalMotivationSummary?: string;
  };
  mesocycleState: {
    cycleWeek: 1 | 2 | 3 | 4;
    cycleStartedAt: number;
    currentFocusSummary: string;
    lastWeeklyDigestSummary?: string;
  };
}

export interface StructuredClinicalContext {
  avoidedMovements: string[];
  reportedLimitations: string[];
  jointStressCaps: Record<string, 'baixo' | 'moderado' | 'livre'>;
  preferredFunctionalPatterns: string[];
  volumeModifier: number; // ex: 0.8 a 1.2
  extraRestSeconds: number;
  protectiveCuesByPattern: Record<string, string>;
  redFlagsDetected: string[];
  summaryPt: string;
  sourceTextHash: string;
}

export interface ActiveScreenContext {
  currentTab: 'home' | 'workouts' | 'calendar' | 'progress';
  activeView?: string;
  isFocusModeActive?: boolean;
  currentExerciseId?: string;
  currentExerciseName?: string;
  currentSetIndex?: number;
  totalSets?: number;
  lastCompletedReps?: number;
  lastWeightKg?: number;
  scheduledDayId?: string;
  selectedStudentUid?: string; // Para modo professor
}

export interface ProposalDiff {
  actionType:
    | 'swap_exercise'
    | 'soften_session'
    | 'adjust_exercise_target'
    | 'compress_remaining_workout'
    | 'generate_custom_workout'
    | 'create_program'
    | 'advance_program_phase'
    | 'evolve_program_variations'
    | 'reschedule_day'
    | 'update_schedule'
    | 'update_routine'
    | 'update_profile'
    | 'log_external_practice'
    | 'autofill_onboarding'
    | 'navigate';
  titlePt: string;
  descriptionPt: string;
  originalId?: string;
  replacementId?: string;
  replacementNamePt?: string;
  targetDayOfWeek?: number;
  workoutPlan?: any;
  workoutProgram?: any;
  payload?: any;
}

export interface AssistantActionProposal {
  replyPt: string;
  clinicalReasoningSummary?: string;
  actionRequired?: boolean;
  proposedDiff?: ProposalDiff;
  requiresConfirmation: boolean;
  activatedSkillIds?: string[];
  activeMemoriesCount?: number;
  tokensUsed?: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
  };
}

export interface AdminModelSpec {
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
  pricingInputPerMillion: number;
  pricingOutputPerMillion: number;
  pricingCachedInputPerMillion: number;
  isEnabled: boolean;
}

export interface AdminSystemConfig {
  aiEnabled: boolean;
  emergencyKillSwitch: boolean;
  dailyHardStopUsd: number;
  monthlyHardStopUsd: number;
  dailyUserTurnQuota: number;
  dailyUserAudioQuota: number;
  models: Record<AgentServiceId, AdminModelSpec>;
  skillsOverrides?: Record<string, { isEnabled: boolean; customProtocolMarkdown?: string }>;
  catalogOverrides?: Record<string, { isHidden?: boolean; customContraindications?: string[] }>;
  updatedAt: number;
  updatedBy: string;
}

export interface AdminApiKeyStatus {
  isConfigured: boolean;
  maskedKey: string;
  source: 'secret_manager' | 'admin_vault' | 'none';
  updatedAt?: number;
  updatedBy?: string;
}

export interface AdminDailyMetrics {
  dateStr: string; // YYYY-MM-DD
  totalCalls: number;
  totalErrors: number;
  totalFallbacksTriggered: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedTokens: number;
  totalAudioSeconds: number;
  estimatedCostUsd: number;
  callsByAgent: Record<string, number>;
  redFlagsBlocked: number;
  proposalsCreated: number;
  proposalsConfirmed: number;
}
