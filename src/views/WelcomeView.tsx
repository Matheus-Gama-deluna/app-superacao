import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, LogIn, ArrowRight, AlertCircle, Mail, UserPlus, CheckCircle2 } from 'lucide-react';
import { setLocal, STORAGE_KEYS, APP_VERSION } from '../lib/storage';
import { EmailAuthModal } from '../components/EmailAuthModal';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface WelcomeViewProps {
  onSelectAccess: (choice: 'guest' | 'login' | 'signup') => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onSelectAccess }) => {
  const { loginGoogle, loginError, clearLoginError, setGuestMode } = useAuth();
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
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
    <div className="min-h-screen bg-[#F6F8F6] text-[#152A29] flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="max-w-md mx-auto w-full pt-6 sm:pt-10 space-y-6">
        {/* Marca & Acolhimento */}
        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 rounded-3xl bg-[#125F55] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md ring-4 ring-[#125F55]/10">
            S
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#152A29]">
              Superação
            </h1>
            <p className="text-sm text-[#5B7170] mt-1 leading-relaxed max-w-xs mx-auto">
              Construa uma rotina possível, sem cobrança, registrando seu esforço real no seu ritmo.
            </p>
          </div>
        </div>

        {/* Mensagem de Erro amigável se login falhar/cancelado */}
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

        {/* Card Principal de Autenticação com Alternador de Abas */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#E4DDD3] space-y-4">
          {/* Seletor Claro: Entrar vs Criar Conta */}
          <div className="flex bg-[#F2F5F3] p-1 rounded-2xl border border-[#E4DDD3]/60">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                clearLoginError();
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authTab === 'login'
                  ? 'bg-white text-[#125F55] shadow-xs'
                  : 'text-[#5B7170] hover:text-[#152A29]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Já tenho conta · Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('signup');
                clearLoginError();
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                authTab === 'signup'
                  ? 'bg-white text-[#125F55] shadow-xs'
                  : 'text-[#5B7170] hover:text-[#152A29]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Criar nova conta</span>
            </button>
          </div>

          {/* Conteúdo da Aba: Entrar */}
          {authTab === 'login' ? (
            <div className="space-y-3 pt-1">
              {/* 1. Botão Principal: Entrar com Google */}
              <button
                type="button"
                onClick={() => handleGoogleLogin(false)}
                disabled={isSubmitting}
                className="w-full min-h-[52px] p-3.5 bg-white hover:bg-[#FAF8F5] border-2 border-[#125F55]/30 hover:border-[#125F55] text-[#152A29] rounded-2xl flex items-center justify-between font-bold text-xs sm:text-sm active:scale-[0.99] transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex items-center gap-3 text-left">
                  {/* Ícone oficial Google SVG */}
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-[#152A29]">Entrar com Google</div>
                    <div className="text-[11px] font-normal text-[#5B7170]">
                      Acesse instantaneamente com sua conta
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#125F55] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 2. Botão Secundário: Entrar com E-mail */}
              <button
                type="button"
                onClick={() => handleOpenEmailAuth('login')}
                disabled={isSubmitting}
                className="w-full min-h-[50px] p-3.5 bg-[#EAF3EF] hover:bg-[#D5E8DF] border border-[#125F55]/30 text-[#125F55] rounded-2xl flex items-center justify-between font-bold text-xs sm:text-sm active:scale-[0.99] transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-[#125F55] text-white flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#125F55]">Entrar com E-mail e Senha</div>
                    <div className="text-[11px] font-normal text-[#125F55]/80">
                      Use seu endereço de e-mail cadastrado
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#125F55] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {/* Criar com Google */}
              <button
                type="button"
                onClick={() => handleGoogleLogin(true)}
                disabled={isSubmitting}
                className="w-full min-h-[52px] p-3.5 bg-white hover:bg-[#FAF8F5] border-2 border-[#125F55]/30 hover:border-[#125F55] text-[#152A29] rounded-2xl flex items-center justify-between font-bold text-xs sm:text-sm active:scale-[0.99] transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-[#152A29]">Criar conta com Google</div>
                    <div className="text-[11px] font-normal text-[#5B7170]">
                      Sincronização instantânea e IA completa
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#125F55] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Criar com E-mail */}
              <button
                type="button"
                onClick={() => handleOpenEmailAuth('register')}
                disabled={isSubmitting}
                className="w-full min-h-[50px] p-3.5 bg-[#EAF3EF] hover:bg-[#D5E8DF] border border-[#125F55]/30 text-[#125F55] rounded-2xl flex items-center justify-between font-bold text-xs sm:text-sm active:scale-[0.99] transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-xl bg-[#125F55] text-white flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#125F55]">Criar conta com E-mail</div>
                    <div className="text-[11px] font-normal text-[#125F55]/80">
                      Cadastre seu e-mail e crie sua senha
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#125F55] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Divisor elegante */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E4DDD3]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-white px-3 text-[#5B7170] font-semibold">
                ou experimente primeiro
              </span>
            </div>
          </div>

          {/* Opção Convidado: Continuar sem conta */}
          <button
            type="button"
            onClick={handleContinueAsGuest}
            disabled={isSubmitting}
            className="w-full min-h-[50px] p-3.5 bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#E4DDD3] text-[#152A29] rounded-2xl flex items-center justify-between font-semibold text-xs sm:text-sm active:scale-[0.99] transition-all cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-[#E8EFE9] text-[#1B4332] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[#19231E]">Continuar sem conta</div>
                <div className="text-[11px] text-[#5D6E65]">
                  Comece agora; dados salvos na memória deste aparelho
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#5D6E65] group-hover:translate-x-0.5 transition-transform" />
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

        {/* Convite Visual para Instalar o App logo na Entrada */}
        <PWAInstallButton variant="banner" className="mt-2" />
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
