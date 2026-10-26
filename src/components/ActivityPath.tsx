import React from 'react';
import {
  CheckCircle2,
  Heart,
  Sparkles,
  Footprints,
  Flag,
  Compass,
  ChevronRight,
  Trophy,
  Target,
} from 'lucide-react';
import { CalendarDay, CanonicalMetrics, PersonalRecord, WorkoutSession } from '../types';

export interface ActivityPathProps {
  variant?: 'compact' | 'full';
  calendar: CalendarDay[];
  sessions?: WorkoutSession[];
  metrics?: CanonicalMetrics;
  personalRecords?: PersonalRecord[];
  targetWeeklyGoal: number;
  completedThisWeek: number;
  todayDayOfWeek: number;
  onNavigateCalendar?: () => void;
  onNavigateProgress?: () => void;
}

interface JourneyChapter {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  isCompleted: boolean;
  isCurrent: boolean;
  progressText: string;
}

export const ActivityPath: React.FC<ActivityPathProps> = ({
  variant = 'compact',
  calendar,
  sessions = [],
  metrics,
  personalRecords = [],
  targetWeeklyGoal,
  completedThisWeek,
  todayDayOfWeek,
  onNavigateCalendar,
  onNavigateProgress,
}) => {
  const daysShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const daysFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Determina mensagem gentil do ritmo atual (inspirado no Gentler Streak)
  const todayItem = calendar.find((c) => c.dayOfWeek === todayDayOfWeek);
  const isTodayRest = todayItem?.activityType === 'rest';
  const isTodayDone = Boolean(todayItem?.isCompleted || todayItem?.vitalityBonusCompleted);

  const getRhythmStatus = () => {
    if (completedThisWeek >= targetWeeklyGoal && targetWeeklyGoal > 0) {
      return {
        badge: 'Meta semanal alcançada',
        message: 'Você honrou seu ritmo planejado nesta semana. Qualquer movimento extra ou descanso é ganho.',
        tone: 'bg-[#D9F277]/45 text-[#203826] border-[#125F55]/20',
      };
    }
    if (isTodayDone) {
      return {
        badge: 'Passo de hoje concluído',
        message: 'Seu percurso segue ativo e consistente. Aproveite o restante do dia para recuperar.',
        tone: 'bg-[#EAF3EF] text-[#125F55] border-[#125F55]/25',
      };
    }
    if (isTodayRest) {
      return {
        badge: 'Dia de regeneração',
        message: 'Descansar faz parte do caminho. Seu percurso nunca quebra em dias de pausa.',
        tone: 'bg-[#EAF3EF]/80 text-[#246747] border-[#C9DBD3]',
      };
    }
    if (completedThisWeek > 0) {
      return {
        badge: 'Ritmo em construção',
        message: `${completedThisWeek} de ${targetWeeklyGoal} ${targetWeeklyGoal === 1 ? 'prática realizada' : 'práticas realizadas'} na semana. Continue no seu tempo.`,
        tone: 'bg-[#EAF3EF] text-[#125F55] border-[#C9DBD3]',
      };
    }
    return {
      badge: 'Caminho aberto',
      message: 'Comece com a sessão planejada ou até 5 minutos leves para inaugurar sua semana.',
      tone: 'bg-[#F5F8F5] text-[#152A29] border-[#C9DBD3]',
    };
  };

  const rhythm = getRhythmStatus();

  // Capítulos da jornada pessoal para a visão completa (ProgressView)
  const totalCompleted = metrics?.completedWorkoutsCount ?? sessions.filter((s) => s.status === 'completed').length;
  const totalPartials = metrics?.partialWorkoutsCount ?? sessions.filter((s) => s.status === 'parcial').length;
  const totalCare = (metrics?.careSessionsCount ?? 0) + (metrics?.weeklyVitalityLinksCount ?? 0);
  const hasRealPR = personalRecords.some((p) => !p.isBaseline && (p.prCount || 0) > 0);
  const hasBaseline = personalRecords.length > 0 || (metrics?.baselineMarksCount ?? 0) > 0;
  const hasExpressOrAdaptive =
    totalPartials > 0 ||
    totalCare > 0 ||
    sessions.some((s) => s.isExpress || s.wasPlannedHabit || s.durationSeconds <= 900);

  const rawChapters = [
    {
      id: 'cap_1',
      stepNumber: 1,
      title: 'Capítulo 1 · Primeiro Passo',
      subtitle: 'Romper a inércia inicial e registrar sua primeira prática ou marca base.',
      done: totalCompleted >= 1 || totalPartials >= 1 || hasBaseline,
      progressText:
        totalCompleted >= 1 || totalPartials >= 1
          ? 'Inércia vencida com sucesso'
          : 'Conclua 1 sessão (mesmo de 5 min) para abrir o caminho',
    },
    {
      id: 'cap_2',
      stepNumber: 2,
      title: 'Capítulo 2 · Ritmo Possível',
      subtitle: `Construir regularidade respeitando sua janela de ${targetWeeklyGoal} ${targetWeeklyGoal === 1 ? 'dia' : 'dias'} e seus descansos.`,
      done: completedThisWeek >= targetWeeklyGoal || totalCompleted >= 2,
      progressText: `${Math.min(completedThisWeek, targetWeeklyGoal)}/${targetWeeklyGoal} na semana atual`,
    },
    {
      id: 'cap_3',
      stepNumber: 3,
      title: 'Capítulo 3 · Constância Flexível',
      subtitle: 'Adaptar a rotina em dias corridos com treino curto, sessão parcial ou recuperação ativa.',
      done: totalCompleted >= 2 && hasExpressOrAdaptive,
      progressText: hasExpressOrAdaptive
        ? 'Adaptação e cuidado integrados à rotina'
        : 'Use uma versão curta, parcial ou cuidado ativo quando precisar',
    },
    {
      id: 'cap_4',
      stepNumber: 4,
      title: 'Capítulo 4 · Superação Pessoal',
      subtitle: 'Superar uma marca de referência anterior no seu próprio tempo, sem pressa.',
      done: hasRealPR,
      progressText: hasRealPR
        ? `${metrics?.prsAchievedCount || 1} recorde(s) pessoal(is) conquistado(s)`
        : hasBaseline
        ? 'Marcas base prontas para futura evolução'
        : 'Estabeleça primeiro suas marcas base',
    },
  ];

  const firstPendingIdx = rawChapters.findIndex((c) => !c.done);
  const chapters: JourneyChapter[] = rawChapters.map((c, idx) => ({
    id: c.id,
    stepNumber: c.stepNumber,
    title: c.title,
    subtitle: c.subtitle,
    isCompleted: c.done,
    isCurrent: firstPendingIdx === -1 ? idx === rawChapters.length - 1 : idx === firstPendingIdx,
    progressText: c.progressText,
  }));

  const activeChapter = chapters.find((c) => c.isCurrent) || chapters[0];

  if (variant === 'compact') {
    return (
      <div
        role="region"
        aria-label="Caminho da sua semana"
        className="pt-3 border-t border-[#C9DBD3]/40 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${rhythm.tone}`}>
              {rhythm.badge}
            </span>
          </div>
          {onNavigateCalendar && (
            <button
              type="button"
              onClick={onNavigateCalendar}
              className="text-xs text-[#125F55] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
            >
              <span>Ver agenda</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Trilha Conectada da Semana (Activity Path Compacto) */}
        <div className="relative px-1 py-1.5">
          {/* Linha orgânica contínua ao fundo (nunca quebra no descanso) */}
          <div
            aria-hidden="true"
            className="absolute left-5 right-5 top-[22px] h-1 rounded-full bg-gradient-to-r from-[#EAF3EF] via-[#C9DBD3]/70 to-[#EAF3EF]"
          />

          <div className="relative z-10 grid grid-cols-7 gap-1">
            {calendar.map((cDay, idx) => {
              const isToday = cDay.dayOfWeek === todayDayOfWeek;
              const isDone = cDay.isCompleted;
              const isRest = cDay.activityType === 'rest';
              const isWalk = cDay.activityType === 'walk';
              const isVitality = Boolean(
                cDay.vitalityBonusCompleted || (isRest && (cDay.careMinutes || 0) > 0)
              );

              const stateLabel = isDone
                ? 'Concluído'
                : isVitality
                ? 'Elo de Vitalidade'
                : isRest
                ? 'Descanso planejado'
                : isWalk
                ? 'Caminhada planejada'
                : 'Prática planejada';

              return (
                <div
                  key={cDay.id || idx}
                  aria-label={`${daysFull[cDay.dayOfWeek]}: ${stateLabel}${isToday ? ' (Hoje)' : ''}`}
                  className="flex flex-col items-center text-center"
                >
                  {/* Nó do Caminho */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isDone
                        ? 'bg-[#125F55] text-white shadow-xs'
                        : isVitality
                        ? 'bg-[#D9F277] text-[#203826] border border-[#125F55]/30 shadow-2xs'
                        : isToday
                        ? 'bg-white text-[#125F55] border-2 border-[#125F55] ring-4 ring-[#125F55]/15 font-black'
                        : isRest
                        ? 'bg-[#EAF3EF] text-[#246747] border border-[#C9DBD3]/80'
                        : 'bg-white text-[#5B7170] border border-[#C9DBD3]'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isVitality ? (
                      <Sparkles className="w-3.5 h-3.5" />
                    ) : isRest ? (
                      <Heart className="w-3.5 h-3.5 opacity-80" />
                    ) : isWalk ? (
                      <Footprints className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[11px] font-bold">{daysShort[cDay.dayOfWeek]}</span>
                    )}
                  </div>

                  {/* Legenda do Dia */}
                  <span
                    className={`mt-1 text-[10px] leading-tight ${
                      isToday ? 'font-black text-[#125F55]' : 'font-semibold text-[#5B7170]'
                    }`}
                  >
                    {isToday ? 'Hoje' : daysShort[cDay.dayOfWeek]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-[#5B7170] leading-relaxed">{rhythm.message}</p>
      </div>
    );
  }

  // VARIANT = 'full' (Para a ProgressView: Caminho Pessoal por Capítulos + Próximo Marco Alcançável)
  return (
    <section
      role="region"
      aria-label="Caminho Pessoal de Progresso"
      className="bg-white rounded-3xl p-5 border border-[#C9DBD3]/80 shadow-xs space-y-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#125F55] uppercase tracking-wider">
            <Compass className="w-4 h-4 text-[#125F55]" />
            <span>Seu Caminho Pessoal</span>
          </div>
          <h3 className="text-lg font-bold text-[#152A29]">
            Constância no seu ritmo, sem quebrar após pausas
          </h3>
          <p className="text-xs text-[#5B7170] leading-relaxed">
            Treinos completos, sessões parciais e dias de descanso regenerativo somam na mesma estrada.
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 ${rhythm.tone}`}>
          {rhythm.badge}
        </span>
      </div>

      {/* Destaque do Próximo Marco Alcançável (Evita sensação de vazio inicial) */}
      <div className="p-4 rounded-2xl bg-[#EAF3EF]/75 border border-[#125F55]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#125F55] text-[#D9F277] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Flag className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#125F55] block">
              Etapa Atual & Próximo Marco Alcançável
            </span>
            <h4 className="text-sm font-bold text-[#152A29]">{activeChapter.title}</h4>
            <p className="text-xs text-[#5B7170] leading-relaxed">{activeChapter.subtitle}</p>
          </div>
        </div>
        <div className="sm:text-right shrink-0">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#C9DBD3] text-xs font-bold text-[#125F55]">
            <Target className="w-3.5 h-3.5" />
            <span>{activeChapter.progressText}</span>
          </span>
        </div>
      </div>

      {/* Trilha Visual de Capítulos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {chapters.map((chap) => (
          <div
            key={chap.id}
            className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
              chap.isCompleted
                ? 'bg-[#EAF3EF]/60 border-[#125F55]/35 text-[#152A29]'
                : chap.isCurrent
                ? 'bg-white border-2 border-[#125F55] text-[#152A29] shadow-xs'
                : 'bg-[#F5F8F5]/70 border-[#C9DBD3]/60 text-[#5B7170]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
                  chap.isCompleted
                    ? 'bg-[#125F55] text-white'
                    : chap.isCurrent
                    ? 'bg-[#D9F277] text-[#203826]'
                    : 'bg-white border border-[#C9DBD3] text-[#5B7170]'
                }`}
              >
                {chap.isCompleted ? '✓' : chap.stepNumber}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#125F55]">
                {chap.isCompleted ? 'Vivenciado' : chap.isCurrent ? 'Em curso' : 'Adiante'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#152A29] leading-snug">
                {chap.title.replace(/^Capítulo \d+ · /, '')}
              </p>
              <p className="text-[11px] text-[#5B7170] mt-0.5 line-clamp-2 leading-snug">
                {chap.progressText}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
