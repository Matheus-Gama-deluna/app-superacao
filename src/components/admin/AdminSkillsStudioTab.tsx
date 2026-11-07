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
    id: '01_red_flags_confef_ethics',
    name: '01 • Triagem de Red Flags & Ética CONFEF/CREF',
    category: 'clinical',
    summary: 'Bloqueio imediato de sinais vermelhos médicos e fronteiras legais CONFEF/CFM/CFN.',
    triggerCondition: 'Sempre ativa no prefixo + gatilhos de dor torácica, dispneia, síncope ou parestesia.',
    protocolPreview: 'Sinais absolutos bloqueiam prescrição e orientam avaliação médica presencial. Nunca diagnostica patologias nem altera prescrição permanente de Professor Parceiro.',
  },
  {
    id: '02_acsm2026_volume_hypertrophy_strength',
    name: '02 • ACSM 2026 & Volume Semanal Fracionado',
    category: 'periodization',
    summary: 'Dose Mínima Eficaz (4–6 séries/padrão) e hipertrofia dedicada (10–16 séries).',
    triggerCondition: 'Metas de hipertrofia, força, massa muscular ou montagem de ficha.',
    protocolPreview: 'Séries diretas = 1.0; sinergistas = 0.5. Priorizar movimentos compostos multiarticulares no início da sessão.',
  },
  {
    id: '03_autoregulation_rir_fatigue_deload',
    name: '03 • Autorregulação (RIR/RPE) & Fadiga',
    category: 'periodization',
    summary: 'Prescrição em 2–3 RIR, Modo Suave (-25%) e rampa de retomada pós-pausa.',
    triggerCondition: 'Relatos de cansaço, sono ruim, estresse ou retorno após hiato.',
    protocolPreview: 'Reduzir 1 série por exercício e ampliar descansos em dias de sono ruim ou sRPE > 4.5. Retomada gradual após >7 dias parado.',
  },
  {
    id: '04_home_biomechanics_resistance_curves',
    name: '04 • Biomecânica Domiciliar & Curvas Elásticas',
    category: 'biomechanics',
    summary: 'Diferenciação de mini band, faixa longa, tubos, peso corporal e alavancas.',
    triggerCondition: 'Treinos em casa, hotel, elásticos, parede ou cadeira.',
    protocolPreview: 'Compensar curva ascendente de elásticos com isometria de pico (2s) e excêntrica controlada (3–4s). Modular alavanca corporal.',
  },
  {
    id: '05_spine_lumbar_cervical_care',
    name: '05 • Coluna Lombar, Cervical & Core (McGill)',
    category: 'clinical',
    summary: 'Estabilidade 3D anti-movimento e eliminação de carga axial desconfortável.',
    triggerCondition: 'Menções a lombar, coluna, hérnia, ciático, pescoço ou trapézio.',
    protocolPreview: 'Priorizar anti-extensão (dead bug), anti-flexão lateral e quadril neutro. Evitar abdominais tradicionais com flexão lombar sob dor.',
  },
  {
    id: '06_lower_limb_knee_hip_tendon',
    name: '06 • Joelho, Patela & Quadril (JOSPT)',
    category: 'clinical',
    summary: 'Proteção femoropatelar, modulação de amplitude e cadeia póstero-lateral.',
    triggerCondition: 'Menções a joelho, patela, condromalácia, estalo ou quadril.',
    protocolPreview: 'Reduzir compressão patelar evitando flexão >60–90° sob dor; priorizar elevação pélvica, cadeira alta, ostra lateral e isometria analgésica.',
  },
  {
    id: '07_upper_limb_shoulder_wrist_care',
    name: '07 • Ombro, Escápula, Manguito & Punho',
    category: 'clinical',
    summary: 'Plano escapular (30–45°), razão puxar:empurrar 1.5:1 e alívio de punho.',
    triggerCondition: 'Menções a ombro, manguito, bursite, punho, pulso ou cotovelo.',
    protocolPreview: 'Preferir pegada neutra e apoios elevados/antebraço em vez de palma espalmada em dorsiflexão máxima no solo.',
  },
  {
    id: '08_longevity_sarcopenia_vestibular',
    name: '08 • Longevidade 55+, Sarcopenia & Vestibular',
    category: 'clinical',
    summary: 'Potência segura EWGSOP2, equilíbrio assistido e blocos sem vertigem.',
    triggerCondition: 'Praticantes 55+/60+, osteopenia, labirintite ou receio de quedas.',
    protocolPreview: 'Agrupar posturas em pé/sentadas evitando transições rápidas solo-pé; usar cadeira/parede próxima para segurança.',
  },
  {
    id: '09_cardiometabolic_female_physiology',
    name: '09 • Cardiometabólica, GLP-1 & Fisiologia Feminina',
    category: 'clinical',
    summary: 'Respiração sem Valsalva (hipertensão), preservação magra em GLP-1 e climatério.',
    triggerCondition: 'Hipertensão, diabetes, GLP-1, gestação/pós-parto, diástase ou menopausa.',
    protocolPreview: 'Expiração rítmica contínua sem bloqueio de ar; estímulo resistido 2–3x/sem para preservação muscular e mineral óssea.',
  },
  {
    id: '10_mesocycle_periodization_ladders',
    name: '10 • Escadas Biomecânicas & Progressão Dupla',
    category: 'periodization',
    summary: 'Critérios objetivos para subir degrau biomecânico ou carga sem lesão.',
    triggerCondition: 'Evolução de ficha, recordes pessoais ou revisão de bloco.',
    protocolPreview: 'Atingir teto de repetições com RPE <= 3 por 2 sessões seguidas antes de elevar carga ou complexidade motora.',
  },
  {
    id: '11_motivational_interviewing_adherence',
    name: '11 • Entrevista Motivacional (OARS) & Adesão',
    category: 'behavioral',
    summary: 'Acolhimento sem culpa, TDAH/baixa fricção executiva e regra do nunca zerar.',
    triggerCondition: 'Desânimo, culpa por falhar, ansiedade ou sobrecarga mental.',
    protocolPreview: 'Zero linguagem punitiva. Validar 5 a 10 minutos como vitória real de identidade ativa; oferecer 1 passo claro por vez.',
  },
  {
    id: '12_visual_posture_equipment_triage',
    name: '12 • Triagem Multimodal de Postura & Equipamentos',
    category: 'biomechanics',
    summary: 'Leitura assistiva de fotos de anamnese para o Professor Parceiro.',
    triggerCondition: 'Submissões de anamnese com fotos posturais ou de ambiente.',
    protocolPreview: 'Reportar achados sempre como indicadores visuais para aferição presencial do treinador e mapear objetos seguros do ambiente.',
  },
  {
    id: '13_cardio_mobility_active_recovery',
    name: '13 • Treino Concorrente, Escritório & Descanso Ativo',
    category: 'biomechanics',
    summary: 'Integração com corrida/bike, pausas em pé sem suar e sessões regenerativas.',
    triggerCondition: 'Dias de descanso, caminhada, corrida, escritório ou alongamento.',
    protocolPreview: 'Mobilidade torácica, quadril e tornozelo (8–12 min, RPE 1–2) para fluxo sanguíneo e descompressão sem fadiga residual.',
  },
  {
    id: '14_martial_arts_combat_and_external_load',
    name: '14 • Artes Marciais, Combate & Carga Externa',
    category: 'biomechanics',
    summary: 'Soltura pós-tatame (Jiu-Jitsu/Muay Thai/Boxe), pegada/punho e registro externo.',
    triggerCondition: 'Menções a Jiu-Jitsu, Muay Thai, Judô, Boxe, luta, tatame ou esportes.',
    protocolPreview: 'Descompressão de punhos/antebraços sem apoio palmar no chão, quadril 90/90, torácica e controle de volume excêntrico pós-sparring.',
  },
  {
    id: '15_long_term_periodization_and_contingency',
    name: '15 • Programas de 8 Semanas & Kit de Contingência',
    category: 'periodization',
    summary: 'Gestão das 4 fases evolutivas (8 semanas) e planos para dias imprevistos.',
    triggerCondition: 'Gestão de programa completo, dias caóticos (<12 min) ou avanço de fase.',
    protocolPreview: '4 fases de 2 semanas (Adaptação -> Base -> Progressão -> Consolidação/Deload) + Planos Emergência 10 min, Suave e Regenerativo.',
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
