import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { Cloud, CloudOff, RefreshCw, Trophy, User, Sparkles, Shield } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface TopStatusBarProps {
  onOpenProfile: () => void;
  onOpenAdmin?: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({ onOpenProfile, onOpenAdmin }) => {
  const { user, profile, isGuest } = useAuth();
  const { syncStatus, latestPRAnnouncement, clearPRAnnouncement } = useWorkout();

  const isSuperAdmin = Boolean(
    (user?.email && user.email.toLowerCase().trim() === 'gamamatheus65@gmail.com') ||
    (profile?.email && profile.email.toLowerCase().trim() === 'gamamatheus65@gmail.com') ||
    profile?.isAdmin === true
  );

  return (
    <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E4DDD3] px-2.5 sm:px-4 py-1.5 sm:py-2.5 pt-safe">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2.5">
        {/* Logo / Nome da Marca */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🌿</span>
          <div>
            <h1 className="text-base sm:text-lg font-serif font-bold text-[#19231E] leading-tight tracking-tight">
              Superação
            </h1>
            <p className="text-[10px] text-[#5D6E65] leading-none hidden sm:block">
              Progresso possível & hábitos
            </p>
          </div>
        </div>

        {/* Status de Sincronização & Rede */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Status de Persistência e Sincronização Verdadeiros (Seção 12, Critério C37) */}
          {!syncStatus.isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#91610D] text-xs font-medium" title="Sem conexão com a internet. Seus registros estão salvos neste aparelho.">
              <CloudOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salvo localmente (offline)</span>
              <span className="sm:hidden">Offline</span>
            </div>
          ) : syncStatus.error ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-[#B13D39] text-xs font-medium" title={syncStatus.error}>
              <span>Falha ao sincronizar</span>
            </div>
          ) : syncStatus.hasPendingWrites ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#91610D] text-xs font-medium animate-pulse" title="Gravado no aparelho, aguardando confirmação da nuvem.">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Alterações pendentes</span>
              <span className="sm:hidden">Gravando</span>
            </div>
          ) : isGuest ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF3EF] border border-[#C9DBD3] text-[#125F55] text-xs font-medium" title="Armazenamento no navegador deste aparelho. Conecte sua conta Google para sincronizar.">
              <span className="hidden sm:inline">Salvo neste dispositivo</span>
              <span className="sm:hidden">Salvo local</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#246747] text-xs font-medium" title="Sincronizado com sua conta do Google Firebase.">
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sincronizado</span>
            </div>
          )}

          {/* Botão de Instalação PWA */}
          <PWAInstallButton variant="compact" />

          {/* Atalho Direto para Painel do Super Admin */}
          {isSuperAdmin && onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-2.5 py-1.5 bg-[#1B4332] hover:bg-[#12372A] text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-[#2D6A4F]"
              title="Abrir Painel do Administrador (DeepInfra v2)"
              aria-label="Painel do Administrador"
            >
              <Shield className="w-3.5 h-3.5 text-[#D8F3DC]" />
              <span className="font-mono text-[11px]">Admin</span>
            </button>
          )}

          {/* Avatar / Perfil */}
          <button
            onClick={onOpenProfile}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-[#EAF3EF] border border-[#C9DBD3] flex items-center justify-center text-[#125F55] hover:bg-[#D9F277] hover:text-[#203826] transition-colors cursor-pointer shrink-0"
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
            className="ml-2 text-[#203826] hover:opacity-70 font-bold min-w-[36px] min-h-[36px] flex items-center justify-center p-1 rounded-lg hover:bg-black/5"
            title="Fechar celebração de recorde"
            aria-label="Fechar celebração de recorde pessoal"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
