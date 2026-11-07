import React, { useState } from 'react';
import {
  Users,
  Search,
  RotateCcw,
  Ban,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
  Sparkles,
} from 'lucide-react';
import { manageAdminUserQuota } from '../../lib/aiClient';

interface ManagedUserItem {
  uid: string;
  displayName: string;
  email: string;
  turnsUsedToday: number;
  audioUsedToday: number;
  isBlocked: boolean;
  role: 'student' | 'teacher' | 'admin';
}

const INITIAL_MOCK_USERS: ManagedUserItem[] = [
  {
    uid: 'admin_matheus',
    displayName: 'Matheus Gama (Admin)',
    email: 'gamamatheus65@gmail.com',
    turnsUsedToday: 4,
    audioUsedToday: 1,
    isBlocked: false,
    role: 'admin',
  },
  {
    uid: 'user_carlos_01',
    displayName: 'Carlos Eduardo',
    email: 'carlos.edu@exemplo.com.br',
    turnsUsedToday: 18,
    audioUsedToday: 3,
    isBlocked: false,
    role: 'student',
  },
  {
    uid: 'user_renata_02',
    displayName: 'Renata Silva',
    email: 'renata.silva@exemplo.com.br',
    turnsUsedToday: 25,
    audioUsedToday: 5,
    isBlocked: false,
    role: 'student',
  },
  {
    uid: 'user_prof_marcos',
    displayName: 'Prof. Marcos Vinícius',
    email: 'prof.marcos@exemplo.com.br',
    turnsUsedToday: 8,
    audioUsedToday: 0,
    isBlocked: false,
    role: 'teacher',
  },
];

export const AdminUsersManagerTab: React.FC = () => {
  const [users, setUsers] = useState<ManagedUserItem[]>(INITIAL_MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedEmails, setRevealedEmails] = useState<Record<string, boolean>>({});
  const [actionLoadingUid, setActionLoadingUid] = useState<string | null>(null);

  const maskEmail = (email: string) => {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 3 ? `${name.slice(0, 3)}***` : `${name}***`;
    return `${maskedName}@${domain}`;
  };

  const handleResetQuota = async (uid: string) => {
    setActionLoadingUid(uid);
    try {
      await manageAdminUserQuota(uid, 'reset');
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, turnsUsedToday: 0, audioUsedToday: 0 } : u))
      );
    } finally {
      setActionLoadingUid(null);
    }
  };

  const handleToggleBlock = async (uid: string, currentlyBlocked: boolean) => {
    setActionLoadingUid(uid);
    try {
      await manageAdminUserQuota(uid, currentlyBlocked ? 'unblock' : 'block');
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, isBlocked: !currentlyBlocked } : u))
      );
    } finally {
      setActionLoadingUid(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header & LGPD Privacy Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2D6A4F]" />
            Gestão de Cotas & Privacidade LGPD
          </h4>
          <p className="text-xs text-slate-500">
            Dados pessoais mascarados por padrão. Somente administradores autorizados gerenciam cotas de IA.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2D6A4F]"
          />
        </div>
      </div>

      {/* Users Table / Cards */}
      <div className="space-y-2">
        {filteredUsers.map((user) => {
          const isEmailRevealed = revealedEmails[user.uid];
          const isAtTurnLimit = user.turnsUsedToday >= 25;

          return (
            <div
              key={user.uid}
              className="p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    {user.displayName}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'teacher'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {user.role}
                  </span>
                  {user.isBlocked && (
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold">
                      Bloqueado
                    </span>
                  )}
                </div>

                {/* Email with LGPD privacy toggle */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <span>{isEmailRevealed ? user.email : maskEmail(user.email)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setRevealedEmails((prev) => ({ ...prev, [user.uid]: !isEmailRevealed }))
                    }
                    className="p-0.5 hover:text-slate-800 rounded transition-colors cursor-pointer"
                    title={isEmailRevealed ? 'Ocultar e-mail' : 'Revelar e-mail'}
                  >
                    {isEmailRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Usage pill */}
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <span className={isAtTurnLimit ? 'text-amber-600 font-bold' : ''}>
                    Texto: {user.turnsUsedToday}/25 hoje
                  </span>
                  <span>•</span>
                  <span>Áudios: {user.audioUsedToday}/5 hoje</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleResetQuota(user.uid)}
                  disabled={actionLoadingUid === user.uid}
                  title="Zerar consumo de hoje para testes"
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resetar Cota</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleBlock(user.uid, user.isBlocked)}
                  disabled={actionLoadingUid === user.uid}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    user.isBlocked
                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                  }`}
                >
                  <Ban className="w-3 h-3" />
                  <span>{user.isBlocked ? 'Desbloquear' : 'Bloquear IA'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
