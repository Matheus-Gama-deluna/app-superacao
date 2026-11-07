import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Cpu,
  ShieldAlert,
  BookOpen,
  Users,
  FileText,
  ArrowLeft,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { AdminDailyMetrics, AdminSystemConfig, AdminApiKeyStatus } from '../types';
import { getAdminDashboardSnapshot } from '../lib/aiClient';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminModelsAndPlaygroundTab } from '../components/admin/AdminModelsAndPlaygroundTab';
import { AdminGuardrailsTab } from '../components/admin/AdminGuardrailsTab';
import { AdminSkillsStudioTab } from '../components/admin/AdminSkillsStudioTab';
import { AdminUsersManagerTab } from '../components/admin/AdminUsersManagerTab';
import { AdminCatalogAndAuditTab } from '../components/admin/AdminCatalogAndAuditTab';

interface AdminDashboardViewProps {
  onBackToApp: () => void;
  adminEmail?: string;
}

type AdminTabKey = 'overview' | 'models' | 'guardrails' | 'skills' | 'users' | 'catalog';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onBackToApp,
  adminEmail = 'gamamatheus65@gmail.com',
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabKey>('overview');
  const [metrics, setMetrics] = useState<AdminDailyMetrics | null>(null);
  const [config, setConfig] = useState<AdminSystemConfig | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<AdminApiKeyStatus | null>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminDashboardSnapshot();
      setMetrics(data.metrics);
      setConfig(data.config);
      setApiKeyStatus(data.apiKeyStatus || null);
      setRecentAudits(data.recentAudits || []);
    } catch (err) {
      console.error('[AdminDashboard] Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const tabs: Array<{ key: AdminTabKey; label: string; icon: React.FC<{ className?: string }> }> = [
    { key: 'overview', label: 'Visão Geral & Custos', icon: Activity },
    { key: 'models', label: 'Modelos & Playground', icon: Cpu },
    { key: 'guardrails', label: 'Guardrails & Travas', icon: ShieldAlert },
    { key: 'skills', label: 'Skills Studio (13)', icon: BookOpen },
    { key: 'users', label: 'Usuários & Cotas', icon: Users },
    { key: 'catalog', label: 'Catálogo & Auditoria', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <header className="bg-[#1B4332] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToApp}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-white"
            title="Voltar ao SuperAção"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D8F3DC]" />
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight">
                Painel do Administrador
              </h1>
              <span className="text-[10px] bg-[#2D6A4F] px-2 py-0.5 rounded-full font-semibold text-[#D8F3DC]">
                DeepInfra v2
              </span>
            </div>
            <p className="text-xs text-[#D8F3DC]/70 hidden sm:block">
              SuperAção • Gestão Central de Agentes, Modelos, Custos e Guardrails
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-[#D8F3DC]/70 block">Administrador Autenticado</span>
            <span className="text-xs font-mono font-semibold text-white">{adminEmail}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {isLoading && !metrics ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">Carregando métricas e configurações da nuvem...</p>
          </div>
        ) : (
          config &&
          metrics && (
            <div>
              {activeTab === 'overview' && (
                <AdminOverviewTab
                  metrics={metrics}
                  config={config}
                  onRefresh={fetchDashboardData}
                  isLoading={isLoading}
                />
              )}
              {activeTab === 'models' && (
                <AdminModelsAndPlaygroundTab
                  config={config}
                  apiKeyStatus={apiKeyStatus}
                  onConfigUpdated={(newConfig) => setConfig(newConfig)}
                />
              )}
              {activeTab === 'guardrails' && (
                <AdminGuardrailsTab
                  config={config}
                  apiKeyStatus={apiKeyStatus}
                  onApiKeyUpdated={(newStatus) => setApiKeyStatus(newStatus)}
                  onConfigUpdated={(newConfig) => setConfig(newConfig)}
                />
              )}
              {activeTab === 'skills' && (
                <AdminSkillsStudioTab
                  config={config}
                  onConfigUpdated={(newConfig) => setConfig(newConfig)}
                />
              )}
              {activeTab === 'users' && <AdminUsersManagerTab />}
              {activeTab === 'catalog' && (
                <AdminCatalogAndAuditTab config={config} recentAudits={recentAudits} />
              )}
            </div>
          )
        )}
      </main>
    </div>
  );
};
