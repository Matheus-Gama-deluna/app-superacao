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
import { WorkoutPlan, MotivationStyle, PostWorkoutMood, CopingPlanRule } from '../types';
import { premadeWorkouts } from '../data/premadeWorkouts';
import { calculateCanonicalMetrics, generateWellbeingInsight } from '../lib/storage';
import {
  getDefaultPreparationRitual,
  getDefaultCopingPlans,
  generateSessionFocusInvite,
  generateWeeklyProcessReview,
} from '../lib/motivationEngine';
import { detectGentleReturn, createGentleReturnPlanSnapshot } from '../lib/workoutEngine';
import { OnboardingModal } from './OnboardingModal';
import { AICoachCard } from '../components/AICoachCard';
import { CoachContext } from '../lib/aiCoach';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { ActivityPath } from '../components/ActivityPath';

interface HomeViewProps {
  onStartWorkout: (
    plan: WorkoutPlan,
    scheduledDayId?: string,
    originType?: 'scheduled' | 'program_session' | 'ad_hoc' | 'express',
    isExpress?: boolean,
    wasPlannedHabit?: boolean,
    scheduledActivityId?: string
  ) => void;
  onResumeWorkout: () => void;
  onNavigateTab: (tab: 'home' | 'workouts' | 'calendar' | 'progress') => void;
  onOpenBuilder?: (existingPlanId?: string, isPro?: boolean) => void;
  onReviewProposal?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartWorkout,
  onResumeWorkout,
  onNavigateTab,
  onOpenBuilder,
  onReviewProposal,
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

  // Estados locais para Se-Então (T07) e Seletor de Estilo (T01)
  const [showCopingModal, setShowCopingModal] = useState<boolean>(false);
  const [showStyleSelector, setShowStyleSelector] = useState<boolean>(false);
  const [showReviewOnboarding, setShowReviewOnboarding] = useState<boolean>(false);
  const [isInstallBannerDismissed, setIsInstallBannerDismissed] = useState<boolean>(false);

  // Dia de hoje e fuso local (A06)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 a 6
  const todayStr = getLocalDateStr(today);
  const todaySchedule =
    calendar.find((c) => c.dateStr === todayStr) || calendar.find((c) => c.dayOfWeek === dayOfWeek);

  // Plano estritamente associado ao dia de hoje (sem fallback enganoso que substitui caminhada ou descanso por agachamento!)
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
  const targetWeeklyGoal =
    profile.availableDays && profile.availableDays.length > 0
      ? profile.availableDays.length
      : activeProgram
      ? activeProgram.weeklyFrequency
      : canonical.weeklyCommittedCount || 2;
  const totalPlannedThisWeek = targetWeeklyGoal;

  // Revisão Semanal de Processo (T04, T05, T17)
  const weeklyReview = generateWeeklyProcessReview(sessions, calendar, targetWeeklyGoal);
  const isWeeklyReviewCompleted = (profile.completedWeeklyReviews || []).includes(todayStr);
  const hasWeeklySessions = weeklyReview.completedCount + weeklyReview.expressOrPartialCount + weeklyReview.externalCount > 0;

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

