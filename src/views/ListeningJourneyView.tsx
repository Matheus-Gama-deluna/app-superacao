import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Clock,
  Dumbbell,
  Target,
  Calendar,
  Layers,
  Check,
  Heart,
  AlertCircle,
  FileCheck2,
  HelpCircle,
  Edit2,
  X,
} from 'lucide-react';
import { UserProfile, OnboardingDraft } from '../types';
import { getLocal, setLocal, STORAGE_KEYS, EQUIPMENT_LABELS, AVOIDANCE_LABELS } from '../lib/storage';

interface ListeningJourneyViewProps {
  onCompleteListening: (draft: OnboardingDraft, nextAction: 'proposal' | 'builder_manual' | 'builder_pro') => void;
  onCancel?: () => void;
}

const DEFAULT_GOALS = [
  'Construir o hábito e consistência diária',
  'Melhorar postura e aliviar tensões',
  'Ganhar força funcional e mobilidade',
  'Mais energia e disposição no dia a dia',
  'Saúde preventiva e bem-estar geral',
];

const AVAILABLE_EQUIPMENTS = [
  { id: 'peso_corporal', label: 'Peso corporal', desc: 'Apenas seu próprio corpo no solo ou em pé' },
  { id: 'mini_band', label: 'Mini band circular', desc: 'Elástico curto fechado em laço' },
  { id: 'faixa_longa', label: 'Faixa elástica longa', desc: 'Super band aberta ou elástico longo' },
  { id: 'tubos_elasticos', label: 'Tubos elásticos com pegadores', desc: 'Elásticos com manoplas anatômicas' },
  { id: 'halteres', label: 'Halteres / Pesos livres', desc: 'Pesos com pegada manual' },
  { id: 'kettlebell', label: 'Kettlebell', desc: 'Peso com alça superior' },
  { id: 'cadeira', label: 'Cadeira firme / apoio', desc: 'Como apoio para equilíbrio ou sentar/levantar' },
  { id: 'parede', label: 'Espaço livre na parede', desc: 'Apoio vertical para panturrilhas e flexão em pé' },
  { id: 'colchonete', label: 'Colchonete / tapete', desc: 'Apoio suave para exercícios deitados' },
];

const LIMITATIONS_OPTIONS = [
  { id: 'joelhos', label: 'Dores ou desconforto nos joelhos' },
  { id: 'lombar', label: 'Tensões ou dores lombares' },
  { id: 'ombros', label: 'Sensibilidade nos ombros' },
  { id: 'punhos', label: 'Dificuldade para apoiar os punhos no chão' },
  { id: 'nenhuma', label: 'Nenhuma limitação articular relevante' },
];

const AVOID_MOVEMENTS_OPTIONS = [
  { id: 'impacto_saltos', label: 'Impacto e saltos (prefiro pés no chão)' },
  { id: 'flexao_chao', label: 'Flexão de braço tradicional no chão' },
  { id: 'agachamento_profundo', label: 'Agachamentos muito profundos' },
  { id: 'sobrecarga_lombar', label: 'Movimentos com peso livre curvando a coluna' },
  { id: 'exercicios_chao', label: 'Exercícios de deitar e levantar do chão com frequência' },
];

const OBSTACLES_OPTIONS = [
  { id: 'falta_tempo', label: 'Dias imprevisíveis ou pouco tempo livre' },
  { id: 'dificuldade_comecar', label: 'A inércia inicial para calçar o tênis e começar' },
  { id: 'cansaco_mental', label: 'Cansaço mental no final do dia' },
  { id: 'desanimo_falhar', label: 'Desânimo quando perco um dia planejado' },
  { id: 'exercicios_complexos', label: 'Dúvidas se estou executando os movimentos da forma correta' },
];

