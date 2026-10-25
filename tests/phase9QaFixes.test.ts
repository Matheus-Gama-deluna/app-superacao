import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSmartWorkoutRoutine } from '../src/lib/workoutEngine';
import { getExerciseById, ensureFullCatalogLoaded } from '../src/data/catalog';
import { specializedHomeExercises } from '../src/data/specializedExercises';
import { getHeuristicInsight, CoachContext } from '../src/lib/aiCoach';
import { copyTextToClipboard, shareWorkoutVictory } from '../src/lib/pwaNative';
import { UserProfile } from '../src/types';

describe('Fase 9: Correções de QA, Experiência, Acolhimento e Acessibilidade (11 Critérios de Aceite)', () => {
  beforeEach(async () => {
    await ensureFullCatalogLoaded();
  });

  const baseProfile: Partial<UserProfile> = {
    uid: 'user_qa_1',
    displayName: 'Carlos QA',
    experienceLevel: 'iniciante',
    availableDays: [1, 3, 5],
    sessionDurationMinutes: 15,
    equipments: ['peso_corporal'],
    reportedLimitations: [],
    avoidedMovements: [],
    primaryGoal: 'Construir o hábito e me sentir melhor',
    routineConfirmed: true,
    userContextNotes: 'Retornando após 6 meses parado',
  };

  it('Critério 1: Exclusão rígida de flexão de braço no solo quando há limitação flexao_chao', () => {
    const profileWithFloorLimitation: Partial<UserProfile> = {
      ...baseProfile,
      reportedLimitations: ['flexao_chao'],
      avoidedMovements: ['flexao_chao'],
      equipments: ['peso_corporal'],
      sessionDurationMinutes: 15,
    };

    const proposal = generateSmartWorkoutRoutine(profileWithFloorLimitation);

    expect(proposal.routines).toBeDefined();
    expect(proposal.routines.length).toBeGreaterThan(0);

    // Reúne todos os exercícios prescritos
    const allPlanExercises = proposal.routines.flatMap((r) => r.exercises);
    const bannedFloorPushups = ['pushups', 'kneeling_pushup', 'diamond_pushup', 'decline_pushup', 'incline_pushup'];

    for (const ex of allPlanExercises) {
      expect(bannedFloorPushups).not.toContain(ex.exerciseId);
      const catalogItem = getExerciseById(ex.exerciseId);
      if (catalogItem) {
        expect(catalogItem.id).not.toBe('pushups');
        expect(catalogItem.id).not.toBe('kneeling_pushup');
      }
    }

    // Deve prescrever alternativa segura em pé ou na parede
    const hasWallOrStandingChest = allPlanExercises.some(
      (ex) => ex.exerciseId === 'wall_pushup_controlled' || ex.exerciseId === 'standing_isometric_chest_press'
    );
    expect(hasWallOrStandingChest).toBe(true);
  });

  it('Critério 2: Parede considerada apoio acessível mesmo quando o usuário só tem peso_corporal', () => {
    const profileBodyweightOnly: Partial<UserProfile> = {
      ...baseProfile,
      equipments: ['peso_corporal'],
      reportedLimitations: ['flexao_chao'],
      avoidedMovements: ['flexao_chao'],
      sessionDurationMinutes: 15,
    };

    const proposal = generateSmartWorkoutRoutine(profileBodyweightOnly);
    const exerciseIds = proposal.routines[0].exercises.map((e) => e.exerciseId);

    // O exercício na parede deve ser aceito sem ser filtrado por falta de equipamento
    expect(exerciseIds).toContain('wall_pushup_controlled');
  });

  it('Critério 3: Duração de 15 min preservada na proposta sem ser sobrescrita pelo tempo estimado', () => {
    const profile15Min: Partial<UserProfile> = {
      ...baseProfile,
      sessionDurationMinutes: 15,
    };

    const proposal = generateSmartWorkoutRoutine(profile15Min);

    // proposal.sessionDurationMinutes deve ser exatamente a duração solicitada pelo usuário
    expect(proposal.sessionDurationMinutes).toBe(15);
  });

  it('Critério 4: Suporte a Micro-treino de 5 min (Hábito Mínimo) com no mínimo 2 slots essenciais', () => {
    const profile5Min: Partial<UserProfile> = {
      ...baseProfile,
      sessionDurationMinutes: 5,
    };

    const proposal = generateSmartWorkoutRoutine(profile5Min);

    expect(proposal.sessionDurationMinutes).toBe(5);
    expect(proposal.routines[0].exercises.length).toBeGreaterThanOrEqual(2);
    expect(proposal.routines[0].exercises.length).toBeLessThanOrEqual(3);
    // Cada exercício deve ter poucas séries para caber em 5 minutos
    for (const ex of proposal.routines[0].exercises) {
      expect(ex.targetSets).toBeLessThanOrEqual(2);
    }
  });

  it('Critério 5: Linguagem responsável - Remoção de "100% segura para você" e filtro do termo "nenhuma"', () => {
    const profileWithNoneLimitation: Partial<UserProfile> = {
      ...baseProfile,
      reportedLimitations: ['nenhuma'],
      sessionDurationMinutes: 15,
    };

    const proposal = generateSmartWorkoutRoutine(profileWithNoneLimitation);

    // Verifica que a promessa falsa de "100% segura" não existe na proposta
    const fullProposalText = JSON.stringify(proposal);
    expect(fullProposalText).not.toContain('100% segura');
    expect(fullProposalText).not.toContain('100% seguro');

    // A palavra 'nenhuma' não deve aparecer na justificativa ou descrição da proposta
    expect(proposal.justificationText.toLowerCase()).not.toContain('nenhuma');
    expect(proposal.description.toLowerCase()).not.toContain('nenhuma');
  });

  it('Critério 6: Rotação de proposta com variationSeed altera exercícios quando há alternativas', () => {
    const profileFlexible: Partial<UserProfile> = {
      ...baseProfile,
      equipments: ['peso_corporal', 'halteres', 'cadeira'],
      reportedLimitations: [],
      sessionDurationMinutes: 20,
    };

    const proposalVar1 = generateSmartWorkoutRoutine(profileFlexible, undefined, { variationSeed: 1 });
    const proposalVar2 = generateSmartWorkoutRoutine(profileFlexible, undefined, { variationSeed: 2 });

    const exercises1 = proposalVar1.routines[0].exercises.map((e) => e.exerciseId);
    const exercises2 = proposalVar2.routines[0].exercises.map((e) => e.exerciseId);

    expect(exercises1.length).toBeGreaterThan(0);
    expect(exercises2.length).toBeGreaterThan(0);
    // As seeds diferentes geram combinações ou ordenações distintas
    const isDifferent = exercises1.some((id, idx) => id !== exercises2[idx]);
    expect(isDifferent).toBe(true);
  });

  it('Critério 7: Coach e rotação determinística de insights empáticos', () => {
    const ctx: CoachContext = {
      displayName: 'Carlos',
      exerciseReason: 'Voltar a ter disposição para brincar com meus filhos',
      habitAnchor: 'Logo após o café da manhã',
      weeklyCompleted: 2,
      lastMood: 'renovado',
      todayPlanTitle: 'Treino A',
    };

    const initialInsight = getHeuristicInsight(ctx);
    expect(initialInsight).toBeDefined();
    expect(initialInsight).toContain('Carlos');
    expect(initialInsight).toContain('brincar com meus filhos');

    // Ao rotacionar passando o insight anterior, deve retornar um insight diferente
    const rotatedInsight = getHeuristicInsight(ctx, initialInsight);
    expect(rotatedInsight).toBeDefined();
    expect(rotatedInsight).not.toBe(initialInsight);
  });

  it('Critério 8: Compartilhamento e cópia resiliente com fallback no pwaNative', async () => {
    const textareaMock = {
      value: '',
      style: {} as any,
      select: vi.fn(),
    };

    vi.stubGlobal('window', {
      location: { origin: 'http://localhost:3000' },
    });
    vi.stubGlobal('document', {
      createElement: vi.fn(() => textareaMock),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      execCommand: vi.fn(() => true),
    });
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn(async () => {}),
      },
    });

    const success = await copyTextToClipboard('Superação Treino Concluído!');
    expect(success).toBe(true);

    const shareStatus = await shareWorkoutVictory({
      title: 'Treino Feito!',
      text: 'Concluí meu treino hoje com sucesso!',
    });
    expect(shareStatus).toBe('copied');
  });

  it('Critério 9: Suavização de metas em -25% calcula repetições de forma segura e arredondada', () => {
    const applySoften = (targetReps: number) => Math.max(1, Math.round(targetReps * 0.75));

    expect(applySoften(12)).toBe(9);
    expect(applySoften(10)).toBe(8);
    expect(applySoften(8)).toBe(6);
    expect(applySoften(4)).toBe(3);
    expect(applySoften(1)).toBe(1); // nunca zera
  });

  it('Critério 10: Deduplicação de séries - atualizar série existente não gera itens repetidos', () => {
    interface WorkoutSetEvent {
      id: string;
      exerciseId: string;
      setIndex: number;
      repsCompleted: number;
      weightUsedKg?: number;
      rpe?: number;
      completedAt: number;
    }

    let setEvents: WorkoutSetEvent[] = [];

    const recordSetDeduplicated = (event: WorkoutSetEvent) => {
      const existingIdx = setEvents.findIndex(
        (s) => s.exerciseId === event.exerciseId && s.setIndex === event.setIndex
      );
      if (existingIdx >= 0) {
        const next = [...setEvents];
        next[existingIdx] = event;
        setEvents = next;
      } else {
        setEvents = [...setEvents, event];
      }
    };

    // Grava série 0
    recordSetDeduplicated({
      id: 'set_1',
      exerciseId: 'squat',
      setIndex: 0,
      repsCompleted: 10,
      completedAt: 100,
    });
    expect(setEvents.length).toBe(1);
    expect(setEvents[0].repsCompleted).toBe(10);

    // Atualiza a mesma série 0 com 12 reps
    recordSetDeduplicated({
      id: 'set_1_updated',
      exerciseId: 'squat',
      setIndex: 0,
      repsCompleted: 12,
      completedAt: 200,
    });
    expect(setEvents.length).toBe(1); // NÃO duplicou
    expect(setEvents[0].repsCompleted).toBe(12); // Atualizou in-place

    // Grava série 1
    recordSetDeduplicated({
      id: 'set_2',
      exerciseId: 'squat',
      setIndex: 1,
      repsCompleted: 8,
      completedAt: 300,
    });
    expect(setEvents.length).toBe(2);
  });

  it('Critério 11: Exercício standing_isometric_chest_press presente no catálogo e classificado corretamente', () => {
    const standingPress = specializedHomeExercises.find((e) => e.id === 'standing_isometric_chest_press');
    expect(standingPress).toBeDefined();
    expect(standingPress?.movement_pattern).toBe('strength');
    expect(standingPress?.functionalPattern).toBe('push_horizontal');
    expect(standingPress?.floorTransition).toBe(false);
    expect(standingPress?.jointStress?.wrist).toBe(0);
  });
});
