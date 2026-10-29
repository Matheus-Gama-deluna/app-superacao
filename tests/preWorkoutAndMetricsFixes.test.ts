import { describe, it, expect } from 'vitest';
import { getCanonicalWeeklyGoal } from '../src/lib/storage';
import { createSoftenedPlanSnapshot, createGentleReturnPlanSnapshot } from '../src/lib/workoutEngine/progression';
import { WorkoutPlan, CalendarDay, UserProfile } from '../src/types';

describe('Correções de Pré-Treino, Descanso e Métricas (Achados 1 a 4)', () => {
  const samplePlan: WorkoutPlan = {
    id: 'plan_full_body_test',
    ownerUid: 'guest_user',
    title: 'Treino A - Corpo Inteiro',
    description: 'Rotina teste',
    version: 1,
    isProfessional: false,
    estimatedDurationMinutes: 15,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    exercises: [
      {
        exerciseId: 'squat',
        exerciseName: 'Agachamento Livre',
        targetSets: 3,
        targetReps: 12,
        restSeconds: 60,
      },
      {
        exerciseId: 'plank',
        exerciseName: 'Prancha Frontal',
        targetSets: 3,
        targetReps: 0,
        targetDurationSeconds: 30,
        restSeconds: 60,
      },
      {
        exerciseId: 'pushup',
        exerciseName: 'Flexão de Braço',
        targetSets: 2,
        targetReps: 8,
        restSeconds: 60,
      },
    ],
  };

  it('Achado 3: createSoftenedPlanSnapshot aplica redução exata de 25% (fator 0.75) e nomeia como Ritmo Suave', () => {
    const softened = createSoftenedPlanSnapshot(samplePlan);

    // Título coerente com a experiência Ritmo Suave
    expect(softened.title).toBe('Treino A - Corpo Inteiro (Ritmo Suave)');
    expect(softened.title).not.toContain('Retomada Gentil');

    // 12 reps * 0.75 = 9 reps (-25% exato)
    expect(softened.exercises[0].targetReps).toBe(9);

    // 30s * 0.75 = 22.5s -> 23s (exatos -23.3% a -25%)
    expect(softened.exercises[1].targetDurationSeconds).toBe(23);

    // 8 reps * 0.75 = 6 reps (-25% exato)
    expect(softened.exercises[2].targetReps).toBe(6);

    // Séries originais preservadas
    expect(softened.exercises[0].targetSets).toBe(3);
  });

  it('Achado 3: createGentleReturnPlanSnapshot permanece exclusivo para retomada após ausência de 7 dias (fator 0.8 e máximo 2 séries)', () => {
    const gentle = createGentleReturnPlanSnapshot(samplePlan);

    expect(gentle.title).toBe('Treino A - Corpo Inteiro (Retomada Gentil)');
    // Séries limitadas a no máximo 2 para readaptação protetiva
    expect(gentle.exercises[0].targetSets).toBe(2);
    // 12 reps * 0.8 = 9.6 -> 10 reps
    expect(gentle.exercises[0].targetReps).toBe(10);
  });

  it('Achado 4: getCanonicalWeeklyGoal unifica Home e Progresso com 3 dias na disponibilidade e 4 treinos na agenda', () => {
    const profile: Partial<UserProfile> = {
      availableDays: [1, 3, 5], // 3 dias declarados na escuta
    };

    const calendarWithExtraDay: CalendarDay[] = [
      { id: '1', ownerUid: 'guest_user', dateStr: '2026-10-26', dayOfWeek: 1, activityType: 'strength', isCompleted: false },
      { id: '2', ownerUid: 'guest_user', dateStr: '2026-10-27', dayOfWeek: 2, activityType: 'strength', isCompleted: false }, // Dia extra adicionado na Agenda!
      { id: '3', ownerUid: 'guest_user', dateStr: '2026-10-28', dayOfWeek: 3, activityType: 'strength', isCompleted: false },
      { id: '4', ownerUid: 'guest_user', dateStr: '2026-10-30', dayOfWeek: 5, activityType: 'strength', isCompleted: false },
    ];

    const result = getCanonicalWeeklyGoal(profile, calendarWithExtraDay);

    // Ambas as telas exibem 4 (pois 4 treinos foram agendados na semana)
    expect(result.targetWeeklyGoal).toBe(4);
    expect(result.scheduledCommittedCount).toBe(4);
    expect(result.personalCommittedDays).toBe(3);
  });

  it('Achado 4: getCanonicalWeeklyGoal mantém a meta da escuta (3 dias) quando o calendário não tem dias extras', () => {
    const profile: Partial<UserProfile> = {
      availableDays: [1, 3, 5],
    };

    const normalCalendar: CalendarDay[] = [
      { id: '1', ownerUid: 'guest_user', dateStr: '2026-10-26', dayOfWeek: 1, activityType: 'strength', isCompleted: false },
      { id: '2', ownerUid: 'guest_user', dateStr: '2026-10-28', dayOfWeek: 3, activityType: 'strength', isCompleted: false },
      { id: '3', ownerUid: 'guest_user', dateStr: '2026-10-30', dayOfWeek: 5, activityType: 'strength', isCompleted: false },
    ];

    const result = getCanonicalWeeklyGoal(profile, normalCalendar);
    expect(result.targetWeeklyGoal).toBe(3);
    expect(result.scheduledCommittedCount).toBe(3);
  });

  it('Achado 4: getCanonicalWeeklyGoal lida honestamente com perfil sem agenda preenchida', () => {
    const profile: Partial<UserProfile> = {
      availableDays: [2, 4],
    };

    const result = getCanonicalWeeklyGoal(profile, []);
    expect(result.targetWeeklyGoal).toBe(2);
  });
});
