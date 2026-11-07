import { describe, it, expect, vi } from 'vitest';
import {
  sendMessageToPersonalAssistant,
  fetchTelemetryWeeklyPills,
  getAdminDashboardSnapshot,
  testAdminModelConnection,
} from '../src/lib/aiClient';
import { generateSmartWorkoutRoutine } from '../src/lib/workoutEngine';
import { getPersonalizedExerciseCue } from '../src/lib/aiStudentAssistant';
import { UserProfile, ActiveScreenContext, StructuredClinicalContext } from '../src/types';

describe('Suíte de Integração Frontend: AI Client, Personal Agent & Admin (v9.0)', () => {
  const dummyContext: ActiveScreenContext = {
    currentTab: 'home',
    activeView: 'home',
    isFocusModeActive: false,
    currentExerciseName: 'Agachamento Livre',
    currentExerciseId: 'agachamento_livre',
  };

  const dummyProfile: Partial<UserProfile> = {
    uid: 'test_user_01',
    displayName: 'Mariana Souza',
    reportedLimitations: [],
    avoidedMovements: [],
    availableDays: [1, 3, 5],
    sessionDurationMinutes: 20,
  };

  it('1. Personal IA detecta Bandeira Vermelha médica deterministamente e bloqueia exercício', async () => {
    const proposal = await sendMessageToPersonalAssistant({
      message: 'Estou sentindo uma dor no peito forte e falta de ar',
      activeContext: dummyContext,
      userProfile: dummyProfile as UserProfile,
    });

    expect(proposal.replyPt).toContain('Atenção médica prioritária');
    expect(proposal.actionRequired).toBe(true);
    expect(proposal.activatedSkillIds).toContain('clinical_exercise_pathology');
  });

  it('2. Personal IA detecta desconforto no joelho e propõe substituição segura com dupla confirmação', async () => {
    const proposal = await sendMessageToPersonalAssistant({
      message: 'Meu joelho está doendo muito ao agachar',
      activeContext: dummyContext,
      userProfile: dummyProfile as UserProfile,
    });

    expect(proposal.replyPt).toContain('joelho');
    expect(proposal.requiresConfirmation).toBe(true);
    expect(proposal.proposedDiff).toBeDefined();
    expect(proposal.proposedDiff?.actionType).toBe('swap_exercise');
    expect(proposal.proposedDiff?.replacementNamePt).toContain('Elevação Pélvica');
    expect(proposal.activatedSkillIds).toContain('knee_patellofemoral_rehab');
  });

  it('3. Personal IA detecta cansaço e propõe suavização de sessão (-25%)', async () => {
    const proposal = await sendMessageToPersonalAssistant({
      message: 'Estou muito cansado hoje da rotina de trabalho',
      activeContext: dummyContext,
      userProfile: dummyProfile as UserProfile,
    });

    expect(proposal.replyPt).toContain('25%');
    expect(proposal.proposedDiff?.actionType).toBe('soften_session');
    expect(proposal.requiresConfirmation).toBe(true);
  });

  it('4. getPersonalizedExerciseCue integra com Memória M2 ativa', () => {
    const memoryFacts = [
      {
        id: 'knee_right_patellofemoral',
        labelPt: 'Sensibilidade femoropatelar',
        persistence: 'chronic' as const,
        avoidedMovements: ['agachamento_profundo'],
        protectiveCuePt: 'Mantenha o vetor femoropatelar seguro com tronco levemente inclinado.',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const cue = getPersonalizedExerciseCue('Agachamento com Peso Corporal', [], memoryFacts);
    expect(cue).toContain('Memória Ativa:');
    expect(cue).toContain('Mantenha o vetor femoropatelar seguro');
  });

  it('5. workoutEngine incorpora structuredClinicalContext da IA nas fichas geradas', () => {
    const clinicalContext: StructuredClinicalContext = {
      avoidedMovements: ['impacto_saltos', 'agachamento_profundo'],
      reportedLimitations: ['dor_joelho'],
      jointStressCaps: { knee: 'baixo' },
      preferredFunctionalPatterns: ['hip_hinge', 'pull_horizontal'],
      volumeModifier: 0.9,
      extraRestSeconds: 15,
      protectiveCuesByPattern: {
        squat: 'Cuidado extra com a descida do quadril',
      },
      redFlagsDetected: [],
      summaryPt: 'Adaptação para conforto femoropatelar',
      sourceTextHash: 'hash123',
    };

    const proposal = generateSmartWorkoutRoutine({
      ...dummyProfile,
      structuredClinicalContext: clinicalContext,
    });

    expect(proposal.routines.length).toBeGreaterThan(0);
    expect(proposal.description).toContain('Cuidado clínico personalizado ativo');

    // Verifica que nenhum exercício de alto impacto ou saltos entrou
    for (const routine of proposal.routines) {
      for (const ex of routine.exercises) {
        expect(ex.exerciseName.toLowerCase()).not.toContain('jump');
        expect(ex.exerciseName.toLowerCase()).not.toContain('salto');
      }
    }
  });

  it('6. Admin Dashboard snapshot retorna configuração válida e métricas de telemetria', async () => {
    const snapshot = await getAdminDashboardSnapshot();
    expect(snapshot.config).toBeDefined();
    expect(snapshot.config.models.master_personal.primaryModel).toBe('zai-org/GLM-5.3');
    expect(snapshot.config.dailyHardStopUsd).toBe(5.0);
    expect(snapshot.metrics).toBeDefined();
    expect(snapshot.metrics.estimatedCostUsd).toBeGreaterThanOrEqual(0);
  });

  it('7. Admin Playground executa teste de conexão sem gasto de tokens', async () => {
    const res = await testAdminModelConnection('master_personal');
    expect(res.success).toBe(true);
    expect(res.latencyMs).toBeGreaterThan(0);
    expect(res.responsePreview).toContain('Simulação Segura R$ 0,00');
  });
});
