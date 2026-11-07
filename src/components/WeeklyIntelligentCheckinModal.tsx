import React from 'react';
import { X, Sparkles, Trophy, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface WeeklyIntelligentCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  weeklyCompletedCount: number;
  targetWeeklyGoal: number;
  onApplyAdjustment?: (adjustmentType: 'maintain' | 'reduce_time' | 'add_active_rest') => void;
}

export const WeeklyIntelligentCheckinModal: React.FC<WeeklyIntelligentCheckinModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  weeklyCompletedCount,
  targetWeeklyGoal,
  onApplyAdjustment,
}) => {
  if (!isOpen) return null;

  const name = userProfile?.displayName ? userProfile.displayName.split(' ')[0] : 'Campeão(ã)';
  const pills = userProfile?.weeklyMotivationalPills || [
    'Sua dedicação é o maior investimento na sua longevidade!',
    'Constância suave supera intensidade passageira.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header Hero */}
        <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D8F3DC] text-[#1B4332] text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Check-in Semanal
            </span>
          </div>

          <h3 className="text-xl font-bold">Parabéns pelo ritmo, {name}!</h3>
          <p className="text-xs text-[#D8F3DC]/90 mt-1">
            Seu Personal reuniu seu balanço de constância e bem-estar desta semana.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Consistency Badge */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D8F3DC] text-[#1B4332] flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Metas da Semana</p>
                <p className="text-sm font-bold text-slate-900">
                  {weeklyCompletedCount} de {targetWeeklyGoal} momentos cumpridos
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#2D6A4F] bg-[#D8F3DC]/50 px-2 py-1 rounded-lg">
              {weeklyCompletedCount >= targetWeeklyGoal ? '100% Concluído' : 'Ritmo Ativo'}
            </span>
          </div>

          {/* AI Motivational Pills */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F]" />
              Sabedoria do Telemetry Analyst (gpt-oss-120b)
            </h4>
            <div className="p-3 bg-[#D8F3DC]/30 border border-[#2D6A4F]/20 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-1.5">
              {pills.map((pill, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
                  <p>{pill}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 1-Click Adjustments */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Como deseja calibrar a próxima semana?
            </h4>

            <button
              type="button"
              onClick={() => {
                onApplyAdjustment?.('maintain');
                onClose();
              }}
              className="w-full p-3 bg-[#1B4332] hover:bg-[#12372A] text-white rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Manter meu ritmo atual (ótimo equilíbrio)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                onApplyAdjustment?.('reduce_time');
                onClose();
              }}
              className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Semana mais corrida: sessões mais curtas (-5 min)</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => {
                onApplyAdjustment?.('add_active_rest');
                onClose();
              }}
              className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Adicionar 1 dia de caminhada / recuperação ativa</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
