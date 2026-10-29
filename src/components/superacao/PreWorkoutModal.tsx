import React, { useState } from 'react';
import { X, BatteryMedium, Sparkles, Zap, Heart, Check, Play } from 'lucide-react';
import { PreWorkoutMood, WorkoutPlan } from '../../types';
import { createSoftenedPlanSnapshot } from '../../lib/workoutEngine';

interface PreWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: WorkoutPlan;
  onConfirmStart: (adaptedPlan?: WorkoutPlan, preMood?: PreWorkoutMood) => void;
  onRestToday?: () => void;
}

export const PreWorkoutModal: React.FC<PreWorkoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  onConfirmStart,
  onRestToday,
}) => {
  const [selectedMood, setSelectedMood] = useState<PreWorkoutMood>('normal');

  if (!isOpen) return null;

  const handleStart = () => {
    if (selectedMood === 'cansado' || selectedMood === 'tenso') {
      const softened = createSoftenedPlanSnapshot(plan);
      onConfirmStart(softened, selectedMood);
    } else {
      onConfirmStart(plan, selectedMood);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pre-workout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-[#FAF8F5] border border-[#E4DDD3] rounded-3xl max-w-md w-full p-6 shadow-xl space-y-5 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4332] bg-[#E8EFE9] px-2.5 py-1 rounded-full">
            Antes de começar
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E4DDD3] text-[#5D6E65] hover:text-[#19231E] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Título Serifado Editorial */}
        <div>
          <h2 id="pre-workout-modal-title" className="font-serif text-2xl font-bold text-[#19231E]">
            Como você chega hoje?
          </h2>
          <p className="text-xs text-[#5D6E65] mt-1 leading-relaxed">
            Seu treino se molda ao seu momento. Dizer a verdade sobre sua energia é o primeiro ato de consistência.
          </p>
        </div>

        {/* Grade 2x2 de Seleção de Sensação */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Cansado */}
          <button
            type="button"
            onClick={() => setSelectedMood('cansado')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[96px] ${
              selectedMood === 'cansado'
                ? 'bg-[#FDF3F0] border-[#E07A5F] shadow-xs'
                : 'bg-white border-[#E4DDD3] hover:border-[#1B4332]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🔋</span>
              {selectedMood === 'cansado' && (
                <span className="w-5 h-5 rounded-full bg-[#E07A5F] text-white flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-[#19231E]">Cansado</p>
              <p className="text-[10px] text-[#5D6E65] mt-0.5">Pouca energia ou sono curto</p>
            </div>
          </button>

          {/* Tenso */}
          <button
            type="button"
            onClick={() => setSelectedMood('tenso')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[96px] ${
              selectedMood === 'tenso'
                ? 'bg-[#FDF3F0] border-[#E07A5F] shadow-xs'
                : 'bg-white border-[#E4DDD3] hover:border-[#1B4332]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🧘</span>
              {selectedMood === 'tenso' && (
                <span className="w-5 h-5 rounded-full bg-[#E07A5F] text-white flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-[#19231E]">Tenso</p>
              <p className="text-[10px] text-[#5D6E65] mt-0.5">Músculos rígidos ou estresse</p>
            </div>
          </button>

          {/* Normal */}
          <button
            type="button"
            onClick={() => setSelectedMood('normal')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[96px] ${
              selectedMood === 'normal'
                ? 'bg-[#E8EFE9] border-[#1B4332] shadow-xs'
                : 'bg-white border-[#E4DDD3] hover:border-[#1B4332]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🌿</span>
              {selectedMood === 'normal' && (
                <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-[#19231E]">Normal</p>
              <p className="text-[10px] text-[#5D6E65] mt-0.5">Ritmo habitual de hoje</p>
            </div>
          </button>

          {/* Disposto */}
          <button
            type="button"
            onClick={() => setSelectedMood('disposto')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[96px] ${
              selectedMood === 'disposto'
                ? 'bg-[#E8EFE9] border-[#1B4332] shadow-xs'
                : 'bg-white border-[#E4DDD3] hover:border-[#1B4332]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">⚡</span>
              {selectedMood === 'disposto' && (
                <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-[#19231E]">Disposto</p>
              <p className="text-[10px] text-[#5D6E65] mt-0.5">Com energia e foco</p>
            </div>
          </button>
        </div>

        {/* Sugestão Dinâmica caso Cansado ou Tenso */}
        {(selectedMood === 'cansado' || selectedMood === 'tenso') ? (
          <div className="bg-[#FDF3F0] border border-[#E07A5F]/40 p-3.5 rounded-2xl space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#E07A5F]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sugestão do Superação: Suavizar o treino de hoje?</span>
            </div>
            <p className="text-[11px] text-[#19231E]/80 leading-relaxed">
              Reduzimos 1 série ou carga para você não parar. O melhor treino é aquele que você consegue cumprir e terminar sentindo-se bem.
            </p>
          </div>
        ) : (
          <div className="bg-[#E8EFE9]/60 border border-[#1B4332]/20 p-3 rounded-2xl text-xs text-[#1B4332] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1B4332] shrink-0" />
            <span>Excelente! Seu plano original de {plan.estimatedDurationMinutes || 20} minutos está pronto.</span>
          </div>
        )}

        {/* Ações Inferiores */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleStart}
            className="w-full h-14 bg-[#1B4332] hover:bg-[#12372A] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {selectedMood === 'cansado' || selectedMood === 'tenso'
                ? 'Suavizar e começar (-25%)'
                : 'Iniciar Treino de Hoje'}
            </span>
          </button>

          {(selectedMood === 'cansado' || selectedMood === 'tenso') && onRestToday && (
            <button
              type="button"
              onClick={onRestToday}
              className="w-full py-2.5 text-xs font-semibold text-[#5D6E65] hover:text-[#19231E] hover:bg-black/5 rounded-xl cursor-pointer transition-colors"
            >
              🤍 Descansar hoje sem culpa
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
