import React, { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  useEffect(() => {
    // Detecta se já está rodando instalado como PWA / standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detecta iOS
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // Se não for Chromium com prompt nem iOS, não exibe
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Instalar Superação no celular"
        className={`flex items-center gap-1.5 font-medium transition-all cursor-pointer active:scale-95 ${
          compact
            ? 'px-2.5 py-1 text-xs rounded-lg bg-[#EAF3EF] text-[#125F55] hover:bg-[#D9F277] hover:text-[#203826]'
            : 'px-3 py-1.5 text-xs rounded-xl bg-[#125F55] text-white hover:bg-[#0C5148] shadow-xs'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>

      {/* Modal Guia para iOS Safari */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-[#C9DBD3] text-[#152A29] relative animate-in fade-in slide-in-from-bottom duration-200">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-[#5B7170]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[#125F55] mb-2">Instalar no iPhone / iPad</h3>
            <p className="text-sm text-[#5B7170] mb-4">
              Para usar o Superação em tela cheia com acesso offline:
            </p>
            <ol className="text-xs text-[#152A29] space-y-2.5 bg-[#F5F8F5] p-3.5 rounded-2xl mb-4">
              <li className="flex items-center gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-[#125F55] text-white rounded-full flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Toque no botão <strong>Compartilhar</strong> (<Share className="inline w-3 h-3 text-[#125F55]" />) na barra do Safari.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-[#125F55] text-white rounded-full flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#125F55] text-white text-xs font-semibold hover:bg-[#0C5148]"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
