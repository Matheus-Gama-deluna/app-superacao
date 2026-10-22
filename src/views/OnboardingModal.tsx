import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  ChevronUp,
  ChevronDown,
  Clock,
  Dumbbell,
  Target,
  Calendar,
  Layers,
} from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingModalProps {
  onComplete: () => void;
  initialStep?: number;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, initialStep = 1 }) => {
  const { profile, updateUserProfile } = useAuth();

  const [step, setStep] = useState<number>(initialStep);

  // 1. Objetivos Múltiplos com Prioridade Explícita (A03)
  const availableGoalOptions = [
    { id: 'habito', label: 'Construir o hábito e consistência diária' },
    { id: 'postura', label: 'Melhorar postura e aliviar tensões' },
    { id: 'forca', label: 'Ganhar força funcional e mobilidade' },
    { id: 'energia', label: 'Mais energia e disposição no dia a dia' },
    { id: 'saude', label: 'Saúde preventiva e bem-estar geral' },
  ];

  const [orderedGoals, setOrderedGoals] = useState<string[]>(() => {
    if (profile.goalPriorityOrder && profile.goalPriorityOrder.length > 0) {
      return profile.goalPriorityOrder;
    }
    if (profile.primaryGoal) {
      return [profile.primaryGoal, ...(profile.secondaryGoals || [])];
    }
    return ['Construir o hábito e consistência diária'];
  });

  const [goalFocus, setGoalFocus] = useState<'foco_unico' | 'equilibrado'>(
    profile.goalFocus || 'foco_unico'
  );

  // 2. Experiência e Disponibilidade
  const [experienceLevel, setExperienceLevel] = useState<UserProfile['experienceLevel']>(
    (profile.experienceLevel as any) || 'iniciante'
  );
  const [availableDays, setAvailableDays] = useState<number[]>(
    profile.availableDays && profile.availableDays.length > 0 ? profile.availableDays : [1, 3, 5]
  );
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(
    profile.sessionDurationMinutes || 20
  );

  // 3. Equipamentos Específicos (A04)
  const [equipments, setEquipments] = useState<string[]>(() => {
    if (profile.equipments && profile.equipments.length > 0) {
      return profile.equipments;
    }
    return ['peso_corporal'];
  });

  // 4. Origem do Plano e Âncora
  const [planSourcePreference, setPlanSourcePreference] = useState<'criar' | 'modelo_revisado' | 'profissional'>(
    profile.planSourcePreference || 'modelo_revisado'
  );
  const [habitAnchor, setHabitAnchor] = useState<string>(profile.habitAnchor || '');

  // Handlers para reordenar objetivos
  const handleToggleGoal = (label: string) => {
    if (orderedGoals.includes(label)) {
      if (orderedGoals.length === 1) return; // Mantém pelo menos um
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
      if (availableDays.length === 1) return;
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

  const handleSaveAndConfirm = async () => {
    const primaryGoal = orderedGoals[0] || 'Construir o hábito e consistência diária';
    const secondaryGoals = orderedGoals.slice(1);

    await updateUserProfile({
      primaryGoal,
      secondaryGoals,
      goalPriorityOrder: orderedGoals,
      goalFocus,
      experienceLevel,
      availableDays,
      sessionDurationMinutes,
      equipments,
      planSourcePreference,
      habitAnchor: habitAnchor.trim(),
      onboardingCompleted: true,
      needsReviewPrompt: false,
    });

    onComplete();
  };

  const daysLabels = [
    { idx: 0, label: 'Dom' },
    { idx: 1, label: 'Seg' },
    { idx: 2, label: 'Ter' },
    { idx: 3, label: 'Qua' },
    { idx: 4, label: 'Qui' },
    { idx: 5, label: 'Sex' },
    { idx: 6, label: 'Sáb' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl bg-white p-5 shadow-2xl border border-[#C9DBD3] text-[#152A29] relative animate-in fade-in duration-200">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#C9DBD3]/50">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step ? 'w-5 bg-[#125F55]' : s < step ? 'w-2 bg-[#246747]' : 'w-2 bg-[#C9DBD3]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={onComplete}
            className="p-1 rounded-full text-[#5B7170] hover:bg-slate-100 cursor-pointer"
            title="Explorar sem preencher"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo rolável com scroll suave */}
        <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-4">
          {/* PASSO 1: OBJETIVOS E PRIORIZAÇÃO (A03) */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-[#125F55] uppercase tracking-wider">
                  Etapa 1 de 5 · Seus Objetivos
                </span>
                <h3 className="text-base font-bold text-[#152A29] mt-0.5">
                  Quais são suas prioridades de treino?
                </h3>
                <p className="text-xs text-[#5B7170]">
                  Selecione um ou mais objetivos. O primeiro da lista será seu foco primário.
                </p>
              </div>

              {/* Lista reordenável de objetivos ativos */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#152A29] block">
                  Prioridade (arranje com as setas):
                </span>
                {orderedGoals.map((g, idx) => (
                  <div
                    key={g}
                    className="p-2.5 rounded-xl border border-[#125F55]/40 bg-[#EAF3EF] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#125F55] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-[#152A29]">{g}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveGoalUp(idx)}
                        disabled={idx === 0}
                        className="p-1 text-[#5B7170] hover:text-[#125F55] disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveGoalDown(idx)}
                        disabled={idx === orderedGoals.length - 1}
                        className="p-1 text-[#5B7170] hover:text-[#125F55] disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Opções extras para adicionar */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-[#5B7170] block mb-1.5">
                  Adicionar outros objetivos à sua lista:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableGoalOptions
                    .filter((opt) => !orderedGoals.includes(opt.label))
                    .map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleToggleGoal(opt.label)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#C9DBD3] text-[11px] font-medium text-[#5B7170] bg-white hover:border-[#125F55] cursor-pointer"
                      >
                        + {opt.label}
                      </button>
                    ))}
                </div>
              </div>

              {/* Foco único vs Equilibrado */}
              <div className="pt-2 border-t border-[#C9DBD3]/50">
                <label className="text-[11px] font-bold text-[#152A29] block mb-1.5">
                  Estratégia de ciclo:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGoalFocus('foco_unico')}
                    className={`p-2.5 rounded-xl border text-left text-xs cursor-pointer ${
                      goalFocus === 'foco_unico'
                        ? 'border-[#125F55] bg-[#EAF3EF] font-bold text-[#125F55]'
                        : 'border-[#C9DBD3] text-[#5B7170]'
                    }`}
                  >
                    <div>Foco Principal</div>
                    <div className="text-[10px] text-[#5B7170] font-normal mt-0.5">
                      Prioriza o 1º objetivo durante 4 a 8 semanas
                    </div>
                  </button>

                  <button
                    onClick={() => setGoalFocus('equilibrado')}
                    className={`p-2.5 rounded-xl border text-left text-xs cursor-pointer ${
                      goalFocus === 'equilibrado'
                        ? 'border-[#125F55] bg-[#EAF3EF] font-bold text-[#125F55]'
                        : 'border-[#C9DBD3] text-[#5B7170]'
                    }`}
                  >
                    <div>Equilíbrio Geral</div>
                    <div className="text-[10px] text-[#5B7170] font-normal mt-0.5">
                      Distribui atenção equilibrada entre todos
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: EXPERIÊNCIA E DISPONIBILIDADE */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-[#125F55] uppercase tracking-wider">
                  Etapa 2 de 5 · Rotina Real
                </span>
                <h3 className="text-base font-bold text-[#152A29] mt-0.5">
                  Sua experiência e tempo disponível
                </h3>
                <p className="text-xs text-[#5B7170]">
                  Planejamos apenas o que cabe na sua rotina, sem treinos excessivos.
                </p>
              </div>

              {/* Experiência autodeclarada */}
              <div>
                <label className="text-[11px] font-bold text-[#152A29] block mb-1.5">
                  Sua relação atual com exercícios:
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'iniciante', title: 'Começando agora', desc: 'Pouca ou nenhuma familiaridade com rotinas de treino' },
                    { id: 'retomando', title: 'Retomando após pausa', desc: 'Já treinei no passado, mas estou parado há meses' },
                    { id: 'pratica', title: 'Já pratico com frequência', desc: 'Costumo treinar e procuro organizar e acompanhar evolução' },
                  ].map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() => setExperienceLevel(exp.id as any)}
                      className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                        experienceLevel === exp.id
                          ? 'border-[#125F55] bg-[#EAF3EF]'
                          : 'border-[#C9DBD3] bg-white hover:border-[#125F55]/50'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#152A29]">{exp.title}</div>
                      <div className="text-[10px] text-[#5B7170] mt-0.5">{exp.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dias disponíveis */}
              <div>
                <label className="text-[11px] font-bold text-[#152A29] block mb-1.5">
                  Dias disponíveis por semana ({availableDays.length} selecionados):
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {daysLabels.map((d) => {
                    const isSelected = availableDays.includes(d.idx);
                    return (
                      <button
                        key={d.idx}
                        onClick={() => handleToggleDay(d.idx)}
                        className={`h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#125F55] text-white shadow-xs'
                            : 'bg-[#F5F8F5] text-[#5B7170] border border-[#C9DBD3]'
                        }`}
                      >
                        <span>{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tempo por sessão */}
              <div>
                <label className="text-[11px] font-bold text-[#152A29] block mb-1.5">
                  Tempo por sessão:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 20, 30, 45].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setSessionDurationMinutes(mins)}
                      className={`h-10 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        sessionDurationMinutes === mins
                          ? 'border-[#125F55] bg-[#EAF3EF] text-[#125F55]'
                          : 'border-[#C9DBD3] text-[#5B7170]'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASSO 3: EQUIPAMENTOS ESPECÍFICOS (A04) */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-[#125F55] uppercase tracking-wider">
                  Etapa 3 de 5 · Equipamentos
                </span>
                <h3 className="text-base font-bold text-[#152A29] mt-0.5">
                  O que você tem disponível para usar?
                </h3>
                <p className="text-xs text-[#5B7170]">
                  Não marcamos nenhum apoio por suposição. Marque apenas o que tiver em mãos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'peso_corporal', label: 'Peso Corporal Puro', desc: 'Sem nenhum acessório necessário' },
                  { id: 'mini_band', label: 'Mini Band', desc: 'Faixa elástica circular fechada' },
                  { id: 'faixa_longa', label: 'Faixa Longa (Super Band)', desc: 'Elástico longo para assistência e tração' },
                  { id: 'tubos_elasticos', label: 'Tubos com Pegadores', desc: 'Elásticos tubulares com manoplas' },
                  { id: 'cadeira', label: 'Cadeira Estável', desc: 'Assento firme para apoio ou elevações' },
                  { id: 'parede', label: 'Espaço Livre na Parede', desc: 'Superfície para apoiar e alinhar' },
                  { id: 'halteres', label: 'Halteres ou Pesos Livres', desc: 'Cargas para progressão de força' },
                  { id: 'colchonete', label: 'Colchonete / Tapete', desc: 'Conforto para exercícios no solo' },
                ].map((item) => {
                  const isChecked = equipments.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleToggleEquipment(item.id)}
                      className={`p-3 rounded-xl border text-left flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                        isChecked
                          ? 'border-[#125F55] bg-[#EAF3EF]'
                          : 'border-[#C9DBD3] bg-white hover:border-[#125F55]/40'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-[#152A29]">{item.label}</div>
                        <div className="text-[10px] text-[#5B7170] mt-0.5">{item.desc}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                          isChecked ? 'bg-[#125F55] border-[#125F55] text-white' : 'border-[#C9DBD3]'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASSO 4: ORIGEM DO PLANO E ÂNCORA (A02, A23) */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-[#125F55] uppercase tracking-wider">
                  Etapa 4 de 5 · Origem & Hábito
                </span>
                <h3 className="text-base font-bold text-[#152A29] mt-0.5">
                  Como prefere começar sua rotina?
                </h3>
                <p className="text-xs text-[#5B7170]">
                  Escolha como seu plano será estruturado inicialmente.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  {
                    id: 'modelo_revisado',
                    title: 'Escolher um modelo de referência',
                    desc: 'Fichas demonstrativas adaptadas ao seu perfil de dias e equipamentos.',
                  },
                  {
                    id: 'criar',
                    title: 'Montar meu treino do zero',
                    desc: 'Escolher livremente os exercícios no editor manual com filtros completos.',
                  },
                  {
                    id: 'profissional',
                    title: 'Cadastrar treino de um profissional',
                    desc: 'Registrar a ficha prescrita pelo seu personal trainer ou fisioterapeuta.',
                  },
                ].map((orig) => (
                  <button
                    key={orig.id}
                    onClick={() => setPlanSourcePreference(orig.id as any)}
                    className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      planSourcePreference === orig.id
                        ? 'border-[#125F55] bg-[#EAF3EF]'
                        : 'border-[#C9DBD3] bg-white hover:border-[#125F55]/50'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#152A29]">{orig.title}</div>
                    <div className="text-[10px] text-[#5B7170] mt-0.5">{orig.desc}</div>
                  </button>
                ))}
              </div>

              {/* Âncora de hábito opcional */}
              <div className="pt-2 border-t border-[#C9DBD3]/50">
                <label className="text-[11px] font-bold text-[#152A29] block mb-1">
                  Âncora de rotina (opcional):
                </label>
                <p className="text-[10px] text-[#5B7170] mb-2">
                  Ex: "Depois do meu café da manhã" ou "Ao encerrar o trabalho às 18h".
                </p>
                <input
                  type="text"
                  placeholder="Ex: Logo após escovar os dentes pela manhã..."
                  value={habitAnchor}
                  onChange={(e) => setHabitAnchor(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#C9DBD3] text-xs text-[#152A29]"
                />
              </div>
            </div>
          )}

          {/* PASSO 5: RESUMO E CONFIRMAÇÃO EXPLÍCITA */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-[#125F55] uppercase tracking-wider">
                  Etapa 5 de 5 · Resumo
                </span>
                <h3 className="text-base font-bold text-[#152A29] mt-0.5">
                  Confirme as configurações da sua rotina
                </h3>
                <p className="text-xs text-[#5B7170]">
                  Nada é ativado sem seu consentimento explícito.
                </p>
              </div>

              <div className="bg-[#F5F8F5] p-3.5 rounded-2xl border border-[#C9DBD3] space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#5B7170] uppercase">Objetivos:</span>
                  <p className="font-semibold text-[#152A29] mt-0.5">
                    1º {orderedGoals[0]}
                    {orderedGoals.length > 1 && ` (+${orderedGoals.length - 1} secundários)`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#C9DBD3]/40">
                  <div>
                    <span className="text-[10px] font-bold text-[#5B7170] uppercase">Frequência:</span>
                    <p className="font-semibold text-[#152A29] mt-0.5">
                      {availableDays.length} dias por semana · {sessionDurationMinutes} min/sessão
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#5B7170] uppercase">Experiência:</span>
                    <p className="font-semibold text-[#152A29] mt-0.5 capitalize">
                      {experienceLevel}
                    </p>
                  </div>
                </div>

                <div className="pt-1 border-t border-[#C9DBD3]/40">
                  <span className="text-[10px] font-bold text-[#5B7170] uppercase">Equipamentos confirmados:</span>
                  <p className="font-semibold text-[#152A29] mt-0.5">
                    {equipments.map((e) => e.replace('_', ' ')).join(', ')}
                  </p>
                </div>

                {habitAnchor && (
                  <div className="pt-1 border-t border-[#C9DBD3]/40">
                    <span className="text-[10px] font-bold text-[#5B7170] uppercase">Âncora de Hábito:</span>
                    <p className="font-semibold text-[#125F55] mt-0.5">
                      "{habitAnchor}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Navegação */}
        <div className="pt-3 border-t border-[#C9DBD3]/50 flex items-center justify-between gap-2">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="h-11 px-3.5 rounded-xl border border-[#C9DBD3] text-[#5B7170] font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="h-11 px-3 text-[#5B7170] font-semibold text-xs hover:underline cursor-pointer"
            >
              Explorar agora
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="h-11 px-5 rounded-xl bg-[#125F55] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#0C5148] shadow-xs cursor-pointer ml-auto"
            >
              <span>Avançar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSaveAndConfirm}
              className="h-11 px-6 rounded-xl bg-[#125F55] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#0C5148] shadow-md cursor-pointer ml-auto"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar e Salvar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
