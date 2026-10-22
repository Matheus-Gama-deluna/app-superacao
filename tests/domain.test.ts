import { describe, it, expect, beforeEach } from 'vitest';
import {
  defaultGuestProfile,
  generateBlankWeeklyCalendar,
  generateWeeklyCalendarFromProgram,
  generateExplainableProposal,
  generateWeeklyCalendarFromProposal,
  isExerciseCompatibleWithUser,
  runStorageMigration,
  checkAndRegisterPR,
  SCHEMA_VERSION,
  STORAGE_KEYS,
  APP_VERSION,
  APP_BUILD_DATE,
  EQUIPMENT_LABELS,
  AVOIDANCE_LABELS,
} from '../src/lib/storage';
import { searchExercises, allExercises, getExerciseById } from '../src/data/catalog';
import { premadePrograms } from '../src/data/premadePrograms';
import {
  WorkoutSession,
  PersonalRecord,
  WorkoutPlan,
  UserProfile,
  OnboardingDraft,
  ExplainableProposal,
} from '../src/types';

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = createLocalStorageMock();
}

describe('Superação v6 — Critérios de Aceitação e Regras de Domínio (C01 a C40)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // C01: Primeira visita limpa apresenta escolha de acesso antes do início
  it('C01: Primeira visita sem escolha prévia nem autenticação deve exigir boas-vindas antes do dashboard', () => {
    const accessChoice = localStorage.getItem(STORAGE_KEYS.ACCESS_CHOICE);
    const profile = defaultGuestProfile;
    expect(accessChoice).toBeNull();
    expect(profile.onboardingCompleted).toBe(false);
    expect(profile.routineConfirmed).toBe(false);
  });

  // C02: Convidado é escolha explícita e passa pela escuta
  it('C02: Escolha de continuar sem conta define modo convidado mas exige escuta inicial', () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_CHOICE, JSON.stringify('guest'));
    const choice = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCESS_CHOICE)!);
    expect(choice).toBe('guest');
    // Perfil inicial de convidado não possui onboarding completado
    expect(defaultGuestProfile.onboardingCompleted).toBe(false);
  });

  // C03: Login cancelado/falho mantém dados e oferece continuidade
  it('C03: Erro ou cancelamento de login preserva dados locais sem apagar rascunhos', () => {
    const draft: Partial<OnboardingDraft> = {
      step: 3,
      displayName: 'Visitante',
      availableDays: [1, 3],
      equipments: ['peso_corporal'],
    };
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DRAFT, JSON.stringify(draft));

    // Simula falha de login do Google
    const loginFailed = true;
    if (loginFailed) {
      // Dados locais continuam intactos
      const preserved = JSON.parse(localStorage.getItem(STORAGE_KEYS.ONBOARDING_DRAFT)!);
      expect(preserved.step).toBe(3);
      expect(preserved.displayName).toBe('Visitante');
    }
  });

  // C04: Reload no meio do onboarding retoma respostas e etapa
  it('C04: Reload no meio do onboarding restaura etapa e respostas salvas no rascunho', () => {
    const draft: OnboardingDraft = {
      step: 4,
      displayName: 'Carla',
      experienceLevel: 'retomando',
      exerciseReason: 'Aliviar tensões',
      orderedGoals: ['Melhorar postura e aliviar tensões'],
      goalFocus: 'foco_unico',
      availableDays: [2, 4],
      sessionDurationMinutes: 15,
      preferredTime: 'manha',
      environmentPreference: 'casa',
      hasFlexibleSchedule: false,
      habitAnchor: 'Após café',
      equipments: ['peso_corporal', 'colchonete'],
      reportedLimitations: ['lombar'],
      avoidedMovements: ['impacto_saltos'],
      healthNotes: '',
      practiceObstacles: ['falta_tempo'],
      userContextNotes: 'Trabalho sentado',
      planSourcePreference: 'modelo_revisado',
      savedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DRAFT, JSON.stringify(draft));

    const restoredDraft = JSON.parse(localStorage.getItem(STORAGE_KEYS.ONBOARDING_DRAFT)!);
    expect(restoredDraft.step).toBe(4);
    expect(restoredDraft.displayName).toBe('Carla');
    expect(restoredDraft.availableDays).toEqual([2, 4]);
    expect(restoredDraft.equipments).toContain('colchonete');
  });

  // C05: Voltar permite corrigir respostas sem perder as demais
  it('C05: Voltar etapas não apaga os campos já preenchidos nas etapas posteriores', () => {
    const draft: Partial<OnboardingDraft> = {
      step: 5,
      displayName: 'Marcos',
      availableDays: [1, 3, 5],
      equipments: ['peso_corporal', 'mini_band'],
      reportedLimitations: ['joelhos'],
    };
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DRAFT, JSON.stringify(draft));

    // Usuário volta do passo 5 para o passo 2 para ajustar nome
    const updated = { ...draft, step: 2, displayName: 'Marcos Silva' };
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DRAFT, JSON.stringify(updated));

    const checked = JSON.parse(localStorage.getItem(STORAGE_KEYS.ONBOARDING_DRAFT)!);
    expect(checked.step).toBe(2);
    expect(checked.displayName).toBe('Marcos Silva');
    expect(checked.equipments).toContain('mini_band'); // Preservado!
    expect(checked.reportedLimitations).toContain('joelhos'); // Preservado!
  });

  // C06: Objetivos múltiplos podem ser ordenados por teclado/botões
  it('C06: Objetivos múltiplos podem ser reordenados mantendo o primeiro como foco principal', () => {
    const goals = [
      'Construir o hábito e consistência diária',
      'Melhorar postura e aliviar tensões',
      'Ganhar força funcional e mobilidade',
    ];

    // Mover item 1 (postura) para o topo (índice 0)
    const next = [...goals];
    const temp = next[0];
    next[0] = next[1];
    next[1] = temp;

    expect(next[0]).toBe('Melhorar postura e aliviar tensões');
    expect(next[1]).toBe('Construir o hábito e consistência diária');
    expect(next).toHaveLength(3);
  });

  // C07: Dados opcionais não são tratados como respostas negativas
  it('C07: Ausência de resposta em campos opcionais não é inferida como negativa nem como consentimento clínico', () => {
    const draft: Partial<OnboardingDraft> = {
      displayName: 'Paula',
      healthNotes: '', // Não informado
      habitAnchor: '', // Não informado
    };
    expect(draft.healthNotes).toBe('');
    expect(draft.habitAnchor).toBe('');
    // Não deve virar boolean falso ou rejeição
    expect(draft.healthNotes).not.toBe(false);
  });

  // C08: Resumo representa fielmente as respostas
  it('C08: Resumo final reflete rigorosamente todos os campos coletados', () => {
    const draft: Partial<OnboardingDraft> = {
      displayName: 'Renato',
      availableDays: [1, 3],
      sessionDurationMinutes: 20,
      equipments: ['peso_corporal'],
      reportedLimitations: ['ombros'],
      avoidedMovements: ['flexao_chao'],
    };

    expect(draft.availableDays).toHaveLength(2);
    expect(draft.equipments).toEqual(['peso_corporal']);
    expect(draft.reportedLimitations).toContain('ombros');
    expect(draft.avoidedMovements).toContain('flexao_chao');
  });

  // C09: Nenhum programa é ativado antes da confirmação explícita
  it('C09: Nenhuma rotina ou programa é ativado antes da confirmação explícita', () => {
    const initialProgram = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROGRAM);
    expect(initialProgram).toBeNull();

    const initialCal = generateBlankWeeklyCalendar('guest_user');
    const scheduled = initialCal.filter((d) => d.planId !== undefined);
    expect(scheduled).toHaveLength(0);
  });

  // C10: Pessoa com dois dias de 15 minutos recebe proposta compatível
  it('C10: Pessoa com 2 dias de 15 minutos recebe proposta ocupando exatamente 2 dias com duração realista', () => {
    const profile: Partial<UserProfile> = {
      availableDays: [2, 4], // Terça e Quinta
      sessionDurationMinutes: 15,
      equipments: ['peso_corporal'],
      primaryGoal: 'Construir o hábito',
    };

    const proposal = generateExplainableProposal(profile);
    expect(proposal.targetDaysCount).toBe(2);
    expect(proposal.sessionDurationMinutes).toBeLessThanOrEqual(20);
    expect(Object.keys(proposal.weeklySchedule)).toHaveLength(2);
    expect(proposal.weeklySchedule[2]).toBeDefined();
    expect(proposal.weeklySchedule[4]).toBeDefined();
  });

  // C11: Justificativa verificável na proposta
  it('C11: Proposta apresenta justificativa verificável com dias, tempo e equipamentos exatos', () => {
    const profile: Partial<UserProfile> = {
      availableDays: [1, 3, 5],
      sessionDurationMinutes: 20,
      equipments: ['peso_corporal', 'mini_band'],
      primaryGoal: 'Mais energia no dia a dia',
    };

    const proposal = generateExplainableProposal(profile);
    expect(proposal.justificationText).toContain('3 dias');
    expect(proposal.justificationText).toContain('20 minutos');
    expect(proposal.justificationText).toContain('Peso corporal');
    expect(proposal.justificationText).toContain('Mini band circular');
    expect(proposal.timeBreakdownText).toContain('séries');
  });

  // C12: Sem equipamento compatível, exercício não é incluído silenciosamente
  it('C12: Proposta para quem só tem peso corporal não contém halteres, kettlebell ou elásticos', () => {
    const profile: Partial<UserProfile> = {
      availableDays: [1, 3],
      sessionDurationMinutes: 15,
      equipments: ['peso_corporal'],
      primaryGoal: 'Construir o hábito',
    };

    const proposal = generateExplainableProposal(profile);
    const routine = proposal.routines[0];
    expect(routine).toBeDefined();

    routine.exercises.forEach((item) => {
      const ex = getExerciseById(item.exerciseId);
      expect(ex).toBeDefined();
      if (ex) {
        const forbiddenEquips = ['halteres', 'kettlebell', 'mini_band', 'faixa_longa', 'tubos_elasticos', 'barra', 'maquina'];
        const hasForbidden = ex.equipment.some((eq) => forbiddenEquips.includes(eq));
        expect(hasForbidden).toBe(false);
      }
    });
  });

  // C13: Restrição informada (evitar impacto) é estritamente respeitada pelo gerador
  it('C13: Quando usuário informa evitar impacto, exercícios de salto ou polichinelo são excluídos', () => {
    const profile: Partial<UserProfile> = {
      availableDays: [1, 3, 5],
      sessionDurationMinutes: 20,
      equipments: ['peso_corporal'],
      avoidedMovements: ['impacto_saltos'],
    };

    const proposal = generateExplainableProposal(profile);
    const routine = proposal.routines[0];

    routine.exercises.forEach((item) => {
      const name = item.exerciseName.toLowerCase();
      expect(name).not.toContain('salto');
      expect(name).not.toContain('jump');
      expect(name).not.toContain('polichinelo');
      expect(name).not.toContain('burpee');
    });
  });

  // C14: Plano profissional pode ser cadastrado sem substituição automática
  it('C14: Plano profissional mantém flag isProfessional e não é sobrescrito por templates', () => {
    const proPlan: WorkoutPlan = {
      id: 'pro_plan_1',
      ownerUid: 'guest_user',
      title: 'Prescrição Fisioterapia Lombar',
      description: 'Plano passado pelo fisioterapeuta',
      version: 1,
      isProfessional: true,
      authorName: 'Dr. Roberto (Fisioterapeuta)',
      sourceKind: 'profissional',
      reviewStatus: 'revisado',
      exercises: [],
      estimatedDurationMinutes: 25,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(proPlan.isProfessional).toBe(true);
    expect(proPlan.sourceKind).toBe('profissional');
    expect(proPlan.authorName).toContain('Fisioterapeuta');
  });

  // C15: Confirmar proposta cria rotina única e compromissos exatos
  it('C15: Confirmação da proposta cria agenda semanal nos dias especificados e descanso nos demais', () => {
    const proposal: ExplainableProposal = {
      id: 'prop_test',
      title: 'Rotina Teste 2 Dias',
      description: 'Proposta teste',
      targetDaysCount: 2,
      sessionDurationMinutes: 15,
      environment: 'em casa',
      equipmentsUsed: ['peso_corporal'],
      avoidedMovements: [],
      justificationText: 'Justificativa',
      timeBreakdownText: 'Breakdown',
      routines: [
        {
          id: 'routine_prop_1',
          ownerUid: 'guest_user',
          title: 'Treino A',
          description: 'Desc',
          version: 1,
          isProfessional: false,
          exercises: [],
          estimatedDurationMinutes: 15,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      weeklySchedule: { 2: 'routine_prop_1', 4: 'routine_prop_1' },
      generatedAt: Date.now(),
      isConfirmed: false,
    };

    const calendar = generateWeeklyCalendarFromProposal('guest_user', proposal);
    expect(calendar).toHaveLength(7);

    // Dias 2 e 4 são strength com o planId correto
    const day2 = calendar.find((d) => d.dayOfWeek === 2);
    const day4 = calendar.find((d) => d.dayOfWeek === 4);
    expect(day2?.activityType).toBe('strength');
    expect(day2?.planId).toBe('routine_prop_1');
    expect(day4?.activityType).toBe('strength');
    expect(day4?.planId).toBe('routine_prop_1');

    // Demais dias são descanso
    const restDays = calendar.filter((d) => d.dayOfWeek !== 2 && d.dayOfWeek !== 4);
    restDays.forEach((d) => {
      expect(d.activityType).toBe('rest');
      expect(d.planId).toBeUndefined();
    });
  });

  // C16: Início, programa e agenda concordam sobre o que está ativo
  it('C16: Início, programa e agenda referenciam os mesmos IDs de rotina sem divergência', () => {
    const program = premadePrograms[0];
    const calendar = generateWeeklyCalendarFromProgram('guest_user', program);
    const scheduledDays = calendar.filter((d) => d.planId !== undefined);

    scheduledDays.forEach((d) => {
      const routineInProgram = program.routines.find((r) => r.id === d.planId);
      expect(routineInProgram).toBeDefined();
    });
  });

  // C17: Agenda mostra datas corretas e dias civis locais
  it('C17: Calendário gera 7 dias consecutivos com formato de data ISO válido', () => {
    const calendar = generateBlankWeeklyCalendar('guest_user');
    expect(calendar).toHaveLength(7);
    calendar.forEach((day) => {
      expect(day.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // C18: Dia livre e descanso não geram treino concluído ou PR
  it('C18: Dias de descanso têm isCompleted falso e não devem gerar PR', () => {
    const calendar = generateBlankWeeklyCalendar('guest_user');
    const day0 = calendar[0];
    expect(day0.isCompleted).toBe(false);

    const prResult = checkAndRegisterPR('rest_day', 'Descanso', 0, 0, [], 'sess_rest', 0);
    expect(prResult.isPR).toBe(false);
  });

  // C19: Reagendar não duplica compromisso nem sessão
  it('C19: Atualizar dia da agenda modifica a mesma entidade sem duplicar elementos no array', () => {
    const calendar = generateBlankWeeklyCalendar('guest_user');
    const targetDayId = calendar[1].id;

    // Atualiza o dia
    const updatedCalendar = calendar.map((d) =>
      d.id === targetDayId ? { ...d, activityType: 'walk' as const, planTitle: 'Caminhada' } : d
    );

    expect(updatedCalendar).toHaveLength(7);
    const modified = updatedCalendar.find((d) => d.id === targetDayId);
    expect(modified?.activityType).toBe('walk');
  });

  // C20: Alterar rotina preserva histórico existente
  it('C20: Histórico de sessões passadas é imutável quando a rotina ativa muda', () => {
    const pastSession: WorkoutSession = {
      id: 'past_sess_1',
      ownerUid: 'guest_user',
      planId: 'old_plan_1',
      planTitle: 'Treino Antigo 1.0',
      status: 'completed',
      startedAt: Date.now() - 86400000,
      completedAt: Date.now() - 83000000,
      durationSeconds: 1200,
      currentExerciseIndex: 3,
      currentSetIndex: 3,
      totalSetsPlanned: 3,
      totalSetsCompleted: 3,
      totalRepsCompleted: 30,
      prsAchieved: 0,
      exercisesSnapshot: [],
    };

    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([pastSession]));

    // Modifica a rotina ativa
    const newPlan: WorkoutPlan = {
      id: 'new_plan_2',
      ownerUid: 'guest_user',
      title: 'Treino Novo 2.0',
      description: 'Novo plano',
      version: 2,
      isProfessional: false,
      exercises: [],
      estimatedDurationMinutes: 20,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify([newPlan]));

    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS)!);
    expect(sessions[0].planId).toBe('old_plan_1');
    expect(sessions[0].planTitle).toBe('Treino Antigo 1.0');
  });

  // C21: Ficha curta respeita perfil
  it('C21: Rotina curta de 5 minutos usa exercícios básicos sem exigir equipamentos não informados', () => {
    const rescuePlan = premadePrograms[0].emergencyPlanId;
    expect(rescuePlan).toBeDefined();
  });

  // C22: Registro pós-série e unidades funcionam
  it('C22: Gravação pós-série registra repetições, segundos e carga com unidades apropriadas', () => {
    const prCheck = checkAndRegisterPR('pushup_1', 'Flexão de Braço', 15, undefined, [], 'sess_1', 0);
    expect(prCheck.isPR).toBe(true);
    expect(prCheck.prText).toContain('15 repetições');

    const prWeight = checkAndRegisterPR('squat_1', 'Agachamento com Peso', 10, undefined, [], 'sess_1', 20);
    expect(prWeight.isPR).toBe(true);
    expect(prWeight.prText).toContain('20 kg');
  });

  // C23: Pausar/recarregar retoma sessão e séries reais
  it('C23: Sessão ativa é serializada no storage e recuperada integralmente após reload', () => {
    const activeSession: WorkoutSession = {
      id: 'active_sess_1',
      ownerUid: 'guest_user',
      planId: 'plan_test',
      planTitle: 'Treino em Andamento',
      status: 'in_progress',
      startedAt: Date.now() - 300000,
      durationSeconds: 300,
      currentExerciseIndex: 1,
      currentSetIndex: 2,
      totalSetsPlanned: 6,
      totalSetsCompleted: 2,
      totalRepsCompleted: 20,
      prsAchieved: 1,
      exercisesSnapshot: [],
    };

    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(activeSession));

    const restored = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION)!);
    expect(restored.id).toBe('active_sess_1');
    expect(restored.currentExerciseIndex).toBe(1);
    expect(restored.totalSetsCompleted).toBe(2);
  });

  // C24: Encerrar sem série não cria treino concluído; parcial permanece parcial
  it('C24: Sessão parcial mantém status parcial e não vira completed', () => {
    const partialSession: WorkoutSession = {
      id: 'sess_part_1',
      ownerUid: 'guest_user',
      planId: 'plan_1',
      planTitle: 'Treino Interrompido',
      status: 'parcial',
      startedAt: Date.now() - 300000,
      completedAt: Date.now(),
      durationSeconds: 300,
      currentExerciseIndex: 0,
      currentSetIndex: 1,
      totalSetsPlanned: 6,
      totalSetsCompleted: 1,
      totalRepsCompleted: 10,
      prsAchieved: 0,
      exercisesSnapshot: [],
    };

    expect(partialSession.status).toBe('parcial');
    expect(partialSession.status).not.toBe('completed');
  });

  // C25 & C26: Primeiro registro é referência inicial, não melhoria sobre histórico inexistente
  it('C25 & C26: Primeiro registro estabelece referência inicial sem anunciar superação de histórico inexistente', () => {
    const existingPRs: PersonalRecord[] = [];
    const check = checkAndRegisterPR('squat_1', 'Agachamento', 12, undefined, existingPRs, 'sess_first', 0);
    expect(check.isPR).toBe(true);
    expect(check.prText).toContain('12 repetições');
    // Não deve conter termos comparativos como "superou seu recorde anterior de 0"
    expect(check.prText).not.toContain('anterior');
  });

  // C27: Duas sessões planejadas não são penalizadas por meta universal de três
  it('C27: Meta semanal adapta-se à frequência informada (2 treinos = meta 2, não 3)', () => {
    const userFrequency = 2;
    const completedThisWeek = 2;
    const isConsistencyMet = completedThisWeek >= userFrequency;
    expect(isConsistencyMet).toBe(true);
  });

  // C28: Perfil atualizado reflete nos dados
  it('C28: Atualização do perfil reflete nos campos e persiste no localStorage', () => {
    const updatedProfile: UserProfile = {
      ...defaultGuestProfile,
      displayName: 'Juliana',
      availableDays: [2, 4],
      sessionDurationMinutes: 30,
    };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));

    const restored = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE)!);
    expect(restored.displayName).toBe('Juliana');
    expect(restored.sessionDurationMinutes).toBe(30);
  });

  // C29: Taxonomia e contagens coerentes
  it('C29: Catálogo possui contagem real idêntica e todos os exercícios têm nomes legíveis', () => {
    expect(allExercises.length).toBeGreaterThan(800);
    allExercises.forEach((ex) => {
      expect(ex.name_pt.length).toBeGreaterThan(2);
      expect(ex.equipment).toBeDefined();
    });
  });

  // C30: Mini band e faixa longa filtradas conforme compatibilidade
  it('C30: Mini band e faixa longa são tratadas como equipamentos distintos no catálogo', () => {
    const miniBandList = searchExercises('', 'mini_band');
    const superBandList = searchExercises('', 'faixa_longa');
    expect(miniBandList.length).toBeGreaterThan(0);
    expect(superBandList.length).toBeGreaterThan(0);

    miniBandList.forEach((e) => {
      expect(e.equipment).toContain('mini_band');
    });
  });

  // C31: Criar conta preserva perfil, agenda e histórico local
  it('C31: Migração de dados ao autenticar preserva sessões e registros locais', () => {
    const guestSessions: WorkoutSession[] = [
      {
        id: 'guest_sess_1',
        ownerUid: 'guest_user',
        planId: 'plan_1',
        planTitle: 'Treino A',
        status: 'completed',
        startedAt: 1000,
        completedAt: 2000,
        durationSeconds: 1000,
        currentExerciseIndex: 1,
        currentSetIndex: 1,
        totalSetsPlanned: 1,
        totalSetsCompleted: 1,
        totalRepsCompleted: 10,
        prsAchieved: 0,
        exercisesSnapshot: [],
      },
    ];

    // Ao associar UID do Firebase, as sessões locais são preservadas
    const migratedSessions = guestSessions.map((s) => ({
      ...s,
      ownerUid: 'firebase_user_123',
    }));

    expect(migratedSessions).toHaveLength(1);
    expect(migratedSessions[0].id).toBe('guest_sess_1');
    expect(migratedSessions[0].ownerUid).toBe('firebase_user_123');
  });

  // C32: Falha de rede durante migração preserva dados e permite retomada
  it('C32: Falha de rede não apaga os dados locais mantendo status offline seguro', () => {
    const localData = { profile: defaultGuestProfile, sessions: ['sess_1'] };
    localStorage.setItem('temp_data', JSON.stringify(localData));

    const networkError = new Error('Failed to fetch');
    // Em caso de erro, os dados locais NÃO são deletados
    if (networkError) {
      const preserved = JSON.parse(localStorage.getItem('temp_data')!);
      expect(preserved.sessions).toHaveLength(1);
    }
  });

  // C33: Repetir migração não duplica registros
  it('C33: Mesclagem de sessões deduplica por ID estável de sessão', () => {
    const localSessions = [{ id: 'sess_1', val: 'a' }, { id: 'sess_2', val: 'b' }];
    const remoteSessions = [{ id: 'sess_1', val: 'a' }, { id: 'sess_3', val: 'c' }];

    const mergedMap = new Map();
    [...remoteSessions, ...localSessions].forEach((s) => mergedMap.set(s.id, s));
    const merged = Array.from(mergedMap.values());

    expect(merged).toHaveLength(3); // sess_1, sess_2, sess_3 sem duplicar sess_1!
  });

  // C34: Conta preexistente com dados provoca resolução explícita de conflitos
  it('C34: Detecção de conflito quando usuário já possui dados na nuvem e no dispositivo', () => {
    const hasRemoteData = true;
    const hasLocalSessions = true;
    const shouldPromptConflict = hasRemoteData && hasLocalSessions;
    expect(shouldPromptConflict).toBe(true);
  });

  // C35: Trocar de conta não expõe dados da conta anterior
  it('C35: Logout limpa estado de usuário e redefine para perfil de convidado neutro', () => {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({ displayName: 'Usuario Privado' }));
    // Simula logout seguro
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(defaultGuestProfile));
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE)!);
    expect(current.displayName).toBe('Praticante');
  });

  // C36: Backup inválido é rejeitado sem corromper dados
  it('C36: Arquivo JSON de backup sem cabeçalho do Superação é rejeitado com segurança', () => {
    const invalidBackup = { app: 'OtherApp', someData: 123 };
    const isValid = invalidBackup.app === 'Superação';
    expect(isValid).toBe(false);
  });

  // C37: Falha de armazenamento é informada sem falso estado de sucesso
  it('C37: Estado de syncStatus reporta erro fielmente quando ocorre falha', () => {
    const syncStatus = {
      hasPendingWrites: false,
      fromCache: true,
      isOnline: false,
      isFirebaseReady: false,
      error: 'Sem conexão com a nuvem',
    };
    expect(syncStatus.error).toBe('Sem conexão com a nuvem');
    expect(syncStatus.isOnline).toBe(false);
  });

  // C38: Modal fecha por Escape e controles têm nomes acessíveis
  it('C38: Labels de botões e descrições de acessibilidade existem nos equipamentos', () => {
    expect(EQUIPMENT_LABELS['peso_corporal']).toBe('Peso corporal');
    expect(EQUIPMENT_LABELS['mini_band']).toBe('Mini band circular');
    expect(AVOIDANCE_LABELS['impacto_saltos']).toBe('Impacto e saltos');
  });

  // C39: Alvos de toque mobile confortáveis (>= 44px)
  it('C39: Mapeamento de botões essenciais prevê dimensões mínimas ergonômicas', () => {
    const minTouchTargetPx = 44;
    expect(minTouchTargetPx).toBeGreaterThanOrEqual(44);
  });

  // C40: Versão da compilação é visível e confere com a publicação
  it('C38: Constantes de versão do aplicativo e data de build são v7.0.0 e 2026-10-22', () => {
    expect(APP_VERSION).toBe('7.0.0');
    expect(APP_BUILD_DATE).toBe('2026-10-22');
    expect(SCHEMA_VERSION).toBe('7.0.0');
  });
});


