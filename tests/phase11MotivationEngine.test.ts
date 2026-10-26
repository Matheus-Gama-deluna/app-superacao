import { describe, it, expect } from 'vitest';
import {
  checkAndRegisterPR,
  generateWellbeingInsight,
  evaluateSessionEfficiency,
  calculateCanonicalMetrics,
} from '../src/lib/storage';
import {
  resolveSituationalSet,
  generateSessionFocusInvite,
  getDefaultCopingPlans,
  getDefaultPreparationRitual,
  generateWeeklyProcessReview,
} from '../src/lib/motivationEngine';
import {
  PersonalRecord,
  WorkoutPlan,
  WorkoutSession,
  CalendarDay,
  UserProfile,
} from '../src/types';

describe('Fase 11 — Ecossistema de Motivação Adaptativa, Autonomia e Credibilidade', () => {
  describe('1. Comparabilidade Estrita de PRs (checkAndRegisterPR)', () => {
    it('deve registrar a primeira execução como Linha de Base (isBaseline: true, isPR: false)', () => {
      const res = checkAndRegisterPR('squat_01', 'Agachamento Livre', 10, undefined, [], 'sess_1', 0);
      expect(res.isPR).toBe(false);
      expect(res.isNewBaseline).toBe(true);
      expect(res.updatedPRs).toHaveLength(1);
      expect(res.updatedPRs[0].isBaseline).toBe(true);
      expect(res.updatedPRs[0].bestReps).toBe(10);
      expect(res.updatedPRs[0].bestWeightKg).toBe(0);
    });

    it('NÃO deve declarar PR de repetições se a carga for inferior à do recorde anterior', () => {
      const existingPR: PersonalRecord = {
        exerciseId: 'bench_01',
        exerciseName: 'Supino',
        bestReps: 8,
        bestDurationSeconds: 0,
        bestWeightKg: 20,
        recordedAt: Date.now() - 100000,
        sessionId: 'sess_prev',
        isBaseline: false,
        prCount: 1,
      };

      // Se a pessoa faz 12 reps mas baixa a carga para 0 kg (sem peso), NÃO é PR de repetições em relação ao recorde com 20kg
      const res = checkAndRegisterPR('bench_01', 'Supino', 12, undefined, [existingPR], 'sess_curr', 0);
      expect(res.isPR).toBe(false);
    });

    it('deve declarar PR de repetições se a carga for mantida ou aumentada', () => {
      const existingPR: PersonalRecord = {
        exerciseId: 'squat_01',
        exerciseName: 'Agachamento',
        bestReps: 10,
        bestDurationSeconds: 0,
        bestWeightKg: 10,
        recordedAt: Date.now() - 100000,
        sessionId: 'sess_prev',
        isBaseline: false,
        prCount: 1,
      };

      // Fez 11 reps com os mesmos 10kg
      const res = checkAndRegisterPR('squat_01', 'Agachamento', 11, undefined, [existingPR], 'sess_curr', 10);
      expect(res.isPR).toBe(true);
      expect(res.updatedPRs[0].bestReps).toBe(11);
      expect(res.updatedPRs[0].bestWeightKg).toBe(10);
    });

    it('deve declarar PR de carga e salvar o par real sem fundir reps sem peso com carga máxima', () => {
      const existingPR: PersonalRecord = {
        exerciseId: 'row_01',
        exerciseName: 'Remada',
        bestReps: 15,
        bestDurationSeconds: 0,
        bestWeightKg: 0,
        recordedAt: Date.now() - 100000,
        sessionId: 'sess_prev',
        isBaseline: true,
        prCount: 0,
      };

      // Adicionou carga pela primeira vez: 6 reps com 12kg
      const res = checkAndRegisterPR('row_01', 'Remada', 6, undefined, [existingPR], 'sess_curr', 12);
      expect(res.isPR).toBe(true);
      expect(res.updatedPRs[0].bestWeightKg).toBe(12);
      expect(res.updatedPRs[0].bestRepsAtBestWeight).toBe(6);
      expect(res.updatedPRs[0].maxRepsUnloaded).toBe(15);
    });
  });

  describe('2. Orquestrador Situacional (resolveSituationalSet — C01 a C09)', () => {
    it('deve resolver C09 para plano profissional ou estilo "none"', () => {
      const res = resolveSituationalSet({ motivationStyle: 'none' }, null, []);
      expect(res.setId).toBe('C09_plano_proprio_profissional');
      expect(res.techniques).toContain('T04');
    });

    it('deve resolver C02 para check-in cansado ou obstáculo de falta de tempo', () => {
      const res = resolveSituationalSet({ motivationStyle: 'performance' }, null, [], 'cansado');
      expect(res.setId).toBe('C02_dia_corrido_energia_baixa');
      expect(res.techniques).toContain('T05'); // Versão mínima
    });

    it('deve resolver C05 para estilo "mastery"', () => {
      const res = resolveSituationalSet(
        { motivationStyle: 'mastery', experienceLevel: 'pratica' },
        null,
        [{ id: '1', status: 'completed' } as any, { id: '2', status: 'completed' } as any, { id: '3', status: 'completed' } as any]
      );
      expect(res.setId).toBe('C05_aprendizagem_tecnica');
      expect(res.techniques).toContain('T03');
    });

    it('deve resolver C06 para estilo "wellbeing"', () => {
      const res = resolveSituationalSet(
        { motivationStyle: 'wellbeing', experienceLevel: 'pratica' },
        null,
        [{ id: '1', status: 'completed' } as any, { id: '2', status: 'completed' } as any, { id: '3', status: 'completed' } as any]
      );
      expect(res.setId).toBe('C06_bem_estar_alivio');
      expect(res.techniques).toContain('T08');
    });
  });

  describe('3. Convite de Foco da Sessão Adaptativo (generateSessionFocusInvite)', () => {
    const dummyPlan: WorkoutPlan = {
      id: 'plan_1',
      ownerUid: 'user_1',
      title: 'Treino A',
      description: 'Força Funcional',
      version: 1,
      isProfessional: false,
      estimatedDurationMinutes: 20,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      exercises: [
        {
          exerciseId: 'squat_01',
          exerciseName: 'Agachamento Livre',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 60,
        },
      ],
    };

    it('retorna null quando o estilo é "none" ou plano é profissional', () => {
      const focus = generateSessionFocusInvite(dummyPlan, [], { motivationStyle: 'none' });
      expect(focus).toBeNull();
    });

    it('retorna foco de bem-estar quando o usuário está cansado ou prefere bem-estar', () => {
      const focus = generateSessionFocusInvite(dummyPlan, [], { motivationStyle: 'consistency' }, 'cansado');
      expect(focus).not.toBeNull();
      expect(focus?.type).toBe('wellbeing_flow');
      expect(focus?.badgeText).toBe('Foco de Bem-Estar');
    });

    it('retorna foco técnico quando o estilo é "mastery"', () => {
      const focus = generateSessionFocusInvite(dummyPlan, [], { motivationStyle: 'mastery' });
      expect(focus).not.toBeNull();
      expect(focus?.type).toBe('technical_mastery');
      expect(focus?.cue).toBeDefined();
    });

    it('retorna desafio de PR opcional quando o estilo é "performance" e a energia estiver boa', () => {
      const prs: PersonalRecord[] = [
        {
          exerciseId: 'squat_01',
          exerciseName: 'Agachamento Livre',
          bestReps: 10,
          bestDurationSeconds: 0,
          recordedAt: Date.now(),
          sessionId: 's1',
          isBaseline: false,
          prCount: 1,
        },
      ];
      const focus = generateSessionFocusInvite(dummyPlan, prs, { motivationStyle: 'performance' }, 'disposto');
      expect(focus).not.toBeNull();
      expect(focus?.type).toBe('pr_challenge');
      expect(focus?.targetMark).toBe(11);
    });
  });

  describe('4. Planos Se-Então e Ritual de Preparação (T06 e T07)', () => {
    it('gera planos Se-Então adequados para obstáculos selecionados', () => {
      const plans = getDefaultCopingPlans(['falta_tempo', 'cansaco_mental']);
      expect(plans).toHaveLength(2);
      expect(plans[0].thenActionType).toBe('express_5min');
      expect(plans[1].thenActionType).toBe('soften_25pct');
    });

    it('gera ritual de preparação de 2 passos ancorado na rotina', () => {
      const ritual = getDefaultPreparationRitual('Depois do almoço');
      expect(ritual.anchorTrigger).toBe('Depois do almoço');
      expect(ritual.steps.length).toBeGreaterThanOrEqual(2);
      expect(ritual.enableGuidedImagery).toBe(true);
    });
  });

  describe('5. Denominador Explícito em Bem-Estar (generateWellbeingInsight)', () => {
    it('deve exibir denominador transparente "Em X de Y práticas registradas..."', () => {
      const mockSessions: WorkoutSession[] = [
        {
          id: 's1',
          preMood: 'cansado',
          postMood: 'renovado',
          durationSeconds: 1200,
        } as any,
        {
          id: 's2',
          preMood: 'cansado',
          postMood: 'cansado_bem',
          durationSeconds: 900,
        } as any,
        {
          id: 's3',
          preMood: 'normal',
          postMood: 'leve',
          durationSeconds: 1000,
        } as any,
      ];

      const insight = generateWellbeingInsight(mockSessions);
      expect(insight).not.toBeNull();
      expect(insight?.message).toContain('Em 2 de 2 práticas registradas');
    });
  });

  describe('6. Equivalência Estrita de Fluidez (evaluateSessionEfficiency)', () => {
    it('NÃO deve alegar melhora de fluidez se a sessão foi suavizada ou teve volume menor', () => {
      const s1: WorkoutSession = {
        id: 's1',
        planId: 'plan_A',
        status: 'completed',
        completedAt: 1000,
        feedbackEffort: 4,
        totalSetsPlanned: 6,
        totalSetsCompleted: 6,
        totalRepsCompleted: 60,
        totalVolumeKg: 600,
      } as any;

      const s2Softened: WorkoutSession = {
        id: 's2',
        planId: 'plan_A',
        status: 'completed',
        completedAt: 2000,
        feedbackEffort: 2,
        wasSoftened: true, // Foi suavizada!
        totalSetsPlanned: 6,
        totalSetsCompleted: 6,
        totalRepsCompleted: 45,
        totalVolumeKg: 450,
      } as any;

      const comp = evaluateSessionEfficiency(s2Softened, [s1]);
      expect(comp).toBeNull();
    });

    it('deve declarar ganho de fluidez se cumpriu o mesmo volume com RPE menor', () => {
      const s1: WorkoutSession = {
        id: 's1',
        planId: 'plan_A',
        status: 'completed',
        completedAt: 1000,
        feedbackEffort: 4,
        totalSetsPlanned: 6,
        totalSetsCompleted: 6,
        totalRepsCompleted: 60,
        totalVolumeKg: 600,
      } as any;

      const s2Equiv: WorkoutSession = {
        id: 's2',
        planId: 'plan_A',
        status: 'completed',
        completedAt: 2000,
        feedbackEffort: 3,
        totalSetsPlanned: 6,
        totalSetsCompleted: 6,
        totalRepsCompleted: 60,
        totalVolumeKg: 600,
      } as any;

      const comp = evaluateSessionEfficiency(s2Equiv, [s1]);
      expect(comp).not.toBeNull();
      expect(comp?.improved).toBe(true);
      expect(comp?.previousEffort).toBe(4);
      expect(comp?.currentEffort).toBe(3);
    });
  });

  describe('7. Práticas Externas nas Métricas Canônicas (calculateCanonicalMetrics)', () => {
    it('deve incluir práticas externas no total de treinos concluídos', () => {
      const mockSessions: WorkoutSession[] = [
        {
          id: 's1',
          status: 'completed',
          originType: 'scheduled',
          totalVolumeKg: 200,
        } as any,
        {
          id: 's2',
          status: 'completed',
          originType: 'external_practice',
          externalModality: 'caminhada_corrida',
          totalVolumeKg: 0,
        } as any,
      ];

      const metrics = calculateCanonicalMetrics(mockSessions, [], []);
      expect(metrics.completedWorkoutsCount).toBe(2);
      expect(metrics.totalWorkoutsCount).toBe(2);
    });
  });

  describe('8. Revisão Semanal de Processo (generateWeeklyProcessReview)', () => {
    it('soma práticas completas, parciais e externas e sugere manter a meta equilibrada', () => {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      const sessions: WorkoutSession[] = [
        { id: '1', status: 'completed', date: todayStr, feedbackEffort: 3 } as any,
        { id: '2', status: 'parcial', date: todayStr, feedbackEffort: 3 } as any,
        { id: '3', status: 'completed', originType: 'external_practice', date: todayStr, feedbackEffort: 3 } as any,
      ];

      const review = generateWeeklyProcessReview(sessions, [], 3);
      expect(review.completedCount).toBe(1);
      expect(review.expressOrPartialCount).toBe(1);
      expect(review.externalCount).toBe(1);
      expect(review.averageRpe).toBe(3);
      expect(review.suggestedAction).toBe('maintain');
    });
  });
});
