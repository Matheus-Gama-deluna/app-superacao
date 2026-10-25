import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import {
  User,
  LogOut,
  LogIn,
  Download,
  Volume2,
  VolumeX,
  Smartphone,
  ShieldCheck,
  Check,
  ArrowLeft,
  Clock,
  Sparkles,
} from 'lucide-react';
import { soundManager } from '../lib/audio';
import { APP_VERSION, APP_BUILD_DATE, AVOIDANCE_LABELS } from '../lib/storage';
import { EmailAuthModal } from '../components/EmailAuthModal';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { ensurePersistentStorage, getStorageEstimate, StorageEstimateResult } from '../lib/pwaNative';
import { Mail, HardDrive, Mic, Shield } from 'lucide-react';

interface ProfileViewProps {
  onClose: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onClose }) => {
  const { user, profile, isGuest, loginGoogle, logout, updateUserProfile, pendingConflict, resolveConflict } = useAuth();
  const { exportBackup, syncStatus } = useWorkout();

  const [displayName, setDisplayName] = useState<string>(profile.displayName || '');
  const [habitAnchor, setHabitAnchor] = useState<string>(profile.habitAnchor || '');
  const [exerciseReason, setExerciseReason] = useState<string>(profile.exerciseReason || '');
  const [healthNotes, setHealthNotes] = useState<string>(profile.healthNotes || '');
  const [preferredTime, setPreferredTime] = useState<string>(profile.preferredTime || 'manha');
  const [availableDays, setAvailableDays] = useState<number[]>(profile.availableDays || [1, 3, 5]);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(profile.sessionDurationMinutes || 20);
  const [avoidedMovements, setAvoidedMovements] = useState<string[]>(profile.avoidedMovements || []);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [storageInfo, setStorageInfo] = useState<StorageEstimateResult | null>(null);
  const [voiceGuideEnabled, setVoiceGuideEnabled] = useState<boolean>(profile.voiceGuideEnabled ?? true);

  // Carrega estimativa de armazenamento local na montagem
  React.useEffect(() => {
    getStorageEstimate().then(setStorageInfo);
  }, []);

  const handlePersistStorage = async () => {
    await ensurePersistentStorage();
    const updated = await getStorageEstimate();
    setStorageInfo(updated);
  };

  const toggleVoiceGuide = () => {
    const next = !voiceGuideEnabled;
    setVoiceGuideEnabled(next);
    updateUserProfile({ voiceGuideEnabled: next });
  };

  // Fecha no Escape com retorno de foco (Critério C38)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const availableEquipmentsList = [
    { id: 'peso_corporal', label: 'Peso Corporal (Apenas o próprio corpo)' },
    { id: 'mini_band', label: 'Mini Band (Elástico circular fechado)' },
    { id: 'faixa_longa', label: 'Faixa Longa (Super Band)' },
    { id: 'tubos_elasticos', label: 'Tubos Elásticos com Pegadores' },
    { id: 'cadeira', label: 'Cadeira estável (como apoio)' },
    { id: 'parede', label: 'Espaço livre na parede' },
    { id: 'halteres', label: 'Halteres / Pesos livres' },
    { id: 'colchonete', label: 'Colchonete / Tapete' },
  ];

  const handleToggleEquipment = (id: string) => {
    const current = profile.equipments || [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    updateUserProfile({ equipments: next.length === 0 ? ['peso_corporal'] : next });
  };

  const handleToggleDay = (dayIdx: number) => {
    if (availableDays.includes(dayIdx)) {
      if (availableDays.length === 1) return;
      setAvailableDays(availableDays.filter((d) => d !== dayIdx));
    } else {
      setAvailableDays([...availableDays, dayIdx].sort());
    }
  };

  const handleToggleAvoidMovement = (movId: string) => {
    if (avoidedMovements.includes(movId)) {
      setAvoidedMovements(avoidedMovements.filter((x) => x !== movId));
    } else {
      setAvoidedMovements([...avoidedMovements, movId]);
    }
  };

  const handleSaveProfile = async () => {
    await updateUserProfile({
      displayName: displayName.trim(),
      habitAnchor: habitAnchor.trim(),
      exerciseReason: exerciseReason.trim(),
      healthNotes: healthNotes.trim(),
      preferredTime: preferredTime as 'manha' | 'tarde' | 'noite' | 'flexivel',
      availableDays,
      sessionDurationMinutes,
      avoidedMovements,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.app || parsed.app !== 'Superação') {
          alert('Arquivo inválido. Certifique-se de que é um backup do Superação.');
          return;
        }

        const confirmRestore = window.confirm(
          'Deseja restaurar seus dados a partir deste backup? Seus registros atuais serão atualizados.'
        );
        if (!confirmRestore) return;

        if (parsed.profile) localStorage.setItem('superacao_user_profile', JSON.stringify(parsed.profile));
        if (parsed.plans) localStorage.setItem('superacao_plans', JSON.stringify(parsed.plans));
        if (parsed.sessions) localStorage.setItem('superacao_sessions', JSON.stringify(parsed.sessions));
        if (parsed.setEvents) localStorage.setItem('superacao_set_events', JSON.stringify(parsed.setEvents));
        if (parsed.calendar) localStorage.setItem('superacao_calendar', JSON.stringify(parsed.calendar));
        if (parsed.prs) localStorage.setItem('superacao_personal_records', JSON.stringify(parsed.prs));

        alert('Backup restaurado com sucesso! A página será atualizada.');
        window.location.reload();
      } catch (err) {
        alert('Erro ao processar o arquivo de backup. Formato JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllLocalData = () => {
    const confirm1 = window.confirm(
      'Tem certeza que deseja apagar todos os seus treinos e configurações locais?'
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      'Esta ação é definitiva e irreversível. Deseja realmente excluir todos os dados do aparelho?'
    );
    if (!confirm2) return;

    localStorage.clear();
    alert('Dados locais excluídos com sucesso. O aplicativo será reiniciado.');
    window.location.reload();
  };

  const toggleSound = () => {
    const next = !(profile.soundEnabled !== false);
    soundManager.setMuted(!next);
    updateUserProfile({ soundEnabled: next });
  };

  const toggleHaptic = () => {
    updateUserProfile({ hapticEnabled: !(profile.hapticEnabled !== false) });
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Top Bar do Perfil */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5B7170] hover:text-[#152A29] p-1.5 rounded-lg cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
        <span className="text-xs font-bold text-[#125F55] uppercase tracking-wider">
          Perfil & Configurações
        </span>
        <div className="w-12" />
      </div>

      {/* Conta e Sincronização */}
      <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#EAF3EF] border border-[#C9DBD3] flex items-center justify-center text-[#125F55] font-black text-lg shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={profile.displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#152A29]">
              {user ? user.displayName || 'Usuário Conectado' : 'Modo Convidado Local'}
            </h3>
            <p className="text-xs text-[#5B7170]">
              {user ? user.email : 'Seus treinos e histórico estão salvos 100% no seu aparelho.'}
            </p>
          </div>
        </div>

        {/* Botão de Login ou Logout */}
        {user ? (
          <button
            onClick={logout}
            className="w-full py-2.5 rounded-xl border border-[#C9DBD3] text-[#B13D39] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Desconectar da Conta</span>
          </button>
        ) : (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] text-[#5B7170] leading-relaxed">
              Deseja salvar seu progresso na nuvem? Conecte sua conta para sincronizar entre aparelhos sem perder seus treinos locais.
            </p>
            <button
              onClick={loginGoogle}
              className="w-full py-2.5 rounded-xl bg-[#125F55] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#0C5148] shadow-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Conectar com Conta Google</span>
            </button>
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="w-full py-2.5 rounded-xl border border-[#C9DBD3] bg-white text-[#152A29] text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#125F55]" />
              <span>Entrar ou Criar com E-mail</span>
            </button>
          </div>
        )}
      </section>

      {/* Identidade e Âncora de Hábito */}
      <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-3.5">
        <h4 className="text-xs font-bold text-[#125F55] uppercase tracking-wider">
          Sua Rotina de Superação
        </h4>

        <div>
          <label className="block text-xs font-bold text-[#152A29] mb-1">Como quer ser chamado?</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl border border-[#C9DBD3] text-xs text-[#152A29] focus:outline-none focus:border-[#125F55]"
          />
        </div>

        <div>
          <label htmlFor="profile-habit-anchor" className="block text-xs font-bold text-[#152A29] mb-1">
            Sua Âncora de Hábito (Quando você treina?)
          </label>
          <input
            id="profile-habit-anchor"
            type="text"
            value={habitAnchor}
            onChange={(e) => setHabitAnchor(e.target.value)}
            placeholder="Ex: Logo após o café da manhã / Antes do banho da noite"
            className="w-full h-10 px-3.5 rounded-xl border border-[#C9DBD3] text-xs text-[#152A29] focus:outline-none focus:border-[#125F55]"
          />
          <p className="text-[10px] text-[#5B7170] mt-1">
            Vincular seu treino a uma rotina existente ajuda a manter a prática suave e consistente.
          </p>
        </div>

        <div>
          <label htmlFor="profile-exercise-reason" className="block text-xs font-bold text-[#152A29] mb-1">
            Seu Porquê Pessoal (O que te inspira a treinar?)
          </label>
          <input
            id="profile-exercise-reason"
            type="text"
            value={exerciseReason}
            onChange={(e) => setExerciseReason(e.target.value)}
            placeholder="Ex: Ter disposição para brincar com meus filhos"
            className="w-full h-10 px-3.5 rounded-xl border border-[#C9DBD3] text-xs text-[#152A29] focus:outline-none focus:border-[#125F55]"
          />
        </div>

        <div>
          <label htmlFor="profile-health-notes" className="block text-xs font-bold text-[#152A29] mb-1">
            Observações de Saúde e Articulações (Opcional)
          </label>
          <input
            id="profile-health-notes"
            type="text"
            value={healthNotes}
            onChange={(e) => setHealthNotes(e.target.value)}
            placeholder="Ex: Desconforto leve no joelho esquerdo"
            className="w-full h-10 px-3.5 rounded-xl border border-[#C9DBD3] text-xs text-[#152A29] focus:outline-none focus:border-[#125F55]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#152A29] mb-1.5">
            Turno Preferido para Treinar
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'manha', label: 'Manhã' },
              { id: 'tarde', label: 'Tarde' },
              { id: 'noite', label: 'Noite' },
              { id: 'flexivel', label: 'Flexível' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={preferredTime === t.id}
                onClick={() => setPreferredTime(t.id)}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  preferredTime === t.id
                    ? 'bg-[#125F55] text-white border-[#125F55]'
                    : 'bg-white text-[#152A29] border-[#C9DBD3] hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dias Disponíveis para Treino */}
        <div>
          <label className="block text-xs font-bold text-[#152A29] mb-1.5">
            Dias Disponíveis na Semana ({availableDays.length} selecionados)
          </label>
          <div className="grid grid-cols-7 gap-1.5">
            {[
              { idx: 0, label: 'D' },
              { idx: 1, label: 'S' },
              { idx: 2, label: 'T' },
              { idx: 3, label: 'Q' },
              { idx: 4, label: 'Q' },
              { idx: 5, label: 'S' },
              { idx: 6, label: 'S' },
            ].map((d) => {
              const fullDayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
              const isSelected = availableDays.includes(d.idx);
              return (
                <button
                  key={d.idx}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={fullDayNames[d.idx]}
                  onClick={() => handleToggleDay(d.idx)}
                  className={`h-10 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#125F55] text-white shadow-xs'
                      : 'bg-[#F5F8F5] text-[#5B7170] border border-[#C9DBD3] hover:border-[#125F55]'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duração Desejada por Sessão */}
        <div>
          <label className="block text-xs font-bold text-[#152A29] mb-1.5">
            Tempo Dedicado por Treino
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {[5, 10, 15, 20, 30, 45].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSessionDurationMinutes(mins)}
                className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  sessionDurationMinutes === mins
                    ? 'bg-[#125F55] text-white shadow-xs'
                    : 'bg-[#F5F8F5] text-[#5B7170] border border-[#C9DBD3] hover:border-[#125F55]'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Cuidados e Movimentos Evitados */}
        <div>
          <label className="block text-xs font-bold text-[#152A29] mb-1.5">
            Movimentos que você prefere evitar
          </label>
          <div className="space-y-1.5">
            {Object.entries(AVOIDANCE_LABELS).map(([key, label]) => {
              const isAvoided = avoidedMovements.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleToggleAvoidMovement(key)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-2 cursor-pointer ${
                    isAvoided
                      ? 'border-amber-400 bg-amber-50 text-amber-900 font-semibold'
                      : 'border-[#C9DBD3] bg-[#F5F8F5] text-[#5B7170] hover:bg-slate-50'
                  }`}
                >
                  <span>{label}</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isAvoided ? 'border-amber-600 bg-amber-600 text-white' : 'border-[#C9DBD3]'
                  }`}>
                    {isAvoided && <Check className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          className="w-full py-3 rounded-xl bg-[#125F55] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#0C5148] shadow-sm transition-all cursor-pointer active:scale-[0.99]"
        >
          {isSaved ? <Check className="w-4 h-4 text-[#246747]" /> : null}
          <span>{isSaved ? 'Preferências Salvas!' : 'Salvar Alterações'}</span>
        </button>
      </section>

      {/* Equipamentos Disponíveis */}
      <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-[#125F55] uppercase tracking-wider">
          Seus Equipamentos Disponíveis
        </h4>
        <div className="space-y-2">
          {availableEquipmentsList.map((eq) => {
            const isChecked = (profile.equipments || []).includes(eq.id);
            return (
              <label
                key={eq.id}
                onClick={() => handleToggleEquipment(eq.id)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F5F8F5] border border-[#C9DBD3] cursor-pointer hover:border-[#125F55]"
              >
                <span className="text-xs font-medium text-[#152A29]">{eq.label}</span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="rounded text-[#125F55] focus:ring-[#125F55] w-4 h-4 cursor-pointer"
                />
              </label>
            );
          })}
        </div>
      </section>

      {/* Retorno Sensorial (Som e Vibração) */}
      <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-[#125F55] uppercase tracking-wider">
          Retorno Sensorial & Timers
        </h4>
        <div className="space-y-2">
          <button
            type="button"
            role="switch"
            aria-checked={profile.soundEnabled !== false}
            onClick={toggleSound}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F5F8F5] border border-[#C9DBD3] hover:border-[#125F55] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-[#152A29]">
              {profile.soundEnabled !== false ? <Volume2 className="w-4 h-4 text-[#125F55]" /> : <VolumeX className="w-4 h-4 text-[#5B7170]" />}
              <span>Sinais Sonoros Sutis no Descanso</span>
            </div>
            <span className="text-xs font-bold text-[#125F55]">
              {profile.soundEnabled !== false ? 'Ativado' : 'Silencioso'}
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={profile.hapticEnabled !== false}
            onClick={toggleHaptic}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F5F8F5] border border-[#C9DBD3] hover:border-[#125F55] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-[#152A29]">
              <Smartphone className="w-4 h-4 text-[#125F55]" />
              <span>Vibração Háptica no Celular</span>
            </div>
            <span className="text-xs font-bold text-[#125F55]">
              {profile.hapticEnabled !== false ? 'Ativado' : 'Desativado'}
            </span>
          </button>
        </div>
      </section>

      {/* Aplicativo & Armazenamento Offline (Fase 7) */}
      <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-3.5">
        <h4 className="text-xs font-bold text-[#125F55] uppercase tracking-wider">
          Aplicativo & Armazenamento Offline
        </h4>

        {/* Botão Visual / Status de Instalação do PWA */}
        <PWAInstallButton variant="full" />

        {/* Blindagem de Dados Locais (Persistent Storage API) */}
        <div className="p-3.5 rounded-2xl bg-[#F5F8F5] border border-[#C9DBD3] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#152A29] flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#125F55]" />
              <span>Memória Local do Celular</span>
            </span>
            <span className="font-semibold text-[#125F55] text-[11px]">
              {storageInfo?.isPersisted ? 'Protegida (Não-Volátil)' : 'Padrão do Navegador'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#5B7170]">
            <span>Uso: {storageInfo?.usageMb || '0'} MB de {storageInfo?.quotaMb || 'Livre'} MB</span>
            <span>{storageInfo?.isPersisted ? 'Blindado contra limpeza' : 'Pode ser limpo se o celular encher'}</span>
          </div>

          {!storageInfo?.isPersisted && (
            <button
              onClick={handlePersistStorage}
              className="w-full mt-1 py-2 px-3 rounded-xl bg-white border border-[#C9DBD3] text-[#125F55] text-xs font-bold hover:bg-[#EAF3EF] transition-colors cursor-pointer"
            >
              Blindar Armazenamento dos Treinos
            </button>
          )}
        </div>

        {/* Guia de Voz Offline do Coach */}
        <button
          type="button"
          role="switch"
          aria-checked={voiceGuideEnabled}
          onClick={toggleVoiceGuide}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F8F5] border border-[#C9DBD3] hover:border-[#125F55] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 text-xs font-medium text-[#152A29]">
            <Mic className="w-4 h-4 text-[#125F55]" />
            <span>Guia de Voz Offline no Fim do Descanso</span>
          </div>
          <span className="text-xs font-bold text-[#125F55]">
            {voiceGuideEnabled ? 'Ativado' : 'Silencioso'}
          </span>
        </button>
      </section>

      {/* Backup, Restauração e Privacidade (A19, A20) */}
      <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-[#125F55] uppercase tracking-wider">
          Privacidade & Gerenciamento de Dados
        </h4>
        <p className="text-xs text-[#5B7170] leading-relaxed">
          O Superação não vende seus dados e garante que seu histórico é 100% seu. Você pode exportar, importar backups ou apagar dados locais a qualquer momento.
        </p>

        <div className="space-y-2 pt-1">
          <button
            onClick={exportBackup}
            className="w-full py-2.5 rounded-xl border border-[#C9DBD3] text-[#125F55] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#EAF3EF] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Backup Completo (JSON)</span>
          </button>

          <label className="w-full py-2.5 rounded-xl border border-[#C9DBD3] text-[#5B7170] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer">
            <span>Restaurar Backup a partir de Arquivo JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            onClick={handleClearAllLocalData}
            className="w-full py-2.5 rounded-xl border border-red-200 text-[#B13D39] text-xs font-semibold hover:bg-red-50 cursor-pointer pt-2"
          >
            Excluir Todos os Dados Locais
          </button>
        </div>
      </section>

      {/* Identificação de Versão e Compilação (Seção 13, Critério C40) */}
      <footer className="text-center space-y-1 pt-2 pb-6 text-xs text-[#5B7170]">
        <p className="font-bold text-[#152A29]">
          Superação · v{APP_VERSION} (Build {APP_BUILD_DATE})
        </p>
        <p className="text-[11px] max-w-xs mx-auto text-[#5B7170]">
          Versão local v{APP_VERSION} em execução. Dados e recordes preservados com segurança neste dispositivo.
        </p>
      </footer>

      {/* Modal de Autenticação por E-mail */}
      <EmailAuthModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />

      {/* Modal de Resolução de Conflito de Conta (Critério C34) */}
      {pendingConflict && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-[#C9DBD3] shadow-xl">
            <h3 className="text-base font-bold text-[#152A29]">
              Conflito de Dados Detectado
            </h3>
            <p className="text-xs text-[#5B7170] leading-relaxed">
              Sua conta Google já possui um histórico gravado, e você também realizou treinos neste dispositivo. Como deseja prosseguir?
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => resolveConflict('merge_local')}
                className="w-full p-3.5 rounded-2xl bg-[#125F55] text-white font-bold text-xs hover:bg-[#0C5148] transition-all cursor-pointer min-h-[48px]"
              >
                Mesclar treinos deste aparelho com a conta
              </button>
              <button
                onClick={() => resolveConflict('keep_remote')}
                className="w-full p-3.5 rounded-2xl border border-[#C9DBD3] bg-white text-[#152A29] font-semibold text-xs hover:bg-slate-50 transition-all cursor-pointer min-h-[48px]"
              >
                Manter apenas os dados da conta na nuvem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
