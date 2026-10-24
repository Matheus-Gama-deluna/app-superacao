import { describe, it, expect, beforeAll } from 'vitest';
import { generateSmartWorkoutRoutine } from '../src/lib/workoutEngine/engine';
import { generateWeeklyCalendarFromProposal } from '../src/lib/storage';
import { ensureFullCatalogLoaded } from '../src/data/catalog';
import { ExplainableProposal, UserProfile } from '../src/types';

describe('Sprint 4: Aproveitamento de 100% dos Dados da Escuta', () => {
  beforeAll(async () => {
    await ensureFullCatalogLoaded();
  });

  it('ajusta tempo de descanso extra (+15s) e inclui consideração de saúde na justificativa quando reportado dor/cansaço e healthNotes', () => {
    const profile: Partial<UserProfile> = {
      uid: 'user_escuta_test',
      experienceLevel: 'iniciante',
      availableDays: [1, 3, 5],
      sessionDurationMinutes: 20,
      equipments: ['peso_corporal'],
      avoidedMovements: [],
      practiceObstacles: ['dor', 'cansaco'],
      healthNotes: 'Desconforto leve no ombro direito',
      primaryGoal: 'Construir o hábito e me sentir melhor',
    };

    const proposal = generateSmartWorkoutRoutine(profile);

    expect(proposal.routines.length).toBeGreaterThan(0);
    // Valida que a justificativa citou a observação de saúde
    expect(proposal.justificationText).toContain('Desconforto leve no ombro');
    expect(proposal.justificationText).toContain('recuperação tranquila sem exaustão');

    // Valida que o exercício recebeu descanso maior devido aos obstáculos (base 20s + 15s = 35s para mobilidade ou 45 + 15 = 60s para força)
    const firstRoutine = proposal.routines[0];
    const firstItem = firstRoutine.exercises[0];
    expect(firstItem.restSeconds).toBeGreaterThanOrEqual(35);
  });

  it('atribui timeOfDay correto na agenda gerada a partir do preferredTime do praticante', () => {
    const dummyProposal: ExplainableProposal = {
      id: 'prop_test',
      title: 'Rotina Teste',
      description: 'Teste',
      targetDaysCount: 3,
      sessionDurationMinutes: 20,
      environment: 'em casa',
      equipmentsUsed: ['peso_corporal'],
      avoidedMovements: [],
      justificationText: 'Justificativa',
      timeBreakdownText: 'Breakdown',
      routines: [
        {
          id: 'routine_a',
          ownerUid: 'user_test',
          title: 'Treino A',
          description: '',
          version: 1,
          isProfessional: false,
          estimatedDurationMinutes: 20,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          exercises: [],
        },
      ],
      weeklySchedule: { 1: 'routine_a', 3: 'routine_a', 5: 'routine_a' },
      generatedAt: Date.now(),
      isConfirmed: true,
      hasCompatibleExercises: true,
    };

    const calendar = generateWeeklyCalendarFromProposal('user_test', dummyProposal, 'manha');
    expect(calendar.length).toBe(7);
    expect(calendar[1].timeOfDay).toBe('manha');
    expect(calendar[3].timeOfDay).toBe('manha');
    expect(calendar[5].timeOfDay).toBe('manha');
  });
});
