import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { Cloud, CloudOff, RefreshCw, Trophy, User, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface TopStatusBarProps {
  onOpenProfile: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({ onOpenProfile }) => {
  const { user, profile, isGuest } = useAuth();
  const { syncStatus, latestPRAnnouncement, clearPRAnnouncement } = useWorkout();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#C9DBD3] px-4 py-3 pt-safe">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Logo / Nome da Marca */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#125F55] flex items-center justify-center text-white font-black text-sm shadow-xs">
            S
          </div>
          <div>
            <h1 className="text-base font-bold text-[#152A29] leading-tight tracking-tight">
              Superação
            </h1>
            <p className="text-[11px] text-[#5B7170] leading-none hidden sm:block">
              Progresso possível & hábitos
            </p>
          </div>
        </div>

        {/* Status de Sincronização & Rede */}
        <div className="flex items-center gap-2">
          {/* Status de Persistência e Sincronização Verdadeiros (Seção 12, Critério C37) */}
          {!syncStatus.isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#91610D] text-xs font-medium" title="Sem conexão com a internet. Seus registros estão salvos neste aparelho.">
              <CloudOff className="w-3.5 h-3.5" />
              <span>Salvo localmente (offline)</span>
            </div>
          ) : syncStatus.error ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[#B13D39] text-xs font-medium" title={syncStatus.error}>
              <span>Falha ao sincronizar</span>
            </div>
          ) : syncStatus.hasPendingWrites ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#91610D] text-xs font-medium animate-pulse" title="Gravado no aparelho, aguardando confirmação da nuvem.">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Alterações pendentes</span>
            </div>
          ) : isGuest ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF3EF] border border-[#C9DBD3] text-[#125F55] text-xs font-medium" title="Armazenamento no navegador deste aparelho. Conecte sua conta Google para sincronizar.">
              <span>Salvo neste dispositivo</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#246747] text-xs font-medium" title="Sincronizado com sua conta do Google Firebase.">
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sincronizado</span>
            </div>
          )}

          {/* Botão de Instalação PWA */}
          <PWAInstallButton compact />

          {/* Avatar / Perfil */}
          <button
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-[#EAF3EF] border border-[#C9DBD3] flex items-center justify-center text-[#125F55] hover:bg-[#D9F277] hover:text-[#203826] transition-colors cursor-pointer shrink-0"
            title="Abrir Perfil e Configurações"
            aria-label="Perfil do usuário"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt={profile.displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Banner de Celebração de Recorde Pessoal (PR) */}
      {latestPRAnnouncement && (
        <div className="max-w-4xl mx-auto mt-2 px-3 py-2 rounded-xl bg-[#D9F277] text-[#203826] text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#125F55] shrink-0" />
            <span>{latestPRAnnouncement}</span>
          </div>
          <button
            onClick={clearPRAnnouncement}
            className="ml-2 text-[#203826] hover:opacity-70 font-bold px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
