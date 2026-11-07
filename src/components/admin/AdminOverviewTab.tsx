import React from 'react';
import {
  DollarSign,
  Activity,
  Layers,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Mic,
  ShieldAlert,
} from 'lucide-react';
import { AdminDailyMetrics, AdminSystemConfig } from '../../types';

interface AdminOverviewTabProps {
  metrics: AdminDailyMetrics;
  config: AdminSystemConfig;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  metrics,
  config,
  onRefresh,
  isLoading = false,
}) => {
  const isHealthy = !config.emergencyKillSwitch && config.aiEnabled;

  return (
    <div className="space-y-5">
      {/* System Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between ${
          isHealthy
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isHealthy ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
            }`}
          >
            {isHealthy ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="font-bold text-sm">
              {isHealthy ? 'Arquitetura de IA Operacional' : 'Atenção: Sistema de IA Restrito'}
            </h4>
            <p className="text-xs opacity-90">
              {config.emergencyKillSwitch
                ? 'Kill-switch de emergência ativado: todas as chamadas externas estão bloqueadas.'
                : 'DeepInfra v2 em execução com redundância automática e R$ 0,00 de custo em testes.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 bg-white/80 hover:bg-white rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Cost */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Custo Estimado Hoje</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-extrabold text-slate-900">
            ${metrics.estimatedCostUsd.toFixed(4)}
          </p>
          <span className="text-[10px] text-slate-400">
            Teto diário: ${config.dailyHardStopUsd.toFixed(2)}
          </span>
        </div>

        {/* Total Calls */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Chamadas Totais</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-extrabold text-slate-900">{metrics.totalCalls}</p>
          <span className="text-[10px] text-slate-400">
            Erros: {metrics.totalErrors} • Fallbacks: {metrics.totalFallbacksTriggered}
          </span>
        </div>

        {/* Tokens */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Tokens Processados</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-lg font-extrabold text-slate-900">
            {(metrics.totalInputTokens + metrics.totalOutputTokens).toLocaleString()}
          </p>
          <span className="text-[10px] text-indigo-600 font-semibold">
            {metrics.totalCachedTokens.toLocaleString()} cached (M1 prefix)
          </span>
        </div>

        {/* Safety & Red Flags */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Red Flags Bloqueadas</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-lg font-extrabold text-slate-900">{metrics.redFlagsBlocked}</p>
          <span className="text-[10px] text-slate-400">
            Propostas aceitas: {metrics.proposalsConfirmed}/{metrics.proposalsCreated}
          </span>
        </div>
      </div>

      {/* Breakdown by Agent */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Distribuição de Uso por Agente
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {Object.entries(metrics.callsByAgent || {}).map(([agentId, calls]) => (
            <div key={agentId} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700 block capitalize">
                {agentId.replace('_', ' ')}
              </span>
              <span className="text-base font-bold text-[#1B4332]">{calls}</span>
              <span className="text-[10px] text-slate-400 ml-1">chamadas</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
