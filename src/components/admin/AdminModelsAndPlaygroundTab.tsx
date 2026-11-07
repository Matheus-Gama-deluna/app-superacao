import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AdminSystemConfig, AdminApiKeyStatus, AgentServiceId } from '../../types';
import { testAdminModelConnection, saveAdminSystemConfig } from '../../lib/aiClient';

interface AdminModelsAndPlaygroundTabProps {
  config: AdminSystemConfig;
  onConfigUpdated: (newConfig: AdminSystemConfig) => void;
  apiKeyStatus?: AdminApiKeyStatus | null;
}

export const AdminModelsAndPlaygroundTab: React.FC<AdminModelsAndPlaygroundTabProps> = ({
  config,
  onConfigUpdated,
  apiKeyStatus,
}) => {
  const [editingConfig, setEditingConfig] = useState<AdminSystemConfig>({ ...config });
  const [selectedAgent, setSelectedAgent] = useState<AgentServiceId>('master_personal');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    responsePreview: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleModelChange = (
    agentId: AgentServiceId,
    field: 'primaryModel' | 'fallbackModel' | 'temperature' | 'maxOutputTokens',
    value: any
  ) => {
    setEditingConfig((prev) => ({
      ...prev,
      models: {
        ...prev.models,
        [agentId]: {
          ...prev.models[agentId],
          [field]: value,
        },
      },
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveAdminSystemConfig(editingConfig);
      onConfigUpdated(editingConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Falha ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunPlaygroundTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const activeModel = editingConfig.models[selectedAgent]?.primaryModel;
      const res = await testAdminModelConnection(selectedAgent, activeModel);
      setTestResult(res);
    } catch {
      setTestResult({
        success: false,
        latencyMs: 0,
        responsePreview: 'Erro ao conectar com o modelo selecionado.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const agentLabels: Record<AgentServiceId, string> = {
    master_personal: 'Master Personal (Prescrição & Adaptação)',
    teacher_copilot: 'Teacher Copilot (Anamnese & Visão)',
    telemetry_analyst: 'Telemetry Analyst (Aderência & Pílulas)',
    habit_companion: 'Habit Companion (Check-ins & Rotina)',
    voice_asr: 'Voice ASR (Transcrição de Voz)',
    memory_embedder: 'Memory Embedder (Busca Vetorial M4)',
  };

  return (
    <div className="space-y-6">
      {/* Save bar */}
      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Sparkles className="w-4 h-4 text-[#2D6A4F]" />
            <span className="font-bold">Modelos e Parâmetros DeepInfra v2</span>
          </div>
          {apiKeyStatus?.isConfigured ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API Key: {apiKeyStatus.maskedKey}
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600 text-[11px] font-medium">
              Simulador Local (R$ 0,00)
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-4 py-2 bg-[#1B4332] hover:bg-[#12372A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          {isSaving ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{saveSuccess ? 'Salvo com Sucesso!' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* Models Configuration Grid */}
      <div className="space-y-3">
        {(Object.keys(editingConfig.models) as AgentServiceId[]).map((agentKey) => {
          const spec = editingConfig.models[agentKey];
          return (
            <div
              key={agentKey}
              className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#2D6A4F]" />
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    {agentLabels[agentKey]}
                  </h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-mono text-slate-600">
                  {agentKey}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Modelo Primário
                  </label>
                  <input
                    type="text"
                    value={spec.primaryModel}
                    onChange={(e) => handleModelChange(agentKey, 'primaryModel', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Modelo Fallback
                  </label>
                  <input
                    type="text"
                    value={spec.fallbackModel}
                    onChange={(e) => handleModelChange(agentKey, 'fallbackModel', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Temperatura ({spec.temperature})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={spec.temperature}
                    onChange={(e) =>
                      handleModelChange(agentKey, 'temperature', parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={spec.maxOutputTokens}
                    onChange={(e) =>
                      handleModelChange(agentKey, 'maxOutputTokens', parseInt(e.target.value, 10))
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Playground Test Section */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Play className="w-4 h-4 text-[#2D6A4F]" />
          Playground & Teste de Conexão R$ 0,00
        </h4>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value as AgentServiceId)}
            className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
          >
            {(Object.keys(editingConfig.models) as AgentServiceId[]).map((key) => (
              <option key={key} value={key}>
                {agentLabels[key]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleRunPlaygroundTest}
            disabled={isTesting}
            className="w-full sm:w-auto px-4 py-2 bg-[#1B4332] hover:bg-[#12372A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {isTesting ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Disparar Teste de Conexão</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs space-y-1 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>{testResult.success ? 'Conexão Bem-Sucedida' : 'Falha na Conexão'}</span>
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <Clock className="w-3 h-3" />
                {testResult.latencyMs}ms
              </span>
            </div>
            <p className="font-mono text-[11px] whitespace-pre-wrap">{testResult.responsePreview}</p>
          </div>
        )}
      </div>
    </div>
  );
};
