import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Save,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Play,
  AlertCircle,
} from 'lucide-react';
import { AdminSystemConfig, AdminApiKeyStatus } from '../../types';
import {
  saveAdminSystemConfig,
  saveAdminApiKey,
  testAdminModelConnection,
} from '../../lib/aiClient';

interface AdminGuardrailsTabProps {
  config: AdminSystemConfig;
  onConfigUpdated: (newConfig: AdminSystemConfig) => void;
  apiKeyStatus?: AdminApiKeyStatus | null;
  onApiKeyUpdated?: (newStatus: AdminApiKeyStatus) => void;
}

export const AdminGuardrailsTab: React.FC<AdminGuardrailsTabProps> = ({
  config,
  onConfigUpdated,
  apiKeyStatus,
  onApiKeyUpdated,
}) => {
  const [editingConfig, setEditingConfig] = useState<AdminSystemConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Estados da Gestão de API Key no Cofre
  const [activeKeyStatus, setActiveKeyStatus] = useState<AdminApiKeyStatus | null>(
    apiKeyStatus || null
  );
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keySaveSuccess, setKeySaveSuccess] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    preview: string;
  } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveAdminSystemConfig(editingConfig);
      onConfigUpdated(editingConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Erro ao salvar guardrails.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApiKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newKey.trim()) return;
    setIsSavingKey(true);
    setKeyError(null);
    setKeySaveSuccess(false);

    try {
      const res = await saveAdminApiKey(newKey);
      const updatedStatus: AdminApiKeyStatus = {
        isConfigured: true,
        maskedKey: res.maskedKey,
        source: 'admin_vault',
        updatedAt: res.updatedAt || Date.now(),
      };
      setActiveKeyStatus(updatedStatus);
      if (onApiKeyUpdated) {
        onApiKeyUpdated(updatedStatus);
      }
      setKeySaveSuccess(true);
      setNewKey('');
      setTimeout(() => setKeySaveSuccess(false), 4000);
    } catch (err: any) {
      setKeyError(err?.message || 'Falha ao salvar chave no cofre seguro.');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleTestKeyConnection = async () => {
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const res = await testAdminModelConnection('master_personal', 'zai-org/GLM-5.3');
      setTestResult({
        success: res.success,
        latencyMs: res.latencyMs,
        preview: res.responsePreview,
      });
    } catch {
      setTestResult({
        success: false,
        latencyMs: 0,
        preview: 'Erro ao testar conexão com o modelo titular.',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-900">
            Limites Financeiros e Travas de Segurança
          </h4>
          <p className="text-xs text-slate-500">
            Proteção estrita contra consumo excessivo de cota ou abusos de API.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-[#1B4332] hover:bg-[#12372A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{saveSuccess ? 'Salvo!' : 'Salvar Guardrails'}</span>
        </button>
      </div>

      {/* Cofre Seguro de Credenciais: API Key DeepInfra */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900">
                  Cofre Seguro de Credenciais (DeepInfra API Key)
                </h4>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Zero-Trust
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Armazenamento blindado no servidor com regras restritas. O navegador nunca recebe ou expõe o token original após gravado.
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {activeKeyStatus?.isConfigured ? (
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ativa:</span>
                <code className="font-mono text-xs">{activeKeyStatus.maskedKey}</code>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Modo Simulação (R$ 0,00)</span>
              </div>
            )}
          </div>
        </div>

        {/* Informações de Origem e Última Rotação */}
        {activeKeyStatus?.isConfigured && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block font-medium">Origem da Chave:</span>
              <span className="font-bold text-slate-700">
                {activeKeyStatus.source === 'secret_manager'
                  ? 'Google Cloud Secret Manager (CLI)'
                  : 'Cofre do Servidor (system_secrets)'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Última Atualização:</span>
              <span className="font-bold text-slate-700">
                {activeKeyStatus.updatedAt
                  ? new Date(activeKeyStatus.updatedAt).toLocaleString('pt-BR')
                  : 'Em execução padrão'}
              </span>
            </div>
          </div>
        )}

        {/* Input e Ações */}
        <form onSubmit={handleSaveApiKey} className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Cadastrar ou Rotacionar Nova Chave DeepInfra:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="sk-deep-xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showKey ? 'Ocultar' : 'Exibir'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSavingKey || !newKey.trim()}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#1B4332] hover:bg-[#12372A] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {isSavingKey ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{keySaveSuccess ? 'Chave Salva!' : 'Salvar no Cofre'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestKeyConnection}
                disabled={isTestingKey}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Testa conexão com o modelo titular"
              >
                {isTestingKey ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Testar Conexão</span>
              </button>
            </div>
          </div>

          {keyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{keyError}</span>
            </div>
          )}

          {keySaveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Chave criptografada e armazenada com sucesso no cofre seguro!</span>
            </div>
          )}

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                testResult.success
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {testResult.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  {testResult.success ? 'Conexão Bem-Sucedida' : 'Falha no Teste de Conexão'}
                </span>
                <span className="font-mono text-[11px] text-slate-500">{testResult.latencyMs}ms</span>
              </div>
              <p className="text-[11px] text-slate-600 font-mono truncate">{testResult.preview}</p>
            </div>
          )}
        </form>
      </div>

      {/* Emergency Kill Switch */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          editingConfig.emergencyKillSwitch
            ? 'bg-rose-50 border-rose-300'
            : 'bg-white border-slate-200 shadow-2xs'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                editingConfig.emergencyKillSwitch
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                Kill Switch de Emergência
                {editingConfig.emergencyKillSwitch && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                    ATIVADO
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md">
                Quando ativado, bloqueia imediatamente todas as requisições de IA para DeepInfra. O aplicativo continuará funcionando normalmente com o simulador determinístico local (R$ 0,00).
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={editingConfig.emergencyKillSwitch}
              onChange={(e) =>
                setEditingConfig((prev) => ({ ...prev, emergencyKillSwitch: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
          </label>
        </div>
      </div>

      {/* Financial Hard Stops */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Hard Stop Diário (USD)</span>
          </div>
          <p className="text-xs text-slate-500">
            Interrompe chamadas de IA se o custo diário ultrapassar este valor.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400">$</span>
            <input
              type="number"
              step="0.5"
              value={editingConfig.dailyHardStopUsd}
              onChange={(e) =>
                setEditingConfig((prev) => ({
                  ...prev,
                  dailyHardStopUsd: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Hard Stop Mensal (USD)</span>
          </div>
          <p className="text-xs text-slate-500">
            Limite máximo de gasto mensal de inferência no DeepInfra.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400">$</span>
            <input
              type="number"
              step="5"
              value={editingConfig.monthlyHardStopUsd}
              onChange={(e) =>
                setEditingConfig((prev) => ({
                  ...prev,
                  monthlyHardStopUsd: parseFloat(e.target.value) || 0,
                }))
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Per User Daily Quotas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Cota Diária de Turnos por Usuário</span>
          </div>
          <p className="text-xs text-slate-500">
            Máximo de interações de texto com o Personal por dia.
          </p>
          <input
            type="number"
            value={editingConfig.dailyUserTurnQuota}
            onChange={(e) =>
              setEditingConfig((prev) => ({
                ...prev,
                dailyUserTurnQuota: parseInt(e.target.value, 10) || 0,
              }))
            }
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
          />
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Lock className="w-4 h-4 text-purple-600" />
            <span>Cota Diária de Áudio (Micro-áudios)</span>
          </div>
          <p className="text-xs text-slate-500">
            Máximo de transcrições de voz (Qwen3-ASR) por usuário por dia.
          </p>
          <input
            type="number"
            value={editingConfig.dailyUserAudioQuota}
            onChange={(e) =>
              setEditingConfig((prev) => ({
                ...prev,
                dailyUserAudioQuota: parseInt(e.target.value, 10) || 0,
              }))
            }
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
          />
        </div>
      </div>
    </div>
  );
};
