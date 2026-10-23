import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { calculateCanonicalMetrics } from '../lib/storage';
import {
  Trophy,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Dumbbell,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ProgressView: React.FC = () => {
  const {
    personalRecords,
    sessions,
    setEvents,
    calendar,
    exportBackup,
  } = useWorkout();

  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Métricas canônicas unificadas (E03 / Seção 5 / T18)
  const metrics = calculateCanonicalMetrics(sessions, calendar, personalRecords);
  const totalReps = setEvents.reduce((acc, curr) => acc + (curr.actualReps || 0), 0);
  const totalVolumeKg = metrics.totalVolumeKg;
  const recoveryDaysCompleted = calendar.filter((c) => c.activityType === 'active_recovery' && c.isCompleted).length;
  const { profile } = useAuth();
  const targetWeeklyGoal = metrics.weeklyCommittedCount > 0 ? metrics.weeklyCommittedCount : (profile?.availableDays?.length || 3);
  const completedThisWeek = metrics.weeklyCompletedCount;

  // Regras estritas e auditáveis de conquistas (E01, E02, Seção 5)
  const badges = [
    {
      id: 'primeiro_passo',
      title: 'Primeiro Passo',
      desc: 'Romper a inércia e concluir o 1º treino',
      isUnlocked: metrics.completedWorkoutsCount >= 1,
      icon: '🌱',
    },
    {
      id: 'guardiao_habito',
      title: 'Constância Flexível',
      desc: 'Praticar uma versão rápida de 5 a 15 min em dias corridos',
      // E02: Apenas treinos planejados express/hábito concluídos (não sessões normais abortadas em 1 min)
      isUnlocked: sessions.some(
        (s) =>
          s.status === 'completed' &&
          (s.isExpress ||
            s.wasPlannedHabit ||
            s.planId.includes('habito') ||
            s.planId.includes('express') ||
            s.planId.includes('emergencia') ||
            s.planId.includes('walk') ||
            (s.durationSeconds <= 900 && s.totalSetsCompleted >= s.totalSetsPlanned))
      ),
      icon: '⚡',
    },
    {
      id: 'superacao_limites',
      title: 'Superação de Limites',
      desc: 'Bater o primeiro Recorde Pessoal (PR) real',
      // E01: Primeira execução registra linha de base; só desbloqueia com evolução real
      isUnlocked: personalRecords.some((p) => !p.isBaseline && (p.prCount || 0) > 0),
      icon: '🏆',
    },
        {
      id: 'consistencia_ferro',
      title: 'Consistência Semanal',
      desc: `Concluir sua meta semanal de ${targetWeeklyGoal} ${targetWeeklyGoal === 1 ? 'treino' : 'treinos'}`,
      isUnlocked: completedThisWeek >= targetWeeklyGoal,
      icon: '🛡️',
    },
    {
      id: 'coluna_postura',
      title: 'Cuidado & Postura',
      desc: 'Cumprir uma sessão de mobilidade/alongamento',
      isUnlocked: recoveryDaysCompleted >= 1,
      icon: '🧘',
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header de Progresso */}
      <div className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#125F55] uppercase tracking-wider">
          <Trophy className="w-4 h-4 text-[#125F55]" />
          <span>Sua Jornada de Superação</span>
        </div>
        <h2 className="text-xl font-bold text-[#152A29]">Recordes & Evolução</h2>
        <p className="text-xs text-[#5B7170] leading-relaxed">
          Cada repetição registrada e cada dia de recuperação cumprido constroem a sua versão mais forte e consistente.
        </p>
      </div>

      {/* Cartões de Indicadores Gerais (E03 / Seção 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-[#C9DBD3] shadow-xs text-center">
          <span className="text-[10px] text-[#5B7170] font-medium block">Treinos Concluídos</span>
          <span className="text-xl font-black text-[#125F55] tabular-nums mt-0.5 block">
            {metrics.completedWorkoutsCount}
          </span>
          {metrics.partialWorkoutsCount > 0 && (
            <span className="text-[9px] text-[#5B7170] block font-normal">
              + {metrics.partialWorkoutsCount} {metrics.partialWorkoutsCount === 1 ? 'parcial' : 'parciais'}
            </span>
          )}
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#C9DBD3] shadow-xs text-center">
          <span className="text-[10px] text-[#5B7170] font-medium block">Recordes Reais (PRs)</span>
          <span className="text-xl font-black text-[#246747] tabular-nums mt-0.5 block">
            {metrics.realPRCount}
          </span>
          {personalRecords.length > metrics.realPRCount && (
            <span className="text-[9px] text-[#5B7170] block font-normal">
              {personalRecords.length - metrics.realPRCount}{' '}
              {personalRecords.length - metrics.realPRCount === 1 ? 'marca inicial' : 'marcas iniciais'}
            </span>
          )}
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#C9DBD3] shadow-xs text-center">
          <span className="text-[10px] text-[#5B7170] font-medium block">Repetições Totais</span>
          <span className="text-xl font-black text-[#125F55] tabular-nums mt-0.5 block">
            {totalReps}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#C9DBD3] shadow-xs text-center">
          <span className="text-[10px] text-[#5B7170] font-medium block">
            {totalVolumeKg > 0 ? 'Volume Total (kg)' : 'Recuperações'}
          </span>
          <span className="text-xl font-black text-[#203826] tabular-nums mt-0.5 block">
            {totalVolumeKg > 0 ? totalVolumeKg.toLocaleString('pt-BR') : recoveryDaysCompleted}
          </span>
        </div>
      </div>

      {/* Seção de Medalhas de Superação & Conquistas */}
      <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#152A29] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#E07A5F]" />
            Medalhas de Superação ({badges.filter((b) => b.isUnlocked).length}/{badges.length})
          </h3>
          <span className="text-[11px] text-[#125F55] font-bold">
            {Math.round((badges.filter((b) => b.isUnlocked).length / badges.length) * 100)}% conquistado
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                b.isUnlocked
                  ? 'bg-[#EAF3EF]/80 border-[#125F55]/40 text-[#152A29]'
                  : 'bg-[#F5F8F5] border-[#C9DBD3]/60 opacity-60'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-[#C9DBD3] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                {b.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-[#152A29]">{b.title}</p>
                  {b.isUnlocked && (
                    <span className="text-[9px] font-black text-[#125F55] uppercase bg-[#D9F277]/50 px-1.5 py-0.2 rounded-md">
                      Conquistado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5B7170] truncate">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Galeria de Recordes Pessoais (PRs) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#152A29] flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-[#125F55]" />
            Seus Recordes & Marcas Pessoais ({personalRecords.length})
          </h3>
        </div>

        {personalRecords.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-[#C9DBD3] text-center text-xs text-[#5B7170]">
            Nenhum registro ainda. Inicie seu primeiro treino para estabelecer sua marca inicial de referência!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {personalRecords.map((pr) => {
              const isRealPR = !pr.isBaseline && (pr.prCount || 0) > 0;
              return (
                <div
                  key={pr.exerciseId}
                  className="bg-white p-4 rounded-2xl border border-[#C9DBD3] shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-[#152A29] truncate">{pr.exerciseName}</h4>
                      {isRealPR ? (
                        <span className="text-[9px] font-black text-[#125F55] uppercase bg-[#D9F277] px-1.5 py-0.2 rounded-md">
                          PR #{pr.prCount}
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-[#5B7170] uppercase bg-[#F5F8F5] border border-[#C9DBD3] px-1.5 py-0.2 rounded-md">
                          Base
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#5B7170] mt-0.5">
                      {isRealPR ? 'Superado' : 'Registrado'} em {new Date(pr.recordedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-black tabular-nums shadow-2xs ${
                        isRealPR ? 'bg-[#D9F277] text-[#203826]' : 'bg-[#EAF3EF] text-[#125F55]'
                      }`}
                    >
                      {pr.bestReps > 0 ? `${pr.bestReps} reps` : `${pr.bestDurationSeconds}s`}
                      {pr.bestWeightKg && pr.bestWeightKg > 0 ? ` · ${pr.bestWeightKg} kg` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Histórico Recente de Treinos */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#152A29] flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#125F55]" />
          Histórico de Sessões ({sessions.length})
        </h3>

        {sessions.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-[#C9DBD3] text-center text-xs text-[#5B7170]">
            Nenhuma sessão gravada até o momento.
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessions.map((sess) => {
              const isExpanded = expandedSessionId === sess.id;
              const relatedSets = setEvents.filter((ev) => ev.sessionId === sess.id);

              return (
                <div
                  key={sess.id}
                  className="bg-white rounded-2xl border border-[#C9DBD3] p-4 shadow-xs space-y-2.5"
                >
                  <div
                    onClick={() => setExpandedSessionId(isExpanded ? null : sess.id)}
                    className="flex items-start justify-between cursor-pointer"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-[#152A29]">{sess.planTitle}</h4>
                      <p className="text-[11px] text-[#5B7170] mt-0.5">
                        {new Date(sess.startedAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(sess.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{Math.ceil(sess.durationSeconds / 60)} min
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {sess.status === 'parcial' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          Parcial
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-[#EAF3EF] text-[#125F55] text-[10px] font-bold">
                        {sess.totalSetsCompleted} séries
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#5B7170]" /> : <ChevronDown className="w-4 h-4 text-[#5B7170]" />}
                    </div>
                  </div>

                  {/* Séries detalhadas expandidas */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-[#C9DBD3]/40 space-y-1.5 text-xs text-[#152A29] animate-in fade-in duration-150">
                      <span className="text-[10px] font-bold text-[#5B7170] uppercase tracking-wider block mb-1">
                        Séries Confirmadas:
                      </span>
                      {relatedSets.map((sEv) => (
                        <div key={sEv.id} className="flex justify-between items-center bg-[#F5F8F5] p-2 rounded-xl text-[11px]">
                          <span className="truncate max-w-[200px]">
                            {sEv.exerciseName} (Série {sEv.setIndex})
                          </span>
                          <span className="font-bold text-[#125F55] tabular-nums">
                            {sEv.actualReps > 0 ? `${sEv.actualReps} reps` : `${sEv.actualDurationSeconds}s`}
                            {sEv.isPR && ' 🏆'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Exportação de Backup */}
      <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-[#152A29]">Exportar Dados em Backup</h4>
          <p className="text-[11px] text-[#5B7170]">Baixe todo o seu histórico em formato JSON seguro.</p>
        </div>
        <button
          onClick={exportBackup}
          className="px-3.5 py-2 rounded-xl bg-[#EAF3EF] text-[#125F55] text-xs font-bold flex items-center gap-1.5 hover:bg-[#D9F277] hover:text-[#203826] transition-colors cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar</span>
        </button>
      </section>
    </div>
  );
};
