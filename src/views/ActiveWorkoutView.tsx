import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { ExerciseIllustration } from '../components/ExerciseIllustration';
import { getExerciseById, useFullCatalog } from '../data/catalog';
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
  Target,
  ArrowLeftRight,
  Play,
  Square,
  Timer,
} from 'lucide-react';
import { soundManager } from '../lib/audio';
import { mediaSessionManager } from '../lib/backgroundWorkout';
import { PostWorkoutMood, PreWorkoutMood, SessionEnjoyment } from '../types';
import { generateTomorrowBridge, PRE_MOOD_LABELS, POST_MOOD_LABELS } from '../lib/storage';
import { generateSessionFocusInvite, generateTurnaroundMessage, formatWorkoutShareSummary } from '../lib/motivationEngine';
import { findSafeEquivalentExercises, analyzeSessionProgression } from '../lib/workoutEngine';
import { ProgressionItemUpgrade, SessionProgressionAnalysis } from '../types';
import { getPersonalizedExerciseCue } from '../lib/aiStudentAssistant';
import { SetConfirmDrawer } from '../components/superacao/SetConfirmDrawer';
import {
  requestWorkoutWakeLock,
  releaseWorkoutWakeLock,
  updateWorkoutMediaSession,
  clearWorkoutMediaSession,
  speakWorkoutCue,
  sendRestFinishedNotification,
  shareWorkoutVictory,
} from '../lib/pwaNative';

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
    chooseRestWithoutGuilt,
    pauseAndReturnHome,
    isResting,
    restSecondsRemaining,
    restDurationTotal,
    skipRest,
    addRestSeconds,
    personalRecords,
    plans,
    calendar,
    setSessionPreMood,
    softenActiveSessionTargets,
    scheduleOptionalMobilityForTomorrow,
    setEvents,
    swapExerciseInActiveSession,
    replaceExerciseInPlan,
    updateActiveExerciseTarget,
    applyPlanProgression,
  } = useWorkout();
  useFullCatalog();

  // Estados locais do modal de confirmação de série (S08)
  const [showConfirmSheet, setShowConfirmSheet] = useState<boolean>(false);
  const [actualRepsInput, setActualRepsInput] = useState<number>(10);
  const [actualDurationInput, setActualDurationInput] = useState<number>(30);
  const [actualWeightInput, setActualWeightInput] = useState<number>(0);
  const [showExtraWeightInput, setShowExtraWeightInput] = useState<boolean>(false);
  const [confirmRestSeconds, setConfirmRestSeconds] = useState<number>(60);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState<boolean>(false);
  const [showFinishScreen, setShowFinishScreen] = useState<boolean>(false);
  const [showExerciseDetail, setShowExerciseDetail] = useState<boolean>(false);
  const [effortScore, setEffortScore] = useState<number>(3);
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [postMood, setPostMood] = useState<PostWorkoutMood | null>('orgulhoso');
  const [localPreMood, setLocalPreMood] = useState<PreWorkoutMood | null>(activeSession?.preMood || null);
  const [sessionEnjoyment, setSessionEnjoyment] = useState<SessionEnjoyment>('prazeroso');
  const [isFocusDismissed, setIsFocusDismissed] = useState<boolean>(false);
  const [isMobilityScheduled, setIsMobilityScheduled] = useState<boolean>(false);
  const [isSessionSoftened, setIsSessionSoftened] = useState<boolean>(false);
  // Fase 4: Adaptação Viva
  const [showSwapModal, setShowSwapModal] = useState<boolean>(false);
  const [saveSwapToPlan, setSaveSwapToPlan] = useState<boolean>(false);
  const [progressionAnalysis, setProgressionAnalysis] = useState<SessionProgressionAnalysis | null>(null);
  const [selectedUpgrades, setSelectedUpgrades] = useState<Record<string, boolean>>({});
  const [progressionApplied, setProgressionApplied] = useState<boolean>(false);

  // Cronômetro Isométrico Ao Vivo para exercícios medidos por tempo (Fase 8)
  const [isoTimerActive, setIsoTimerActive] = useState<boolean>(false);
  const [isoTimerPaused, setIsoTimerPaused] = useState<boolean>(false);
  const [isoTimeRemaining, setIsoTimeRemaining] = useState<number>(0);
  const [isoTargetSeconds, setIsoTargetSeconds] = useState<number>(30);


  // Tecla Escape para fechar qualquer modal aberto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSwapModal) setShowSwapModal(false);
        else if (showExerciseDetail) setShowExerciseDetail(false);
        else if (showConfirmSheet) setShowConfirmSheet(false);
        else if (showAbandonConfirm) setShowAbandonConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSwapModal, showExerciseDetail, showConfirmSheet, showAbandonConfirm]);

  // Screen Wake Lock & Media Session Lifecycle
  useEffect(() => {
    requestWorkoutWakeLock();
    return () => {
      releaseWorkoutWakeLock();
      clearWorkoutMediaSession();
    };
  }, []);

  if (!activeSession) return null;

  const currentExerciseItem = activeSession.exercisesSnapshot[activeSession.currentExerciseIndex];
  const exerciseDetails = currentExerciseItem ? getExerciseById(currentExerciseItem.exerciseId) : null;
  const isTimeTracking = exerciseDetails?.tracking === 'time';

  // Histórico anterior do exercício para desafio pessoal
  const previousPR = personalRecords.find((p) => p.exerciseId === currentExerciseItem?.exerciseId);

  // Foco Adaptativo da Sessão (T01 a T04 / C01 a C09) e Ponte para Amanhã (Estratégia B)
  const currentPlan = plans.find((p) => p.id === activeSession.planId) || null;
  const sessionFocus = currentPlan && !isFocusDismissed
    ? generateSessionFocusInvite(currentPlan, personalRecords, profile, activeSession.preMood)
    : null;
  const isChallengeExercise = Boolean(sessionFocus && sessionFocus.exerciseId === currentExerciseItem?.exerciseId);
  const tomorrowBridge = generateTomorrowBridge(activeSession, calendar, plans, personalRecords);

  // Próximo exercício / série para preparação no descanso (E05)
  // Durante o descanso (isResting), recordSet já avançou currentExerciseIndex e currentSetIndex para a série a ser executada
  const nextExItem = activeSession.exercisesSnapshot[activeSession.currentExerciseIndex] || currentExerciseItem;
  const nextSetNum = activeSession.currentSetIndex;

  const handleOpenConfirm = (overrideDuration?: number) => {
    if (isTimeTracking) {
      setActualDurationInput(overrideDuration || currentExerciseItem?.targetDurationSeconds || 30);
    } else {
      setActualRepsInput(currentExerciseItem?.targetReps || 10);
    }
    const initialWeight = previousPR?.bestWeightKg || 0;
    setActualWeightInput(initialWeight);
    setShowExtraWeightInput(initialWeight > 0);
    setConfirmRestSeconds(currentExerciseItem?.restSeconds || 60);
    setShowConfirmSheet(true);
  };

  const handleStartIsoTimer = (targetSec: number) => {
    setIsoTargetSeconds(targetSec);
    setIsoTimeRemaining(targetSec);
    setIsoTimerPaused(false);
    setIsoTimerActive(true);
    if (profile.voiceGuideEnabled !== false) {
      speakWorkoutCue('Começou! Sustente a postura e respire.');
    }
  };

  const handleStopIsoTimerEarly = () => {
    const elapsed = Math.max(1, isoTargetSeconds - isoTimeRemaining);
    setIsoTimerActive(false);
    setIsoTimerPaused(false);
    soundManager.playSetCompleted();
    handleOpenConfirm(elapsed);
  };

  const handleCancelIsoTimer = () => {
    setIsoTimerActive(false);
    setIsoTimerPaused(false);
    setIsoTimeRemaining(0);
  };

  // Efeito do Cronômetro Isométrico com avisos sonoros e voz offline
  useEffect(() => {
    let interval: any = null;
    if (isoTimerActive && !isoTimerPaused) {
      interval = setInterval(() => {
        setIsoTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsoTimerActive(false);
            setIsoTimerPaused(false);
            soundManager.playRestFinished();
            if (profile.voiceGuideEnabled !== false) {
              speakWorkoutCue('Tempo concluído! Excelente sustentação.');
            }
            setTimeout(() => {
              handleOpenConfirm(isoTargetSeconds);
            }, 300);
            return 0;
          }
          const next = prev - 1;
          if (next <= 3 && next > 0) {
            soundManager.playCountdownTick();
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isoTimerActive, isoTimerPaused, isoTargetSeconds, profile.voiceGuideEnabled]);

  // Se trocar de exercício enquanto o cronômetro estiver rodando, cancela o timer
  useEffect(() => {
    setIsoTimerActive(false);
    setIsoTimerPaused(false);
    setIsoTimeRemaining(0);
  }, [activeSession?.currentExerciseIndex]);

  // Atualiza controles e informações na tela de bloqueio do celular (Media Session)
  useEffect(() => {
    if (!isResting && activeSession && currentExerciseItem) {
      mediaSessionManager.updateSession(
        currentExerciseItem.exerciseName,
        `Série ${activeSession.currentSetIndex} de ${currentExerciseItem.targetSets}`,
        activeSession.planTitle,
        {
          onNextSet: handleOpenConfirm,
        }
      );
    }
  }, [
    isResting,
    activeSession?.currentExerciseIndex,
    activeSession?.currentSetIndex,
    currentExerciseItem?.exerciseName,
    currentExerciseItem?.targetSets,
    activeSession?.planTitle,
  ]);

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
      if (currentPlan) {
        try {
          const analysis = analyzeSessionProgression(
            { ...activeSession, feedbackEffort: effortScore },
            currentPlan,
            personalRecords,
            setEvents
          );
          setProgressionAnalysis(analysis);
          const initialSelected: Record<string, boolean> = {};
          analysis.upgrades.forEach(u => { initialSelected[u.exerciseId] = true; });
          setSelectedUpgrades(initialSelected);
        } catch (err) {
          console.warn('Erro ao analisar progressao:', err);
        }
      }
      setShowFinishScreen(true);
    }
  };

  const handleFinishWorkout = async () => {
    await completeWorkout(effortScore, workoutNotes, postMood || undefined, sessionEnjoyment);
  };

  const handleShareWorkout = async () => {
    const effectivePre = localPreMood || activeSession.preMood;
    const shareData = formatWorkoutShareSummary({
      planTitle: activeSession.planTitle,
      durationMinutes: Math.max(1, Math.round(activeSession.durationSeconds / 60)),
      setsCompleted: activeSession.totalSetsCompleted,
      preMood: effectivePre || undefined,
      postMood: postMood || undefined,
      prsAchieved: activeSession.prsAchieved,
      totalVolumeKg: activeSession.totalVolumeKg,
    });
    const status = await shareWorkoutVictory({
      title: shareData.title,
      text: shareData.text,
    });
    if (status === 'copied' || status === 'shared') {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
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

          {/* Moedas de Superação Conquistadas (Estratégia A) */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#5B7170] uppercase tracking-wider block">
              Vitórias Reconhecidas Desta Sessão
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeSession.prsAchieved > 0 && (
                <div className="bg-[#D9F277]/30 border border-[#125F55]/40 p-2.5 rounded-xl flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#125F55] shrink-0" />
                  <span className="text-xs font-bold text-[#125F55]">
                    {activeSession.prsAchieved} Recorde(s) Pessoal(is) superado(s)!
                  </span>
                </div>
              )}
              {(activeSession.newBaselinesCount || 0) > 0 && (
                <div className="bg-[#EAF3EF] border border-[#C9DBD3] p-2.5 rounded-xl flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#125F55] shrink-0" />
                  <span className="text-xs font-semibold text-[#152A29]">
                    {activeSession.newBaselinesCount} Marca(s) Base estabelecida(s)
                  </span>
                </div>
              )}
              {(activeSession.planId.includes('mobilidade') || activeSession.planTitle.toLowerCase().includes('alongamento') || activeSession.planTitle.toLowerCase().includes('caminhada')) ? (
                <div className="bg-[#EAF3EF] border border-[#C9DBD3] p-2.5 rounded-xl flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#246747] shrink-0" />
                  <span className="text-xs font-semibold text-[#246747]">
                    Elo de Vitalidade & Regeneração
                  </span>
                </div>
              ) : (
                <div className="bg-[#F5F8F5] border border-[#C9DBD3] p-2.5 rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#125F55] shrink-0" />
                  <span className="text-xs font-semibold text-[#152A29]">
                    Vitória de Constância e Ritmo
                  </span>
                </div>
              )}
            </div>
          </div>

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
                  type="button"
                  aria-pressed={effortScore === item.score}
                  onClick={() => {
                    setEffortScore(item.score);
                    if (currentPlan) {
                      const analysis = analyzeSessionProgression(
                        { ...activeSession, feedbackEffort: item.score },
                        currentPlan,
                        personalRecords,
                        setEvents
                      );
                      setProgressionAnalysis(analysis);
                      const initialSelected: Record<string, boolean> = {};
                      analysis.upgrades.forEach(u => { initialSelected[u.exerciseId] = true; });
                      setSelectedUpgrades(initialSelected);
                    }
                  }}
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

          {/* Card de Evolução Consensual da Ficha (Fase 4 & 5 - Motor Adaptativo) */}
          {progressionAnalysis && progressionAnalysis.upgrades.length > 0 && currentPlan && !currentPlan.isProfessional && profile.motivationStyle !== 'none' && (
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-300 text-left space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                    Evolução Sugerida para Sua Ficha
                  </h4>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    {progressionAnalysis.summaryMessage}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {progressionAnalysis.upgrades.map((up) => (
                  <label
                    key={up.exerciseId}
                    className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(selectedUpgrades[up.exerciseId])}
                      onChange={(e) => {
                        setSelectedUpgrades((prev) => ({
                          ...prev,
                          [up.exerciseId]: e.target.checked,
                        }));
                      }}
                      className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-500"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{up.exerciseName}</span>
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                          {up.type === 'ladder_step_up'
                            ? `Subir para Degrau ${up.suggestedValue}`
                            : `+${up.suggestedValue - up.currentValue} ${up.unit}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                        {up.reason}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-1">
                {progressionApplied ? (
                  <div className="py-2.5 px-3 bg-emerald-700 text-white rounded-xl text-xs font-bold text-center">
                    ✓ Ficha oficial atualizada com sucesso para seus próximos treinos!
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const approved = progressionAnalysis.upgrades.filter(
                        (u) => selectedUpgrades[u.exerciseId]
                      );
                      if (approved.length > 0) {
                        await applyPlanProgression(currentPlan.id, approved);
                        setProgressionApplied(true);
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 cursor-pointer shadow-xs transition-transform active:scale-[0.98]"
                  >
                    Atualizar Ficha Oficial com as Metas Acima
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Termômetro de Bem-Estar Após a Prática (Estratégia D & T08 com opções honestas) */}
          <div className="bg-white p-4 rounded-2xl border border-[#C9DBD3] shadow-xs space-y-2">
            <label className="block text-xs font-bold text-[#152A29]">
              Como você está se sentindo após essa prática?
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
              {[
                { mood: 'renovado' as const, label: 'Com energia', icon: '✨' },
                { mood: 'leve' as const, label: 'Mais leve', icon: '🌿' },
                { mood: 'orgulhoso' as const, label: 'Cumprido', icon: '🏅' },
                { mood: 'cansado_bem' as const, label: 'Cansado e bem', icon: '💪' },
                { mood: 'neutro' as const, label: 'Neutro/Igual', icon: '🙂' },
                { mood: 'esgotado' as const, label: 'Exausto', icon: '🥱' },
                { mood: 'desconforto' as const, label: 'Desconforto', icon: '⚠️' },
              ].map((m) => (
                <button
                  key={m.mood}
                  type="button"
                  aria-pressed={postMood === m.mood}
                  onClick={() => setPostMood(m.mood)}
                  className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                    postMood === m.mood
                      ? 'bg-[#125F55] text-white shadow-xs'
                      : 'bg-[#F5F8F5] text-[#5B7170] border border-[#C9DBD3] hover:border-[#125F55]'
                  }`}
                >
                  <span className="text-sm">{m.icon}</span>
                  <span className="text-[10px] truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Espelho de Bem-Estar Imediato (Antes x Depois - T08 & T09) */}
          {(() => {
            const effectivePre = localPreMood || activeSession.preMood;
            if (!effectivePre || !postMood) return null;
            const turnaround = generateTurnaroundMessage(
              effectivePre,
              postMood,
              Math.max(1, Math.round(activeSession.durationSeconds / 60))
            );
            const preInfo = PRE_MOOD_LABELS[effectivePre];
            const postInfo = POST_MOOD_LABELS[postMood];

            return (
              <div className="bg-gradient-to-br from-[#EAF3EF] to-[#D9F277]/25 border border-[#125F55]/30 p-4 rounded-2xl space-y-2.5 shadow-2xs animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#125F55]">
                  <Sparkles className="w-4 h-4 text-[#E07A5F]" />
                  <span>{turnaround.headline}</span>
                </div>
                <div className="flex items-center justify-between bg-white/85 p-3 rounded-xl border border-[#C9DBD3] text-xs">
                  <div className="text-center flex-1">
                    <span className="text-[10px] text-[#5B7170] block uppercase font-bold">Antes do treino</span>
                    <span className="font-bold text-[#152A29] mt-0.5 inline-flex items-center gap-1">
                      <span>{preInfo?.icon}</span>
                      <span>{preInfo?.label?.split('/')[0]?.trim() || effectivePre}</span>
                    </span>
                  </div>
                  <div className="px-2 text-[#125F55] font-black text-sm">➔</div>
                  <div className="text-center flex-1">
                    <span className="text-[10px] text-[#5B7170] block uppercase font-bold">Após a prática</span>
                    <span className="font-bold text-[#125F55] mt-0.5 inline-flex items-center gap-1">
                      <span>{postInfo?.icon}</span>
                      <span>{postInfo?.label?.split('/')[0]?.trim() || postMood}</span>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#152A29] leading-relaxed">
                  {turnaround.explanation}
                </p>
              </div>
            );
          })()}

          {/* Vivência Subjetiva da Sessão (Separando Afeto/Prazer de Esforço RPE - T08) */}
          <div className="bg-white p-4 rounded-2xl border border-[#C9DBD3] shadow-xs space-y-2">
            <label className="block text-xs font-bold text-[#152A29]">
              Vivência da Prática de Hoje (Sensação)
            </label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'prazeroso' as const, label: 'Prazerosa', sub: 'Fluida & Boa', icon: '🌿' },
                { id: 'neutro' as const, label: 'Neutra', sub: 'Cumprida', icon: '⚖️' },
                { id: 'dificil' as const, label: 'Custosa', sub: 'Desafiadora', icon: '🧗' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={sessionEnjoyment === item.id}
                  onClick={() => setSessionEnjoyment(item.id)}
                  className={`py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                    sessionEnjoyment === item.id
                      ? 'bg-[#125F55] text-white shadow-xs'
                      : 'bg-[#F5F8F5] text-[#5B7170] border border-[#C9DBD3] hover:border-[#125F55]'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-bold leading-tight">{item.label}</span>
                  <span className="text-[9px] opacity-80 leading-none">{item.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card de Celebração de Conclusão / Compartilhar */}
          <div className="bg-white p-4 rounded-2xl border border-[#C9DBD3] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#152A29]">Compartilhar sua Superação</span>
              {copiedShare && (
                <span role="status" className="text-emerald-700 font-bold text-[11px] animate-in fade-in">
                  ✓ Resumo copiado! Pronto para colar onde quiser.
                </span>
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
              <span>{copiedShare ? '✓ Resumo Copiado para a Área de Transferência!' : 'Compartilhar Vitória'}</span>
            </button>
          </div>

          {/* A PONTE PARA O PRÓXIMO DIA (Estratégia B: Psicologia Comportamental) */}
          <div className="bg-[#EAF3EF] border border-[#125F55]/30 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#125F55]">
              <Sparkles className="w-4 h-4 text-[#125F55]" />
              <span>{tomorrowBridge.headline}</span>
            </div>
            <p className="text-xs text-[#152A29] leading-relaxed">
              {tomorrowBridge.bodyText}
            </p>

            {tomorrowBridge.nextChallengePreview && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-[#C9DBD3] text-xs">
                <span className="font-bold text-[#125F55]">Desafio antecipado: </span>
                <span className="text-[#5B7170]">
                  {tomorrowBridge.nextChallengePreview.exerciseName} ({tomorrowBridge.nextChallengePreview.targetMarkText})
                </span>
              </div>
            )}

            {tomorrowBridge.canScheduleOptionalMobility && (
              <button
                type="button"
                disabled={isMobilityScheduled}
                onClick={async () => {
                  await scheduleOptionalMobilityForTomorrow(tomorrowBridge.tomorrowDateStr);
                  setIsMobilityScheduled(true);
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isMobilityScheduled
                    ? 'bg-[#125F55] text-white shadow-xs'
                    : 'bg-white text-[#125F55] border border-[#125F55]/40 hover:bg-[#D9F277]/30'
                }`}
              >
                {isMobilityScheduled ? (
                  <span>✓ Alongamento leve separado na sua agenda!</span>
                ) : (
                  <span>Separar 6 min de alongamento leve para amanhã</span>
                )}
              </button>
            )}
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
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-[#5B7170] hover:text-[#B13D39] flex items-center justify-center cursor-pointer"
            title="Encerrar sessão"
            aria-label="Encerrar sessão"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={onPauseAndReturnHome || pauseAndReturnHome}
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-[#5B7170] hover:text-[#125F55] flex items-center justify-center cursor-pointer"
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
          className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-[#5B7170] hover:text-[#125F55] flex items-center justify-center cursor-pointer"
          title="Alternar som do timer"
          aria-label="Alternar som do timer"
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
        /* ÁREA PRINCIPAL DO EXERCÍCIO (S07) - VIEWPORT DINÂMICO 320px-430px COM ROLAGEM SUAVE RESILIENTE */
        <main className="flex-1 flex flex-col justify-between p-3.5 sm:p-4 max-w-md mx-auto w-full overflow-y-auto sm:overflow-hidden min-h-0 select-none touch-manipulation">
          {/* Check-in Inicial de Sensação e Acolhimento caso ainda não informado */}
          {activeSession.totalSetsCompleted === 0 && !localPreMood && !activeSession.preMood && (
            <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#E4DDD3] space-y-1 mb-1.5 shrink-0 animate-in fade-in">
              <span className="text-[10px] font-bold text-[#19231E] block">
                Como você está chegando hoje?
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'cansado' as const, label: 'Cansado', icon: '🔋' },
                  { id: 'tenso' as const, label: 'Tenso', icon: '🧘' },
                  { id: 'disposto' as const, label: 'Disposto', icon: '⚡' },
                  { id: 'normal' as const, label: 'Normal', icon: '🙂' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setLocalPreMood(m.id);
                      setSessionPreMood(m.id);
                    }}
                    className="p-1 rounded-xl border border-[#E4DDD3] bg-white hover:border-[#1B4332] text-center cursor-pointer transition-colors"
                  >
                    <span className="text-sm block">{m.icon}</span>
                    <span className="text-[10px] font-bold text-[#19231E]">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opção de Descanso Sem Culpa caso tenha chegado cansado/tenso na 1ª série */}
          {activeSession.totalSetsCompleted === 0 && ((localPreMood || activeSession.preMood) === 'cansado' || (localPreMood || activeSession.preMood) === 'tenso') && (
            <div className="bg-[#FDF3F0] p-2.5 rounded-2xl border border-[#E07A5F]/30 flex flex-col gap-2 mb-1.5 shrink-0 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#E07A5F] font-bold flex items-center gap-1">
                  <span>🌿</span>
                  <span>Ritmo Suave sugerido (-25%)</span>
                </span>
                <span className="text-[10px] text-[#5D6E65]">Tudo bem estar assim!</span>
              </div>
              <div className="flex gap-2">
                {!isSessionSoftened && (
                  <button
                    type="button"
                    onClick={() => {
                      softenActiveSessionTargets();
                      setIsSessionSoftened(true);
                    }}
                    className="flex-1 py-1.5 px-2 bg-[#E8EFE9] border border-[#1B4332]/30 text-[#1B4332] rounded-xl text-xs font-bold hover:bg-[#1B4332] hover:text-white cursor-pointer shadow-2xs"
                  >
                    Suavizar metas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => chooseRestWithoutGuilt()}
                  className="flex-1 py-1.5 px-2 bg-white border border-[#E07A5F]/40 text-[#E07A5F] hover:bg-[#FDF3F0] rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  🤍 Descansar hoje sem culpa
                </button>
              </div>
            </div>
          )}

          {/* Indicador discreto após a 1ª série caso o usuário tenha optado por treino suavizado */}
          {activeSession.totalSetsCompleted > 0 && (localPreMood || activeSession.preMood) && ((localPreMood || activeSession.preMood) === 'cansado' || (localPreMood || activeSession.preMood) === 'tenso') && (
            <div className="bg-[#FDF3F0] px-3 py-1 rounded-full border border-[#E07A5F]/30 flex items-center justify-between text-[11px] text-[#E07A5F] font-semibold mb-1 shrink-0">
              <span className="flex items-center gap-1.5">
                <span>🌿</span>
                <span>Ritmo Suave ativo (-25%)</span>
              </span>
              <button
                type="button"
                onClick={() => chooseRestWithoutGuilt()}
                className="text-[10px] text-[#5D6E65] hover:text-[#19231E] underline cursor-pointer"
              >
                Descansar hoje
              </button>
            </div>
          )}

          {/* Destaque do Foco Adaptativo da Sessão (T01 a T04 / C01 a C09 / Micro-desafio) */}
          {isChallengeExercise && sessionFocus && !isFocusDismissed && (
            <div className="bg-[#E8EFE9] border border-[#1B4332]/30 px-3 py-1.5 rounded-2xl flex items-center justify-between text-xs mb-1.5 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span className="text-xs">🎯</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#1B4332] text-white shrink-0">
                  {sessionFocus.badgeText}
                </span>
                <span className="font-bold text-[#19231E] truncate">{sessionFocus.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFocusDismissed(true)}
                className="text-[10px] text-[#5D6E65] hover:text-[#19231E] shrink-0 ml-2 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Ilustração e Nome */}
          <div className="space-y-2 flex-1 flex flex-col justify-center min-h-0">
            <ExerciseIllustration
              movementPattern={exerciseDetails?.movement_pattern}
              modality={exerciseDetails?.modality}
              images={exerciseDetails?.images}
              exerciseName={currentExerciseItem.exerciseName}
              className="w-full h-32 sm:h-40 max-h-[25vh] object-contain shadow-2xs rounded-2xl border border-[#E4DDD3] shrink"
            />

            <div>
              <div className="flex items-center justify-between text-xs text-[#1B4332] font-bold">
                <span className="text-[#5D6E65]">{exerciseDetails?.target_muscle || 'Corpo todo'}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8EFE9] text-[11px] font-bold">
                  Série {activeSession.currentSetIndex} de {currentExerciseItem.targetSets}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2 mt-0.5">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#19231E] line-clamp-2 leading-snug flex-1">
                  {currentExerciseItem.exerciseName}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowSwapModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-white border border-[#E4DDD3] text-xs font-bold text-[#1B4332] hover:bg-[#E8EFE9] hover:border-[#1B4332] focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:outline-none flex items-center gap-1 transition-all shadow-2xs cursor-pointer shrink-0 mt-0.5"
                  title="Trocar este exercício por outro equivalente"
                  aria-label="Trocar exercício por equivalente seguro"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Trocar</span>
                </button>
              </div>

              {/* Dica Biomecânica do Assistente IA */}
              <div className="mt-1.5 px-2.5 py-1 bg-[#EAF3EF]/70 rounded-xl border border-[#125F55]/20 flex items-center gap-1.5 text-[11px] text-[#125F55]">
                <span>💡</span>
                <span className="line-clamp-1 font-medium">
                  {getPersonalizedExerciseCue(currentExerciseItem.exerciseName, profile.reportedLimitations)}
                </span>
              </div>
            </div>

            {/* Meta desta Série e Recorde Pessoal Compacto */}
            <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#E4DDD3] text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-[#19231E]">
                <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
                <span>Meta da série:</span>
              </div>
              <div className="flex items-center gap-2">
                {previousPR && (
                  <span className="text-[10px] text-[#5D6E65]">
                    Melhor: {previousPR.bestReps > 0 ? `${previousPR.bestReps} reps` : `${previousPR.bestDurationSeconds}s`}
                  </span>
                )}
                <span className="font-black text-sm tabular-nums text-[#1B4332] bg-[#E8EFE9] px-2 py-0.5 rounded-lg">
                  {isTimeTracking
                    ? `${currentExerciseItem.targetDurationSeconds || 30}s`
                    : `${currentExerciseItem.targetReps} reps`}
                </span>
              </div>
            </div>

            {/* Instrução Rápida de Execução com clique para detalhes */}
            {exerciseDetails?.instructions_pt && (
              <div
                onClick={() => setShowExerciseDetail(true)}
                className="bg-white p-2.5 rounded-2xl border border-[#E4DDD3] hover:border-[#1B4332] cursor-pointer transition-all group shadow-2xs"
                title="Clique para ver o passo a passo completo e cuidados"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-[#1B4332]">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Como Executar o Movimento:
                  </span>
                  <span className="text-[10px] text-[#5D6E65] group-hover:text-[#1B4332] underline font-semibold">
                    Ver passos
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Navegação entre movimentos e CTA Principal */}
          <div className="pt-2 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs text-[#5D6E65] px-1">
              <button
                onClick={previousExercise}
                disabled={activeSession.currentExerciseIndex <= 0}
                className="flex items-center gap-1 font-semibold disabled:opacity-30 hover:text-[#1B4332] focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:outline-none rounded-lg p-1 cursor-pointer"
                aria-label="Ir para exercício anterior"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <button
                onClick={nextExercise}
                disabled={activeSession.currentExerciseIndex >= activeSession.exercisesSnapshot.length - 1}
                className="flex items-center gap-1 font-semibold disabled:opacity-30 hover:text-[#1B4332] focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:outline-none rounded-lg p-1 cursor-pointer"
                aria-label="Ir para próximo exercício"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* BOTÃO PRINCIPAL GIGANTE (56px) / CRONÔMETRO ISOMÉTRICO AO VIVO */}
            {isTimeTracking ? (
              isoTimerActive ? (
                <div className="bg-[#1B4332] text-white p-4 rounded-3xl shadow-md space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-[#D9F277] animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#D9F277]">
                        {isoTimerPaused ? 'Cronômetro Pausado' : 'Sustente a Postura!'}
                      </span>
                    </div>
                    <span className="text-2xl font-black tabular-nums text-white">
                      {isoTimeRemaining}s
                    </span>
                  </div>

                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D9F277] transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((isoTargetSeconds - isoTimeRemaining) / (isoTargetSeconds || 1)) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsoTimerPaused((prev) => !prev)}
                      className="flex-1 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    >
                      {isoTimerPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                      <span>{isoTimerPaused ? 'Retomar' : 'Pausar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStopIsoTimerEarly}
                      className="flex-1 py-2.5 bg-[#D9F277] hover:bg-[#cbe65b] text-[#19231E] font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#19231E] focus-visible:outline-none"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Concluir ({isoTargetSeconds - isoTimeRemaining}s)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelIsoTimer}
                      className="p-2.5 bg-white/10 hover:bg-white/20 text-white/80 rounded-xl cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                      title="Cancelar cronômetro"
                      aria-label="Cancelar cronômetro"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartIsoTimer(currentExerciseItem?.targetDurationSeconds || 30)}
                    className="w-full h-14 min-h-[56px] bg-[#1B4332] text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 hover:bg-[#12372A] active:scale-[0.98] transition-all shadow-md cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:outline-none"
                  >
                    <Timer className="w-5 h-5 text-[#D9F277]" />
                    <span>Iniciar Contagem ({currentExerciseItem?.targetDurationSeconds || 30}s)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenConfirm()}
                    className="w-full py-1 text-xs font-semibold text-[#5D6E65] hover:text-[#1B4332] cursor-pointer text-center focus-visible:underline focus-visible:outline-none"
                  >
                    Ou registrar série manualmente sem cronômetro
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={() => handleOpenConfirm()}
                className="w-full h-14 min-h-[56px] bg-[#1B4332] text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 hover:bg-[#12372A] active:scale-[0.98] transition-all shadow-md cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:outline-none"
                aria-label="Concluir série do exercício"
              >
                <Check className="w-6 h-6 stroke-[3]" />
                <span>Concluir Série</span>
              </button>
            )}
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

      {/* MODAL DE TROCA INTELIGENTE DE EXERCÍCIO AO VIVO (Fase 4) */}
      {showSwapModal && currentExerciseItem && (
        <div
          onClick={() => setShowSwapModal(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in cursor-pointer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="swap-modal-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-5 border border-[#C9DBD3] text-[#152A29] space-y-4 shadow-2xl cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h3 id="swap-modal-title" className="text-sm font-bold text-slate-900">Substituir Exercício</h3>
                <p className="text-[11px] text-slate-500">
                  Substitutos seguros do mesmo padrão biomecânico
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSwapModal(false)}
                aria-label="Fechar substituição"
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={saveSwapToPlan}
                onChange={(e) => setSaveSwapToPlan(e.target.checked)}
                className="rounded text-[#125F55]"
              />
              <span>Atualizar também na minha ficha oficial para os próximos treinos</span>
            </label>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(() => {
                const candidates = findSafeEquivalentExercises(
                  currentExerciseItem.exerciseId,
                  profile
                );

                if (candidates.length === 0) {
                  return (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-600">
                      Nenhum outro exercício compatível com seus equipamentos e articulações encontrado no momento.
                    </div>
                  );
                }

                return candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-3 bg-slate-50 hover:bg-[#EAF3EF] rounded-2xl border border-slate-200 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {cand.name_pt || cand.name_en}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {cand.target_muscle || 'Geral'} • {cand.equipment?.join(', ') || 'peso corporal'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        swapExerciseInActiveSession(activeSession.currentExerciseIndex, cand);
                        if (saveSwapToPlan && currentPlan) {
                          await replaceExerciseInPlan(currentPlan.id, currentExerciseItem.exerciseId, cand);
                        }
                        setShowSwapModal(false);
                      }}
                      className="px-3 py-1.5 bg-[#125F55] text-white rounded-xl text-xs font-bold hover:bg-[#0C5148] cursor-pointer shrink-0"
                    >
                      Escolher
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET DE CONFIRMAÇÃO DO REGISTRO REAL (S08) */}
      <SetConfirmDrawer
        isOpen={showConfirmSheet}
        onClose={() => setShowConfirmSheet(false)}
        exerciseName={currentExerciseItem?.exerciseName || ''}
        setIndex={activeSession.currentSetIndex}
        totalSets={currentExerciseItem?.targetSets || 1}
        isTimeTracking={Boolean(isTimeTracking)}
        actualReps={actualRepsInput}
        onRepsChange={setActualRepsInput}
        actualDuration={actualDurationInput}
        onDurationChange={setActualDurationInput}
        actualWeight={actualWeightInput}
        onWeightChange={setActualWeightInput}
        supportsWeight={supportsExternalWeight(exerciseDetails)}
        previousPR={previousPR ? {
          bestWeightKg: previousPR.bestWeightKg,
          bestReps: previousPR.bestReps,
          bestDurationSeconds: previousPR.bestDurationSeconds,
        } : undefined}
        restSeconds={confirmRestSeconds}
        onRestSecondsChange={setConfirmRestSeconds}
        onSaveSet={handleSaveSet}
      />

      {/* DIÁLOGO DE CONFIRMAÇÃO DE ABANDONO DE TREINO */}
      {showAbandonConfirm && (
        <div
          onClick={() => setShowAbandonConfirm(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs cursor-pointer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="abandon-confirm-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-[#C9DBD3] text-[#152A29] space-y-3 cursor-default"
          >
            <h4 id="abandon-confirm-title" className="text-base font-bold text-[#152A29]">Pausar ou encerrar treino?</h4>
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
