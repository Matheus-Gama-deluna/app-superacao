import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, User, LogIn, ArrowRight, AlertCircle, Mail } from 'lucide-react';
import { setLocal, STORAGE_KEYS, APP_VERSION } from '../lib/storage';
import { EmailAuthModal } from '../components/EmailAuthModal';

interface WelcomeViewProps {
  onSelectAccess: (choice: 'guest' | 'login' | 'signup') => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onSelectAccess }) => {
  const { loginGoogle, loginError, clearLoginError, setGuestMode } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [emailModalMode, setEmailModalMode] = useState<'login' | 'register'>('login');

  const handleContinueAsGuest = () => {
    setGuestMode();
    setLocal(STORAGE_KEYS.ACCESS_CHOICE, 'guest');
    onSelectAccess('guest');
  };

  const handleGoogleLogin = async (isNewAccount: boolean = false) => {
    setIsSubmitting(true);
    clearLoginError();
    try {
      const success = await loginGoogle();
      if (success) {
        setLocal(STORAGE_KEYS.ACCESS_CHOICE, isNewAccount ? 'signup' : 'login');
        onSelectAccess(isNewAccount ? 'signup' : 'login');
      }
    } catch {
      // Erro já capturado no AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEmailAuth = (mode: 'login' | 'register') => {
    setEmailModalMode(mode);
    setIsEmailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F8F5] text-[#152A29] flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="max-w-md mx-auto w-full pt-8 sm:pt-14 space-y-8">
        {/* Marca & Acolhimento */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-[#125F55] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md">
            S
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#152A29]">
              Superação
            </h1>
            <p className="text-sm text-[#5B7170] mt-1.5 leading-relaxed max-w-xs mx-auto">
              Construa uma rotina possível, sem cobrança, registrando seu esforço real no seu ritmo.
            </p>
          </div>
        </div>

        {/* Mensagem de Erro amigável se login falhar/cancelado (C03) */}
        {loginError && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[#91610D] text-xs flex items-start gap-2.5 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{loginError}</p>
              <button
                onClick={handleContinueAsGuest}
                className="mt-1.5 text-xs font-bold underline hover:text-[#734C08] cursor-pointer"
              >
                Prosseguir sem conta agora
              </button>
            </div>
          </div>
        )}

        {/* Opções de Acesso Transparentes (C01, C02, C03) */}
        <div className="space-y-3 pt-2">
          {/* 1. Continuar sem conta (Convidado Local - Fricção Zero) */}
          <button
            onClick={handleContinueAsGuest}
            disabled={isSubmitting}
            className="w-full min-h-[56px] p-4 bg-[#125F55] text-white rounded-2xl flex items-center justify-between font-bold text-sm hover:bg-[#0C5148] active:scale-[0.99] transition-all cursor-pointer shadow-md group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div>Continuar sem conta</div>
                <div className="text-[11px] font-normal text-white/80">
                  Comece agora; dados salvos neste aparelho
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/70 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* 2. Conectar com Google */}
          <button
            onClick={() => handleGoogleLogin(true)}
            disabled={isSubmitting}
            className="w-full min-h-[52px] p-3.5 bg-white border border-[#C9DBD3] text-[#152A29] rounded-2xl flex items-center justify-between font-bold text-xs sm:text-sm hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#EAF3EF] flex items-center justify-center text-[#125F55] shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div>Criar conta com Google</div>
                <div className="text-[11px] font-normal text-[#5B7170]">
                  Sincronização instantânea em nuvem
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#5B7170]" />
          </button>

          {/* 3. Conectar com E-mail e Senha */}
          <button
            onClick={() => handleOpenEmailAuth('register')}
            disabled={isSubmitting}
            className="w-full min-h-[52px] p-3.5 bg-white border border-[#C9DBD3] text-[#152A29] rounded-2xl flex items-center justify-between font-bold text-xs sm:text-sm hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#EAF3EF] flex items-center justify-center text-[#125F55] shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div>Criar conta com E-mail</div>
                <div className="text-[11px] font-normal text-[#5B7170]">
                  Use seu endereço de e-mail e senha
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#5B7170]" />
          </button>

          {/* 4. Já tenho uma conta (Entrar) */}
          <button
            onClick={() => handleOpenEmailAuth('login')}
            disabled={isSubmitting}
            className="w-full min-h-[48px] p-3 border border-transparent text-[#5B7170] rounded-2xl flex items-center justify-center gap-2 font-semibold text-xs hover:text-[#152A29] hover:bg-black/5 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Já tenho uma conta · Entrar</span>
          </button>
        </div>

        {/* Esclarecimento Honesto sobre Privacidade e Dados */}
        <div className="bg-[#EAF3EF] p-4 rounded-2xl border border-[#C9DBD3]/60 space-y-1.5 text-xs text-[#5B7170]">
          <div className="flex items-center gap-1.5 font-bold text-[#125F55]">
            <Shield className="w-4 h-4" />
            <span>Seus dados são 100% seus</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            Sem conta, seus treinos e evolução ficam salvos exclusivamente na memória deste navegador. Você poderá criar ou conectar sua conta a qualquer momento para sincronizar sem perder seu histórico.
          </p>
        </div>
      </div>

      {/* Modal de E-mail e Senha */}
      <EmailAuthModal
        isOpen={isEmailModalOpen}
        initialMode={emailModalMode}
        onClose={() => setIsEmailModalOpen(false)}
        onSuccess={() => {
          setLocal(STORAGE_KEYS.ACCESS_CHOICE, emailModalMode === 'register' ? 'signup' : 'login');
          onSelectAccess(emailModalMode === 'register' ? 'signup' : 'login');
        }}
      />

      {/* Rodapé sutil */}
      <footer className="text-center py-4 text-[11px] text-[#5B7170]">
        Superação · Versão {APP_VERSION} · Sem promessas milagrosas
      </footer>
    </div>
  );
};
