import React from 'react';
import { Clock, Zap, Smartphone } from 'lucide-react';

interface ObstaclePillsProps {
  onExpressClick?: () => void;
  onCopingClick: () => void;
  onOfflinePracticeClick: () => void;
}

export const ObstaclePills: React.FC<ObstaclePillsProps> = ({
  onExpressClick,
  onCopingClick,
  onOfflinePracticeClick,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
      {onExpressClick && (
        <button
          type="button"
          onClick={onExpressClick}
          className="shrink-0 px-3 py-1.5 bg-white border border-[#E4DDD3] hover:border-[#1B4332] text-[11px] font-semibold text-[#19231E] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:outline-none"
          aria-label="Ativar treino rápido de 5 minutos"
        >
          <Clock className="w-3.5 h-3.5 text-[#1B4332]" />
          <span>Só tenho 5 min</span>
        </button>
      )}

      <button
        type="button"
        onClick={onCopingClick}
        className="shrink-0 px-3 py-1.5 bg-white border border-[#E4DDD3] hover:border-[#E07A5F] text-[11px] font-semibold text-[#19231E] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-[#E07A5F] focus-visible:outline-none"
        aria-label="Abrir plano de ação para imprevistos"
      >
        <Zap className="w-3.5 h-3.5 text-[#E07A5F]" />
        <span>Surgiu um imprevisto hoje?</span>
      </button>

      <button
        type="button"
        onClick={onOfflinePracticeClick}
        className="shrink-0 px-3 py-1.5 bg-white border border-[#E4DDD3] hover:border-[#1B4332] text-[11px] font-semibold text-[#5D6E65] hover:text-[#19231E] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-[#1B4332] focus-visible:outline-none"
        aria-label="Registrar prática realizada sem o celular"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#5D6E65]" />
        <span>Fiz sem o celular</span>
      </button>
    </div>
  );
};
