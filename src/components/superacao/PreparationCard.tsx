import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { PreparationRitual } from '../../types';

interface PreparationCardProps {
  ritual: PreparationRitual;
  isDoneToday: boolean;
  habitAnchor?: string;
  onComplete: () => void;
}

export const PreparationCard: React.FC<PreparationCardProps> = ({
  ritual,
  isDoneToday,
  habitAnchor,
  onComplete,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <section className="bg-white border border-[#E4DDD3] rounded-3xl p-4.5 shadow-2xs space-y-2.5 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🚪</span>
          <div>
            <h3 className="text-xs font-bold text-[#19231E]">
              Ritual de Preparação
            </h3>
            {habitAnchor && (
              <p className="text-[11px] text-[#5D6E65]">
                Âncora: <strong>{habitAnchor}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDoneToday ? (
            <span className="text-[#1B4332] text-[11px] font-bold bg-[#E8EFE9] px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#1B4332]/20">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Preparação Feita
            </span>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              className="text-xs font-bold text-[#1B4332] bg-[#E8EFE9] border border-[#1B4332]/30 px-3 py-1.5 rounded-xl hover:bg-[#1B4332] hover:text-white transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:outline-none"
            >
              Concluir preparação
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? 'Recolher detalhes do ritual' : 'Expandir detalhes do ritual'}
            className="w-7 h-7 rounded-lg text-[#5D6E65] hover:text-[#19231E] hover:bg-[#F5F3EF] flex items-center justify-center cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:outline-none"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#E4DDD3]/70 space-y-1.5 text-xs animate-in fade-in duration-150">
          <p className="text-[11px] text-[#5D6E65] leading-relaxed">
            <span className="font-semibold text-[#19231E]">{ritual.anchorTrigger}</span>:{' '}
            {ritual.steps.join(' → ')}.
          </p>
          <div className="flex items-center gap-1 text-[10px] text-[#5D6E65]">
            <Sparkles className="w-3 h-3 text-[#E07A5F]" />
            <span>Elimine o atrito antes de começar: prepare seu espaço e roupas com antecedência.</span>
          </div>
        </div>
      )}
    </section>
  );
};
