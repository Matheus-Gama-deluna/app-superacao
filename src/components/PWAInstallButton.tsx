import React, { useState, useEffect } from 'react';
import { Download, Share, X, Smartphone, CheckCircle2, MoreVertical, Monitor, Sparkles } from 'lucide-react';
import { isAppInstalledStandalone, isIOSDevice } from '../lib/pwaNative';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PWAInstallButtonProps {
  variant?: 'compact' | 'banner' | 'full';
  className?: string;
  onDismissBanner?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
  onDismissBanner,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');

  useEffect(() => {
    // Detecta modo standalone
    const installed = isAppInstalledStandalone();
    setIsInstalled(installed);

    // Ajusta aba padrão conforme o SO detectado
    if (isIOSDevice()) {
      setActiveTab('ios');
    } else if (typeof window !== 'undefined' && !/mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      setActiveTab('desktop');
    } else {
      setActiveTab('android');
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return;
        }
      } catch {
        // Se falhar o prompt nativo, abre o modal
      }
    }
    setShowModal(true);
  };

  // Se já estiver instalado em modo standalone:
  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className={`flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold ${className}`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Superação instalado como Aplicativo neste dispositivo (Modo Nativo)</span>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* 1. Variante Compacta (Para TopStatusBar) */}
      {variant === 'compact' && (
        <button
          onClick={handleTriggerInstall}
          aria-label="Instalar aplicativo Superação"
          title="Instalar Superação na tela inicial do celular"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#EAF3EF] text-[#125F55] hover:bg-[#D9F277] hover:text-[#203826] transition-all cursor-pointer active:scale-95 border border-[#C9DBD3] shrink-0 ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">Instalar App</span>
        </button>
      )}

      {/* 2. Variante Banner Destacado (Para HomeView e WelcomeView) */}
      {variant === 'banner' && (
        <section
          aria-label="Instalar aplicativo Superação no celular"
          className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-[#125F55] via-[#15695E] to-[#0D4B43] text-white shadow-md border border-[#0C5148] ${className}`}
        >
          {/* Efeito estético de brilho suave no fundo */}
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-[#D9F277]/20 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
                <Smartphone className="w-5 h-5 text-[#D9F277]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Instale o Superação no seu celular
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D9F277] text-[#203826] uppercase">
                    100% Grátis
                  </span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed max-w-md">
                  Abra direto pelo ícone na tela inicial, em tela cheia e com acesso instantâneo aos seus treinos mesmo sem internet.
                </p>
              </div>
            </div>

            {onDismissBanner && (
              <button
                onClick={onDismissBanner}
                aria-label="Fechar convite de instalação"
                className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-3.5 pt-2 flex flex-wrap items-center gap-2.5 relative z-10">
            <button
              onClick={handleTriggerInstall}
              className="px-4 py-2.5 rounded-xl bg-[#D9F277] text-[#203826] text-xs font-bold flex items-center gap-2 hover:bg-[#c8e65e] active:scale-98 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Instalar Aplicativo Agora</span>
            </button>
            <span className="text-[11px] text-white/70">
              {deferredPrompt ? 'Instalação nativa em 1 toque' : 'Instale em segundos sem ocupar memória'}
            </span>
          </div>
        </section>
      )}

      {/* 3. Variante Completa (Para ProfileView) */}
      {variant === 'full' && (
        <div className={`space-y-2.5 ${className}`}>
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F8F5] border border-[#C9DBD3]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#125F55] text-white flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-[#D9F277]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#152A29]">
                  {deferredPrompt ? 'Pronto para Instalação Nativa' : 'Adicionar à Tela Inicial'}
                </p>
                <p className="text-[11px] text-[#5B7170]">
                  Treine em tela cheia e acesse tudo offline com rapidez.
                </p>
              </div>
            </div>
            <button
              onClick={handleTriggerInstall}
              className="px-3.5 py-2 rounded-xl bg-[#125F55] text-white text-xs font-bold hover:bg-[#0C5148] transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL GUIA VISUAL INTERATIVO DE INSTALAÇÃO */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-[#C9DBD3] text-[#152A29] relative my-auto animate-in zoom-in-95 duration-200">
            {/* Botão Fechar */}
            <button
              onClick={() => setShowModal(false)}
              aria-label="Fechar guia de instalação"
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-[#5B7170] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#125F55] text-white flex items-center justify-center font-black text-xl shadow-xs">
                S
              </div>
              <div>
                <h3 id="pwa-install-title" className="text-base font-bold text-[#152A29]">
                  Instalar o App Superação
                </h3>
                <p className="text-xs text-[#5B7170]">
                  Escolha o seu dispositivo para ver o passo a passo:
                </p>
              </div>
            </div>

            {/* Abas de Plataforma */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F5F8F5] rounded-xl border border-[#C9DBD3] mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-[#125F55] text-white shadow-xs'
                    : 'text-[#5B7170] hover:text-[#152A29]'
                }`}
              >
                Android
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-[#125F55] text-white shadow-xs'
                    : 'text-[#5B7170] hover:text-[#152A29]'
                }`}
              >
                iPhone / iPad
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'desktop'
                    ? 'bg-[#125F55] text-white shadow-xs'
                    : 'text-[#5B7170] hover:text-[#152A29]'
                }`}
              >
                Computador
              </button>
            </div>

            {/* Conteúdo por Plataforma */}
            {activeTab === 'android' && (
              <div className="space-y-3 bg-[#F5F8F5] p-4 rounded-2xl border border-[#C9DBD3] text-xs">
                <p className="font-semibold text-[#152A29]">
                  No Chrome, Samsung Internet ou Edge:
                </p>
                <ol className="space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#125F55] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Toque no menu de <strong>três pontos</strong> (<MoreVertical className="inline w-3.5 h-3.5 text-[#125F55]" />) no topo ou rodapé do navegador.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#125F55] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#125F55] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Confirme em <strong>"Instalar"</strong>. O ícone oficial do Superação aparecerá na sua tela de apps!
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="space-y-3 bg-[#F5F8F5] p-4 rounded-2xl border border-[#C9DBD3] text-xs">
                <p className="font-semibold text-[#152A29]">
                  No Safari do iPhone ou iPad:
                </p>
                <ol className="space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#125F55] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Toque no botão de <strong>Compartilhar</strong> (<Share className="inline w-3.5 h-3.5 text-[#125F55]" />) na barra inferior do Safari.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#125F55] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#125F55] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Toque em <strong>"Adicionar"</strong> no canto superior direito. Pronto!
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'desktop' && (
              <div className="space-y-3 bg-[#F5F8F5] p-4 rounded-2xl border border-[#C9DBD3] text-xs">
                <p className="font-semibold text-[#152A29]">
                  No Chrome, Edge ou Brave (Windows / Mac):
                </p>
                <ol className="space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#125F55] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Clique no ícone de <strong>Instalar</strong> (<Download className="inline w-3.5 h-3.5 text-[#125F55]" />) no lado direito da barra de endereços (URL).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#125F55] text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Ou abra o menu do navegador (<MoreVertical className="inline w-3.5 h-3.5 text-[#125F55]" />) e selecione <strong>"Instalar Superação"</strong>.
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {/* Botão de Ação */}
            <div className="mt-4 pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-[#125F55] text-white text-xs font-bold hover:bg-[#0C5148] transition-all cursor-pointer shadow-xs"
              >
                Entendi, vou instalar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
