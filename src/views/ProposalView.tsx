import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Dumbbell,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Calendar,
  Layers,
  Heart,
  AlertCircle,
  ArrowLeftRight,
  X,
} from 'lucide-react';
import { ExplainableProposal, WorkoutPlan, Exercise, OnboardingDraft } from '../types';
import { allExercises, useFullCatalog } from '../data/catalog';
import { ExerciseIllustration } from '../components/ExerciseIllustration';
import {
  findSafeEquivalentExercises,
  calculateRoutineDurationMinutes,
  fitRoutineToTargetDuration,
  buildRoutinePatternsText,
} from '../lib/workoutEngine';
import {
  EQUIPMENT_LABELS,
  AVOIDANCE_LABELS,
  generateExplainableProposal,
  getLocal,
  STORAGE_KEYS,
} from '../lib/storage';

interface ProposalViewProps {
  proposal: ExplainableProposal;
  onConfirm: () => void;
  onAdjustAnswers: () => void;
  onChooseOtherOption: (option: 'builder_manual' | 'builder_pro') => void;
  onClose?: () => void;
}

export const ProposalView: React.FC<ProposalViewProps> = ({
  proposal,
  onConfirm,
  onAdjustAnswers,
  onChooseOtherOption,
  onClose,
}) => {
  const { profile } = useAuth();
  const { confirmProposal } = useWorkout();
  const { isReady: catalogReady } = useFullCatalog();
  const [currentProposal, setCurrentProposal] = useState<ExplainableProposal>(proposal);
  const [swappingExerciseIndex, setSwappingExerciseIndex] = useState<number | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [showExercisesDetail, setShowExercisesDetail] = useState<boolean>(true);
  const [showOtherOptionsModal, setShowOtherOptionsModal] = useState<boolean>(false);

  // Fallback para rascunho de onboarding caso o contexto de auth ainda esteja sincronizando na transição imediata
  const latestDraft = useMemo(
    () => getLocal<OnboardingDraft | null>(STORAGE_KEYS.ONBOARDING_DRAFT, null),
    [profile]
  );
  const effectiveExpLevel = profile.experienceLevel || latestDraft?.experienceLevel || 'iniciante';
  const effectiveReason = profile.exerciseReason || latestDraft?.exerciseReason || '';
  const effectiveContextNotes = profile.userContextNotes || latestDraft?.userContextNotes || '';

  const daysLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const scheduledDaysIndices = Object.keys(currentProposal.weeklySchedule).map(Number);

  const handleConfirmRoutine = async () => {
    setIsConfirming(true);
    try {
      await confirmProposal(currentProposal);
      onConfirm();
    } catch (err) {
      console.error('Erro ao confirmar proposta:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  const primaryPlan = currentProposal.routines[0];
  const selectedItemToSwap = swappingExerciseIndex !== null ? primaryPlan?.exercises[swappingExerciseIndex] : null;

  useEffect(() => {
    setCurrentProposal(proposal);
  }, [proposal]);

  // Fecha modais com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (swappingExerciseIndex !== null) setSwappingExerciseIndex(null);
        else if (showOtherOptionsModal) setShowOtherOptionsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [swappingExerciseIndex, showOtherOptionsModal]);

  const swapCandidates = useMemo(() => {
    if (!selectedItemToSwap) return [];
    return findSafeEquivalentExercises(selectedItemToSwap.exerciseId, profile, allExercises);
  }, [selectedItemToSwap, profile, catalogReady]);

  const handleSwapExercise = (newEx: Exercise) => {
    if (swappingExerciseIndex === null || !primaryPlan) return;
    const updatedExercises = [...primaryPlan.exercises];
    const prevItem = updatedExercises[swappingExerciseIndex];
    updatedExercises[swappingExerciseIndex] = {
      ...prevItem,
      exerciseId: newEx.id,
      exerciseName: newEx.name_pt,
      targetReps: newEx.tracking === 'time' ? 0 : (prevItem.targetReps || 10),
      targetDurationSeconds: newEx.tracking === 'time' ? 30 : undefined,
    };

    const calibratedExercises = fitRoutineToTargetDuration(
      updatedExercises,
      currentProposal.sessionDurationMinutes
    );
    const recalculatedMinutes = calculateRoutineDurationMinutes(calibratedExercises);
    const updatedTitle = (primaryPlan.title || '').replace(/\(\d+\s*min\)/, `(${recalculatedMinutes} min)`);

    const updatedRoutines = currentProposal.routines.map((r, i) =>
      i === 0
        ? {
            ...r,
            title: updatedTitle,
            exercises: calibratedExercises,
            estimatedDurationMinutes: recalculatedMinutes,
          }
        : r
    );

    const newPatternsText = buildRoutinePatternsText(calibratedExercises);
    const baseJustification = currentProposal.justificationText || '';
    const updatedJustification = baseJustification.replace(
      /foco nos padrões de [^.]+\./,
      `${newPatternsText}.`
    );
    const planB = updatedRoutines[1] || null;
    const updatedTimeBreakdown = planB
      ? `Treino A (${calibratedExercises.length} movimentos em séries calibradas, ~${recalculatedMinutes} min) e Treino B (${planB.exercises.length} movimentos em séries calibradas, ~${planB.estimatedDurationMinutes} min) alternados ao longo da semana.`
      : `${calibratedExercises.length} exercícios × séries calibradas para ~${recalculatedMinutes} min por sessão com descansos e transições calculados.`;

    setCurrentProposal({
      ...currentProposal,
      routines: updatedRoutines,
      justificationText: updatedJustification,
      timeBreakdownText: updatedTimeBreakdown,
    });
    setSwappingExerciseIndex(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#19231E] flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E4DDD3] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={onAdjustAnswers}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#5D6E65] hover:text-[#19231E] p-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ajustar respostas</span>
          </button>
          <span className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
            Proposta de Rotina
          </span>
          {onClose ? (
            <button
              onClick={onClose}
              className="text-xs font-semibold text-[#5D6E65] hover:text-[#19231E] p-1.5 rounded-lg cursor-pointer transition-colors"
            >
              Voltar ao Início
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-5">
        {currentProposal.hasCompatibleExercises === false && (
          <section className="bg-white rounded-3xl p-6 border border-amber-300 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Combinação sem cobertura direta
                </span>
                <h2 className="font-serif text-lg font-bold text-[#19231E]">
                  Não encontramos movimentos curados para estes critérios
                </h2>
                <p className="text-xs text-[#5D6E65] leading-relaxed">
                  {currentProposal.reasonIfUnavailable || 'A combinação atual de equipamentos e restrições não possui exercícios certificados no momento. Não geramos rotinas fictícias.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onAdjustAnswers}
                className="w-full py-3 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#12372A] cursor-pointer shadow-xs"
              >
                Ajustar Equipamentos e Cuidados
              </button>
              <button
                onClick={() => setShowOtherOptionsModal(true)}
                className="w-full py-3 border border-[#E4DDD3] bg-[#FAF8F5] text-[#19231E] rounded-xl text-xs font-semibold hover:bg-white cursor-pointer"
              >
                Montar Ficha Manual ou Cadastrar Plano de Profissional
              </button>
            </div>
          </section>
        )}

        {/* Banner de Apresentação Explicável com 3 Pílulas Sintéticas */}
        <section className="bg-white rounded-3xl p-6 border border-[#E4DDD3] shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8EFE9] flex items-center justify-center text-[#1B4332] shrink-0 mt-0.5">
              <Sparkles className="w-6 h-6 text-[#1B4332]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider bg-[#E8EFE9] px-2.5 py-0.5 rounded-full">
                Proposta Personalizada
              </span>
              <h1 className="font-serif text-2xl font-bold text-[#19231E] mt-1 leading-tight">
                {currentProposal.title}
              </h1>
            </div>
          </div>

          {/* 3 Pílulas Sintéticas no Topo (Ritmo Natural) */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E4DDD3] text-center">
              <Clock className="w-4 h-4 text-[#1B4332] mx-auto mb-1" />
              <span className="text-[10px] text-[#5D6E65] block">Duração</span>
              <span className="font-bold text-xs text-[#19231E]">
                ~{primaryPlan?.estimatedDurationMinutes || currentProposal.sessionDurationMinutes} min (janela de {currentProposal.sessionDurationMinutes} min)
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E4DDD3] text-center">
              <Calendar className="w-4 h-4 text-[#1B4332] mx-auto mb-1" />
              <span className="text-[10px] text-[#5D6E65] block">Frequência</span>
              <span className="font-bold text-xs text-[#19231E]">
                {currentProposal.targetDaysCount}x / semana
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E4DDD3] text-center">
              <Dumbbell className="w-4 h-4 text-[#1B4332] mx-auto mb-1" />
              <span className="text-[10px] text-[#5D6E65] block truncate">Equipamentos</span>
              <span className="font-bold text-xs text-[#19231E] truncate block">
                {profile.equipments && profile.equipments.length > 0 && !profile.equipments.includes('nenhum')
                  ? profile.equipments.map((e) => EQUIPMENT_LABELS[e] || e).slice(0, 1).join(', ')
                  : 'Peso do corpo'}
              </span>
            </div>
          </div>

          {/* Card de Acolhimento do Momento Pessoal (Critério C04, C11) */}
          {(effectiveExpLevel === 'retomando' || effectiveReason || effectiveContextNotes) && (
            <div className="p-4 rounded-2xl bg-[#FDF3F0] border border-[#E07A5F]/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#E07A5F]">
                <span className="text-sm">🌱</span>
                <span>Seu Momento e Motivação Pessoal</span>
              </div>
              <div className="text-xs text-[#19231E]/90 space-y-1 leading-relaxed">
                {effectiveExpLevel === 'retomando' && (
                  <p>
                    <strong>Retomando após pausa:</strong> calibramos um volume acolhedor para que você construa consistência sem cansaço excessivo.
                  </p>
                )}
                {effectiveReason && (
                  <p>
                    <strong>Seu porquê:</strong> «{effectiveReason}».
                  </p>
                )}
                {effectiveContextNotes && (
                  <p>
                    <strong>Nota pessoal:</strong> «{effectiveContextNotes}».
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Justificativa Clara e Verificável (Critério C11) */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E4DDD3] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B4332]">
              <ShieldCheck className="w-4 h-4" />
              <span>Por que esta rotina foi pensada para você?</span>
            </div>
            <p className="text-xs text-[#19231E] leading-relaxed">
              {currentProposal.justificationText}
            </p>
          </div>

          {/* Explicação da Duração com Séries e Descansos Somados (Seção 6) */}
          <p className="text-[11px] text-[#5D6E65] leading-snug px-1">
            {currentProposal.timeBreakdownText}
          </p>

          {/* Atalho para Hábito Mínimo (5 min) se a proposta atual for mais longa */}
          {currentProposal.sessionDurationMinutes === 5 && proposal.sessionDurationMinutes > 5 ? (
            <div className="p-3 bg-[#E8EFE9] rounded-2xl border border-[#1B4332]/20 flex items-center justify-between gap-3 text-xs">
              <div className="text-[#1B4332]">
                <span className="font-bold block">Versão Expressa de 5 min ativada</span>
                <span className="text-[11px] text-[#5D6E65]">Disponibilidade informada original: {proposal.sessionDurationMinutes} min.</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentProposal(proposal)}
                className="px-3 py-1.5 bg-white text-[#1B4332] border border-[#1B4332]/40 rounded-xl text-xs font-bold shrink-0 hover:bg-[#E8EFE9] cursor-pointer shadow-2xs"
              >
                Restaurar {proposal.sessionDurationMinutes} min
              </button>
            </div>
          ) : currentProposal.sessionDurationMinutes > 5 ? (
            <div className="p-3 bg-[#E8EFE9] rounded-2xl border border-[#1B4332]/20 flex items-center justify-between gap-3 text-xs">
              <div className="text-[#1B4332]">
                <span className="font-bold block">Pouco tempo ou voltando aos poucos?</span>
                <span className="text-[11px] text-[#5D6E65]">Comece com 5 min de hábito diário.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const microProposal = generateExplainableProposal(
                    { ...profile, sessionDurationMinutes: 5 },
                    { sessionDurationMinutes: 5 }
                  );
                  const origMin = proposal.sessionDurationMinutes;
                  microProposal.justificationText = `Versão expressa (hábito mínimo): adaptamos esta rotina para aproximadamente 5 minutos por sessão com exercícios essenciais, preservando sua meta de ${microProposal.targetDaysCount} dias por semana e sua disponibilidade original informada de ${origMin} minutos. Foco em manter o hábito ativo sem sobrecarga articular.`;
                  setCurrentProposal(microProposal);
                }}
                className="px-3 py-1.5 bg-[#1B4332] text-white rounded-xl text-xs font-bold shrink-0 hover:bg-[#12372A] cursor-pointer shadow-2xs"
              >
                Versão 5 min
              </button>
            </div>
          ) : null}
        </section>

        {/* Ficha de Exercícios Detalhada */}
        {primaryPlan && (
          <section className="bg-white rounded-3xl p-6 border border-[#C9DBD3] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#152A29]">
                  {primaryPlan.title}
                </h2>
                <p className="text-xs text-[#5B7170] mt-0.5">
                  {primaryPlan.exercises.length} movimentos compatíveis com seus apoios
                </p>
              </div>
              <button
                onClick={() => setShowExercisesDetail(!showExercisesDetail)}
                className="p-2 text-[#5B7170] hover:text-[#152A29] rounded-xl hover:bg-slate-50 cursor-pointer"
                aria-label={showExercisesDetail ? 'Ocultar detalhes' : 'Exibir detalhes'}
              >
                {showExercisesDetail ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            {showExercisesDetail && (
              <div className="space-y-2.5 pt-1">
                {primaryPlan.exercises.map((ex, idx) => (
                  <div
                    key={ex.exerciseId || idx}
                    className="p-3 rounded-2xl bg-[#F5F8F5] border border-[#C9DBD3]/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-white border border-[#C9DBD3] text-[#125F55] font-black flex items-center justify-center text-[11px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold text-[#152A29] block truncate">
                          {ex.exerciseName}
                        </span>
                        <span className="text-[11px] text-[#5B7170]">
                          {ex.targetSets} séries · {ex.targetReps > 0 ? `${ex.targetReps} reps` : `${ex.targetDurationSeconds}s`} · {ex.restSeconds}s descanso
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ex.notes && (
                      <span className="text-[10px] text-[#91610D] font-medium shrink-0 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Atenção
                      </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSwappingExerciseIndex(idx)}
                        className="px-2.5 py-1.5 rounded-xl bg-white border border-[#C9DBD3] text-[#125F55] hover:border-[#125F55] hover:bg-[#EAF3EF] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                        title="Trocar por exercício equivalente seguro"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Trocar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dias agendados */}
            <div className="pt-2 border-t border-[#E4DDD3]/60 space-y-1.5">
              <span className="text-xs font-semibold text-[#5D6E65] block">
                Dias de treino sugeridos na sua semana:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scheduledDaysIndices.map((d) => (
                  <span
                    key={d}
                    className="px-3 py-1 rounded-xl bg-[#E8EFE9] border border-[#1B4332]/30 text-[#1B4332] text-xs font-bold shadow-2xs"
                  >
                    ✓ {daysLabels[d]}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 3 Botões de Ação Explícitos (Seção 6, Critérios C09, C15) */}
        <section className="space-y-3 pt-2">
          {/* Botão 1: Confirmar Minha Rotina (C09, C15) */}
          <button
            onClick={handleConfirmRoutine}
            disabled={isConfirming}
            className="w-full min-h-[56px] p-4 bg-[#1B4332] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#12372A] active:scale-[0.99] transition-all cursor-pointer shadow-md"
          >
            <CheckCircle2 className="w-5 h-5 text-[#D9F277]" />
            <span>Confirmar minha rotina</span>
          </button>

          {/* Botão 2: Ajustar Respostas */}
          <button
            onClick={onAdjustAnswers}
            className="w-full min-h-[48px] p-3 bg-white border border-[#E4DDD3] text-[#19231E] rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#FAF8F5] transition-all cursor-pointer"
          >
            <span>Ajustar proposta ou respostas</span>
          </button>

          {/* Botão 3: Ver Outras Opções */}
          <button
            onClick={() => setShowOtherOptionsModal(true)}
            className="w-full min-h-[44px] p-2.5 text-[#5B7170] text-xs font-medium hover:text-[#152A29] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Ver outras opções (manual ou plano de profissional)</span>
          </button>
        </section>
      </main>

      {/* Modal de Outras Opções */}
      {showOtherOptionsModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-[#C9DBD3] shadow-xl">
            <h3 className="text-base font-bold text-[#152A29]">
              Outras formas de começar
            </h3>
            <p className="text-xs text-[#5B7170]">
              Você tem total autonomia. Se preferir não seguir a proposta sugerida, escolha uma alternativa:
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setShowOtherOptionsModal(false);
                  onChooseOtherOption('builder_pro');
                }}
                className="w-full p-3.5 rounded-2xl border border-[#C9DBD3] text-left hover:border-[#125F55] hover:bg-[#EAF3EF] transition-all cursor-pointer min-h-[52px]"
              >
                <div className="text-xs font-bold text-[#152A29]">Cadastrar Plano de Profissional</div>
                <div className="text-[11px] text-[#5B7170] mt-0.5">
                  Adicione a prescrição do seu personal trainer ou fisioterapeuta.
                </div>
              </button>

              <button
                onClick={() => {
                  setShowOtherOptionsModal(false);
                  onChooseOtherOption('builder_manual');
                }}
                className="w-full p-3.5 rounded-2xl border border-[#C9DBD3] text-left hover:border-[#125F55] hover:bg-[#EAF3EF] transition-all cursor-pointer min-h-[52px]"
              >
                <div className="text-xs font-bold text-[#152A29]">Montar Minha Rotina Manualmente</div>
                <div className="text-[11px] text-[#5B7170] mt-0.5">
                  Selecione livremente do catálogo oficial e defina suas séries.
                </div>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowOtherOptionsModal(false)}
                className="w-full py-2.5 text-xs font-semibold text-[#5B7170] hover:text-[#152A29] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TROCA RAPIDA DE EXERCICIO NA PROPOSTA INICIAL (Fase 8) */}
      {swappingExerciseIndex !== null && selectedItemToSwap && (
        <div
          onClick={() => setSwappingExerciseIndex(null)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-[#C9DBD3] text-[#152A29] relative overflow-hidden cursor-default animate-in fade-in slide-in-from-bottom duration-200"
          >
            <div className="p-4 border-b border-[#C9DBD3] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#125F55]">
                  Substituição Segura
                </span>
                <h3 className="text-sm font-bold text-[#152A29]">
                  Trocar: {selectedItemToSwap.exerciseName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSwappingExerciseIndex(null)}
                className="w-8 h-8 rounded-full bg-[#F5F8F5] hover:bg-slate-200 text-[#5B7170] flex items-center justify-center cursor-pointer transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              <p className="text-xs text-[#5B7170]">
                Exercícios com o mesmo foco biomecânico e adaptados aos seus cuidados e equipamentos:
              </p>

              {swapCandidates.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5B7170] bg-[#F5F8F5] rounded-2xl">
                  Nenhuma alternativa equivalente adicional encontrada para a combinação atual de equipamentos.
                </div>
              ) : (
                swapCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3 rounded-2xl bg-white border border-[#C9DBD3] hover:border-[#125F55]/60 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ExerciseIllustration
                        movementPattern={cand.movement_pattern}
                        modality={cand.modality}
                        images={cand.images}
                        exerciseName={cand.name_pt}
                        className="w-14 h-14 rounded-xl shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#152A29] truncate">
                          {cand.name_pt}
                        </h4>
                        <p className="text-[11px] text-[#5B7170] truncate mt-0.5">
                          {cand.target_muscle} · {cand.equipment.join(', ')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSwapExercise(cand)}
                      className="px-3 py-1.5 rounded-xl bg-[#EAF3EF] text-[#125F55] text-xs font-bold shrink-0 hover:bg-[#125F55] hover:text-white transition-colors cursor-pointer"
                    >
                      Escolher
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
