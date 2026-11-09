import { describe, it, expect } from 'vitest';
import { composeTargetedWorkout } from '../src/lib/workoutEngine/composer';

describe('Compositor Inteligente de Treinos (composeTargetedWorkout)', () => {
  it('escala a quantidade de exercícios e volume com a duração solicitada (8 a 60 min)', () => {
    // 10 min -> 3 exercícios
    const quick10 = composeTargetedWorkout({}, { purpose: 'forca_hipertrofia', durationMinutes: 10 });
    expect(quick10.exercises.length).toBe(3);
    expect(quick10.estimatedDurationMinutes).toBeGreaterThanOrEqual(8);

    // 20 min -> 5 exercícios
    const standard20 = composeTargetedWorkout({}, { purpose: 'forca_hipertrofia', durationMinutes: 20 });
    expect(standard20.exercises.length).toBe(5);

    // 40 min -> 7 exercícios
    const long40 = composeTargetedWorkout({}, { purpose: 'forca_hipertrofia', durationMinutes: 40 });
    expect(long40.exercises.length).toBe(7);

    // 60 min (sessão longa treinada ou relaxamento profundo) -> 8 exercícios
    const max60 = composeTargetedWorkout(
      { experienceLevel: 'avancado' },
      { purpose: 'relaxamento_muscular', durationMinutes: 60 }
    );
    expect(max60.exercises.length).toBe(8);
    expect(max60.estimatedDurationMinutes).toBeGreaterThanOrEqual(45);
  });

  it('exclui rigorosamente exercícios em dislikedExerciseIds (Memória M2)', () => {
    // Vamos escolher o primeiro exercício de uma geração padrão
    const initial = composeTargetedWorkout({}, { purpose: 'forca_hipertrofia', durationMinutes: 20 });
    const dislikedId = initial.exercises[0].exerciseId;

    // Nova geração com o ID descurtido
    const updated = composeTargetedWorkout(
      {},
      {
        purpose: 'forca_hipertrofia',
        durationMinutes: 20,
        dislikedExerciseIds: [dislikedId],
      }
    );

    const hasDisliked = updated.exercises.some((e) => e.exerciseId === dislikedId);
    expect(hasDisliked).toBe(false);
  });

  it('favorece exercícios favoritados (likedExerciseIds)', () => {
    // Se o aluno favoritou ponte e perdigueiro
    const liked = ['butt_lift_bridge', 'bird_dog_hold'];
    const plan = composeTargetedWorkout(
      {},
      {
        purpose: 'core_estabilidade',
        durationMinutes: 20,
        likedExerciseIds: liked,
      }
    );

    const includedLiked = plan.exercises.filter((e) => liked.includes(e.exerciseId));
    expect(includedLiked.length).toBeGreaterThan(0);
  });

  it('respeita limitações de joelho e evita flexões de solo se avoidFloor=true', () => {
    const plan = composeTargetedWorkout(
      {
        reportedLimitations: ['joelhos'],
        avoidedMovements: ['impacto_saltos'],
      },
      {
        purpose: 'forca_hipertrofia',
        durationMinutes: 20,
        avoidFloor: true,
      }
    );

    for (const item of plan.exercises) {
      expect(item.exerciseName.toLowerCase()).not.toContain('jump');
      expect(item.exerciseName.toLowerCase()).not.toContain('salto');
    }
  });

  it('monta sessões específicas para descompressão pós-luta/tatame', () => {
    const plan = composeTargetedWorkout(
      {},
      {
        purpose: 'pos_luta_artes_marciais',
        durationMinutes: 15,
      }
    );

    expect(plan.title).toContain('Pós-Luta');
    expect(plan.category).toBe('mobilidade');
    expect(plan.exercises.length).toBeGreaterThanOrEqual(3);
  });
});
