import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Bot, HeartHandshake } from 'lucide-react';
import { generateDailyInsight, CoachContext, CoachInsightResult } from '../lib/aiCoach';

interface AICoachCardProps {
  context: CoachContext;
}

export const AICoachCard: React.FC<AICoachCardProps> = ({ context }) => {
  const [insightData, setInsightData] = useState<CoachInsightResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchInsight = async (force: boolean = false) => {
    setLoading(true);
    try {
      const res = await generateDailyInsight(context, force, insightData?.insight);
      setInsightData(res);
    } catch {
      // Ignora erro, generateDailyInsight já tem fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight(false);
  }, [
    context.displayName,
    context.exerciseReason,
    context.weeklyCompleted,
    context.lastMood,
    context.habitAnchor,
    context.todayPlanTitle,
  ]);

  if (!insightData && !loading) return null;

  return (
    <section
      aria-label="Pílula de Sabedoria do Coach"
      className="bg-linear-to-br from-emerald-50/90 via-[#F4F9F6] to-teal-50/70 rounded-3xl p-4 sm:p-5 border border-[#C9DBD3] shadow-xs relative overflow-hidden transition-all"
    >
      {/* Detalhe estético sutil de fundo */}
      <div className="absolute top-0 right-0 -mt-3 -mr-3 w-20 h-20 bg-emerald-200/20 rounded-full blur-xl pointer-events-none" />

      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#125F55] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D9F277]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#152A29] flex items-center gap-1.5">
              <span>Pílula de Sabedoria do Dia</span>
              <span className="text-[10px] font-semibold text-[#125F55] bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                Coach de Constância
              </span>
            </h3>
          </div>
        </div>

        <button
          onClick={() => fetchInsight(true)}
          disabled={loading}
          aria-label="Gerar nova reflexão do Coach"
          title="Buscar uma nova perspectiva acolhedora"
          className="text-xs text-[#5B7170] hover:text-[#125F55] p-1.5 rounded-lg hover:bg-white/80 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#125F55]' : ''}`} />
        </button>
      </div>

      {loading && !insightData ? (
        <div className="py-2 flex items-center gap-2 text-xs text-[#5B7170]">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#125F55]" />
          <span>Buscando palavras acolhedoras para o seu momento...</span>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[#203826] font-medium leading-relaxed italic">
            "{insightData?.insight}"
          </p>

          <div className="flex items-center justify-between pt-1 text-[10px] text-[#5B7170]">
            <span className="flex items-center gap-1">
              <HeartHandshake className="w-3 h-3 text-[#125F55]" />
              <span>Foco no progresso sustentável</span>
            </span>
            {insightData?.isAiGenerated ? (
              <span className="font-semibold text-emerald-800 bg-emerald-100/50 px-1.5 py-0.5 rounded">
                Gemini 2.5 Flash Lite
              </span>
            ) : (
              <span className="text-slate-400">Sabedoria Superação</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
