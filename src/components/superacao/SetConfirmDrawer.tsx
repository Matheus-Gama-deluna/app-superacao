import React, { useState } from 'react';
import { X, Minus, Plus, Check, Clock, Dumbbell } from 'lucide-react';

interface SetConfirmDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  setIndex: number;
  totalSets: number;
  isTimeTracking: boolean;
  actualReps: number;
  onRepsChange: (reps: number) => void;
  actualDuration: number;
  onDurationChange: (duration: number) => void;
  actualWeight: number;
  onWeightChange: (weight: number) => void;
  supportsWeight: boolean;
  previousPR?: { bestWeightKg?: number; bestReps?: number; bestDurationSeconds?: number };
  restSeconds: number;
  onRestSecondsChange: (sec: number) => void;
  onSaveSet: () => void;
}

export const SetConfirmDrawer: React.FC<SetConfirmDrawerProps> = ({
  isOpen,
  onClose,
  exerciseName,
  setIndex,
  totalSets,
  isTimeTracking,
  actualReps,
  onRepsChange,
  actualDuration,
  onDurationChange,
  actualWeight,
  onWeightChange,
  supportsWeight,
  previousPR,
  restSeconds,
  onRestSecondsChange,
  onSaveSet,
}) => {
  const [showExtraWeight, setShowExtraWeight] = useState<boolean>(actualWeight > 0);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-[32px] p-5 border-t border-x border-[#E4DDD3] text-[#19231E] space-y-4 shadow-2xl cursor-default animate-in slide-in-from-bottom duration-250 pb-safe"
      >
        {/* Drag handle pill */}
        <div className="w-12 h-1.5 bg-[#E4DDD3] rounded-full mx-auto -mt-1" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-1 border-b border-[#E4DDD3]/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4332] bg-[#E8EFE9] px-2.5 py-0.5 rounded-full">
              Série {setIndex} de {totalSets}
            </span>
            <h3 className="font-serif text-lg font-bold text-[#19231E] mt-1 truncate max-w-[260px]">
              {exerciseName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E4DDD3] text-[#5D6E65] hover:text-[#19231E] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ajustador de Repetições ou Tempo com Stepper Amplo */}
        <div className="bg-[#FAF8F5] p-4 rounded-2xl text-center space-y-3 border border-[#E4DDD3]/70">
          <label className="text-xs font-bold text-[#5D6E65] uppercase tracking-wider block">
            {isTimeTracking ? 'Tempo Real Sustentado' : 'Repetições Reais Executadas'}
          </label>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (isTimeTracking) {
                  onDurationChange(Math.max(0, actualDuration - 5));
                } else {
                  onRepsChange(Math.max(0, actualReps - 1));
                }
              }}
              className="w-12 h-12 rounded-2xl bg-white border border-[#E4DDD3] flex items-center justify-center text-lg font-bold text-[#1B4332] active:scale-95 shadow-2xs hover:bg-[#E8EFE9] cursor-pointer transition-all"
              aria-label="Diminuir"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="w-24">
              <span className="text-4xl font-black text-[#1B4332] tabular-nums">
                {isTimeTracking ? actualDuration : actualReps}
              </span>
              <span className="block text-[11px] text-[#5D6E65] font-semibold mt-0.5">
                {isTimeTracking ? 'segundos' : 'repetições'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isTimeTracking) {
                  onDurationChange(actualDuration + 5);
                } else {
                  onRepsChange(actualReps + 1);
                }
              }}
              className="w-12 h-12 rounded-2xl bg-white border border-[#E4DDD3] flex items-center justify-center text-lg font-bold text-[#1B4332] active:scale-95 shadow-2xs hover:bg-[#E8EFE9] cursor-pointer transition-all"
              aria-label="Aumentar"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Atalhos Rápidos */}
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            {[8, 10, 12, 15, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (isTimeTracking) {
                    onDurationChange(num * 2);
                  } else {
                    onRepsChange(num);
                  }
                }}
                className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  (isTimeTracking ? actualDuration === num * 2 : actualReps === num)
                    ? 'bg-[#1B4332] text-white border-[#1B4332]'
                    : 'bg-white border-[#E4DDD3] text-[#5D6E65] hover:border-[#1B4332]/40'
                }`}
              >
                {isTimeTracking ? `${num * 2}s` : num}
              </button>
            ))}
          </div>
        </div>

        {/* Ajuste de Carga Adicional (se suportado pelo exercício) */}
        {supportsWeight ? (
          !showExtraWeight && actualWeight === 0 ? (
            <div className="text-center py-0.5">
              <button
                type="button"
                onClick={() => setShowExtraWeight(true)}
                className="text-[11px] font-bold text-[#1B4332] bg-[#E8EFE9] hover:bg-[#dbeee4] border border-[#1B4332]/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar carga extra em kg (opcional)</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl text-center space-y-2 border border-[#E4DDD3]/70">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold text-[#5D6E65] uppercase tracking-wider block">
                  Carga Utilizada (kg)
                </label>
                {previousPR?.bestWeightKg ? (
                  <span className="text-[10px] text-[#1B4332] font-bold">
                    Última marca: {previousPR.bestWeightKg} kg
                  </span>
                ) : (
                  <span className="text-[10px] text-[#5D6E65]">Halteres / Peso livre</span>
                )}
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => onWeightChange(Math.max(0, actualWeight - 2))}
                  className="w-10 h-10 rounded-xl bg-white border border-[#E4DDD3] flex items-center justify-center font-bold text-xs text-[#1B4332] active:scale-95 shadow-2xs cursor-pointer"
                >
                  -2
                </button>
                <div className="w-24">
                  <span className="text-3xl font-black text-[#1B4332] tabular-nums">
                    {actualWeight}
                  </span>
                  <span className="block text-[10px] text-[#5D6E65] font-semibold mt-0.5">
                    {actualWeight > 0 ? 'kg utilizados' : 'peso do corpo'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onWeightChange(actualWeight + 2)}
                  className="w-10 h-10 rounded-xl bg-white border border-[#E4DDD3] flex items-center justify-center font-bold text-xs text-[#1B4332] active:scale-95 shadow-2xs cursor-pointer"
                >
                  +2
                </button>
              </div>

              {/* Pílulas rápidas de carga */}
              <div className="flex items-center justify-center gap-1.5 pt-0.5 flex-wrap">
                {[0, 4, 8, 12, 16, 20, 30].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onWeightChange(w)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border cursor-pointer transition-colors ${
                      actualWeight === w
                        ? 'bg-[#1B4332] text-white border-[#1B4332]'
                        : 'bg-white border-[#E4DDD3] text-[#5D6E65] hover:border-[#1B4332]'
                    }`}
                  >
                    {w === 0 ? 'Livre' : `${w}k`}
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="bg-[#FAF8F5] p-2.5 rounded-2xl text-center space-y-0.5 border border-[#E4DDD3]/70">
            <span className="text-[11px] font-bold text-[#1B4332] uppercase tracking-wider block">
              Peso Corporal & Controle Articular
            </span>
            <p className="text-[10px] text-[#5D6E65]">
              Exercício executado com o peso do próprio corpo.
            </p>
          </div>
        )}

        {/* Descanso Inline Ajustável */}
        <div className="bg-white p-3 rounded-2xl border border-[#E4DDD3] flex items-center justify-between text-xs text-[#5D6E65]">
          <div className="flex items-center gap-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5 text-[#1B4332]" />
            <span>Descanso a seguir:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[30, 45, 60, 90].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => onRestSecondsChange(sec)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                  restSeconds === sec
                    ? 'bg-[#1B4332] text-white border-[#1B4332]'
                    : 'bg-[#FAF8F5] text-[#5D6E65] border-[#E4DDD3] hover:border-[#1B4332]/40'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Botão de Salvar Série */}
        <button
          type="button"
          onClick={onSaveSet}
          className="w-full h-14 bg-[#1B4332] hover:bg-[#12372A] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md cursor-pointer"
        >
          <Check className="w-5 h-5" />
          <span>Salvar Registro & Iniciar Descanso</span>
        </button>
      </div>
    </div>
  );
};
