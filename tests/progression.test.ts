import { describe, it, expect } from 'vitest';
import {
  analyzeSessionProgression,
  applyUpgradesToWorkoutPlan,
  detectGentleReturn,
  createGentleReturnPlanSnapshot,
  findSafeEquivalentExercises,
  calculateMovementLaddersProgress,
  MOVEMENT_LADDERS,
} from '../src/lib/workoutEngine/progression';
import { WorkoutPlan, WorkoutSession, UserProfile, SetEvent } from '../src/types';

describe('WorkoutEngine - Progressão e Adaptação Viva (Fase 4 & 5)', () => {
  const dummyPlan: WorkoutPlan = {
    id: 'plan_test_progression',
    ownerUid: 'guest_user',
    title: 'Treino Teste de Progressão',
    description: 'Rotina de validação',
    version: 1,
    isProfessional: false,
    estimatedDurationMinutes: 20,
    targetSets: 3,
    targetReps: 10,
    exercises: [
      {
        exerciseId: 'wall_pushup_controlled',
        exerciseName: 'Flexão na Parede',
        targetSets: 3,
        targetReps: 15,
        restSeconds: 45,
        trackingMode: 'reps',
      },
      {
        exerciseId: 'plank',
        exerciseName: 'Prancha Frontal',
        targetSets: 3,
        targetReps: 30, // segundos
        targetDurationSeconds: 30,
        restSeconds: 45,
        trackingMode: 'time',
      },
      {
        exerciseId: 'chair_sit_to_stand_cross_arms',
        exerciseName: 'Sentar e Levantar da Cadeira',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 45,
        trackingMode: 'reps',
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('1. analyzeSessionProgression sugere subir degrau da escada biomecânica quando critério é cumprido', () => {
    const session: WorkoutSession = {
      id: 'sess_1',
      ownerUid: 'guest_user',
      planId: dummyPlan.id,
      planTitle: dummyPlan.title,
      startedAt: Date.now() - 1200000,
      completedAt: Date.now(),
      durationSeconds: 1200,
      currentExerciseIndex: 2,
      currentSetIndex: 3,
      totalSetsPlanned: 9,
      totalSetsCompleted: 9,
      totalRepsCompleted: 90,
      prsAchieved: 1,
      status: 'completed',
      preMood: 'normal',
      postMood: 'renovado',
      feedbackEffort: 2, // Leve / fluido
      exercisesSnapshot: dummyPlan.exercises,
    };

    const setEvents: SetEvent[] = [
      {
        id: 'ev_1',
        ownerUid: 'guest_user',
        sessionId: 'sess_1',
        exerciseId: 'wall_pushup_controlled',
        exerciseName: 'Flexão na Parede',
        setIndex: 1,
        targetReps: 15,
        actualReps: 15,
        restDurationSeconds: 45,
        isPR: false,
        clientEventId: 'c1',
        recordedAt: Date.now(),
      },
      {
        id: 'ev_2',
        ownerUid: 'guest_user',
        sessionId: 'sess_1',
        exerciseId: 'wall_pushup_controlled',
        exerciseName: 'Flexão na Parede',
        setIndex: 2,
        targetReps: 15,
        actualReps: 15,
        restDurationSeconds: 45,
        isPR: false,
        clientEventId: 'c2',
        recordedAt: Date.now(),
      },
      {
        id: 'ev_3',
        ownerUid: 'guest_user',
        sessionId: 'sess_1',
        exerciseId: 'wall_pushup_controlled',
        exerciseName: 'Flexão na Parede',
        setIndex: 3,
        targetReps: 15,
        actualReps: 15,
        restDurationSeconds: 45,
        isPR: false,
        clientEventId: 'c3',
        recordedAt: Date.now(),
      },
      {
        id: 'ev_4',
        ownerUid: 'guest_user',
        sessionId: 'sess_1',
        exerciseId: 'plank',
        exerciseName: 'Prancha Frontal',
        setIndex: 1,
        targetReps: 30,
        actualReps: 0,
        actualDurationSeconds: 30,
        restDurationSeconds: 45,
        isPR: false,
        clientEventId: 'c4',
        recordedAt: Date.now(),
      },
    ];

    const analysis = analyzeSessionProgression(session, dummyPlan, [], setEvents);
    expect(analysis.upgrades.length).toBeGreaterThan(0);

    const ladderUpgrade = analysis.upgrades.find(u => u.type === 'ladder_step_up');
    expect(ladderUpgrade).toBeDefined();
    expect(ladderUpgrade?.exerciseId).toBe('wall_pushup_controlled');
    expect(ladderUpgrade?.ladderInfo?.toStepIndex).toBe(2);
    expect(ladderUpgrade?.ladderInfo?.replacementExerciseId).toBe('incline_push-up');

    const timeUpgrade = analysis.upgrades.find(u => u.type === 'time_increase');
    expect(timeUpgrade).toBeDefined();
    expect(timeUpgrade?.suggestedValue).toBeGreaterThan(30);
  });

  it('2. applyUpgradesToWorkoutPlan atualiza o plano apenas com os itens aprovados pelo usuário', () => {
    const upgrades = [
      {
        exerciseId: 'wall_pushup_controlled',
        exerciseName: 'Flexão na Parede',
        type: 'ladder_step_up' as const,
        currentValue: 1,
        suggestedValue: 2,
        unit: 'degrau' as const,
        reason: 'Dominou degrau 1',
        ladderInfo: {
          ladderId: 'pushup',
          fromStepIndex: 1,
          toStepIndex: 2,
          toStepName: 'Flexão Inclinada no Banco',
          replacementExerciseId: 'incline_push-up',
        },
      },
    ];

    const updated = applyUpgradesToWorkoutPlan(dummyPlan, upgrades);
    const updatedEx = updated.exercises.find(e => e.exerciseId === 'incline_push-up');
    expect(updatedEx).toBeDefined();
    expect(updatedEx?.exerciseName).toBe('Flexão Inclinada no Banco');
    // Os outros exercícios continuam intocados
    expect(updated.exercises.find(e => e.exerciseId === 'plank')?.targetReps).toBe(30);
  });

  it('3. detectGentleReturn identifica ausência >= 7 dias e cria snapshot não destrutivo', () => {
    const return7Days = detectGentleReturn('2026-10-10', '2026-10-23');
    expect(return7Days.isEligible).toBe(true);
    expect(return7Days.daysAbsent).toBe(13);
    expect(return7Days.headline).toContain('13 dias');

    const returnRecent = detectGentleReturn('2026-10-21', '2026-10-23');
    expect(returnRecent.isEligible).toBe(false);

    // Snapshot adaptado
    const gentleSnapshot = createGentleReturnPlanSnapshot(dummyPlan);
    expect(gentleSnapshot.title).toContain('Retomada Gentil');
    expect(gentleSnapshot.id).toBe(dummyPlan.id); // Mantém o ID original
    expect(gentleSnapshot.exercises[0].targetSets).toBe(2);
    expect(gentleSnapshot.exercises[0].targetReps).toBeLessThan(15);
    // Plano original intacto
    expect(dummyPlan.exercises[0].targetSets).toBe(3);
  });

  it('4. findSafeEquivalentExercises filtra exercícios com respeito estrito a limitações e equipamentos', () => {
    const userProfile: Partial<UserProfile> = {
      equipments: ['peso_corporal'],
      reportedLimitations: ['joelhos'], // Dor no joelho
      avoidedMovements: ['salto'],
      primaryGoal: 'habito',
      experienceLevel: 'iniciante',
      availableDays: [1, 3, 5],
      sessionDurationMinutes: 20,
    };

    // Procurar equivalentes para flexão na parede
    const substitutes = findSafeEquivalentExercises('wall_pushup_controlled', userProfile);
    expect(substitutes.length).toBeGreaterThan(0);
    for (const sub of substitutes) {
      expect(sub.id).not.toBe('wall_pushup_controlled');
      // Não pode exigir halteres
      expect(sub.equipment).not.toBe('halteres');
    }
  });

  it('5. calculateMovementLaddersProgress mapeia o status dos 4 degraus para as 5 escadas', () => {
    expect(MOVEMENT_LADDERS.length).toBe(5);

    const progress = calculateMovementLaddersProgress([], []);
    expect(progress.length).toBe(5);
    expect(progress[0].steps.length).toBe(4);
    expect(progress[0].steps[0].status).toBe('current');
    expect(progress[0].steps[1].status).toBe('locked');
  });
});
