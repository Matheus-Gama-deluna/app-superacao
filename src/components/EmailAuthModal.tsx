import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const EmailAuthModal: React.FC<EmailAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}) => {
  const { loginEmail, registerEmail, resetPassword, loginError, clearLoginError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      clearLoginError();
      setLocalFeedback(null);
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialMode]);

  // Tecla Escape fecha o modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();
    setLocalFeedback(null);

    if (!email.trim()) {
      setLocalFeedback({ type: 'error', message: 'Por favor, informe seu endereço de e-mail.' });
      return;
    }

    if (mode === 'reset') {
      setIsSubmitting(true);
      const res = await resetPassword(email);
      setIsSubmitting(false);
      if (res.success) {
        setLocalFeedback({ type: 'success', message: res.message });
      } else {
        setLocalFeedback({ type: 'error', message: res.message });
      }
      return;
    }

    if (!password) {
      setLocalFeedback({ type: 'error', message: 'Por favor, digite sua senha.' });
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setLocalFeedback({ type: 'error', message: 'A senha precisa ter pelo menos 6 caracteres.' });
      return;
    }

    setIsSubmitting(true);
    let success = false;
    if (mode === 'login') {
      success = await loginEmail(email, password);
    } else {
      success = await registerEmail(email, password, displayName);
    }
    setIsSubmitting(false);

    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#C9DBD3] space-y-5 text-[#152A29]">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between">
          <h2 id="auth-modal-title" className="text-lg font-extrabold text-[#152A29]">
            {mode === 'login' && 'Entrar na sua Conta'}
            {mode === 'register' && 'Criar Conta no Superação'}
            {mode === 'reset' && 'Recuperar Senha'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar janela"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5B7170] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Alternadoras (Login / Cadastro) */}
        {mode !== 'reset' && (
          <div className="flex rounded-xl bg-[#F5F8F5] p-1 border border-[#C9DBD3]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearLoginError();
                setLocalFeedback(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#125F55] shadow-xs'
                  : 'text-[#5B7170] hover:text-[#152A29]'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                clearLoginError();
                setLocalFeedback(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#125F55] shadow-xs'
                  : 'text-[#5B7170] hover:text-[#152A29]'
              }`}
            >
              Criar Conta
            </button>
          </div>
        )}

        {/* Mensagens de Feedback / Erro */}
        {(localFeedback || loginError) && (
          <div
            role="alert"
            className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
              localFeedback?.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border border-amber-200 text-[#91610D]'
            }`}
          >
            {localFeedback?.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <p className="font-semibold leading-relaxed">
              {localFeedback?.message || loginError}
            </p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-display-name" className="block text-xs font-semibold text-[#5B7170] mb-1">
                Como gostaria de ser chamado(a)? (opcional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-[#5B7170]" />
                <input
                  id="auth-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#C9DBD3] text-sm focus:outline-none focus:ring-2 focus:ring-[#125F55]"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-[#5B7170] mb-1">
              Endereço de E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-[#5B7170]" />
              <input
                ref={emailInputRef}
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#C9DBD3] text-sm focus:outline-none focus:ring-2 focus:ring-[#125F55]"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="auth-password" className="block text-xs font-semibold text-[#5B7170]">
                  Senha
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      clearLoginError();
                      setLocalFeedback(null);
                    }}
                    className="text-[11px] font-bold text-[#125F55] hover:underline cursor-pointer"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-[#5B7170]" />
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#C9DBD3] text-sm focus:outline-none focus:ring-2 focus:ring-[#125F55]"
                />
              </div>
              {mode === 'register' && (
                <span className="text-[11px] text-[#5B7170] mt-1 block">
                  Mínimo de 6 caracteres.
                </span>
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#125F55] text-white rounded-xl font-bold text-sm hover:bg-[#0C5148] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Aguarde...</span>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Entrar na Conta'}
                    {mode === 'register' && 'Cadastrar e Começar'}
                    {mode === 'reset' && 'Enviar Link de Redefinição'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Rodapé de navegação do modo reset */}
        {mode === 'reset' && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearLoginError();
                setLocalFeedback(null);
              }}
              className="text-xs font-bold text-[#125F55] hover:underline cursor-pointer"
            >
              Voltar para o login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