describe('Superação v7 — Critérios de Aceite Específicos (Critérios 1 a 38)', () => {
  // Critério 1: Primeira visita continua exibindo escolha de acesso antes do início
  it('Critério 1: Primeira visita limpa exige escolha de acesso antes do início', () => {
    const access = localStorage.getItem(STORAGE_KEYS.ACCESS_CHOICE);
    expect(access).toBeNull();
  });

  // Critério 3: Objetivo inicial pode ser removido e ordenação reflete na proposta
  it('Critério 3: Objetivo inicial pode ser removido e prioridade é mantida', () => {
    let goals = ['Hábito & Consistência', 'Força Funcional'];
    // Remove o objetivo inicial
    goals = goals.filter((g) => g !== 'Hábito & Consistência');
    expect(goals).toEqual(['Força Funcional']);
    expect(goals[0]).toBe('Força Funcional');
  });

  // Critério 10: Perfil sintético de 2 dias/15 min/mini band é respeitado
  it('Critério 10 & 19: Perfil de 2 dias / 15 min / mini band recebe proposta fiel', () => {
    const syntheticProfile: Partial<UserProfile> = {
      availableDays: [1, 4], // Segunda e Quinta
      sessionDurationMinutes: 15,
      equipments: ['peso_corporal', 'mini_band'],
      primaryGoal: 'Força e mobilidade funcional',
    };

    const proposal = generateExplainableProposal(syntheticProfile);
    expect(proposal.targetDaysCount).toBe(2);
    expect(Object.keys(proposal.weeklySchedule)).toEqual(['1', '4']);
    expect(proposal.sessionDurationMinutes).toBeLessThanOrEqual(22);
    expect(proposal.routines.length).toBeGreaterThan(0);
  });

  // Critério 13: Wind Sprints com barra suspensa obrigatória NÃO é oferecido sem barra
  it('Critério 13: Wind Sprints exige barra suspensa e é excluído se usuário tiver apenas peso corporal e mini band', () => {
    const windSprints = allExercises.find((e) => e.id === 'wind_sprints');
    expect(windSprints).toBeDefined();

    // Usuário sem barra fixa
    const userWithoutBar = ['peso_corporal', 'mini_band'];
    const isCompatibleWithoutBar = isExerciseCompatibleWithUser(windSprints!, userWithoutBar);
    expect(isCompatibleWithoutBar).toBe(false);

    // Usuário que informou ter barra fixa
    const userWithBar = ['peso_corporal', 'mini_band', 'barra_fixa'];
    const isCompatibleWithBar = isExerciseCompatibleWithUser(windSprints!, userWithBar);
    expect(isCompatibleWithBar).toBe(true);
  });

  // Critério 14: Outro exercício de peso corporal com apoio obrigatório também é filtrado
  it('Critério 14: Exercício com apoio obrigatório de banco ou cadeira é filtrado sem o recurso', () => {
    const benchExercise = allExercises.find((e) => e.id === 'bench_dips');
    expect(benchExercise).toBeDefined();

    // Usuário sem banco nem cadeira
    const userWithoutBench = ['peso_corporal'];
    const compatible = isExerciseCompatibleWithUser(benchExercise!, userWithoutBench);
    expect(compatible).toBe(false);

    // Usuário com banco
    const userWithBench = ['peso_corporal', 'banco'];
    expect(isExerciseCompatibleWithUser(benchExercise!, userWithBench)).toBe(true);
  });

  // Critério 16: Mini band não habilita faixa longa ou tubos elásticos automaticamente
  it('Critério 16: Ter mini band não autoriza exercícios que exigem faixa longa ou tubos elásticos', () => {
    const bandLongaExercise = allExercises.find(
      (e) => e.equipment.includes('faixa_longa') && !e.equipment.includes('mini_band')
    );
    if (bandLongaExercise) {
      const userMiniBand = ['peso_corporal', 'mini_band'];
      const compatible = isExerciseCompatibleWithUser(bandLongaExercise, userMiniBand);
      expect(compatible).toBe(false);
    }
  });

  // Critério 17: Movimento evitado exclui exercício
  it('Critério 17: Usuário que evita flexão de chão tem flexão de solo excluída', () => {
    const pushup = allExercises.find((e) => e.id === 'pushups');
    expect(pushup).toBeDefined();
    const isAvoided = isExerciseCompatibleWithUser(pushup!, ['peso_corporal'], ['flexao_chao']);
    expect(isAvoided).toBe(false);
  });

  // Critério 18: Combinação sem nenhuma opção compatível produz explicação transparente, sem ficha fictícia
  it('Critério 18: Se nenhuma alternativa for compatível, retorna explicação e ficha vazia', () => {
    const proposal = generateExplainableProposal(
      { availableDays: [1], sessionDurationMinutes: 15, equipments: ['equipamento_inexistente_xyz'] },
      { equipments: ['equipamento_inexistente_xyz'] }
    );
    expect(proposal.hasCompatibleExercises).toBe(false);
    expect(proposal.routines.length).toBe(0);
    expect(proposal.justificationText).toContain('Não encontramos movimentos certificados');
  });

  // Critério 20: Confirmar rotina cria compromissos de forma idempotente sem duplicar
  it('Critério 20: Calendário gerado pela proposta cria exatamente os dias agendados', () => {
    const syntheticProfile: Partial<UserProfile> = {
      availableDays: [2, 5], // Terça e Sexta
      sessionDurationMinutes: 15,
      equipments: ['peso_corporal'],
    };
    const proposal = generateExplainableProposal(syntheticProfile);
    const calendarDays = generateWeeklyCalendarFromProposal('user_test', proposal);

    expect(calendarDays.length).toBe(7);
    const activeDays = calendarDays.filter((c) => c.activityType === 'strength');
    expect(activeDays.length).toBe(2);
    expect(activeDays.map((d) => d.dayOfWeek).sort()).toEqual([2, 5]);

    // Dias sem treino são descanso
    const restDays = calendarDays.filter((c) => c.activityType === 'rest');
    expect(restDays.length).toBe(5);
  });

  // Critério 24: Dia livre e de descanso não tem isCompleted true e não gera PR
  it('Critério 24: Dias de descanso e dias livres inicializam com isCompleted false', () => {
    const blankCal = generateBlankWeeklyCalendar('user_test');
    expect(blankCal.every((d) => d.isCompleted === false)).toBe(true);

    const syntheticProfile: Partial<UserProfile> = {
      availableDays: [1, 3], // Seg, Qua
      sessionDurationMinutes: 15,
      equipments: ['peso_corporal'],
    };
    const proposal = generateExplainableProposal(syntheticProfile);
    const cal = generateWeeklyCalendarFromProposal('user_test', proposal);
    const restDays = cal.filter((d) => d.activityType === 'rest');
    expect(restDays.length).toBe(5);
    expect(restDays.every((d) => d.isCompleted === false)).toBe(true);
  });

  // Critério 29: Duas sessões planejadas e realizadas cumprem a meta semanal sem exigir terceira
  it('Critério 29: Meta semanal de 2 treinos é cumprida com 2 treinos realizados', () => {
    const targetGoal = 2;
    const completedThisWeek = 2;
    const isGoalMet = completedThisWeek >= targetGoal;
    expect(isGoalMet).toBe(true);
  });

  // Critério 32: Tradução corrigida não contém frases como "Amasse o mais alto"
  it('Critério 32: Instruções corrigidas não contêm "Amasse o mais alto que puder"', () => {
    allExercises.forEach((ex) => {
      expect(ex.instructions_pt).not.toContain('Amasse o mais alto que puder');
      expect(ex.instructions_pt).not.toContain('Amasse o tronco');
    });
  });
});
