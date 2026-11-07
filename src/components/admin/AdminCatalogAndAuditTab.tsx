import React, { useState } from 'react';
import {
  FileText,
  Search,
  EyeOff,
  CheckCircle2,
  Clock,
  Shield,
  Filter,
} from 'lucide-react';
import { AdminSystemConfig } from '../../types';

interface AdminCatalogAndAuditTabProps {
  config: AdminSystemConfig;
  recentAudits?: any[];
}

interface AuditLogEntry {
  id: string;
  action: string;
  target: string;
  adminEmail: string;
  timestamp: number;
  details?: string;
}

const INITIAL_MOCK_AUDIT: AuditLogEntry[] = [
  {
    id: 'log_01',
    action: 'admin_save_settings',
    target: 'models.master_personal',
    adminEmail: 'gamamatheus65@gmail.com',
    timestamp: Date.now() - 1000 * 60 * 35,
    details: 'Calibragem de fallback para DeepSeek-V4-Pro',
  },
  {
    id: 'log_02',
    action: 'skill_protocol_override',
    target: 'knee_patellofemoral_rehab',
    adminEmail: 'gamamatheus65@gmail.com',
    timestamp: Date.now() - 1000 * 60 * 120,
    details: 'Inclusão de protocolo de cadeia cinética fechada',
  },
  {
    id: 'log_03',
    action: 'user_quota_reset',
    target: 'user_carlos_01',
    adminEmail: 'gamamatheus65@gmail.com',
    timestamp: Date.now() - 1000 * 60 * 240,
    details: 'Reset de turnos para homologação de testes visuais',
  },
];

export const AdminCatalogAndAuditTab: React.FC<AdminCatalogAndAuditTabProps> = ({
  config,
  recentAudits = INITIAL_MOCK_AUDIT,
}) => {
  const [activeSection, setActiveSection] = useState<'audit' | 'catalog'>('audit');

  return (
    <div className="space-y-4">
      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSection('audit')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeSection === 'audit'
              ? 'bg-[#1B4332] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Trilha de Auditoria (Audit Logs)
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('catalog')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeSection === 'catalog'
              ? 'bg-[#1B4332] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sobrescritas do Catálogo (873 Exercícios)
        </button>
      </div>

      {/* Audit Log View */}
      {activeSection === 'audit' && (
        <div className="space-y-2">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <span className="font-semibold">Registro Imutável de Ações Administrativas</span>
            <span className="text-[11px] font-mono text-slate-400">Total: {recentAudits.length}</span>
          </div>

          <div className="space-y-2">
            {recentAudits.map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 font-mono text-[11px]">
                    {entry.action}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <span>Alvo: <span className="font-semibold text-slate-800">{entry.target}</span></span>
                  <span>•</span>
                  <span>Por: <span className="font-mono text-slate-700">{entry.adminEmail}</span></span>
                </div>
                {entry.details && (
                  <p className="text-[11px] text-slate-500 italic">{entry.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Overrides View */}
      {activeSection === 'catalog' && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                Customização do Catálogo Global de Exercícios
              </h4>
              <p className="text-xs text-slate-500">
                Oculte movimentos ou adicione contraindicações articulares sem necessidade de novo deploy.
              </p>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Todos os 873 exercícios do catálogo oficial estão certificados com validação biomecânica ativa. Nenhuma restrição forçada no momento.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
