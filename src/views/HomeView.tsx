import { getLocalDateStr } from '../lib/dateUtils';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import {
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Dumbbell,
  Heart,
  ChevronRight,
  Flame,
  Footprints,
  Plus,
  Compass,
  FileCheck2,
  X,
  AlertCircle,
  Target,
  Circle,
  Shield,
  Sliders,
  Check,
  Zap,
} from 'lucide-react';
import { WorkoutPlan, MotivationStyle, PostWorkoutMood, PreWorkoutMood, CopingPlanRule } from '../types';
import { premadeWorkouts } from '../data/premadeWorkouts';
import { calculateCanonicalMetrics, generateWellbeingInsight, getCanonicalWeeklyGoal } from '../lib/storage';
import {
  getDefaultPreparationRitual,
  getDefaultCopingPlans,
  generateSessionFocusInvite,
  generateWeeklyProcessReview,
} from '../lib/motivationEngine';
import { detectGentleReturn, createGentleReturnPlanSnapshot, createSoftenedPlanSnapshot } from '../lib/workoutEngine';
import { OnboardingModal } from './OnboardingModal';
import { AICoachCard } from '../components/AICoachCard';
import { CoachContext } from '../lib/aiCoach';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { ActivityPath } from '../components/ActivityPath';
import { WeekPath } from '../components/superacao/WeekPath';
import { PreparationCard } from '../components/superacao/PreparationCard';
import { ObstaclePills } from '../components/superacao/ObstaclePills';
import { PreWorkoutModal } from '../components/superacao/PreWorkoutModal';