export const ListeningJourneyView: React.FC<ListeningJourneyViewProps> = ({
  onCompleteListening,
  onCancel,
}) => {
  const { profile, updateUserProfile } = useAuth();

  // Carrega rascunho salvo anteriormente se existir (Critério C04)
  const savedDraft = getLocal<OnboardingDraft | null>(STORAGE_KEYS.ONBOARDING_DRAFT, null);

  const [step, setStep] = useState<number>(() => savedDraft?.step || 1);

  // A. Momento
  const [displayName, setDisplayName] = useState<string>(
    savedDraft?.displayName || profile.displayName || ''
  );
  const [experienceLevel, setExperienceLevel] = useState<'iniciante' | 'retomando' | 'pratica'>(
    savedDraft?.experienceLevel || (profile.experienceLevel as any) || 'iniciante'
  );
  const [exerciseReason, setExerciseReason] = useState<string>(
    savedDraft?.exerciseReason || profile.exerciseReason || ''
  );

  // B. Objetivos e prioridades
  const [orderedGoals, setOrderedGoals] = useState<string[]>(() => {
    if (savedDraft?.orderedGoals && savedDraft.orderedGoals.length > 0) return savedDraft.orderedGoals;
    if (profile.goalPriorityOrder && profile.goalPriorityOrder.length > 0) return profile.goalPriorityOrder;
    return [];
  });
  const [goalFocus, setGoalFocus] = useState<'foco_unico' | 'equilibrado'>(
    savedDraft?.goalFocus || profile.goalFocus || 'foco_unico'
  );

  // C. Disponibilidade real
  const [availableDays, setAvailableDays] = useState<number[]>(() => {
    if (savedDraft?.availableDays) return savedDraft.availableDays;
    if (profile.availableDays && profile.availableDays.length > 0) return profile.availableDays;
    return [];
  });
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(
    savedDraft?.sessionDurationMinutes || profile.sessionDurationMinutes || 20
  );
  const [preferredTime, setPreferredTime] = useState<'manha' | 'tarde' | 'noite' | 'flexivel'>(
    savedDraft?.preferredTime || profile.preferredTime || 'flexivel'
  );
  const [environmentPreference, setEnvironmentPreference] = useState<'casa' | 'academia' | 'ar_livre' | 'qualquer'>(
    savedDraft?.environmentPreference || profile.environmentPreference || 'casa'
  );
  const [hasFlexibleSchedule, setHasFlexibleSchedule] = useState<boolean>(
    savedDraft?.hasFlexibleSchedule ?? profile.hasFlexibleSchedule ?? false
  );
  const [habitAnchor, setHabitAnchor] = useState<string>(
    savedDraft?.habitAnchor || profile.habitAnchor || ''
  );

  // D. Equipamentos e ambiente (NADA pré-selecionado além de peso_corporal - Critério C12)
  const [equipments, setEquipments] = useState<string[]>(() => {
    if (savedDraft?.equipments) return savedDraft.equipments;
    if (profile.equipments && profile.equipments.length > 0) return profile.equipments;
    return ['peso_corporal'];
  });

  // E. Anamnese inicial e cuidados
  const [reportedLimitations, setReportedLimitations] = useState<string[]>(
    savedDraft?.reportedLimitations || profile.reportedLimitations || []
  );
  const [avoidedMovements, setAvoidedMovements] = useState<string[]>(
    savedDraft?.avoidedMovements || profile.avoidedMovements || []
  );
  const [healthNotes, setHealthNotes] = useState<string>(
    savedDraft?.healthNotes || profile.healthNotes || ''
  );

  // F. Escuta e preferências
  const [practiceObstacles, setPracticeObstacles] = useState<string[]>(
    savedDraft?.practiceObstacles || profile.practiceObstacles || []
  );
  const [userContextNotes, setUserContextNotes] = useState<string>(
    savedDraft?.userContextNotes || profile.userContextNotes || ''
  );

  // G. Origem preferida
  const [planSourcePreference, setPlanSourcePreference] = useState<'criar' | 'modelo_revisado' | 'profissional'>(
    savedDraft?.planSourcePreference || profile.planSourcePreference || 'modelo_revisado'
  );

  // Auto-save do rascunho a cada mudança (Critério C04)
  useEffect(() => {
    const currentDraft: OnboardingDraft = {
      step,
      displayName,
      experienceLevel,
      exerciseReason,
      orderedGoals,
      goalFocus,
      availableDays,
      sessionDurationMinutes,
      preferredTime,
      environmentPreference,
      hasFlexibleSchedule,
      habitAnchor,
      equipments,
      reportedLimitations,
      avoidedMovements,
      healthNotes,
      practiceObstacles,
      userContextNotes,
      planSourcePreference,
      savedAt: Date.now(),
    };
    setLocal(STORAGE_KEYS.ONBOARDING_DRAFT, currentDraft);
  }, [
    step,
    displayName,
    experienceLevel,
    exerciseReason,
    orderedGoals,
    goalFocus,
    availableDays,
    sessionDurationMinutes,
    preferredTime,
    environmentPreference,
    hasFlexibleSchedule,
    habitAnchor,
    equipments,
    reportedLimitations,
    avoidedMovements,
    healthNotes,
    practiceObstacles,
    userContextNotes,
    planSourcePreference,
  ]);

  // Handlers de Ordenação de Objetivos Acessíveis (Critério C06)
  const handleToggleGoal = (label: string) => {
    if (orderedGoals.includes(label)) {
      setOrderedGoals(orderedGoals.filter((g) => g !== label));
    } else {
      setOrderedGoals([...orderedGoals, label]);
    }
  };

  const handleMoveGoalUp = (index: number) => {
    if (index === 0) return;
    const next = [...orderedGoals];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setOrderedGoals(next);
  };

  const handleMoveGoalDown = (index: number) => {
    if (index === orderedGoals.length - 1) return;
    const next = [...orderedGoals];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setOrderedGoals(next);
  };

  const handleToggleDay = (dayIndex: number) => {
    if (availableDays.includes(dayIndex)) {
      setAvailableDays(availableDays.filter((d) => d !== dayIndex));
    } else {
      setAvailableDays([...availableDays, dayIndex].sort());
    }
  };

  const handleToggleEquipment = (eqId: string) => {
    if (equipments.includes(eqId)) {
      const next = equipments.filter((e) => e !== eqId);
      setEquipments(next.length === 0 ? ['peso_corporal'] : next);
    } else {
      setEquipments([...equipments.filter((e) => e !== 'nenhum'), eqId]);
    }
  };

  const handleToggleLimitation = (limId: string) => {
    if (limId === 'nenhuma') {
      setReportedLimitations(['nenhuma']);
      return;
    }
    const clean = reportedLimitations.filter((x) => x !== 'nenhuma');
    if (clean.includes(limId)) {
      setReportedLimitations(clean.filter((x) => x !== limId));
    } else {
      setReportedLimitations([...clean, limId]);
    }
  };

  const handleToggleAvoidMovement = (movId: string) => {
    if (avoidedMovements.includes(movId)) {
      setAvoidedMovements(avoidedMovements.filter((x) => x !== movId));
    } else {
      setAvoidedMovements([...avoidedMovements, movId]);
    }
  };

  const handleToggleObstacle = (obsId: string) => {
    if (practiceObstacles.includes(obsId)) {
      setPracticeObstacles(practiceObstacles.filter((x) => x !== obsId));
    } else {
      setPracticeObstacles([...practiceObstacles, obsId]);
    }
  };

  const currentDraftData: OnboardingDraft = {
    step,
    displayName,
    experienceLevel,
    exerciseReason,
    orderedGoals,
    goalFocus,
    availableDays,
    sessionDurationMinutes,
    preferredTime,
    environmentPreference,
    hasFlexibleSchedule,
    habitAnchor,
    equipments,
    reportedLimitations,
    avoidedMovements,
    healthNotes,
    practiceObstacles,
    userContextNotes,
    planSourcePreference,
    savedAt: Date.now(),
  };

  const handleFinalChoice = async (action: 'proposal' | 'builder_manual' | 'builder_pro') => {
    // Salva o perfil com os dados preenchidos (incluindo exerciseReason - Frente 1)
    await updateUserProfile({
      displayName: displayName.trim() || 'Praticante',
      experienceLevel,
      exerciseReason: exerciseReason.trim(),
      primaryGoal: orderedGoals[0] || DEFAULT_GOALS[0],
      secondaryGoals: orderedGoals.slice(1),
      goalPriorityOrder: orderedGoals,
      goalFocus,
      availableDays,
      sessionDurationMinutes,
      preferredTime,
      environmentPreference,
      hasFlexibleSchedule,
      habitAnchor: habitAnchor.trim(),
      equipments,
      reportedLimitations,
      avoidedMovements,
      healthNotes: healthNotes.trim(),
      practiceObstacles,
      userContextNotes: userContextNotes.trim(),
      planSourcePreference: action === 'builder_pro' ? 'profissional' : action === 'builder_manual' ? 'criar' : 'modelo_revisado',
      onboardingCompleted: true,
      routineConfirmed: false, // Só confirma quando aceitar a proposta na tela seguinte! (Critério C09)
    });

    onCompleteListening(currentDraftData, action);
  };

  const stepTitles = [
    'Seu Momento',
    'Objetivos & Prioridades',
    'Disponibilidade Real',
    'Equipamentos & Ambiente',
    'Cuidados & Limitações',
    'Preferências & Obstáculos',
    'Resumo & Escolha de Início',
  ];

  const daysLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="min-h-screen bg-[#F5F8F5] text-[#152A29] flex flex-col font-sans">
      {/* Barra de Topo com Progresso */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#C9DBD3] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5B7170] hover:text-[#152A29] hover:bg-slate-100 cursor-pointer"
                aria-label="Voltar etapa anterior"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : onCancel ? (
              <button
                onClick={onCancel}
                className="text-xs font-semibold text-[#5B7170] hover:text-[#152A29] px-2 py-1 cursor-pointer"
              >
                Início
              </button>
            ) : (
              <div className="w-6" />
            )}
            <div>
              <span className="text-[10px] font-bold text-[#125F55] uppercase tracking-wider">
                Passo {step} de 7
              </span>
              <h1 className="text-sm font-bold text-[#152A29] leading-tight">
                {stepTitles[step - 1]}
              </h1>
            </div>
          </div>

          <div className="w-24 bg-[#EAF3EF] h-2 rounded-full overflow-hidden border border-[#C9DBD3]/50">
            <div
              className="bg-[#125F55] h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.round((step / 7) * 100)}%` }}
            />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Passo */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-6">
        {/* PASSO 1: SEU MOMENTO */}
        {step === 1 && (
          <section className="bg-white rounded-3xl p-6 border border-[#C9DBD3] shadow-xs space-y-5 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#152A29]">Como prefere ser chamado?</h2>
              <p className="text-xs text-[#5B7170]">
                Não pedimos peso, medidas nem informações desnecessárias. Apenas o que for útil para organizar sua rotina.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="display_name_input" className="block text-xs font-bold text-[#152A29]">
                Seu nome de preferência
              </label>
              <input
                id="display_name_input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Matheus, Ana..."
                className="w-full h-12 px-3.5 rounded-xl border border-[#C9DBD3] text-sm focus:outline-none focus:border-[#125F55] bg-[#F5F8F5]"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-[#152A29]">
                Qual é a sua relação com exercícios hoje?
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'iniciante', label: 'Começando do zero', desc: 'Nunca pratiquei com frequência ou faz muito tempo' },
                  { id: 'retomando', label: 'Retomando após uma pausa', desc: 'Já tive rotina antes, mas parei por rotina ou desânimo' },
                  { id: 'pratica', label: 'Já pratico com certa regularidade', desc: 'Quero organizar melhor meus treinos e registrar meu progresso' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={experienceLevel === item.id}
                    onClick={() => setExperienceLevel(item.id as any)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer min-h-[52px] ${
                      experienceLevel === item.id
                        ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55]'
                        : 'border-[#C9DBD3] bg-white text-[#152A29] hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      experienceLevel === item.id ? 'border-[#125F55] bg-[#125F55] text-white' : 'border-[#C9DBD3]'
                    }`}>
                      {experienceLevel === item.id && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[11px] text-[#5B7170] mt-0.5 leading-snug">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label htmlFor="exercise_reason_input" className="block text-xs font-bold text-[#152A29]">
                O que motivou você a começar agora? (opcional)
              </label>
              <input
                id="exercise_reason_input"
                type="text"
                value={exerciseReason}
                onChange={(e) => setExerciseReason(e.target.value)}
                placeholder="Ex: mais energia, aliviar dores nas costas, relaxar..."
                className="w-full h-12 px-3.5 rounded-xl border border-[#C9DBD3] text-sm focus:outline-none focus:border-[#125F55] bg-[#F5F8F5]"
              />
            </div>
          </section>
        )}

        {/* PASSO 2: OBJETIVOS E PRIORIDADES (Critério C06) */}
        {step === 2 && (
          <section className="bg-white rounded-3xl p-6 border border-[#C9DBD3] shadow-xs space-y-5 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#152A29]">Seus Objetivos & Prioridades</h2>
              <p className="text-xs text-[#5B7170]">
                O primeiro da lista será seu foco prioritário. Use as setas para reordenar por prioridade.
              </p>
            </div>

            {/* Lista com Reordenação Acessível via Teclado e Botões */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#125F55] block">
                Objetivos Selecionados (por ordem de prioridade):
              </span>
              <div className="space-y-2">
                {orderedGoals.map((goal, idx) => (
                  <div
                    key={goal}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      idx === 0 ? 'border-[#125F55] bg-[#EAF3EF]' : 'border-[#C9DBD3] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        idx === 0 ? 'bg-[#125F55] text-white' : 'bg-slate-200 text-[#5B7170]'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#152A29] block truncate">
                          {goal}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] text-[#125F55] font-semibold">
                            Foco Principal
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botões Subir / Descer e Remover */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveGoalUp(idx)}
                        disabled={idx === 0}
                        aria-label={`Mover ${goal} para cima`}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5B7170] hover:text-[#152A29] hover:bg-slate-100 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleMoveGoalDown(idx)}
                        disabled={idx === orderedGoals.length - 1}
                        aria-label={`Mover ${goal} para baixo`}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5B7170] hover:text-[#152A29] hover:bg-slate-100 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                      {orderedGoals.length > 1 && (
                        <button
                          onClick={() => handleToggleGoal(goal)}
                          aria-label={`Remover ${goal}`}
                          title="Remover objetivo"
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5B7170] hover:text-[#B13D39] hover:bg-red-50 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Outros objetivos para adicionar */}
            <div className="space-y-2 pt-2 border-t border-[#C9DBD3]/40">
              <span className="text-xs font-semibold text-[#5B7170] block">
                Adicionar outros objetivos à sua lista:
              </span>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_GOALS.filter((g) => !orderedGoals.includes(g)).map((g) => (
                  <button
                    key={g}
                    onClick={() => handleToggleGoal(g)}
                    className="px-3.5 py-2.5 rounded-xl border border-[#C9DBD3] bg-[#F5F8F5] text-xs font-medium text-[#152A29] hover:border-[#125F55] transition-colors cursor-pointer min-h-[44px]"
                  >
                    + {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Modo de foco */}
            <div className="space-y-2 pt-2 border-t border-[#C9DBD3]/40">
              <label className="block text-xs font-bold text-[#152A29]">
                Como prefere conduzir seus objetivos?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={goalFocus === 'foco_unico'}
                  onClick={() => setGoalFocus('foco_unico')}
                  className={`p-3 rounded-xl border text-left cursor-pointer min-h-[48px] ${
                    goalFocus === 'foco_unico'
                      ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55] font-bold'
                      : 'border-[#C9DBD3] bg-white text-[#5B7170]'
                  }`}
                >
                  <div className="text-xs">Foco no objetivo principal</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Prioriza consistência em torno do 1º item</div>
                </button>
                <button
                  type="button"
                  aria-pressed={goalFocus === 'equilibrado'}
                  onClick={() => setGoalFocus('equilibrado')}
                  className={`p-3 rounded-xl border text-left cursor-pointer min-h-[48px] ${
                    goalFocus === 'equilibrado'
                      ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55] font-bold'
                      : 'border-[#C9DBD3] bg-white text-[#5B7170]'
                  }`}
                >
                  <div className="text-xs">Equilíbrio múltiplo</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Distribui estímulos entre todos os itens</div>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* PASSO 3: DISPONIBILIDADE REAL (Critérios C07, C10) */}
        {step === 3 && (
          <section className="bg-white rounded-3xl p-6 border border-[#C9DBD3] shadow-xs space-y-5 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#152A29]">Sua Disponibilidade Real</h2>
              <p className="text-xs text-[#5B7170]">
                Quantos dias e quanto tempo você tem disponível na realidade, sem metas inatingíveis.
              </p>
            </div>

            {/* Dias da semana */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#152A29]">
                  Dias possíveis para treinar ({availableDays.length} {availableDays.length === 1 ? 'dia' : 'dias'})
                </span>
                <span className="text-[#125F55] font-semibold text-[11px]">
                  {availableDays.length === 2 ? 'Ideal para iniciantes' : ''}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {daysLabels.map((label, idx) => {
                  const isSelected = availableDays.includes(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleToggleDay(idx)}
                      aria-label={`${label} ${isSelected ? 'selecionado' : 'não selecionado'}`}
                      className={`h-14 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#125F55] bg-[#125F55] text-white shadow-xs'
                          : 'border-[#C9DBD3] bg-[#F5F8F5] text-[#5B7170] hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-bold">{label}</span>
                      <div className="w-2 h-2 rounded-full mt-1 bg-current opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duração por sessão */}
            <div className="space-y-2 pt-2 border-t border-[#C9DBD3]/40">
              <label className="block text-xs font-bold text-[#152A29]">
                Tempo disponível por sessão
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[5, 10, 15, 20, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    aria-pressed={sessionDurationMinutes === mins}
                    onClick={() => setSessionDurationMinutes(mins)}
                    className={`h-12 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      sessionDurationMinutes === mins
                        ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55]'
                        : 'border-[#C9DBD3] bg-white text-[#5B7170] hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{mins} minutos</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ambiente */}
            <div className="space-y-2 pt-2 border-t border-[#C9DBD3]/40">
              <label className="block text-xs font-bold text-[#152A29]">
                Onde você vai praticar na maioria das vezes?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'casa', label: 'Em casa' },
                  { id: 'academia', label: 'Na academia' },
                  { id: 'ar_livre', label: 'Ar livre' },
                ].map((env) => (
                  <button
                    key={env.id}
                    type="button"
                    aria-pressed={environmentPreference === env.id}
                    onClick={() => setEnvironmentPreference(env.id as any)}
                    className={`h-12 rounded-xl border text-xs font-bold flex items-center justify-center cursor-pointer ${
                      environmentPreference === env.id
                        ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55]'
                        : 'border-[#C9DBD3] bg-white text-[#5B7170] hover:bg-slate-50'
                    }`}
                  >
                    <span>{env.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Âncora de Hábito Opcional */}
            <div className="space-y-2 pt-2 border-t border-[#C9DBD3]/40">
              <label htmlFor="habit_anchor_input" className="block text-xs font-bold text-[#152A29]">
                Âncora de rotina (opcional)
              </label>
              <p className="text-[11px] text-[#5B7170]">
                Vincule o treino a um momento que já acontece todo dia.
              </p>
              <input
                id="habit_anchor_input"
                type="text"
                value={habitAnchor}
                onChange={(e) => setHabitAnchor(e.target.value)}
                placeholder="Ex: logo após o café da manhã, antes do banho..."
                className="w-full h-12 px-3.5 rounded-xl border border-[#C9DBD3] text-sm focus:outline-none focus:border-[#125F55] bg-[#F5F8F5]"
              />
            </div>
          </section>
        )}

        {/* PASSO 4: EQUIPAMENTOS E AMBIENTE (Critério C12) */}
        {step === 4 && (
          <section className="bg-white rounded-3xl p-6 border border-[#C9DBD3] shadow-xs space-y-5 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#152A29]">Equipamentos & Apoios</h2>
              <p className="text-xs text-[#5B7170]">
                Marque somente o que você realmente tem disponível. Não pré-marcamos nenhum equipamento além de peso corporal.
              </p>
            </div>

            <div className="space-y-2">
              {AVAILABLE_EQUIPMENTS.map((eq) => {
                const isSelected = equipments.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleToggleEquipment(eq.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer min-h-[52px] ${
                      isSelected
                        ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55]'
                        : 'border-[#C9DBD3] bg-white text-[#152A29] hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{eq.label}</div>
                      <div className="text-[11px] text-[#5B7170] mt-0.5 leading-snug">{eq.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'border-[#125F55] bg-[#125F55] text-white' : 'border-[#C9DBD3]'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* PASSO 5: ANAMNESE E CUIDADOS (Critério C13) */}
        {step === 5 && (
          <section className="bg-white rounded-3xl p-6 border border-[#C9DBD3] shadow-xs space-y-5 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#152A29]">Cuidados & Limitações</h2>
              <p className="text-xs text-[#5B7170]">
                Informações para calibrar movimentos seguros. O Superação respeita suas respostas, mas não substitui recomendação de um profissional de saúde.
              </p>
            </div>

            {/* Limitações articulares */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#152A29]">
                Você sente dores ou desconforto frequente em alguma região?
              </label>
              <div className="space-y-1.5">
                {LIMITATIONS_OPTIONS.map((lim) => {
                  const isChecked = reportedLimitations.includes(lim.id);
                  return (
                    <button
                      key={lim.id}
                      type="button"
                      aria-pressed={isChecked}
                      onClick={() => handleToggleLimitation(lim.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-2 text-xs cursor-pointer min-h-[46px] ${
                        isChecked
                          ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55] font-semibold'
                          : 'border-[#C9DBD3] bg-white text-[#5B7170] hover:bg-slate-50'
                      }`}
                    >
                      <span>{lim.label}</span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? 'border-[#125F55] bg-[#125F55] text-white' : 'border-[#C9DBD3]'
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Movimentos a evitar */}
            <div className="space-y-2 pt-2 border-t border-[#C9DBD3]/40">
              <label className="block text-xs font-bold text-[#152A29]">
                Movimentos que você prefere evitar por segurança ou conforto:
              </label>
              <div className="space-y-1.5">
                {AVOID_MOVEMENTS_OPTIONS.map((mov) => {
                  const isChecked = avoidedMovements.includes(mov.id);
                  return (
                    <button
                      key={mov.id}
                      type="button"
                      aria-pressed={isChecked}
                      onClick={() => handleToggleAvoidMovement(mov.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-2 text-xs cursor-pointer min-h-[46px] ${
                        isChecked
                          ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55] font-semibold'
                          : 'border-[#C9DBD3] bg-white text-[#5B7170] hover:bg-slate-50'
                      }`}
                    >
                      <span>{mov.label}</span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? 'border-[#125F55] bg-[#125F55] text-white' : 'border-[#C9DBD3]'
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orientações médicas */}
            <div className="space-y-2 pt-2 border-t border-[#C9DBD3]/40">
              <label htmlFor="health_notes_input" className="block text-xs font-bold text-[#152A29]">
                Orientações que recebeu de médico ou fisioterapeuta (opcional)
              </label>
              <textarea
                id="health_notes_input"
                rows={2}
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                placeholder="Ex: evitar impacto excessivo no joelho direito, focar em fortalecimento suave..."
                className="w-full p-3 rounded-xl border border-[#C9DBD3] text-xs focus:outline-none focus:border-[#125F55] bg-[#F5F8F5]"
              />
            </div>
          </section>
        )}

        {/* PASSO 6: PREFERÊNCIAS E OBSTÁCULOS */}
        {step === 6 && (
          <section className="bg-white rounded-3xl p-6 border border-[#C9DBD3] shadow-xs space-y-5 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#152A29]">O que costuma dificultar sua prática?</h2>
              <p className="text-xs text-[#5B7170]">
                Entender seus obstáculos nos ajuda a sugerir formatos realistas e gentis.
              </p>
            </div>

            <div className="space-y-1.5">
              {OBSTACLES_OPTIONS.map((obs) => {
                const isChecked = practiceObstacles.includes(obs.id);
                return (
                  <button
                    key={obs.id}
                    type="button"
                    aria-pressed={isChecked}
                    onClick={() => handleToggleObstacle(obs.id)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-2 text-xs cursor-pointer min-h-[46px] ${
                      isChecked
                        ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55] font-semibold'
                        : 'border-[#C9DBD3] bg-white text-[#5B7170] hover:bg-slate-50'
                    }`}
                  >
                    <span>{obs.label}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isChecked ? 'border-[#125F55] bg-[#125F55] text-white' : 'border-[#C9DBD3]'
                    }`}>
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#C9DBD3]/40">
              <label htmlFor="user_context_input" className="block text-xs font-bold text-[#152A29]">
                O que você gostaria que o Superação entendesse sobre você antes de começarmos?
              </label>
              <textarea
                id="user_context_input"
                rows={3}
                value={userContextNotes}
                onChange={(e) => setUserContextNotes(e.target.value)}
                placeholder="Ex: Trabalho sentado o dia inteiro, costumo ficar com pescoço tenso..."
                className="w-full p-3 rounded-xl border border-[#C9DBD3] text-xs focus:outline-none focus:border-[#125F55] bg-[#F5F8F5]"
              />
            </div>
          </section>
        )}

        {/* PASSO 7: RESUMO & ESCOLHA DE INÍCIO (Critérios C08, C09, C14) */}
        {step === 7 && (
          <section className="bg-white rounded-3xl p-6 border border-[#C9DBD3] shadow-xs space-y-6 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#152A29]">Resumo das suas Respostas</h2>
              <p className="text-xs text-[#5B7170]">
                Confira o que coletamos. Você pode editar qualquer bloco antes de decidir como iniciar.
              </p>
            </div>

            {/* Blocos de Resumo com Botão Editar (Critério C08) */}
            <div className="space-y-3">
              {/* Bloco 1: Momento & Nome */}
              <div className="p-3.5 rounded-2xl bg-[#F5F8F5] border border-[#C9DBD3]/60 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#125F55] uppercase text-[10px] block tracking-wide">
                    Momento
                  </span>
                  <div className="font-semibold text-[#152A29] mt-0.5">
                    {displayName || 'Praticante'} · {experienceLevel === 'iniciante' ? 'Iniciante' : experienceLevel === 'retomando' ? 'Retomando' : 'Regular'}
                  </div>
                  <div className="text-[11px] text-[#5B7170] mt-0.5">{exerciseReason}</div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="p-1.5 text-[#125F55] hover:bg-white rounded-lg cursor-pointer"
                  title="Editar momento"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bloco 2: Objetivos */}
              <div className="p-3.5 rounded-2xl bg-[#F5F8F5] border border-[#C9DBD3]/60 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#125F55] uppercase text-[10px] block tracking-wide">
                    Foco Principal
                  </span>
                  <div className="font-semibold text-[#152A29] mt-0.5">
                    1º {orderedGoals[0]}
                  </div>
                  {orderedGoals.length > 1 && (
                    <div className="text-[11px] text-[#5B7170] mt-0.5">
                      + {orderedGoals.slice(1).join(', ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="p-1.5 text-[#125F55] hover:bg-white rounded-lg cursor-pointer"
                  title="Editar objetivos"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bloco 3: Disponibilidade */}
              <div className="p-3.5 rounded-2xl bg-[#F5F8F5] border border-[#C9DBD3]/60 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#125F55] uppercase text-[10px] block tracking-wide">
                    Disponibilidade
                  </span>
                  <div className="font-semibold text-[#152A29] mt-0.5">
                    {availableDays.length} {availableDays.length === 1 ? 'dia' : 'dias'} por semana ({availableDays.map((d) => daysLabels[d]).join(', ')}) · {sessionDurationMinutes} min por sessão
                  </div>
                  {habitAnchor && (
                    <div className="text-[11px] text-[#5B7170] mt-0.5">
                      Âncora: {habitAnchor}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="p-1.5 text-[#125F55] hover:bg-white rounded-lg cursor-pointer"
                  title="Editar disponibilidade"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bloco 4: Equipamentos & Cuidados */}
              <div className="p-3.5 rounded-2xl bg-[#F5F8F5] border border-[#C9DBD3]/60 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#125F55] uppercase text-[10px] block tracking-wide">
                    Equipamentos & Cuidados
                  </span>
                  <div className="font-semibold text-[#152A29] mt-0.5">
                    {equipments.map((e) => EQUIPMENT_LABELS[e] || e).join(', ')}
                  </div>
                  {avoidedMovements.length > 0 ? (
                    <div className="text-[11px] text-[#91610D] mt-0.5">
                      Evitando: {avoidedMovements.map((a) => AVOIDANCE_LABELS[a] || a).join(', ')}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#5B7170] mt-0.5">
                      Cuidados / Restrições: Não informado
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setStep(4)}
                  className="p-1.5 text-[#125F55] hover:bg-white rounded-lg cursor-pointer"
                  title="Editar equipamentos"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bloco 5: Obstáculos & Contexto (V8-08) */}
              <div className="p-3.5 rounded-2xl bg-[#F5F8F5] border border-[#C9DBD3]/60 flex items-start justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#125F55] uppercase text-[10px] block tracking-wide">
                    Obstáculos & Contexto
                  </span>
                  <div className="font-semibold text-[#152A29] mt-0.5">
                    {practiceObstacles.length > 0
                      ? practiceObstacles.map((o) => OBSTACLES_OPTIONS.find((opt) => opt.id === o)?.label || o).join(' · ')
                      : 'Não informado'}
                  </div>
                  {userContextNotes ? (
                    <div className="text-[11px] text-[#5B7170] mt-0.5 italic">
                      "{userContextNotes}"
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={() => setStep(6)}
                  className="p-1.5 text-[#125F55] hover:bg-white rounded-lg cursor-pointer"
                  title="Editar obstáculos"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Aviso ético: Concluir não ativa programa automaticamente (Critério C09) */}
            <div className="bg-[#EAF3EF] p-3.5 rounded-2xl border border-[#C9DBD3]/60 text-xs text-[#5B7170]">
              <p className="leading-relaxed text-[11px]">
                Nenhuma rotina foi ativada ainda. Escolha abaixo como deseja começar:
              </p>
            </div>

            {/* 3 Escolhas Transparentes de Próximo Passo (Critérios C09, C14) */}
            <div className="space-y-2.5 pt-1">
              <button
                onClick={() => handleFinalChoice('proposal')}
                className="w-full min-h-[52px] p-3.5 bg-[#125F55] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between hover:bg-[#0C5148] transition-all cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <Sparkles className="w-4 h-4 text-[#D9F277]" />
                  <div>
                    <div>Ver Proposta Personalizada para Mim</div>
                    <div className="text-[10px] font-normal text-white/80">
                      Montada estritamente com base nos seus dias e apoios
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleFinalChoice('builder_pro')}
                className="w-full min-h-[48px] p-3 border border-[#C9DBD3] bg-white text-[#152A29] rounded-2xl font-semibold text-xs flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 text-left">
                  <FileCheck2 className="w-4 h-4 text-[#125F55]" />
                  <span>Cadastrar plano do meu personal ou fisioterapeuta</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#5B7170]" />
              </button>

              <button
                onClick={() => handleFinalChoice('builder_manual')}
                className="w-full min-h-[48px] p-3 border border-transparent text-[#5B7170] rounded-2xl font-medium text-xs flex items-center justify-center gap-2 hover:text-[#152A29] hover:bg-black/5 transition-all cursor-pointer"
              >
                <Dumbbell className="w-4 h-4" />
                <span>Montar minha própria rotina manualmente</span>
              </button>
            </div>
          </section>
        )}

        {/* Botão de Avançar nos Passos 1 a 6 */}
        {step < 7 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#5B7170]">
              Passo {step} de 7 · Salvo automaticamente
            </span>
            <button
              onClick={() => {
                if (step === 2 && orderedGoals.length === 0) {
                  setOrderedGoals([DEFAULT_GOALS[0]]);
                }
                if (step === 3 && availableDays.length === 0) {
                  setAvailableDays([1, 3, 5]);
                }
                setStep(step + 1);
              }}
              className="px-6 h-12 bg-[#125F55] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 hover:bg-[#0C5148] transition-all cursor-pointer shadow-sm"
            >
              <span>Avançar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