  return (
    <div className="space-y-6 pb-24">
      {/* Banner de Revisão Amigável para Usuários com Rotina Legada (A18) */}
      {/* Card de Retomada Contextual sem Culpa (T11 / C01) */}
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
        <section className="bg-gradient-to-r from-[#EAF3EF] to-white rounded-2xl p-4.5 border border-[#125F55]/30 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#125F55]">
                  Revisão Semanal de Processo
                </h3>
                <p className="text-xs text-[#152A29] font-medium mt-0.5">
                  {weeklyReview.completedCount} treinos completos · {weeklyReview.expressOrPartialCount} parciais/rápidos · {weeklyReview.externalCount} práticas externas
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#D9F277]/60 text-[#203826] text-[10px] font-bold shrink-0">
              Esforço médio {weeklyReview.averageRpe}/5
            </span>
          </div>

          <div className="text-xs text-[#5B7170] leading-relaxed">
            {weeklyReview.suggestedAction === 'advance' ? (
              <p>Você cumpriu sua meta com folga e sensação leve! Sugerimos avançar para <strong>{weeklyReview.suggestedDaysTarget} dias</strong> na próxima semana.</p>
            ) : weeklyReview.suggestedAction === 'soften' ? (
              <p>A semana foi exigente ou os dias foram corridos. Que tal calibrar a meta para <strong>{weeklyReview.suggestedDaysTarget} dias</strong> para manter o ritmo sem peso?</p>
            ) : (
              <p>Seu ritmo foi equilibrado e constante! Manter a meta de <strong>{weeklyReview.currentTargetDays} dias</strong> consolida seu hábito.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => applyWeeklyReviewDecision(weeklyReview.suggestedAction, weeklyReview.suggestedDaysTarget)}
              className="py-2 px-3.5 bg-[#125F55] text-white rounded-xl text-xs font-bold hover:bg-[#0C5148] cursor-pointer shadow-xs"
            >
              Aceitar recomendação ({weeklyReview.suggestedDaysTarget} dias)
            </button>
            <button
              onClick={() => applyWeeklyReviewDecision('maintain', targetWeeklyGoal)}
              className="py-2 px-3 bg-white border border-[#C9DBD3] text-[#5B7170] rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Manter meta atual
            </button>
          </div>
        </section>
      )}

      {profile.needsReviewPrompt && activeProgram && (
        <section className="bg-[#EAF3EF] rounded-2xl p-4 border border-[#125F55]/30 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#125F55] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-[#152A29]">
              <p className="font-bold">Revisão de Rotina</p>
              <p className="text-[#5B7170] mt-0.5">
                Seu programa atual é <strong>{activeProgram.title}</strong>. Deseja confirmar esta rotina ou personalizar suas preferências?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 pl-6">
            <button
              onClick={confirmLegacyRoutine}
              className="px-3 py-1.5 bg-[#125F55] text-white rounded-lg text-xs font-bold hover:bg-[#0C5148] cursor-pointer"
            >
              Confirmar Rotina
            </button>
            <button
              onClick={() => setShowReviewOnboarding(true)}
              className="px-3 py-1.5 border border-[#C9DBD3] bg-white text-[#5B7170] rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Personalizar Perfil
            </button>
          </div>
        </section>
      )}

      

