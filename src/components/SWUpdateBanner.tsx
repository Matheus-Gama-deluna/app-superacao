import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

interface SWUpdateBannerProps {
  isWorkoutActive?: boolean;
}

export const SWUpdateBanner: React.FC<SWUpdateBannerProps> = ({ isWorkoutActive = false }) => {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Escuta evento customizado disparado pelo Service Worker ou por listeners de update
    const handleSWUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('swUpdated', handleSWUpdate);

    // Verifica se há worker em espera
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg && reg.waiting) {
        setUpdateAvailable(true);
      }
    });

    return () => {
      window.removeEventListener('swUpdated', handleSWUpdate);
    };
  }, []);

  // Nunca interrompe um treino ativo
  if (!updateAvailable || isWorkoutActive || isDismissed) return null;

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        setTimeout(() => {
          window.location.reload();
        }, 300);
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <aside
      aria-label="Atualização disponível"
      className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 bg-white border border-[#125F55]/30 rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#D9F277] text-[#203826] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-[#125F55]" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#152A29]">Nova versão disponível!</p>
          <p className="text-[11px] text-[#5B7170]">Melhorias e ajustes prontos para você.</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleApplyUpdate}
          disabled={isUpdating}
          className="px-3 py-1.5 rounded-xl bg-[#125F55] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#0C5148] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>{isUpdating ? 'Atualizando...' : 'Atualizar'}</span>
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          aria-label="Dispensar aviso de atualização"
          className="p-1.5 text-[#5B7170] hover:text-[#152A29] rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