interface HomeViewProps {
  onStartWorkout: (
    plan: WorkoutPlan,
    scheduledDayId?: string,
    originType?: 'scheduled' | 'program_session' | 'ad_hoc' | 'express',
    isExpress?: boolean,
    wasPlannedHabit?: boolean,
    scheduledActivityId?: string,
    preMood?: PreWorkoutMood
  ) => void;
  onResumeWorkout: () => void;
  onNavigateTab: (tab: 'home' | 'workouts' | 'calendar' | 'progress') => void;
  onOpenBuilder?: (existingPlanId?: string, isPro?: boolean) => void;
  onReviewProposal?: () => void;
  onOpenListening?: () => void;
  onOpenLinkTeacher?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartWorkout,
  onResumeWorkout,
  onNavigateTab,
  onOpenBuilder,
  onReviewProposal,
  onOpenListening,
  onOpenLinkTeacher,
}) => {
  const { profile } = useAuth();
  const {
    plans,
    sessions,
    calendar,
    activeSession,
    personalRecords,
    activeProgram,
    startEmergencyWorkout,
    recordWalkSession,
    recordExternalPractice,
    chooseRestWithoutGuilt,
    completePreparationRitual,
    updateMotivationStyle,
    applyWeeklyReviewDecision,
    confirmLegacyRoutine,
    toggleDayActivityCompleted,
  } = useWorkout();

  // Estados locais de prática externa multimodal (T04)
  const [showPracticeModal, setShowPracticeModal] = useState<boolean>(false);
  const [practiceModality, setPracticeModality] = useState<
    'caminhada_corrida' | 'forca_academia' | 'mobilidade_yoga' | 'esporte_coletivo' | 'ciclismo_natacao' | 'outra'
  >('caminhada_corrida');
  const [practiceDuration, setPracticeDuration] = useState<number>(30);
  const [practiceEffort, setPracticeEffort] = useState<number>(3);
  const [practiceMood, setPracticeMood] = useState<PostWorkoutMood>('leve');
  const [practiceDistanceKm, setPracticeDistanceKm] = useState<string>('');
  const [practiceNotes, setPracticeNotes] = useState<string>('');

  // Estados locais para Se-Então (T07), Seletor de Estilo (T01) e Pré-Treino (T08)
  const [showCopingModal, setShowCopingModal] = useState<boolean>(false);
  const [showStyleSelector, setShowStyleSelector] = useState<boolean>(false);
  const [showReviewOnboarding, setShowReviewOnboarding] = useState<boolean>(false);
  const [showPreWorkoutModal, setShowPreWorkoutModal] = useState<boolean>(false);
  const [preMood, setPreMood] = useState<PreWorkoutMood>('normal');

  // Dia de hoje e fuso local (A06)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 a 6
  const todayStr = getLocalDateStr(today);
  const todaySchedule =
    calendar.find((c) => c.dateStr === todayStr) || calendar.find((c) => c.dayOfWeek === dayOfWeek);

  // Plano estritamente associado ao dia de hoje
  const todayPlan = todaySchedule?.planId
    ? plans.find((p) => p.id === todaySchedule.planId) || null
    : null;

  // Fase atual do programa ativo
  const currentPhase = activeProgram?.phases.find((phase) =>
    phase.weeks.includes(activeProgram.currentWeek)
  ) || activeProgram?.phases[0];

  // Plano de mobilidade suave para descanso ativo opcional
  const recoveryPlan = plans.find((p) => p.category === 'mobilidade') || null;

  // Detecção de Retomada Gentil (Fase 4 & 5 - Ausência prolongada >= 7 dias)
  const gentleReturn = detectGentleReturn(sessions, todayStr);

  const wellbeingInsight = generateWellbeingInsight(sessions);

  // Foco Adaptativo da Sessão (T01 a T04 / C01 a C09)
  const sessionFocus = todayPlan
    ? generateSessionFocusInvite(todayPlan, personalRecords, profile)
    : null;

  // Ritual de Preparação (T06)
  const ritual = profile.preparationRitual || getDefaultPreparationRitual(profile.habitAnchor);
  const isRitualDoneToday = ritual.lastCompletedDateStr === todayStr;

  // Planos Se-Então (T07)
  const copingPlans = profile.copingPlans || getDefaultCopingPlans(profile.practiceObstacles);

  // Estilo de Motivação (T01)
  const currentMotivationStyle = profile.motivationStyle || 'consistency';

  const coachContext: CoachContext = {
    displayName: profile.displayName,
    exerciseReason: profile.exerciseReason,
    habitAnchor: profile.habitAnchor,
    weeklyCompleted: calculateCanonicalMetrics(sessions, calendar, personalRecords).weeklyCompletedCount,
    lastMood: sessions.find((s) => s.postMood)?.postMood,
    todayPlanTitle: todayPlan?.title || (todaySchedule?.activityType === 'rest' ? 'Dia de Descanso' : undefined),
    motivationStyle: currentMotivationStyle,
  };

  // Estatísticas de consistência derivadas dos eventos canônicos reais (A07, R04, Seção 5)
  const canonical = calculateCanonicalMetrics(sessions, calendar, personalRecords);
  const completedThisWeek = canonical.weeklyCompletedCount;
  const canonicalWeekly = getCanonicalWeeklyGoal(profile, calendar, activeProgram?.weeklyFrequency);
  const targetWeeklyGoal = canonicalWeekly.targetWeeklyGoal;
  const totalPlannedThisWeek = targetWeeklyGoal;

  // Revisão Semanal de Processo (T04, T05, T17)
  const weeklyReview = generateWeeklyProcessReview(sessions, calendar, targetWeeklyGoal);
  const isWeeklyReviewCompleted = (profile.completedWeeklyReviews || []).includes(todayStr);
  const hasWeeklySessions = weeklyReview.completedCount + weeklyReview.expressOrPartialCount + weeklyReview.externalCount > 0;

  // Formatação de data em pt-BR (Ritmo Natural)
  const formattedDate = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const handleSavePractice = async () => {
    const km = practiceDistanceKm ? parseFloat(practiceDistanceKm) : undefined;
    await recordExternalPractice(
      practiceModality,
      practiceDuration,
      practiceEffort,
      practiceMood,
      practiceNotes.trim(),
      km
    );
    setShowPracticeModal(false);
    setPracticeDistanceKm('');
    setPracticeNotes('');
  };

  const handleStartTodayWorkout = () => {
    if (!todayPlan) return;
    if (preMood === 'cansado' || preMood === 'tenso') {
      const softened = createSoftenedPlanSnapshot(todayPlan);
      onStartWorkout(softened, todaySchedule?.id, 'scheduled', false, false, undefined, preMood);
    } else {
      onStartWorkout(todayPlan, todaySchedule?.id, 'scheduled', false, false, undefined, preMood);
    }
  };

  return (
    <div className="space-y-4.5 pb-24">
      {/* ─────────────────────────────────────────────────────────────
          FOLD 1: HEADER EDITORIAL ACOLHEDOR & RITMO SEMANAL
          Garante que o Card de Ação Principal e o botão CTA fiquem
          completamente visíveis no viewport mobile 390×844 sem rolagem.
         ───────────────────────────────────────────────────────────── */}
      <section className="space-y-3 pt-1">
        {/* Cabeçalho Editorial com Saudação e Data */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-[#5D6E65] tracking-wide">
              {capitalizedDate}
            </p>
            <h1 className="font-serif text-2xl font-bold text-[#19231E] leading-tight">
              Olá, {profile.displayName || 'Praticante'}!
            </h1>
          </div>

          {/* Badge de Consistência Semanal */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8EFE9] text-[#1B4332] rounded-full border border-[#1B4332]/15 shrink-0 shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-[#1B4332]" />
            <span className="text-xs font-bold">
              {totalPlannedThisWeek > 0
                ? `${completedThisWeek}/${totalPlannedThisWeek} na semana`
                : `${completedThisWeek} sessões`}
            </span>
          </div>
        </div>

        {/* Estilo de Incentivo Compacto (T01 Autonomia) */}
        <div className="flex items-center justify-between text-xs text-[#5D6E65]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>Incentivo:</span>
            <span className="font-bold text-[#1B4332] bg-[#E8EFE9] px-2.5 py-0.5 rounded-full border border-[#1B4332]/20 flex items-center gap-1">
              {currentMotivationStyle === 'consistency' && '🎯 Constância & Hábito'}
              {currentMotivationStyle === 'mastery' && '📐 Domínio Técnico'}
              {currentMotivationStyle === 'wellbeing' && '🌿 Bem-Estar & Alívio'}
              {currentMotivationStyle === 'performance' && '🏆 Superação (PRs)'}
              {currentMotivationStyle === 'variety' && '🎲 Variedade'}
              {currentMotivationStyle === 'social' && '🤝 Compromisso'}
              {currentMotivationStyle === 'none' && '🛡️ Apenas Meu Plano'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowStyleSelector((prev) => !prev)}
            className="text-[11px] font-bold text-[#1B4332] hover:underline cursor-pointer shrink-0 ml-2"
          >
            {showStyleSelector ? 'Fechar' : 'Mudar estilo'}
          </button>
        </div>

        {/* Menu rápido de estilos de incentivo quando acionado */}
        {showStyleSelector && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-[#FAF8F5] rounded-2xl border border-[#E4DDD3] animate-in fade-in">
            {[
              { id: 'consistency' as const, label: 'Constância', icon: '🎯' },
              { id: 'mastery' as const, label: 'Domínio Técnico', icon: '📐' },
              { id: 'wellbeing' as const, label: 'Bem-Estar', icon: '🌿' },
              { id: 'performance' as const, label: 'Superação (PRs)', icon: '🏆' },
              { id: 'variety' as const, label: 'Variedade', icon: '🎲' },
              { id: 'none' as const, label: 'Sem desafios', icon: '🛡️' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={async () => {
                  await updateMotivationStyle(st.id);
                  setShowStyleSelector(false);
                }}
                className={`p-2 rounded-xl text-left text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  currentMotivationStyle === st.id
                    ? 'bg-[#1B4332] text-white'
                    : 'bg-white text-[#19231E] border border-[#E4DDD3] hover:border-[#1B4332]'
                }`}
              >
                <span>{st.icon}</span>
                <span className="truncate">{st.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Trilha Semanal de 1 Linha (Bolinhas Semânticas) */}
        <WeekPath
          calendar={calendar}
          sessions={sessions}
          todayDayOfWeek={dayOfWeek}
          todayStr={todayStr}
          onNavigateCalendar={() => onNavigateTab('calendar')}
        />
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CARD PRINCIPAL CONTEXTUAL DE HOJE (FOLD 1 GARANTIDO)
         ───────────────────────────────────────────────────────────── */}
      {activeSession ? (
        /* CARD: TREINO EM ANDAMENTO / PAUSADO */
        <section className="bg-[#1B4332] text-white rounded-3xl p-5 shadow-md relative overflow-hidden space-y-3">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-bold text-white tracking-wide uppercase">
              Treino em Andamento
            </span>
            <h3 className="font-serif text-xl font-bold mt-2 text-white">
              {activeSession.planTitle}
            </h3>
            <p className="text-xs text-white/80 mt-1">
              Exercício {activeSession.currentExerciseIndex + 1} de {activeSession.exercisesSnapshot.length} · Série {activeSession.currentSetIndex}
            </p>
          </div>

          <button
            onClick={onResumeWorkout}
            className="w-full h-14 bg-[#D9F277] text-[#19231E] font-bold text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-[#cbe368] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Retomar Treino Agora</span>
          </button>
        </section>
      ) : todaySchedule?.activityType === 'walk' ? (
        /* CARD: ATIVIDADE LIVRE · CAMINHADA */
        <section className="bg-white border border-[#E4DDD3] rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1B4332] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Footprints className="w-4 h-4" />
              <span>Atividade Livre · Caminhada</span>
            </span>
            <span className="text-[#5D6E65] text-[11px]">Ritmo livre</span>
          </div>

          <h3 className="font-serif text-xl font-bold text-[#19231E]">
            {todaySchedule.planTitle || 'Caminhada Confortável & Ar Livre'}
          </h3>
          <p className="text-xs text-[#5D6E65] leading-relaxed">
            Estimule o sistema cardiorrespiratório e a circulação no seu próprio ritmo. Registre a duração e a distância opcional sem necessidade de GPS.
          </p>

          <button
            onClick={() => {
              setPracticeModality('caminhada_corrida');
              setShowPracticeModal(true);
            }}
            className="w-full h-14 bg-[#1B4332] hover:bg-[#12372A] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <Footprints className="w-5 h-5" />
            <span>Registrar Caminhada de Hoje</span>
          </button>
        </section>
      ) : todaySchedule?.activityType === 'rest' ? (
        /* CARD: DIA DE DESCANSO & REGENERAÇÃO */
        <section className="bg-white border border-[#E4DDD3] rounded-3xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#E07A5F] uppercase tracking-wider">
              <Heart className="w-4 h-4" />
              <span>Dia de Descanso & Regeneração</span>
            </div>
            {todaySchedule.vitalityBonusCompleted && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#E8EFE9] border border-[#1B4332]/20 text-[10px] font-bold text-[#1B4332] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Elo Conquistado
              </span>
            )}
          </div>

          <div>
            <h3 className="font-serif text-xl font-bold text-[#19231E]">
              O descanso é onde o corpo se regenera
            </h3>
            <p className="text-xs text-[#5D6E65] mt-1 leading-relaxed">
              Hoje não há cobrança de treino. Descansar é vencer! Se quiser se movimentar levemente sem cansar os músculos, você pode registrar uma prática regenerativa:
            </p>
          </div>

          <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recoveryPlan && (
              <button
                onClick={() => onStartWorkout(recoveryPlan, todaySchedule?.id, 'ad_hoc')}
                className="h-12 bg-[#E8EFE9] text-[#1B4332] font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#1B4332] hover:text-white transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-[#E07A5F]" />
                <span>Alongamento / Mobilidade (8 min)</span>
              </button>
            )}
            <button
              onClick={() => {
                setPracticeModality('caminhada_corrida');
                setShowPracticeModal(true);
              }}
              className="h-12 bg-white text-[#19231E] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#FAF8F5] transition-all border border-[#E4DDD3] cursor-pointer"
            >
              <Footprints className="w-4 h-4 text-[#1B4332]" />
              <span>Caminhada Regenerativa Livre (Registrar Prática)</span>
            </button>
          </div>
        </section>
      ) : todayPlan ? (
        /* CARD: TREINO DE FORÇA PLANEJADO PARA HOJE */
        <section className="bg-white border border-[#E4DDD3] rounded-3xl p-5 shadow-sm space-y-3.5 transition-all">
          {/* Cabeçalho do Card */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px] text-[#1B4332] bg-[#E8EFE9] px-2.5 py-1 rounded-full">
              Treino Planejado para Hoje
            </span>
            <span className="flex items-center gap-1 text-[#5D6E65] font-semibold text-xs">
              <Clock className="w-3.5 h-3.5 text-[#1B4332]" />
              {todayPlan.estimatedDurationMinutes} min · {todayPlan.exercises.length} {todayPlan.exercises.length === 1 ? 'exercício' : 'exercícios'}
            </span>
          </div>

          {/* Título Serifado */}
          <div>
            <h2 className="font-serif text-xl font-bold text-[#19231E] leading-tight">
              {todayPlan.title}
            </h2>
            <p className="text-xs text-[#5D6E65] line-clamp-2 mt-0.5">
              {todayPlan.description}
            </p>
          </div>

          {/* Foco Adaptativo da Sessão (se houver) */}
          {sessionFocus && (
            <div className="bg-[#FAF8F5] border border-[#E4DDD3] rounded-2xl p-3 flex items-start gap-2.5">
              <span className="text-base shrink-0 mt-0.5">🎯</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#1B4332] text-white">
                    {sessionFocus.badgeText}
                  </span>
                  <h4 className="text-xs font-bold text-[#19231E]">{sessionFocus.title}</h4>
                </div>
                <p className="text-[11px] text-[#5D6E65] mt-0.5 leading-snug">
                  {sessionFocus.description}
                </p>
              </div>
            </div>
          )}

          {/* Lista Compacta de Exercícios */}
          <div className="bg-[#FAF8F5] p-3 rounded-2xl space-y-1.5 text-xs text-[#19231E] border border-[#E4DDD3]/60">
            {todayPlan.exercises.slice(0, 3).map((ex, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-medium truncate max-w-[210px]">{ex.exerciseName}</span>
                <span className="text-[#5D6E65] text-[11px] tabular-nums">
                  {ex.targetSets}x {ex.targetReps > 0 ? `${ex.targetReps} reps` : `${ex.targetDurationSeconds}s`}
                </span>
              </div>
            ))}
            {todayPlan.exercises.length > 3 && (
              <p className="text-[11px] text-[#5D6E65] pt-0.5">
                + {todayPlan.exercises.length - 3} outros movimentos
              </p>
            )}
          </div>

          {/* Seletor Compacto de Humor "Como você chega hoje?" */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#19231E] text-[11px]">Como você chega hoje?</span>
              <button
                type="button"
                onClick={() => setShowPreWorkoutModal(true)}
                className="text-[10px] text-[#1B4332] font-bold hover:underline cursor-pointer"
              >
                Antes de começar
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'cansado' as const, label: 'Cansado', icon: '🔋' },
                { id: 'tenso' as const, label: 'Tenso', icon: '🧘' },
                { id: 'normal' as const, label: 'Normal', icon: '🌿' },
                { id: 'disposto' as const, label: 'Disposto', icon: '⚡' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPreMood(m.id)}
                  className={`py-1.5 px-1 rounded-xl text-center text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    preMood === m.id
                      ? m.id === 'cansado' || m.id === 'tenso'
                        ? 'bg-[#FDF3F0] text-[#E07A5F] border border-[#E07A5F] shadow-2xs font-bold'
                        : 'bg-[#E8EFE9] text-[#1B4332] border border-[#1B4332] shadow-2xs font-bold'
                      : 'bg-[#FAF8F5] text-[#5D6E65] border border-[#E4DDD3] hover:border-[#1B4332]/40'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>

            {(preMood === 'cansado' || preMood === 'tenso') && (
              <div className="p-2.5 bg-[#FDF3F0] border border-[#E07A5F]/30 rounded-xl text-[11px] text-[#19231E]/80 animate-in fade-in">
                <span className="font-bold text-[#E07A5F]">Sugestão Superação: </span>
                Suavizar o treino de hoje? Reduzimos volume/carga para você manter a consistência sem cansaço excessivo.
              </div>
            )}
          </div>

          {/* BOTÃO CTA GIGANTE DE 56PX (H-14) VISÍVEL NO FOLD 1 */}
          <div className="space-y-2 pt-1">
            {preMood === 'cansado' || preMood === 'tenso' ? (
              <div className="space-y-1.5">
                <button
                  onClick={handleStartTodayWorkout}
                  className="w-full h-14 bg-[#1B4332] hover:bg-[#12372A] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-md"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Suavizar e começar (-25%)</span>
                </button>
                <button
                  onClick={() => onStartWorkout(todayPlan, todaySchedule?.id, 'scheduled', false, false, undefined, preMood)}
                  className="w-full py-2 text-xs font-semibold text-[#5D6E65] hover:text-[#19231E] text-center cursor-pointer"
                >
                  Prefiro fazer o treino normal
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartTodayWorkout}
                className="w-full h-14 bg-[#1B4332] hover:bg-[#12372A] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Iniciar Treino de Hoje</span>
              </button>
            )}

            {/* Pílulas Horizontais de Contingência (Express / Se-Então / Offline) */}
            <ObstaclePills
              onExpressClick={startEmergencyWorkout}
              onCopingClick={() => setShowCopingModal(true)}
              onOfflinePracticeClick={() => {
                setPracticeModality('forca_academia');
                setShowPracticeModal(true);
              }}
            />
          </div>
        </section>
      ) : todaySchedule?.activityType === 'active_recovery' ? (
        /* CARD: DESCANSO ATIVO ORIENTADO PELO PROFESSOR */
        <section className="bg-white border border-[#E4DDD3] rounded-3xl p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1B4332] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>🚶</span>
              <span>Descanso Ativo Orientado pelo Professor</span>
            </span>
            <span className="text-[#5D6E65] text-[11px]">Recuperação Leve</span>
          </div>

          <div>
            <h3 className="font-serif text-xl font-bold text-[#19231E]">
              Movimento Suave & Regeneração
            </h3>
            <p className="text-xs text-[#5D6E65] mt-1 leading-relaxed">
              {todaySchedule.notes ||
                'Dia planejado para estimular sua circulação e flexibilidade sem fadiga muscular.'}
            </p>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => {
                setPracticeModality('caminhada_corrida');
                setShowPracticeModal(true);
              }}
              className="flex-1 h-12 bg-[#1B4332] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#12372A] transition-all cursor-pointer shadow-sm"
            >
              <Footprints className="w-4 h-4 text-[#D9F277]" />
              <span>Registrar Caminhada Leve / Prática</span>
            </button>
            {recoveryPlan && (
              <button
                onClick={() => onStartWorkout(recoveryPlan, todaySchedule?.id, 'ad_hoc')}
                className="flex-1 h-12 bg-[#E8EFE9] text-[#1B4332] font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#1B4332] hover:text-white transition-all cursor-pointer border border-[#1B4332]/20"
              >
                <Sparkles className="w-4 h-4 text-[#E07A5F]" />
                <span>Mobilidade Guiada (8 min)</span>
              </button>
            )}
          </div>
        </section>
      ) : (
        /* FOLD 1: DOIS CARDS CLAROS PARA ALUNO NOVO OU SEM ROTINA */
        <section className="space-y-3">
          {/* Card 1: Montar Meu Treino Personalizado */}
          <div className="bg-gradient-to-br from-[#E8EFE9] to-white rounded-3xl p-5 border border-[#1B4332]/30 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B4332]">
              <span className="text-base">✨</span>
              <span>Montar Meu Treino Personalizado</span>
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#19231E]">
                Crie um plano feito sob medida para você
              </h2>
              <p className="text-xs text-[#5D6E65] mt-1 leading-relaxed">
                Responda perguntas rápidas sobre seu corpo, tempo e espaço para gerarmos uma rotina segura e livre de sobrecargas articulares.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenListening || onReviewProposal}
              className="w-full h-12 bg-[#1B4332] hover:bg-[#12372A] text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#D9F277]" />
              <span>Responder e Criar Meu Plano</span>
            </button>
          </div>

          {/* Card 2: Treinar com um Professor */}
          <div className="bg-white rounded-3xl p-5 border border-[#E4DDD3] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5D6E65]">
              <span className="text-base">👨‍🏫</span>
              <span>Treinar com um Professor</span>
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#19231E]">
                Conectar com Personal ou Ficha de Treinador
              </h3>
              <p className="text-xs text-[#5D6E65] mt-1 leading-relaxed">
                Preencha a ficha de avaliação enviada pelo seu professor (com envio de fotos) ou insira o código de convite para receber suas fichas.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenLinkTeacher}
              className="w-full h-12 bg-[#FAF8F5] border border-[#1B4332]/30 text-[#1B4332] hover:bg-[#E8EFE9] font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <span>Inserir Código do Professor</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FOLD 2: RITUAL DE PREPARAÇÃO, CAMINHO SEMANAL & EXTRAS
         ───────────────────────────────────────────────────────────── */}

      {/* Banner de Retomada Gentil sem Culpa (Fase 4 & 5 - Ausência >= 7 dias) */}
      {gentleReturn.isEligible && todayPlan && (
        <section className="bg-amber-50 rounded-2xl p-4.5 border border-amber-300 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-black text-lg">
              🌿
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-bold text-amber-950">Bem-vindo(a) de volta!</h3>
                <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 text-[10px] font-bold rounded-full">
                  Retomada Acolhedora
                </span>
                <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 text-[10px] font-bold rounded-full">
                  Readaptação
                </span>
              </div>
              <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                Sentimos sua falta há {gentleReturn.daysAbsent} dias (faz {gentleReturn.daysAbsent} dias desde seu último registro por aqui). Como foram esses dias para você?
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <button
              onClick={() => {
                const adaptedPlan = createGentleReturnPlanSnapshot(todayPlan);
                onStartWorkout(adaptedPlan, todaySchedule?.id, 'scheduled');
              }}
              className="flex-1 py-2.5 px-3 bg-amber-800 text-white rounded-xl text-xs font-bold shadow hover:bg-amber-900 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Iniciar Treino Gentil (2 séries)
            </button>
            <button
              onClick={() => setShowPracticeModal(true)}
              className="py-2.5 px-3 bg-white text-amber-900 border border-amber-300 rounded-xl text-xs font-bold hover:bg-amber-100 cursor-pointer text-center"
            >
              Pratiquei fora do app
            </button>
            <button
              onClick={() => onStartWorkout(todayPlan, todaySchedule?.id, 'scheduled')}
              className="py-2.5 px-3 bg-white text-amber-900 border border-amber-300 rounded-xl text-xs font-bold hover:bg-amber-100 cursor-pointer text-center"
            >
              Fazer Normal
            </button>
          </div>
        </section>
      )}

      {/* Card de Revisão Semanal de Processo (T04, T05, T17) */}
      {hasWeeklySessions && !isWeeklyReviewCompleted && dayOfWeek >= 4 && (
        <section className="bg-gradient-to-r from-[#E8EFE9] to-white rounded-3xl p-4.5 border border-[#1B4332]/20 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1B4332]">
                  Revisão Semanal de Processo
                </h3>
                <p className="text-xs text-[#19231E] font-medium mt-0.5">
                  {weeklyReview.completedCount} treinos completos · {weeklyReview.expressOrPartialCount} parciais/rápidos · {weeklyReview.externalCount} práticas externas
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#D9F277] text-[#19231E] text-[10px] font-bold shrink-0">
              Esforço médio {weeklyReview.averageRpe}/5
            </span>
          </div>

          <div className="text-xs text-[#5D6E65] leading-relaxed">
            {weeklyReview.suggestedAction === 'advance' ? (
              <p>Você cumpriu sua meta com folga e sensação leve! Sugerimos avançar para <strong>{weeklyReview.suggestedDaysTarget} dias</strong> na próxima semana.</p>
            ) : weeklyReview.suggestedAction === 'soften' ? (
              <p>A semana foi exigente ou os dias foram corridos. Que tal calibrar a meta para <strong>{weeklyReview.suggestedDaysTarget} dias</strong> para manter o ritmo sem peso?</p>
            ) : (
              <p>Seu ritmo foi equilibrado e constante! Manter a meta de <strong>{weeklyReview.currentTargetDays} dias</strong> consolida seu hábito.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {weeklyReview.suggestedAction !== 'maintain' && (
              <button
                onClick={() => applyWeeklyReviewDecision(weeklyReview.suggestedAction, weeklyReview.suggestedDaysTarget)}
                className="py-2 px-3.5 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#12372A] focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:outline-none cursor-pointer shadow-xs transition-colors"
              >
                {weeklyReview.suggestedAction === 'advance'
                  ? `Avançar para ${weeklyReview.suggestedDaysTarget} dias`
                  : `Suavizar para ${weeklyReview.suggestedDaysTarget} dias sem culpa`}
              </button>
            )}
            <button
              onClick={() => applyWeeklyReviewDecision('maintain', targetWeeklyGoal)}
              className="py-2 px-3 bg-white border border-[#E4DDD3] text-[#5D6E65] rounded-xl text-xs font-semibold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:outline-none cursor-pointer transition-colors"
            >
              Manter meta ({targetWeeklyGoal} {targetWeeklyGoal === 1 ? 'dia' : 'dias'})
            </button>
            {weeklyReview.suggestedAction === 'maintain' && targetWeeklyGoal > 1 && (
              <button
                onClick={() => applyWeeklyReviewDecision('soften', Math.max(1, targetWeeklyGoal - 1))}
                className="py-2 px-3 bg-white border border-[#E4DDD3] text-[#5D6E65] hover:text-[#1B4332] rounded-xl text-xs font-semibold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:outline-none cursor-pointer transition-colors"
              >
                Suavizar (-1 dia)
              </button>
            )}
          </div>
        </section>
      )}

      {/* Revisão de Rotina para Usuários Legados */}
      {profile.needsReviewPrompt && activeProgram && (
        <section className="bg-[#E8EFE9] rounded-2xl p-4 border border-[#1B4332]/20 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-[#19231E]">
              <p className="font-bold">Revisão de Rotina</p>
              <p className="text-[#5D6E65] mt-0.5">
                Seu programa atual é <strong>{activeProgram.title}</strong>. Deseja confirmar esta rotina ou personalizar suas preferências?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 pl-6">
            <button
              onClick={confirmLegacyRoutine}
              className="px-3 py-1.5 bg-[#1B4332] text-white rounded-lg text-xs font-bold hover:bg-[#12372A] cursor-pointer"
            >
              Confirmar Rotina
            </button>
            <button
              onClick={() => setShowReviewOnboarding(true)}
              className="px-3 py-1.5 border border-[#E4DDD3] bg-white text-[#5D6E65] rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Personalizar Perfil
            </button>
          </div>
        </section>
      )}

      {/* Ritual de Preparação (T06) - Acordeão Retrátil */}
      <PreparationCard
        ritual={ritual}
        isDoneToday={isRitualDoneToday}
        habitAnchor={profile.habitAnchor}
        onComplete={completePreparationRitual}
      />

      {/* Lembretes Sutis de Âncora e Porquê */}
      {(profile.habitAnchor || profile.exerciseReason) && (
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {profile.habitAnchor && (
            <div className="flex items-center gap-1.5 text-xs text-[#5D6E65] bg-white px-3 py-1.5 rounded-xl border border-[#E4DDD3]">
              <Clock className="w-3.5 h-3.5 text-[#1B4332] shrink-0" />
              <span>
                Sua âncora: <strong>{profile.habitAnchor}</strong>
              </span>
            </div>
          )}
          {profile.exerciseReason && (
            <div className="flex items-center gap-1.5 text-xs text-[#5D6E65] bg-[#E8EFE9]/60 px-3 py-1.5 rounded-xl border border-[#1B4332]/20">
              <Heart className="w-3.5 h-3.5 text-[#1B4332] shrink-0" />
              <span>
                Seu porquê: <em>«{profile.exerciseReason}»</em>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Rotinas Complementares Intercaladas do Dia (se houver) */}
      {todaySchedule?.additionalActivities && todaySchedule.additionalActivities.length > 0 && (
        <section className="bg-white rounded-3xl p-5 border border-[#E4DDD3] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-[#5D6E65]">
            <span className="font-semibold uppercase tracking-wider text-[#1B4332] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Rotinas Intercaladas de Hoje</span>
            </span>
            <span className="text-[11px] font-bold text-[#1B4332]">
              {todaySchedule.additionalActivities.length} {todaySchedule.additionalActivities.length === 1 ? 'rotina' : 'rotinas'}
            </span>
          </div>

          <div className="space-y-2">
            {todaySchedule.additionalActivities.map((act) => {
              const extraPlan = plans.find((p) => p.id === act.planId) || premadeWorkouts.find((p) => p.id === act.planId);
              const timeBadge =
                act.timeOfDay === 'manha'
                  ? '🌅 Manhã'
                  : act.timeOfDay === 'tarde'
                  ? '☀️ Tarde'
                  : act.timeOfDay === 'noite'
                  ? '🌙 Noite'
                  : '⏱️ Horário Livre';

              return (
                <div
                  key={act.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    act.isCompleted ? 'bg-[#E8EFE9]/60 border-[#1B4332]/30' : 'bg-[#FAF8F5] border-[#E4DDD3]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#E4DDD3] text-[#1B4332]">
                        {timeBadge}
                      </span>
                      {act.isCompleted && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D9F277] text-[#19231E]">
                          ✓ Concluído
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-[#19231E]">{act.planTitle}</h4>
                    {act.programTitle && (
                      <p className="text-[11px] text-[#5D6E65]">Programa: {act.programTitle}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {extraPlan && !act.isCompleted && (
                      <button
                        onClick={() =>
                          onStartWorkout(
                            extraPlan,
                            todaySchedule?.id,
                            'program_session',
                            false,
                            false,
                            act.id
                          )
                        }
                        className="py-1.5 px-3 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#12372A] flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Iniciar</span>
                      </button>
                    )}
                    <button
                      onClick={() => toggleDayActivityCompleted(todaySchedule?.id || '', act.id)}
                      className="py-1.5 px-3 bg-white border border-[#E4DDD3] text-[#5D6E65] hover:text-[#19231E] rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      {act.isCompleted ? 'Desmarcar' : 'Marcar como feito'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Programa Ativo Confirmado (se houver) */}
      {activeProgram && (
        <div className="bg-white p-4 rounded-3xl border border-[#E4DDD3] space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1B4332] uppercase tracking-wider text-[11px] truncate max-w-[240px]">
              {activeProgram.title}
            </span>
            <button
              onClick={() => onNavigateTab('workouts')}
              className="text-[#1B4332] font-bold hover:underline shrink-0 cursor-pointer text-xs"
            >
              Ver Programa
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-[#19231E]">
            <span className="font-bold">
              Semana {activeProgram.currentWeek} de {activeProgram.durationWeeks}
            </span>
            <span className="text-[#5D6E65] text-[11px]">
              {currentPhase?.name || 'Fase Ativa'}
            </span>
          </div>
        </div>
      )}

      {/* Caminho Pessoal da Semana Completo (Inspirado no Gentler Streak) */}
      <ActivityPath
        calendar={calendar}
        sessions={sessions}
        metrics={canonical}
        personalRecords={personalRecords}
        targetWeeklyGoal={targetWeeklyGoal}
        completedThisWeek={completedThisWeek}
        todayDayOfWeek={dayOfWeek}
        hideWeeklyNodes={true}
        onNavigateCalendar={() => onNavigateTab('calendar')}
        onNavigateProgress={() => onNavigateTab('progress')}
      />

      {/* Espelho de Bem-Estar (Estratégia D: Termômetro Antes vs Depois) */}
      {wellbeingInsight && (
        <section className="bg-white rounded-3xl p-4.5 border border-[#E4DDD3] flex items-start gap-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-2xl bg-[#E8EFE9] text-[#1B4332] flex items-center justify-center shrink-0 text-base shadow-2xs">
            ✨
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-extrabold text-[#1B4332] uppercase tracking-wider block">
              Espelho de Bem-Estar & Sensação
            </span>
            <p className="text-xs text-[#19231E] mt-0.5 leading-relaxed font-medium">
              {wellbeingInsight.message}
            </p>
          </div>
        </section>
      )}

      {/* Coach de IA Contextual */}
      <AICoachCard context={coachContext} />

      {/* Banner de Instalação PWA */}
      <PWAInstallButton variant="banner" />

      {/* ─────────────────────────────────────────────────────────────
          MODAIS E DIÁLOGOS DE APOIO
         ───────────────────────────────────────────────────────────── */}

      {/* DIÁLOGO PRÉ-TREINO "ANTES DE COMEÇAR" (T08 & T09) */}
      {todayPlan && (
        <PreWorkoutModal
          isOpen={showPreWorkoutModal}
          onClose={() => setShowPreWorkoutModal(false)}
          plan={todayPlan}
          onConfirmStart={(adapted, mood) => {
            setShowPreWorkoutModal(false);
            if (adapted) {
              onStartWorkout(adapted, todaySchedule?.id, 'scheduled', false, false, undefined, mood);
            } else {
              onStartWorkout(todayPlan, todaySchedule?.id, 'scheduled', false, false, undefined, mood);
            }
          }}
          onRestToday={async () => {
            setShowPreWorkoutModal(false);
            await chooseRestWithoutGuilt('Descanso escolhido conscientemente no pré-treino.');
          }}
        />
      )}

      {/* MODAL UNIVERSAL DE PRÁTICA EXTERNA (T04) */}
      {showPracticeModal && (
        <div
          onClick={() => setShowPracticeModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-[#E4DDD3] text-[#19231E] space-y-4 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E4DDD3]">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-[#1B4332]" />
                <h3 className="text-base font-bold text-[#19231E]">
                  {practiceModality === 'caminhada_corrida' ? 'Registrar Caminhada' : 'Registrar Prática Realizada'}
                </h3>
              </div>
              <button
                onClick={() => setShowPracticeModal(false)}
                className="p-1 rounded-full text-[#5D6E65] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5D6E65]">
              Toda prática de movimento conta para sua constância semanal e saúde. Registre o que você fez fora do app:
            </p>

            {/* Modalidades */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#19231E]">Modalidade</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'caminhada_corrida' as const, label: 'Caminhada / Corrida', icon: '🚶' },
                  { id: 'forca_academia' as const, label: 'Musculação / Força', icon: '🏋️' },
                  { id: 'mobilidade_yoga' as const, label: 'Mobilidade / Yoga', icon: '🧘' },
                  { id: 'esporte_coletivo' as const, label: 'Futebol / Esporte', icon: '⚽' },
                  { id: 'ciclismo_natacao' as const, label: 'Ciclismo / Natação', icon: '🚴' },
                  { id: 'outra' as const, label: 'Outro Movimento', icon: '✨' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPracticeModality(item.id)}
                    className={`p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                      practiceModality === item.id
                        ? 'bg-[#E8EFE9] border-[#1B4332] text-[#1B4332] shadow-2xs'
                        : 'bg-[#FAF8F5] border-[#E4DDD3] text-[#5D6E65] hover:border-[#1B4332]/40'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duração em Minutos */}
            <div className="space-y-1.5">
              <label htmlFor="walk_duration_input" className="block text-xs font-bold text-[#19231E]">
                Duração da Prática (minutos)
              </label>
              <input
                id="walk_duration_input"
                data-testid="practice_duration_input"
                type="number"
                min={5}
                max={240}
                value={practiceDuration}
                onChange={(e) => setPracticeDuration(parseInt(e.target.value) || 10)}
                className="w-full p-3 rounded-xl border border-[#E4DDD3] text-sm font-semibold focus:outline-[#1B4332]"
              />
            </div>

            {/* Distância Opcional para Caminhada / Corrida */}
            {practiceModality === 'caminhada_corrida' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#19231E]">
                  Distância Aproximada em km (opcional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 3.5"
                  value={practiceDistanceKm}
                  onChange={(e) => setPracticeDistanceKm(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E4DDD3] text-sm focus:outline-[#1B4332]"
                />
              </div>
            )}

            {/* Sensação de Esforço */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#19231E]">
                Como foi o esforço?
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { val: 1, label: 'Muito leve' },
                  { val: 2, label: 'Leve' },
                  { val: 3, label: 'Moderado' },
                  { val: 4, label: 'Firme' },
                  { val: 5, label: 'Intenso' },
                ].map((eff) => (
                  <button
                    key={eff.val}
                    type="button"
                    onClick={() => setPracticeEffort(eff.val)}
                    className={`py-2 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                      practiceEffort === eff.val
                        ? 'bg-[#1B4332] text-white shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#5D6E65] border border-[#E4DDD3]'
                    }`}
                  >
                    {eff.val}
                    <span className="block text-[8px] font-normal">{eff.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sensação Pós-Prática */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#19231E]">
                Como você se sentiu após praticar?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'leve' as const, label: 'Mais leve' },
                  { id: 'renovado' as const, label: 'Energizado' },
                  { id: 'neutro' as const, label: 'Tranquilo' },
                ].map((mood) => (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => setPracticeMood(mood.id)}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      practiceMood === mood.id
                        ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#5D6E65] border border-[#E4DDD3]'
                    }`}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Botão de Gravação */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPracticeModal(false)}
                className="flex-1 py-3 text-xs font-semibold text-[#5D6E65] hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePractice}
                className="flex-2 py-3 bg-[#1B4332] hover:bg-[#12372A] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirmar Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PLANOS SE-ENTÃO PARA OBSTÁCULOS (T07) */}
      {showCopingModal && (
        <div
          onClick={() => setShowCopingModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-[#E4DDD3] text-[#19231E] space-y-4 cursor-default animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E4DDD3]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#E07A5F]" />
                <h3 className="text-sm font-bold text-[#19231E]">Respostas Rápidas Se-Então</h3>
              </div>
              <button
                onClick={() => setShowCopingModal(false)}
                className="p-1 rounded-full text-[#5D6E65] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5D6E65]">
              Imprevistos fazem parte da vida real. Escolha um caminho de continuidade flexível para manter sua constância sem culpa:
            </p>

            <div className="space-y-2 pt-1">
              {copingPlans.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-[#E4DDD3] bg-[#FAF8F5] space-y-2"
                >
                  <p className="text-[11px] font-bold text-[#1B4332]">
                    {rule.ifTriggerLabel}
                  </p>
                  <p className="text-xs text-[#19231E]">
                    {rule.thenActionLabel}
                  </p>

                  <div className="pt-1">
                    {rule.thenActionType === 'express_5min' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCopingModal(false);
                          startEmergencyWorkout();
                        }}
                        className="w-full py-2 px-3 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#12372A] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Fazer Opção Rápida (5 min)</span>
                      </button>
                    )}

                    {rule.thenActionType === 'soften_25pct' && todayPlan && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCopingModal(false);
                          const softened = createSoftenedPlanSnapshot(todayPlan);
                          onStartWorkout(softened, todaySchedule?.id, 'scheduled', false, false, undefined, preMood);
                        }}
                        className="w-full py-2 px-3 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#12372A] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Iniciar Treino Suavizado (-25%)</span>
                      </button>
                    )}

                    {rule.thenActionType === 'swap_mobility' && recoveryPlan && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCopingModal(false);
                          onStartWorkout(recoveryPlan, todaySchedule?.id, 'ad_hoc');
                        }}
                        className="w-full py-2 px-3 bg-[#E8EFE9] border border-[#1B4332]/30 text-[#1B4332] rounded-xl text-xs font-bold hover:bg-[#1B4332] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Fazer Alongamento Suave (8 min)</span>
                      </button>
                    )}

                    {rule.thenActionType === 'reschedule_day' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCopingModal(false);
                          onNavigateTab('calendar');
                        }}
                        className="w-full py-2 px-3 bg-white border border-[#E4DDD3] text-[#5D6E65] rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>Reagendar na Agenda</span>
                      </button>
                    )}

                    {rule.thenActionType === 'guided_form_focus' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await completePreparationRitual();
                          setShowCopingModal(false);
                        }}
                        className="w-full py-2 px-3 bg-white border border-[#E4DDD3] text-[#19231E] rounded-xl text-xs font-bold hover:bg-[#FAF8F5] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3] text-[#1B4332]" />
                        <span>Concluir apenas o Ritual de 2 passos</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCopingModal(false)}
              className="w-full py-2.5 rounded-xl border border-[#E4DDD3] text-[#5D6E65] text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE REVISÃO DE ONBOARDING */}
      {showReviewOnboarding && (
        <OnboardingModal onComplete={() => setShowReviewOnboarding(false)} />
      )}
    </div>
  );
};