      {/* 1. Header de Acolhimento & Trilha Semanal (Direção "Clareza em Movimento") */}
      <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3]/80 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#5B7170] uppercase tracking-wider">
              Superação Diária
            </p>
            <h2 className="text-xl font-bold text-[#152A29] mt-0.5">
              Olá, {profile.displayName || 'Praticante'}!
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#D9F277]/40 rounded-full border border-[#D9F277]">
            <Flame className="w-4 h-4 text-[#125F55]" />
            <span className="text-xs font-bold text-[#203826]">
              {totalPlannedThisWeek > 0
                ? `${completedThisWeek}/${totalPlannedThisWeek} na semana`
                : `${completedThisWeek} sessões feitas`}
            </span>
          </div>
        </div>

        {/* Lembrete Sutil da Âncora e Motivação Pessoal */}
        {(profile.habitAnchor || profile.exerciseReason) && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {profile.habitAnchor && (
              <div className="flex items-center gap-1.5 text-xs text-[#5B7170] bg-[#F5F8F5] px-3 py-1.5 rounded-xl border border-[#C9DBD3]/50">
                <Clock className="w-3.5 h-3.5 text-[#125F55] shrink-0" />
                <span>
                  Sua âncora de rotina: <strong>{profile.habitAnchor}</strong>
                </span>
              </div>
            )}
            {profile.exerciseReason && (
              <div className="flex items-center gap-1.5 text-xs text-[#5B7170] bg-[#EAF3EF]/70 px-3 py-1.5 rounded-xl border border-[#C9DBD3]/50">
                <Heart className="w-3.5 h-3.5 text-[#125F55] shrink-0" />
                <span>
                  Seu porquê: <em>«{profile.exerciseReason}»</em>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Estilo de Incentivo Escolhido (T01 Autonomia) */}
        <div className="pt-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#5B7170]">
            <span>Incentivo:</span>
            <span className="font-bold text-[#125F55] bg-[#EAF3EF] px-2.5 py-0.5 rounded-full border border-[#125F55]/20 flex items-center gap-1">
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
            className="text-[11px] font-bold text-[#125F55] hover:underline cursor-pointer"
          >
            {showStyleSelector ? 'Fechar opções' : 'Mudar estilo'}
          </button>
        </div>

        {/* Menu rápido de estilos de incentivo */}
        {showStyleSelector && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-[#F5F8F5] rounded-2xl border border-[#C9DBD3] animate-in fade-in">
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
                    ? 'bg-[#125F55] text-white'
                    : 'bg-white text-[#152A29] border border-[#C9DBD3] hover:border-[#125F55]'
                }`}
              >
                <span>{st.icon}</span>
                <span className="truncate">{st.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Ritual de Preparação (T06) */}
        <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#C9DBD3]/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#152A29] flex items-center gap-1.5">
              <span>🚪</span>
              <span>Ritual de Preparação</span>
            </span>
            {isRitualDoneToday ? (
              <span className="text-emerald-800 text-[10px] font-bold bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> Preparação Feita
              </span>
            ) : (
              <button
                type="button"
                onClick={completePreparationRitual}
                className="text-[10px] font-bold text-[#125F55] bg-white border border-[#125F55]/30 px-2 py-0.5 rounded-lg hover:bg-[#EAF3EF] cursor-pointer"
              >
                Concluir preparação
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#5B7170] leading-snug">
            {ritual.anchorTrigger}: {ritual.steps.join(' → ')}.
          </p>
        </div>

        {/* Programa Ativo Confirmado (Compacto) */}
        {activeProgram && (
          <div className="bg-[#EAF3EF]/70 p-3 rounded-2xl border border-[#C9DBD3]/70 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-black text-[#125F55] uppercase tracking-wider truncate max-w-[240px]">
                {activeProgram.title}
              </span>
              <button
                onClick={() => onNavigateTab('workouts')}
                className="text-[#125F55] font-bold hover:underline shrink-0 cursor-pointer"
              >
                Ver Programa
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-[#152A29]">
              <span className="font-bold">
                Semana {activeProgram.currentWeek} de {activeProgram.durationWeeks}
              </span>
              <span className="text-[#5B7170] text-[11px]">
                {currentPhase?.name || 'Fase Ativa'}
              </span>
            </div>
          </div>
        )}

        {/* Caminho Pessoal da Semana (Inspirado no Gentler Streak — Descanso não quebra a linha) */}
        <ActivityPath
          variant="compact"
          calendar={calendar}
          sessions={sessions}
          metrics={canonical}
          personalRecords={personalRecords}
          targetWeeklyGoal={targetWeeklyGoal}
          completedThisWeek={completedThisWeek}
          todayDayOfWeek={dayOfWeek}
          onNavigateCalendar={() => onNavigateTab('calendar')}
          onNavigateProgress={() => onNavigateTab('progress')}
        />
      </section>

      {/* 2. CARD CONTEXTUAL DE HOJE (A06: reflete estritamente a atividade agendada) */}
      {activeSession ? (
        <section className="bg-[#125F55] text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold text-white tracking-wide uppercase">
              Treino em Andamento
            </span>
            <h3 className="text-xl font-bold mt-2">{activeSession.planTitle}</h3>
            <p className="text-xs text-white/80 mt-1">
              Exercício {activeSession.currentExerciseIndex + 1} de {activeSession.exercisesSnapshot.length} · Série {activeSession.currentSetIndex}
            </p>

            <button
              onClick={onResumeWorkout}
              className="mt-4 w-full h-14 bg-[#D9F277] text-[#203826] font-bold text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-[#c8e362] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Retomar Treino Agora</span>
            </button>
          </div>
        </section>
      ) : todaySchedule?.activityType === 'walk' ? (
        /* CARD DE CAMINHADA (A06, A15) */
        <section className="bg-gradient-to-br from-[#EAF3EF] to-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#125F55] uppercase tracking-wider">
            <Footprints className="w-4 h-4" />
            <span>Atividade Livre · Caminhada</span>
          </div>
          <h3 className="text-xl font-bold text-[#152A29]">
            {todaySchedule.planTitle || 'Caminhada Confortável & Ar Livre'}
          </h3>
          <p className="text-xs text-[#5B7170] leading-relaxed">
            Estimule o sistema cardiorrespiratório e a circulação no seu próprio ritmo. Registre a duração e a distância opcional sem necessidade de GPS.
          </p>

          <button
            onClick={() => {
              setPracticeModality('caminhada_corrida');
              setShowPracticeModal(true);
            }}
            className="w-full h-14 bg-[#125F55] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0C5148] active:scale-[0.98] transition-all cursor-pointer shadow-md"
          >
            <Footprints className="w-5 h-5" />
            <span>Registrar Caminhada de Hoje</span>
          </button>
        </section>
      ) : todaySchedule?.activityType === 'rest' ? (
        /* CARD DE DESCANSO PLANEJADO & CUIDADO ATIVO (Estratégia A, E e Invariante de Descanso) */
        <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#246747] uppercase tracking-wider">
              <Heart className="w-4 h-4" />
              <span>Dia de Descanso & Regeneração</span>
            </div>
            {todaySchedule.vitalityBonusCompleted && (
              <span className="px-2 py-0.5 rounded-full bg-[#EAF3EF] border border-[#125F55]/30 text-[10px] font-bold text-[#125F55] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Elo Conquistado
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#152A29]">
              O descanso é onde o corpo se regenera
            </h3>
            <p className="text-xs text-[#5B7170] mt-1 leading-relaxed">
              Hoje não há cobrança de treino. Descansar é vencer! Se quiser se movimentar levemente sem cansar os músculos, você pode conquistar um <strong>Elo de Vitalidade</strong> ou registrar uma prática leve:
            </p>
          </div>

          <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recoveryPlan && (
              <button
                onClick={() => onStartWorkout(recoveryPlan, todaySchedule?.id, 'ad_hoc')}
                className="h-12 bg-[#EAF3EF] text-[#125F55] font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#D9F277] hover:text-[#203826] transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Alongamento / Mobilidade (8 min)</span>
              </button>
            )}
            <button
              onClick={() => {
                setPracticeModality('caminhada_corrida');
                setShowPracticeModal(true);
              }}
              className="h-12 bg-[#F5F8F5] text-[#152A29] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-[#C9DBD3] cursor-pointer"
            >
              <Footprints className="w-4 h-4 text-[#125F55]" />
              <span>Caminhada Regenerativa Livre (Registrar Prática)</span>
            </button>
          </div>
        </section>
      ) : todayPlan ? (
        <>
        {/* CARD DE TREINO DE FORÇA PROGRAMADO */}
        <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-[#5B7170]">
            <span className="font-semibold uppercase tracking-wider text-[#125F55]">
              Treino Planejado para Hoje
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {todayPlan.estimatedDurationMinutes} min
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#152A29] leading-tight">
            {todayPlan.title}
          </h3>
          <p className="text-xs text-[#5B7170] line-clamp-2">
            {todayPlan.description}
          </p>

          {/* Foco Adaptativo da Sessão (T01 a T04 / C01 a C09) */}
          {sessionFocus && (
            <div className="bg-[#EAF3EF] border border-[#125F55]/30 rounded-2xl p-3.5 flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">🎯</span>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#125F55] text-white inline-block">
                  {sessionFocus.badgeText}
                </span>
                <h4 className="text-xs font-bold text-[#152A29] mt-1">
                  {sessionFocus.title}
                </h4>
                <p className="text-[11px] text-[#5B7170] mt-0.5 leading-relaxed">
                  {sessionFocus.description}
                </p>
              </div>
            </div>
          )}

          <div className="bg-[#F5F8F5] p-3 rounded-2xl space-y-1.5 text-xs text-[#152A29]">
            {todayPlan.exercises.slice(0, 3).map((ex, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-medium truncate max-w-[200px]">{ex.exerciseName}</span>
                <span className="text-[#5B7170] text-[11px] tabular-nums">
                  {ex.targetSets}x {ex.targetReps > 0 ? `${ex.targetReps} reps` : `${ex.targetDurationSeconds}s`}
                </span>
              </div>
            ))}
            {todayPlan.exercises.length > 3 && (
              <p className="text-[11px] text-[#5B7170] pt-1">
                + {todayPlan.exercises.length - 3} outros exercícios
              </p>
            )}
          </div>

          {/* Ação rápida para imprevisto (Se-Então T07) */}
          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={() => setShowCopingModal(true)}
              className="text-[11px] text-[#125F55] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Surgiu um imprevisto hoje? (Se-Então)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPracticeModality('forca_academia');
                setShowPracticeModal(true);
              }}
              className="text-[11px] text-[#5B7170] hover:text-[#125F55] cursor-pointer"
            >
              Fiz sem o celular
            </button>
          </div>

          <button
            onClick={() => onStartWorkout(todayPlan, todaySchedule?.id, 'scheduled')}
            className="w-full h-14 bg-[#125F55] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0C5148] active:scale-[0.98] transition-all cursor-pointer shadow-md"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Iniciar Treino de Hoje</span>
          </button>
        </section>

        {/* ROTINAS COMPLEMENTARES INTERCALADAS DO DIA */}
        {todaySchedule?.additionalActivities && todaySchedule.additionalActivities.length > 0 && (
          <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-[#5B7170]">
              <span className="font-semibold uppercase tracking-wider text-[#125F55] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
                <span>Rotinas Intercaladas de Hoje</span>
              </span>
              <span className="text-[11px] font-bold text-[#125F55]">
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
                      act.isCompleted ? 'bg-[#EAF3EF]/60 border-[#246747]/40' : 'bg-[#F5F8F5] border-[#C9DBD3]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#C9DBD3] text-[#125F55]">
                          {timeBadge}
                        </span>
                        {act.isCompleted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D9F277]/60 text-[#203826]">
                            ✓ Concluído
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[#152A29]">{act.planTitle}</h4>
                      {act.programTitle && (
                        <p className="text-[11px] text-[#5B7170]">Programa: {act.programTitle}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {extraPlan && !act.isCompleted && (
                        <button
                          type="button"
                          onClick={() => onStartWorkout(extraPlan, todaySchedule.id, 'scheduled', false, true, act.id)}
                          className="w-full sm:w-auto px-4 py-2 bg-[#125F55] hover:bg-[#0C5148] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Iniciar Agora</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleDayActivityCompleted(todaySchedule.id, act.id)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          act.isCompleted ? 'text-[#246747] bg-emerald-50' : 'text-[#5B7170] hover:text-[#125F55]'
                        }`}
                        title={act.isCompleted ? 'Desmarcar' : 'Marcar como concluído'}
                      >
                        {act.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        </>
      ) : (
        /* CONTA VAZIA / SEM PROGRAMA ATIVO: 3 ORIGENS CLARAS (A01, A02) */
        <section className="bg-white rounded-3xl p-6 border border-[#C9DBD3] text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF3EF] flex items-center justify-center mx-auto text-[#125F55]">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#152A29]">
              Como você deseja começar?
            </h3>
            <p className="text-xs text-[#5B7170] mt-1 max-w-sm mx-auto">
              Nenhuma rotina foi pré-imposta. Escolha uma das 3 origens para organizar sua rotina no seu ritmo.
            </p>
          </div>

          {onReviewProposal && (
            <div className="p-4 rounded-2xl bg-[#EAF3EF] border border-[#125F55]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div>
                <span className="text-xs font-bold text-[#125F55] block">
                  Proposta Baseada nas suas Respostas
                </span>
                <span className="text-[11px] text-[#5B7170]">
                  Revise a rotina calibrada para seus dias e apoios.
                </span>
              </div>
              <button
                onClick={onReviewProposal}
                className="w-full sm:w-auto px-4 py-2 bg-[#125F55] text-white text-xs font-bold rounded-xl hover:bg-[#0C5148] transition-all cursor-pointer shrink-0"
              >
                Ver Proposta
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-left">
            <button
              onClick={() => {
                if (onOpenBuilder) onOpenBuilder();
                else onNavigateTab('workouts');
              }}
              className="p-3.5 rounded-2xl border border-[#C9DBD3] hover:border-[#125F55] bg-[#F5F8F5] transition-all cursor-pointer group"
            >
              <Plus className="w-5 h-5 text-[#125F55] mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-[#152A29]">Montar meu Treino</div>
              <div className="text-[10px] text-[#5B7170] mt-0.5 leading-snug">
                Escolha exercícios do catálogo e ajuste séries livres.
              </div>
            </button>

            <button
              onClick={() => onNavigateTab('workouts')}
              className="p-3.5 rounded-2xl border border-[#125F55]/40 bg-[#EAF3EF] transition-all cursor-pointer group"
            >
              <Compass className="w-5 h-5 text-[#125F55] mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-[#125F55]">Modelos Demonstrativos</div>
              <div className="text-[10px] text-[#5B7170] mt-0.5 leading-snug">
                Fichas demonstrativas para casa ou academia.
              </div>
            </button>

            <button
              onClick={() => {
                if (onOpenBuilder) onOpenBuilder(undefined, true);
                else onNavigateTab('workouts');
              }}
              className="p-3.5 rounded-2xl border border-[#C9DBD3] hover:border-[#125F55] bg-[#F5F8F5] transition-all cursor-pointer group"
            >
              <FileCheck2 className="w-5 h-5 text-[#125F55] mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-[#152A29]">Plano de Profissional</div>
              <div className="text-[10px] text-[#5B7170] mt-0.5 leading-snug">
                Cadastre o treino do seu personal ou fisioterapeuta.
              </div>
            </button>
          </div>
        </section>
      )}

      {/* 3. OPÇÃO RÁPIDA (5 MINUTOS) - Respeitosa e acolhedora (A08, A24) */}
      {!activeSession && (
        <section className="bg-[#EAF3EF]/60 rounded-2xl p-4 border border-[#C9DBD3]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-[#125F55] flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
              Pouco tempo hoje? Opção rápida (5 a 10 min)
            </h4>
            <p className="text-[11px] text-[#5B7170]">
              2 movimentos essenciais em <strong>5 minutos</strong>. Mesmo em dias corridos, movimentar o corpo com calma faz bem.
            </p>
          </div>
          <button
            onClick={startEmergencyWorkout}
            className="px-4 py-2.5 bg-[#125F55] hover:bg-[#0C5148] text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <span>Opção Rápida (5 min)</span>
          </button>
        </section>
      )}

      {/* Espelho de Bem-Estar (Estratégia D: Termômetro Antes vs Depois) */}
      {wellbeingInsight && (
        <section className="bg-gradient-to-r from-[#D9F277]/25 via-[#EAF3EF] to-white rounded-3xl p-4.5 border border-[#C9DBD3]/80 flex items-start gap-3.5 animate-in fade-in">
          <div className="w-9 h-9 rounded-2xl bg-[#125F55] text-white flex items-center justify-center shrink-0 text-base shadow-xs">
            ✨
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-extrabold text-[#125F55] uppercase tracking-wider block">
              Espelho de Bem-Estar & Sensação
            </span>
            <p className="text-xs text-[#152A29] mt-0.5 leading-relaxed font-medium">
              {wellbeingInsight.message}
            </p>
          </div>
        </section>
      )}

      {/* Pílula de Sabedoria do Coach IA */}
      <AICoachCard context={coachContext} />

      {/* Convite Discreto de Instalação do App (Movido para depois da ação do dia para não competir com o foco principal) */}
      {!isInstallBannerDismissed && (
        <PWAInstallButton
          variant="banner"
          onDismissBanner={() => setIsInstallBannerDismissed(true)}
        />
      )}

      {/* 4. Vitrine de Recordes Pessoais (PRs Recentes) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#152A29] flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#125F55]" />
            Suas Superações & Recordes
          </h3>
          <button
            onClick={() => onNavigateTab('progress')}
            className="text-xs text-[#125F55] font-semibold hover:underline cursor-pointer"
          >
            Ver todos
          </button>
        </div>

        {personalRecords.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {personalRecords.slice(0, 4).map((pr) => (
              <div
                key={pr.exerciseId}
                className="bg-white p-3.5 rounded-2xl border border-[#C9DBD3] shadow-xs flex flex-col justify-between"
              >
                <p className="text-xs font-semibold text-[#152A29] truncate">{pr.exerciseName}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#125F55] tabular-nums">
                    {pr.bestWeightKg && pr.bestWeightKg > 0
                      ? `${pr.bestWeightKg} kg`
                      : pr.bestReps > 0
                      ? pr.bestReps
                      : pr.bestDurationSeconds}
                  </span>
                  <span className="text-[10px] text-[#5B7170]">
                    {pr.bestWeightKg && pr.bestWeightKg > 0
                      ? `(${pr.bestReps} reps)`
                      : pr.bestReps > 0
                      ? 'reps'
                      : 'segundos'}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-medium">
                  {pr.isBaseline ? (
                    <span className="text-[#5B7170] flex items-center gap-1">
                      <Target className="w-3 h-3 text-[#5B7170]" />
                      Marca Base (Referência)
                    </span>
                  ) : (
                    <span className="text-[#125F55] flex items-center gap-1 font-bold">
                      <Sparkles className="w-3 h-3 text-[#125F55]" />
                      Recorde Pessoal (PR{pr.prCount && pr.prCount > 1 ? ` #${pr.prCount}` : ''})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-4 rounded-2xl border border-[#C9DBD3] text-center text-xs text-[#5B7170]">
            Complete sua primeira série para registrar seu primeiro marco pessoal!
          </div>
        )}
      </section>

      {/* MODAL UNIVERSAL DE REGISTRO DE PRÁTICA REALIZADA (T04) */}
      {showPracticeModal && (
        <div
          onClick={() => setShowPracticeModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#C9DBD3] text-[#152A29] space-y-4 cursor-default animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#C9DBD3]/40">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-[#125F55]" />
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-[#152A29]">
                    {practiceModality === 'caminhada_corrida' ? 'Registrar Caminhada' : 'Registrar Prática Realizada'}
                  </h3>
                  <span className="text-[10px] text-[#5B7170]">
                    {practiceModality === 'caminhada_corrida' ? 'Registrar Prática Realizada' : 'Atividade Externa'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowPracticeModal(false)}
                className="p-1 rounded-full text-[#5B7170] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5B7170]">
              Registre atividades feitas ao ar livre, na academia ou fora do celular para honrar seu compromisso semanal.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#152A29] mb-1.5">
                  Modalidade:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'caminhada_corrida' as const, label: 'Caminhada / Corrida', icon: '🚶' },
                    { id: 'forca_academia' as const, label: 'Força / Academia', icon: '🏋️' },
                    { id: 'mobilidade_yoga' as const, label: 'Mobilidade / Yoga', icon: '🧘' },
                    { id: 'esporte_coletivo' as const, label: 'Esporte / Aula', icon: '⚽' },
                    { id: 'ciclismo_natacao' as const, label: 'Ciclismo / Natação', icon: '🚴' },
                    { id: 'outra' as const, label: 'Outra Atividade', icon: '🏃' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPracticeModality(m.id)}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        practiceModality === m.id
                          ? 'bg-[#125F55] text-white shadow-xs'
                          : 'bg-[#F5F8F5] text-[#152A29] border border-[#C9DBD3] hover:border-[#125F55]'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span className="truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="practice_duration_input" className="block text-[11px] font-bold text-[#152A29] mb-1">
                  Duração (minutos):
                </label>
                <input
                  id={practiceModality === 'caminhada_corrida' ? 'walk_duration_input' : 'practice_duration_input'}
                  data-testid="practice_duration_input"
                  type="number"
                  min="5"
                  max="300"
                  value={practiceDuration}
                  onChange={(e) => setPracticeDuration(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-10 px-3 rounded-xl border border-[#C9DBD3] text-xs font-bold text-[#152A29]"
                />
              </div>

              {(practiceModality === 'caminhada_corrida' || practiceModality === 'ciclismo_natacao') && (
                <div>
                  <label className="block text-[11px] font-bold text-[#152A29] mb-1">
                    Distância em km (opcional):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ex: 3.2"
                    value={practiceDistanceKm}
                    onChange={(e) => setPracticeDistanceKm(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#C9DBD3] text-xs text-[#152A29]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#152A29] mb-1">
                  Esforço percebido (1 a 5):
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setPracticeEffort(score)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        practiceEffort === score
                          ? 'bg-[#125F55] text-white'
                          : 'bg-[#F5F8F5] text-[#5B7170] border border-[#C9DBD3]'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#152A29] mb-1">
                  Sensação ao terminar:
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'renovado' as const, label: 'Energia', icon: '✨' },
                    { id: 'leve' as const, label: 'Mais leve', icon: '🌿' },
                    { id: 'orgulhoso' as const, label: 'Cumprido', icon: '🏅' },
                    { id: 'cansado_bem' as const, label: 'Cansado e bem', icon: '💪' },
                    { id: 'neutro' as const, label: 'Neutro', icon: '🙂' },
                    { id: 'esgotado' as const, label: 'Exausto', icon: '🥱' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPracticeMood(m.id)}
                      className={`py-1 px-1 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        practiceMood === m.id
                          ? 'bg-[#125F55] text-white'
                          : 'bg-[#F5F8F5] text-[#5B7170] border border-[#C9DBD3]'
                      }`}
                    >
                      <span>{m.icon}</span>
                      <span className="truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#152A29] mb-1">
                  Notas sobre a prática (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Treino no parque, ritmo tranquilo..."
                  value={practiceNotes}
                  onChange={(e) => setPracticeNotes(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#C9DBD3] text-xs text-[#152A29]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPracticeModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#C9DBD3] text-[#5B7170] text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePractice}
                className="px-5 py-2.5 rounded-xl bg-[#125F55] text-white text-xs font-bold hover:bg-[#0C5148] cursor-pointer shadow-sm"
              >
                Confirmar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PLANOS SE-ENTÃO PARA OBSTÁCULOS (T07) */}
      {showCopingModal && (
        <div
          onClick={() => setShowCopingModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#C9DBD3] text-[#152A29] space-y-4 cursor-default animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#C9DBD3]/40">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#E07A5F]" />
                <h3 className="text-sm font-bold text-[#152A29]">Respostas Rápidas Se-Então</h3>
              </div>
              <button
                onClick={() => setShowCopingModal(false)}
                className="p-1 rounded-full text-[#5B7170] hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5B7170]">
              Imprevistos fazem parte da vida real. Escolha um caminho de continuidade flexível para manter sua constância sem culpa:
            </p>

            <div className="space-y-2 pt-1">
              {copingPlans.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-[#C9DBD3] bg-[#F5F8F5] space-y-2"
                >
                  <p className="text-[11px] font-bold text-[#125F55]">
                    {rule.ifTriggerLabel}
                  </p>
                  <p className="text-xs text-[#152A29]">
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
                        className="w-full py-2 px-3 bg-[#125F55] text-white rounded-xl text-xs font-bold hover:bg-[#0C5148] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
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
                          const softened = createGentleReturnPlanSnapshot(todayPlan);
                          onStartWorkout(softened, todaySchedule?.id, 'scheduled');
                        }}
                        className="w-full py-2 px-3 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
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
                        className="w-full py-2 px-3 bg-[#EAF3EF] border border-[#125F55]/30 text-[#125F55] rounded-xl text-xs font-bold hover:bg-[#D9F277]/40 flex items-center justify-center gap-1.5 cursor-pointer"
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
                        className="w-full py-2 px-3 bg-white border border-[#C9DBD3] text-[#5B7170] rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
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
                        className="w-full py-2 px-3 bg-[#FAF7F2] border border-[#C9DBD3] text-[#152A29] rounded-xl text-xs font-bold hover:bg-white flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-700" />
                        <span>Concluir apenas o Ritual de 2 passos</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCopingModal(false)}
              className="w-full py-2.5 rounded-xl border border-[#C9DBD3] text-[#5B7170] text-xs font-semibold hover:bg-slate-50 cursor-pointer"
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
