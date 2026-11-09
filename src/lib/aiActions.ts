/**
 * Contrato entre o Personal IA (backend) e o executor do app (App.tsx).
 * - EXECUTABLE_ACTION_TYPES: toda ação anunciada no prompt DEVE constar aqui (garantido por teste de contrato).
 * - normalizeExternalModality: traduz a modalidade livre devolvida pelo LLM para o enum interno.
 * - buildAiUserContext: monta o contexto vivo do aluno enviado ao agente.
 */

import type { CalendarDay, UserProfile, WorkoutSession } from '../types';

export type ExternalModality =
  | 'caminhada_corrida'
  | 'forca_academia'
  | 'mobilidade_yoga'
  | 'esporte_coletivo'
  | 'ciclismo_natacao'
  | 'artes_marciais'
  | 'outra';

export const EXECUTABLE_ACTION_TYPES = [
  'swap_exercise',
  'soften_session',
  'adjust_exercise_target',
  'generate_custom_workout',
  'log_external_practice',
  'advance_program_phase',
  'update_profile',
  'autofill_onboarding',
  'navigate',
] as const;

export function normalizeExternalModality(raw?: string | null): ExternalModality {
  const v = String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_');

  if (!v) return 'outra';
  if (/(arte|marcial|jiu|jitsu|muay|thai|boxe|judo|karate|mma|luta|capoeira|tatame)/.test(v)) return 'artes_marciais';
  if (/(yoga|ioga|pilates|mobilidade|alongamento)/.test(v)) return 'mobilidade_yoga';
  if (/(caminhada|corrida|correr|run|trote|trilha|walk)/.test(v)) return 'caminhada_corrida';
  if (/(cicl|bike|bicicleta|nata|piscina|nado)/.test(v)) return 'ciclismo_natacao';
  if (/(forca|muscul|academia|gym|peso)/.test(v)) return 'forca_academia';
  if (/(esporte|futebol|volei|basquete|tenis|coletivo|aula|danca|handebol|futsal)/.test(v)) return 'esporte_coletivo';
  return 'outra';
}

const DAY_MS = 86_400_000;

function toDateStr(ts?: number): string | undefined {
  if (!ts) return undefined;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface AiUserContextPayload {
  experienceLevel?: string;
  obstacles?: string[];
  availableDays?: number[];
  habitAnchor?: string;
  exerciseReason?: string;
  goalPriority?: string[];
  preferredTime?: string;
  environment?: string;
  today?: { kind?: string; planTitle?: string; completed?: boolean; dateStr?: string };
  recentSessions?: Array<{
    date?: string;
    title?: string;
    rpe?: number;
    durationMin?: number;
    mood?: string;
    external?: boolean;
  }>;
  daysSinceLastWorkout?: number;
  weeklyCompleted?: number;
  weeklyTarget?: number;
}

export function buildAiUserContext(
  profile: Partial<UserProfile> | null | undefined,
  calendar: CalendarDay[] = [],
  sessions: WorkoutSession[] = [],
  now: number = Date.now()
): AiUserContextPayload {
  const p = (profile || {}) as any;
  const todayStr = toDateStr(now);
  const todayCal = calendar.find((c) => c.dateStr === todayStr);

  const completed = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.completedAt || b.startedAt || 0) - (a.completedAt || a.startedAt || 0));

  const last = completed[0];
  const lastTs = last ? last.completedAt || last.startedAt : undefined;

  const weekAgo = now - 7 * DAY_MS;
  const weeklyCompleted = completed.filter((s) => (s.completedAt || s.startedAt || 0) >= weekAgo).length;

  return {
    experienceLevel: p.experienceLevel,
    obstacles: Array.isArray(p.practiceObstacles) ? p.practiceObstacles : undefined,
    availableDays: Array.isArray(p.availableDays) ? p.availableDays : undefined,
    habitAnchor: p.habitAnchor,
    exerciseReason: p.exerciseReason,
    goalPriority: Array.isArray(p.goalPriorityOrder) ? p.goalPriorityOrder : undefined,
    preferredTime: p.preferredTime,
    environment: p.environmentPreference,
    today: todayCal
      ? {
          kind: todayCal.activityType,
          planTitle: todayCal.planTitle,
          completed: todayCal.isCompleted,
          dateStr: todayStr,
        }
      : { kind: 'livre', dateStr: todayStr },
    recentSessions: completed.slice(0, 5).map((s) => ({
      date: toDateStr(s.completedAt || s.startedAt),
      title: s.planTitle,
      rpe: s.feedbackEffort ?? s.rpeEffort,
      durationMin: s.durationSeconds ? Math.round(s.durationSeconds / 60) : undefined,
      mood: s.postMood as string | undefined,
      external: s.originType === 'external_practice',
    })),
    daysSinceLastWorkout: lastTs ? Math.max(0, Math.floor((now - lastTs) / DAY_MS)) : undefined,
    weeklyCompleted,
    weeklyTarget: Array.isArray(p.availableDays) && p.availableDays.length > 0 ? p.availableDays.length : undefined,
  };
}
