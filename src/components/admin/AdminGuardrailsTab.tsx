import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Save,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Lock,
} from 'lucide-react';
import { AdminSystemConfig } from '../../types';
import { saveAdminSystemConfig } from '../../lib/aiClient';

interface AdminGuardrailsTabProps {
  config: AdminSystemConfig;
  onConfigUpdated: (newConfig: AdminSystemConfig) => void;
}

export const AdminGuardrailsTab: React.FC<AdminGuardrailsTabProps> = ({
  config,
  onConfigUpdated,
}) => {
  const [editingConfig, setEditingConfig] = useState<AdminSystemConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
