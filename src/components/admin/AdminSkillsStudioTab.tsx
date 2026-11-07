import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Layers,
  Save,
  Sparkles,
} from 'lucide-react';
import { AdminSystemConfig } from '../../types';
import { saveAdminSkillOverride } from '../../lib/aiClient';

interface AdminSkillsStudioTabProps {
  config: AdminSystemConfig;
  onConfigUpdated: (newConfig: AdminSystemConfig) => void;
}

interface SkillInfo {
  id: string;
  name: string;
  category: 'clinical' | 'biomechanics' | 'behavioral' | 'periodization';
  summary: string;
  triggerCondition: string;
  protocolPreview: string;
}

const REGISTERED_SKILLS: SkillInfo[] = [
  {
    id: 'acsm_resistance_volume',
    name: 'ACSM 2026 Volume & Frequência',
    category: 'periodization',
    summary: 'Dose-resposta de volume semanal fracionado e frequência mínima eficaz.',
    triggerCondition: 'Montagem e auditoria de fichas de treino ou ajuste de volume.',
    protocolPreview: 'Volume fracionado semanal: 6 a 40 séries/grupo muscular/semana. Descanso mínimo de 48h entre estímulos pesados para o mesmo grupo.',
  },
  {
    id: 'biomechanical_movement_analysis',
    name: 'Análise Biomecânica de Movimento',
    category: 'biomechanics',
    summary: 'Vetores articulares, braço de momento, cisalhamento vs compressão.',
    triggerCondition: 'Queixas articulares ou prescrição de exercícios compostos.',
    protocolPreview: 'Identificar plano de movimento. Preferir exercícios de cadeia fechada em articulações com histórico de dor. Alinhar linha de ação da carga à linha articular.',
  },
  {
    id: 'knee_patellofemoral_rehab',
    name: 'Proteção Femoropatelar & Joelho',
    category: 'clinical',
    summary: 'Manejo de condromalácia, valgo dinâmico e estresse patelar.',
    triggerCondition: 'Menções a joelho, patela, condromalácia ou dor ao descer escadas.',
    protocolPreview: 'Evitar flexão de joelho > 90° sob carga livre. Fortalecer abdutores e rotadores externos do quadril (glúteo médio). Priorizar elevação pélvica e extensão terminal.',
  },
  {
    id: 'spine_lumbar_health',
    name: 'Saúde da Coluna & Estabilidade Lombar',
    category: 'clinical',
    summary: 'Preservação de neutro, ativação de core e controle de carga axial.',
    triggerCondition: 'Menções a lombar, hérnia de disco, dor nas costas.',
    protocolPreview: 'Eliminar flexão de tronco combinada com rotação sob carga. Priorizar Big 3 de McGill (Bird-dog, Curl-up modificado, Prancha lateral). Respiração diafragmática ativa.',
  },
  {
    id: 'shoulder_subacromial_comfort',
    name: 'Conforto Escapuloumeral & Manguito',
    category: 'clinical',
    summary: 'Impacto subacromial, rotação externa e estabilidade escapular.',
    triggerCondition: 'Menções a dor no ombro, manguito rotador ou estalo ao elevar o braço.',
    protocolPreview: 'Elevações preferencialmente no plano escapular (30° anterior ao frontal). Pegada neutra em desenvolvimentos e puxadas. Fortalecer serrátil anterior e manguito.',
  },
  {
    id: 'wrist_dorsiflexion_relief',
    name: 'Alívio de Punho & Apoios Elevados',
    category: 'clinical',
    summary: 'Manejo de dor em flexão dorsal e adaptações de solo.',
    triggerCondition: 'Menções a punho, dor ao apoiar a mão no chão, flexão de braço.',
    protocolPreview: 'Substituir apoio com palma no solo por pegada neutra em apoios elevados, halteres hexagonais ou prancha em antebraços.',
  },
  {
    id: 'biopsychosocial_adherence',
    name: 'Aderência Biopsicossocial & Hábitos',
    category: 'behavioral',
    summary: 'Modelo COM-B, coping planning e redução de fricção comportamental.',
    triggerCondition: 'Desânimo, pausas prolongadas, falta de tempo, estresse.',
    protocolPreview: 'Regra dos 5 minutos: validar qualquer movimento parcial. Linguagem acolhedora focada em autoeficácia, sem termos militarizados ou cobrança punitiva.',
  },
];

export const AdminSkillsStudioTab: React.FC<AdminSkillsStudioTabProps> = ({
  config,
  onConfigUpdated,
}) => {
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const [editingProtocols, setEditingProtocols] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const isSkillEnabled = (skillId: string) => {
    return config.skillsOverrides?.[skillId]?.isEnabled ?? true;
  };

  const handleToggleSkill = async (skillId: string) => {
    const currentState = isSkillEnabled(skillId);
    const newOverrides = {
      ...(config.skillsOverrides || {}),
      [skillId]: {
        ...(config.skillsOverrides?.[skillId] || {}),
        isEnabled: !currentState,
      },
    };
    const updated = { ...config, skillsOverrides: newOverrides };
    await saveAdminSkillOverride(skillId, !currentState);
    onConfigUpdated(updated);
  };

  const handleSaveProtocol = async (skillId: string) => {
    const customProtocol = editingProtocols[skillId];
    if (customProtocol === undefined) return;
    setSavingId(skillId);
    try {
      await saveAdminSkillOverride(skillId, isSkillEnabled(skillId), customProtocol);
      const newOverrides = {
        ...(config.skillsOverrides || {}),
        [skillId]: {
          ...(config.skillsOverrides?.[skillId] || {}),
          isEnabled: isSkillEnabled(skillId),
          customProtocolMarkdown: customProtocol,
        },
      };
      onConfigUpdated({ ...config, skillsOverrides: newOverrides });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#2D6A4F]" />
          Skills Studio: Ciência do Exercício & Fisiologia
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Arquitetura de Progressive Disclosure: camada 1 leve no prompt raiz, camada 2 injetada sob demanda conforme gatilhos do usuário.
        </p>
      </div>

      <div className="space-y-3">
        {REGISTERED_SKILLS.map((skill) => {
          const enabled = isSkillEnabled(skill.id);
          const isExpanded = expandedSkillId === skill.id;
          const currentProtocol =
            editingProtocols[skill.id] ??
            config.skillsOverrides?.[skill.id]?.customProtocolMarkdown ??
            skill.protocolPreview;

          return (
            <div
              key={skill.id}
              className={`p-4 bg-white border rounded-2xl transition-all shadow-2xs ${
                enabled ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{skill.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-100 text-slate-600">
                      {skill.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{skill.summary}</p>
                  <p className="text-[11px] text-[#2D6A4F] font-medium">
                    Gatilho: {skill.triggerCondition}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Enable / Disable toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleToggleSkill(skill.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2D6A4F]" />
                  </label>

                  {/* Expand protocol */}
                  <button
                    type="button"
                    onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Protocol Editor Drawer */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Protocolo Clínico da Skill (Camada 2 Markdown)</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      Editável em tempo real
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    value={currentProtocol}
                    onChange={(e) =>
                      setEditingProtocols((prev) => ({ ...prev, [skill.id]: e.target.value }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#2D6A4F]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveProtocol(skill.id)}
                      disabled={savingId === skill.id}
                      className="px-3 py-1.5 bg-[#1B4332] hover:bg-[#12372A] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      {savingId === skill.id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                      <span>Salvar Protocolo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
