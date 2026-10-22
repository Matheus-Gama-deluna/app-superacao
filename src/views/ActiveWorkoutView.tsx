import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { ExerciseIllustration } from '../components/ExerciseIllustration';
import { getExerciseById } from '../data/catalog';
import {
  X,
  Check,
  RotateCcw,
  SkipForward,
  Plus,
  Minus,
  Sparkles,
  Trophy,
  Clock,
  Heart,
  ChevronRight,
  ChevronLeft,
  Flame,
  Volume2,
  VolumeX,
  Info,
  ShieldAlert,
  Pause,
} from 'lucide-react';
import { soundManager } from '../lib/audio';

interface ActiveWorkoutViewProps {
  onPauseAndReturnHome?: () => void;
}

// Verifica se o exercício é compatível com sobrecarga em kg ou estritamente peso corporal / mobilidade (E06)
function supportsExternalWeight(ex: any): boolean {
  if (!ex) return false;
  if (ex.modality === 'mobilidade' || ex.modality === 'alongamento' || ex.modality === 'recuperacao') {
    return false;
  }
  const weightEquipments = ['halteres', 'kettlebell', 'barra', 'anilhas', 'maquina', 'cabo', 'polia', 'caneleira'];
  const hasWeightEquipment = Array.isArray(ex.equipment) && ex.equipment.some((eq: string) => weightEquipments.includes(eq.toLowerCase()));
  const isExcludedPattern = ['mobilidade', 'alongamento', 'postura'].includes(ex.movement_pattern);
  return hasWeightEquipment || (!isExcludedPattern && (ex.modality === 'hipertrofia' || ex.modality === 'forca'));
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({
  onPauseAndReturnHome,
}) => {
  const { profile, updateUserProfile } = useAuth();
  const {
    activeSession,
    recordSet,
    previousExercise,
    nextExercise,
    completeWorkout,
    savePartialWorkout,
    abandonWorkout,
    pauseAndReturnHome,
    isResting,
    restSecondsRemaining,
    restDurationTotal,
    skipRest,
    addRestSeconds,
    personalRecords,
  } = useWorkout();

  // Estados locais do modal de confirmação de série (S08)
  const [showConfirmSheet, setShowConfirmSheet] = useState<boolean>(false);
  const [actualRepsInput, setActualRepsInput] = useState<number>(10);
  const [actualDurationInput, setActualDurationInput] = useState<number>(30);
  const [actualWeightInput, setActualWeightInput] = useState<number>(0);
  const [confirmRestSeconds, setConfirmRestSeconds] = useState<number>(60);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState<boolean>(false);
  const [showFinishScreen, setShowFinishScreen] = useState<boolean>(false);
  const [showExerciseDetail, setShowExerciseDetail] = useState<boolean>(false);
  const [effortScore, setEffortScore] = useState<number>(3);
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Tecla Escape para fechar qualquer modal aberto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExerciseDetail) setShowExerciseDetail(false);
        else if (showConfirmSheet) setShowConfirmSheet(false);
        else if (showAbandonConfirm) setShowAbandonConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExerciseDetail, showConfirmSheet, showAbandonConfirm]);

  if (!activeSession) return null;

  const currentExerciseItem = activeSession.exercisesSnapshot[activeSession.currentExerciseIndex];
  const exerciseDetails = currentExerciseItem ? getExerciseById(currentExerciseItem.exerciseId) : null;
  const isTimeTracking = exerciseDetails?.tracking === 'time';

  // Histórico anterior do exercício para desafio pessoal
  const previousPR = personalRecords.find((p) => p.exerciseId === currentExerciseItem?.exerciseId);

  // Próximo exercício / série para preparação no descanso (E05)
  // Durante o descanso (isResting), recordSet já avançou currentExerciseIndex e currentSetIndex para a série a ser executada
  const nextExItem = activeSession.exercisesSnapshot[activeSession.currentExerciseIndex] || currentExerciseItem;
  const nextSetNum = activeSession.currentSetIndex;

  const handleOpenConfirm = () => {
    if (isTimeTracking) {
      setActualDurationInput(currentExerciseItem?.targetDurationSeconds || 30);
    } else {
      setActualRepsInput(currentExerciseItem?.targetReps || 10);
    }
    setActualWeightInput(previousPR?.bestWeightKg || 0);
    setConfirmRestSeconds(currentExerciseItem?.restSeconds || 60);
    setShowConfirmSheet(true);
  };

  const handleSaveSet = async () => {
    setShowConfirmSheet(false);
    const result = await recordSet(
      isTimeTracking ? 0 : actualRepsInput,
      isTimeTracking ? actualDurationInput : undefined,
      confirmRestSeconds,
      actualWeightInput > 0 ? actualWeightInput : undefined
    );

    // Se concluiu a última série do último exercício, abre tela final (S10)
    const isVeryLast =
      activeSession.currentExerciseIndex >= activeSession.exercisesSnapshot.length - 1 &&
      activeSession.currentSetIndex >= currentExerciseItem.targetSets;

    if (isVeryLast) {
      setShowFinishScreen(true);
    }
  };

  const handleFinishWorkout = async () => {
    await completeWorkout(effortScore, workoutNotes);
  };

  const handleShareWorkout = async () => {
    const shareText = `🔥 Mais um treino concluído no Superação!\n📋 ${activeSession.planTitle}\n⏱️ ${Math.ceil(activeSession.durationSeconds / 60)} minutos dedicados\n💪 ${activeSession.totalSetsCompleted} séries concluídas\n${activeSession.totalVolumeKg ? `🏋️ ${activeSession.totalVolumeKg} kg superados em volume\n` : ''}${activeSession.prsAchieved > 0 ? `🏆 ${activeSession.prsAchieved} novos recordes pessoais!\n` : ''}\nConstruindo minha melhor versão todos os dias!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Superação Diária', text: shareText });
        return;
      } catch {
        // Fallback para área de transferência
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    } catch {
      // Ignorar falha silenciosa
    }
  };

  const toggleSound = () => {
    const nextSound = !profile.soundEnabled;
    soundManager.setMuted(!nextSound);
    updateUserProfile({ soundEnabled: nextSound });
  };

  // ──────────────────────────────────────────────
  // TELA S10: CONCLUSÃO & PONTE PARA O PRÓXIMO DIA
  // ──────────────────────────────────────────────
  if (showFinishScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F5F8F5] text-[#152A29] p-5 flex flex-col justify-between overflow-y-auto pt-safe pb-safe animate-in fade-in duration-300">
        <div className="max-w-md mx-auto w-full space-y-6 pt-4">
          {/* Header de Vitória */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#D9F277] text-[#203826] rounded-3xl mx-auto flex items-center justify-center shadow-md">
              <Trophy className="w-9 h-9 text-[#125F55]" />
            </div>
            <span className="text-xs font-bold text-[#125F55] uppercase tracking-wider">
              Treino Realizado
            </span>
            <h2 className="text-2xl font-black text-[#152A29]">
              Parabéns pela superação!
            </h2>
            <p className="text-xs text-[#5B7170]">
              Você honrou o compromisso consigo mesmo hoje.
            </p>
          </div>

          {/* Métricas Reais do Treino */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white p-3.5 rounded-2xl border border-[#C9DBD3] text-center shadow-xs">
              <span className="text-[10px] text-[#5B7170] block font-medium">Duração</span>
              <span className="text-lg font-black text-[#125F55] tabular-nums mt-0.5 block">
                {Math.ceil(activeSession.durationSeconds / 60)} min
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-[#C9DBD3] text-center shadow-xs">
              <span className="text-[10px] text-[#5B7170] block font-medium">Séries Feitas</span>
              <span className="text-lg font-black text-[#125F55] tabular-nums mt-0.5 block">
                {activeSession.totalSetsCompleted}
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-[#C9DBD3] text-center shadow-xs">
              <span className="text-[10px] text-[#5B7170] block font-medium">Recordes (PRs)</span>
              <span className="text-lg font-black text-[#246747] tabular-nums mt-0.5 block">
                {activeSession.prsAchieved}
              </span>
            </div>
          </div>

          {/* Volume em kg se houver */}
          {activeSession.totalVolumeKg && activeSession.totalVolumeKg > 0 ? (
            <div className="bg-[#EAF3EF] p-3 rounded-2xl border border-[#C9DBD3] text-center">
              <span className="text-[10px] text-[#5B7170] font-bold uppercase tracking-wider block">
                Volume Total Superado na Sessão
              </span>
              <span className="text-xl font-black text-[#125F55] tabular-nums">
                {activeSession.totalVolumeKg.toLocaleString('pt-BR')} kg
              </span>
            </div>
          ) : null}

          {/* Percepção de Esforço (RPE 1-5) */}
          <div className="bg-white p-4 rounded-2xl border border-[#C9DBD3] shadow-xs space-y-2">
            <label className="block text-xs font-bold text-[#152A29]">
              Como você sentiu o treino de hoje?
            </label>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { score: 1, label: 'Leve' },
                { score: 2, label: 'Suave' },
                { score: 3, label: 'Bom' },
                { score: 4, label: 'Intenso' },
                { score: 5, label: 'Máximo' },
              ].map((item) => (
                <button
                  key={item.score}
                  onClick={() => setEffortScore(item.score)}
                  className={`py-2 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                    effortScore === item.score
                      ? 'bg-[#125F55] text-white shadow-xs'
                      : 'bg-[#F5F8F5] text-[#5B7170] border border-[#C9DBD3] hover:border-[#125F55]'
                  }`}
                >
                  {item.score}
                  <span className="block text-[9px] font-normal">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card de Celebração de Conclusão / Compartilhar */}
          <div className="bg-white p-4 rounded-2xl border border-[#C9DBD3] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#152A29]">Compartilhar sua Superação</span>
              {copiedShare && (
                <span className="text-emerald-700 font-bold text-[11px]">✓ Copiado para compartilhar!</span>
              )}
            </div>
            <p className="text-[11px] text-[#5B7170]">
              Inspire amigos ou guarde o resumo da sua vitória diária.
            </p>
            <button
              type="button"
              onClick={handleShareWorkout}
              className="w-full py-3 bg-[#EAF3EF] hover:bg-[#D9F277] text-[#125F55] hover:text-[#203826] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#C9DBD3]"
            >
              <Sparkles className="w-4 h-4 text-[#E07A5F]" />
              <span>{copiedShare ? 'Resumo Copiado para a Área de Transferência!' : 'Compartilhar Vitória'}</span>
            </button>
          </div>

          {/* A PONTE PARA O PRÓXIMO DIA (Psicologia Comportamental) */}
          <div className="bg-[#EAF3EF] border border-[#C9DBD3] p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#125F55]">
              <Sparkles className="w-4 h-4 text-[#125F55]" />
              <span>Ponte para amanhã: Seu próximo passo</span>
            </div>
            <p className="text-xs text-[#152A29] leading-relaxed">
              O hábito de quem se exercita se constrói no ritmo contínuo. Amanhã sua meta é <strong>Recuperação Ativa & Alongamento</strong> para soltar as articulações ou <strong>Descanso Total</strong>.
            </p>
          </div>
        </div>

        {/* Botão de Fechar e Voltar */}
        <div className="max-w-md mx-auto w-full pt-4">
          <button
            onClick={handleFinishWorkout}
            className="w-full h-14 bg-[#125F55] text-white font-bold text-sm rounded-2xl hover:bg-[#0C5148] active:scale-[0.98] transition-all shadow-md cursor-pointer"
          >
            Concluir e Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // TELA S07 / S09: MODO FOCO EM EXECUÇÃO
  // ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-[#F5F8F5] text-[#152A29] flex flex-col justify-between pt-safe pb-safe select-none">
      {/* Top Header do Modo Foco */}
      <header className="px-4 py-2.5 flex items-center justify-between border-b border-[#C9DBD3] bg-white">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAbandonConfirm(true)}
            className="p-1.5 rounded-lg text-[#5B7170] hover:text-[#B13D39] cursor-pointer"
            title="Encerrar sessão"
            aria-label="Encerrar sessão"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={onPauseAndReturnHome || pauseAndReturnHome}
            className="p-1.5 rounded-lg text-[#5B7170] hover:text-[#125F55] cursor-pointer"
            title="Pausar treino e voltar ao início"
            aria-label="Pausar treino e voltar ao início"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#125F55]">
            Modo Foco · {activeSession.planTitle}
          </span>
          <div className="text-xs text-[#5B7170] font-medium">
            Exercício {activeSession.currentExerciseIndex + 1} de {activeSession.exercisesSnapshot.length}
          </div>
        </div>

        <button
          onClick={toggleSound}
          className="p-1.5 rounded-lg text-[#5B7170] hover:text-[#125F55]"
          title="Alternar som do timer"
        >
          {profile.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </header>

      {/* OVERLAY DE DESCANSO (S09) COM CRONÔMETRO SENSORIAL */}
      {isResting ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in duration-200">
          <span className="px-3 py-1 bg-[#EAF3EF] text-[#125F55] text-xs font-bold rounded-full border border-[#C9DBD3]">
            Descanso Ativo em Andamento
          </span>

          {/* Relógio Circular Grande */}
          <div className="relative w-52 h-52 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="104"
                cy="104"
                r="90"
                stroke="#C9DBD3"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="104"
                cy="104"
                r="90"
                stroke="#125F55"
                strokeWidth="8"
                strokeDasharray={565.48}
                strokeDashoffset={
                  restDurationTotal > 0
                    ? 565.48 * (1 - restSecondsRemaining / restDurationTotal)
                    : 0
                }
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black text-[#152A29] tabular-nums tracking-tighter">
                {restSecondsRemaining}
              </span>
              <span className="text-xs text-[#5B7170] font-semibold uppercase mt-1">segundos</span>
            </div>
          </div>

          {/* Próximo Movimento (Preparação Psicológica) */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#C9DBD3] max-w-xs w-full text-xs text-left shadow-xs">
            <span className="text-[10px] text-[#5B7170] font-bold uppercase tracking-wider block">
              Próxima Série:
            </span>
            <p className="font-bold text-[#152A29] mt-0.5 truncate">
              {nextExItem?.exerciseName}
            </p>
            <p className="text-[#125F55] font-semibold text-[11px] mt-0.5">
              Série {nextSetNum} de {nextExItem?.targetSets} · Meta: {nextExItem?.targetReps ? `${nextExItem.targetReps} reps` : `${nextExItem?.targetDurationSeconds}s`}
            </p>
          </div>

          {/* Controles de Descanso */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <button
              onClick={() => addRestSeconds(15)}
              className="flex-1 py-3 bg-white border border-[#C9DBD3] text-[#152A29] text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              +15s
            </button>
            <button
              onClick={skipRest}
              className="flex-2 py-3 bg-[#125F55] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#0C5148] cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
              <span>Iniciar Série Já</span>
            </button>
          </div>
        </div>
      ) : (
        /* ÁREA PRINCIPAL DO EXERCÍCIO (S07) */
        <main className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full overflow-y-auto">
          {/* Ilustração e Nome */}
          <div className="space-y-3">
            <ExerciseIllustration
              movementPattern={exerciseDetails?.movement_pattern}
              modality={exerciseDetails?.modality}
              images={exerciseDetails?.images}
              exerciseName={currentExerciseItem.exerciseName}
              className="w-full h-44 shadow-xs"
            />

            <div>
              <div className="flex items-center justify-between text-xs text-[#125F55] font-bold">
                <span>{exerciseDetails?.target_muscle || 'Corpo todo'}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#EAF3EF] text-[11px]">
                  Série {activeSession.currentSetIndex} de {currentExerciseItem.targetSets}
                </span>
              </div>
              <h2 className="text-xl font-black text-[#152A29] mt-1">
                {currentExerciseItem.exerciseName}
              </h2>
            </div>

            {/* Dica de Micro-Superação (Última marca vs Meta de hoje) */}
            <div className="bg-[#EAF3EF] p-3 rounded-2xl border border-[#C9DBD3] text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-[#125F55]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Meta desta série:
                </span>
                <span className="font-black text-sm tabular-nums">
                  {isTimeTracking
                    ? `${currentExerciseItem.targetDurationSeconds || 30}s`
                    : `${currentExerciseItem.targetReps} reps`}
                </span>
              </div>
              {previousPR && (
                <p className="text-[11px] text-[#5B7170]">
                  Seu melhor histórico: <strong>{previousPR.bestReps > 0 ? `${previousPR.bestReps} reps` : `${previousPR.bestDurationSeconds}s`}</strong>. Supere por 1 repetição se for possível hoje!
                </p>
              )}
            </div>

            {/* Instrução Rápida de Execução com clique para detalhes */}
            {exerciseDetails?.instructions_pt && (
              <div
                onClick={() => setShowExerciseDetail(true)}
                className="bg-white p-3 rounded-2xl border border-[#C9DBD3]/70 hover:border-[#125F55] cursor-pointer transition-all group shadow-2xs"
                title="Clique para ver o passo a passo completo e cuidados"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-[#125F55] mb-1">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Como Executar o Movimento:
                  </span>
                  <span className="text-[10px] text-[#5B7170] group-hover:text-[#125F55] underline font-semibold">
                    Ver passos
                  </span>
                </div>
                <p className="text-xs text-[#5B7170] line-clamp-3 leading-relaxed">
                  {exerciseDetails.instructions_pt}
                </p>
              </div>
            )}
          </div>

          {/* Navegação entre movimentos e CTA Principal */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#5B7170] px-1">
              <button
                onClick={previousExercise}
                disabled={activeSession.currentExerciseIndex <= 0}
                className="flex items-center gap-1 font-semibold disabled:opacity-30 hover:text-[#125F55] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <button
                onClick={nextExercise}
                disabled={activeSession.currentExerciseIndex >= activeSession.exercisesSnapshot.length - 1}
                className="flex items-center gap-1 font-semibold disabled:opacity-30 hover:text-[#125F55] cursor-pointer"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* BOTÃO PRINCIPAL GIGANTE (56px) - CONCLUIR SÉRIE */}
            <button
              onClick={handleOpenConfirm}
              className="w-full h-14 bg-[#125F55] text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0C5148] active:scale-[0.98] transition-all shadow-md cursor-pointer"
            >
              <Check className="w-6 h-6 stroke-[3]" />
              <span>Concluir Série</span>
            </button>
          </div>
        </main>
      )}

      {/* MODAL DE DETALHES COMPLETOS DO EXERCÍCIO DURANTE O TREINO */}
      {showExerciseDetail && exerciseDetails && (
        <div
          onClick={() => setShowExerciseDetail(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-[#C9DBD3] text-[#152A29] relative overflow-hidden cursor-default animate-in fade-in slide-in-from-bottom duration-200"
          >
            {/* Botão de Fechar Superior Destacado */}
            <button
              type="button"
              onClick={() => setShowExerciseDetail(false)}
              className="absolute top-3.5 right-3.5 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-[#FAF7F2] text-[#152A29] border border-[#C9DBD3] shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Fechar (ou clique fora)"
              aria-label="Fechar guia do exercício"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Conteúdo com rolagem suave */}
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <div className="relative rounded-2xl overflow-hidden">
                <ExerciseIllustration
                  movementPattern={exerciseDetails.movement_pattern}
                  modality={exerciseDetails.modality}
                  images={exerciseDetails.images}
                  exerciseName={exerciseDetails.name_pt}
                  className="w-full h-52 sm:h-56"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#125F55]">
                  {exerciseDetails.target_muscle}
                </span>
                <h3 className="text-xl font-black text-[#152A29] mt-0.5">
                  {exerciseDetails.name_pt}
                </h3>
              </div>

              {/* Músculos Trabalhados */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#5B7170] uppercase tracking-wider block">
                  Músculos Trabalhados
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(exerciseDetails.primary_muscles || [exerciseDetails.target_muscle || 'Corpo']).map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-lg bg-[#EAF3EF] text-[#125F55] text-xs font-semibold">
                      {m}
                    </span>
                  ))}
                  {(exerciseDetails.secondary_muscles || []).map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded-lg bg-[#F5F8F5] border border-[#C9DBD3] text-[#5B7170] text-[11px]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Passo a Passo em PT-BR */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#5B7170] uppercase tracking-wider block">
                  Passo a Passo de Execução
                </span>
                <div className="space-y-2.5 bg-[#F5F8F5] p-3.5 rounded-2xl border border-[#C9DBD3]/50">
                  {(exerciseDetails.steps_pt && exerciseDetails.steps_pt.length > 0
                    ? exerciseDetails.steps_pt
                    : [exerciseDetails.instructions_pt]
                  ).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#152A29]">
                      <span className="w-5 h-5 rounded-full bg-[#125F55] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-normal">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cautelas e Segurança */}
              {exerciseDetails.caution_pt && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-[#91610D] flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold">Atenção Postural: </span>
                    {exerciseDetails.caution_pt}
                  </div>
                </div>
              )}
            </div>

            {/* Barra Inferior com Botão Fechar */}
            <div className="p-4 bg-white border-t border-[#C9DBD3]">
              <button
                type="button"
                onClick={() => setShowExerciseDetail(false)}
                className="w-full py-3 rounded-xl bg-[#125F55] text-white text-xs font-bold hover:bg-[#0C5148] active:scale-[0.98] cursor-pointer transition-all shadow-xs text-center"
              >
                Voltar ao Treino
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SHEET DE CONFIRMAÇÃO DO REGISTRO REAL (S08) */}
      {showConfirmSheet && (
        <div
          onClick={() => setShowConfirmSheet(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-5 border border-[#C9DBD3] text-[#152A29] space-y-4 shadow-2xl cursor-default"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#C9DBD3]/60">
              <div>
                <h4 className="text-sm font-bold text-[#152A29]">Confirmar Execução Real</h4>
                <p className="text-[11px] text-[#5B7170]">
                  Série {activeSession.currentSetIndex} · {currentExerciseItem.exerciseName}
                </p>
              </div>
              <button
                onClick={() => setShowConfirmSheet(false)}
                className="p-1 rounded-full text-[#5B7170] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ajustador de Repetições ou Tempo */}
            <div className="bg-[#F5F8F5] p-4 rounded-2xl text-center space-y-3">
              <label className="text-xs font-bold text-[#5B7170] uppercase tracking-wider block">
                {isTimeTracking ? 'Tempo Real Sustentado' : 'Repetições Reais Executadas'}
              </label>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    if (isTimeTracking) {
                      setActualDurationInput((prev) => Math.max(0, prev - 5));
                    } else {
                      setActualRepsInput((prev) => Math.max(0, prev - 1));
                    }
                  }}
                  className="w-12 h-12 rounded-2xl bg-white border border-[#C9DBD3] flex items-center justify-center text-lg font-bold text-[#125F55] active:scale-95 shadow-xs cursor-pointer"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="w-24">
                  <span className="text-4xl font-black text-[#125F55] tabular-nums">
                    {isTimeTracking ? actualDurationInput : actualRepsInput}
                  </span>
                  <span className="block text-[10px] text-[#5B7170] font-semibold mt-0.5">
                    {isTimeTracking ? 'segundos' : 'repetições'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (isTimeTracking) {
                      setActualDurationInput((prev) => prev + 5);
                    } else {
                      setActualRepsInput((prev) => prev + 1);
                    }
                  }}
                  className="w-12 h-12 rounded-2xl bg-white border border-[#C9DBD3] flex items-center justify-center text-lg font-bold text-[#125F55] active:scale-95 shadow-xs cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Botões Rápidos */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {[8, 10, 12, 15, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      if (isTimeTracking) {
                        setActualDurationInput(num * 2);
                      } else {
                        setActualRepsInput(num);
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-[#C9DBD3] text-[#5B7170] hover:text-[#125F55] hover:border-[#125F55] cursor-pointer"
                  >
                    {isTimeTracking ? `${num * 2}s` : num}
                  </button>
                ))}
              </div>
            </div>

            {/* Ajuste de Carga / Peso (kg) para Sobrecarga Progressiva (E06) */}
            {supportsExternalWeight(exerciseDetails) ? (
              <div className="bg-[#F5F8F5] p-3.5 rounded-2xl text-center space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-bold text-[#5B7170] uppercase tracking-wider block">
                    Carga Utilizada (kg)
                  </label>
                  {previousPR?.bestWeightKg ? (
                    <span className="text-[10px] text-[#125F55] font-bold">
                      Última marca: {previousPR.bestWeightKg} kg
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#5B7170]">
                      Peso corporal ou halteres
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setActualWeightInput((prev) => Math.max(0, prev - 2))}
                    className="w-10 h-10 rounded-xl bg-white border border-[#C9DBD3] flex items-center justify-center font-bold text-xs text-[#125F55] active:scale-95 shadow-xs cursor-pointer"
                  >
                    -2
                  </button>
                  <div className="w-24">
                    <span className="text-3xl font-black text-[#125F55] tabular-nums">
                      {actualWeightInput}
                    </span>
                    <span className="block text-[10px] text-[#5B7170] font-semibold mt-0.5">
                      {actualWeightInput > 0 ? 'kg utilizados' : 'peso do corpo'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActualWeightInput((prev) => prev + 2)}
                    className="w-10 h-10 rounded-xl bg-white border border-[#C9DBD3] flex items-center justify-center font-bold text-xs text-[#125F55] active:scale-95 shadow-xs cursor-pointer"
                  >
                    +2
                  </button>
                </div>

                {/* Atalhos rápidos de carga */}
                <div className="flex items-center justify-center gap-1.5 pt-0.5 flex-wrap">
                  {[0, 4, 8, 12, 16, 20, 30].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setActualWeightInput(w)}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border cursor-pointer transition-colors ${
                        actualWeightInput === w
                          ? 'bg-[#125F55] text-white border-[#125F55]'
                          : 'bg-white border-[#C9DBD3] text-[#5B7170] hover:border-[#125F55]'
                      }`}
                    >
                      {w === 0 ? 'Livre' : `${w}k`}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#F5F8F5] p-3 rounded-2xl text-center space-y-1">
                <span className="text-xs font-bold text-[#125F55] uppercase tracking-wider block">
                  Peso Corporal & Execução Técnica
                </span>
                <p className="text-[11px] text-[#5B7170]">
                  Exercício executado com o peso do próprio corpo. Foco em controle articular e amplitude.
                </p>
              </div>
            )}

            {/* Tempo de Descanso a Iniciar */}
            <div className="flex items-center justify-between text-xs text-[#5B7170] px-1">
              <span>Descanso após esta série:</span>
              <div className="flex items-center gap-1.5 font-bold text-[#125F55] tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                <span>{confirmRestSeconds} segundos</span>
              </div>
            </div>

            {/* Salvar Série */}
            <button
              onClick={handleSaveSet}
              className="w-full h-13 bg-[#125F55] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0C5148] active:scale-[0.98] transition-all shadow-md cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>Salvar Registro & Iniciar Descanso</span>
            </button>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO DE ABANDONO DE TREINO */}
      {showAbandonConfirm && (
        <div
          onClick={() => setShowAbandonConfirm(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-[#C9DBD3] text-[#152A29] space-y-3 cursor-default"
          >
            <h4 className="text-base font-bold text-[#152A29]">Pausar ou encerrar treino?</h4>
            <p className="text-xs text-[#5B7170] leading-relaxed">
              Tudo o que você já executou até agora fica salvo com segurança no seu histórico. Você pode fechar o app e retomar depois, ou encerrar por hoje.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setShowAbandonConfirm(false)}
                className="w-full py-2.5 rounded-xl bg-[#125F55] text-white text-xs font-bold cursor-pointer"
              >
                Continuar Treinando
              </button>
              <button
                onClick={async () => {
                  setShowAbandonConfirm(false);
                  if (activeSession.totalSetsCompleted > 0) {
                    await savePartialWorkout();
                  } else {
                    abandonWorkout();
                  }
                }}
                className="w-full py-2.5 rounded-xl border border-[#C9DBD3] text-[#B13D39] text-xs font-semibold hover:bg-red-50 cursor-pointer"
              >
                {activeSession.totalSetsCompleted > 0
                  ? 'Salvar Séries Feitas & Concluir como Parcial'
                  : 'Descartar Treino sem Séries'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
