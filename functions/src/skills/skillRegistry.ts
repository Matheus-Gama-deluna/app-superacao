/**
 * Registro das 15 Skills Científicas de Educação Física (v9.5 Produção)
 * Progressive Disclosure em 3 Camadas:
 * - Camada 1: Índice estático leve (~320 tokens no prefix cache)
 * - Camada 2: Protocolo denso injetado sob demanda (~450 a 650 tokens por skill, máx 4 por turno)
 * - Camada 3: Ferramentas determinísticas acopladas + Overrides em tempo real do Skills Studio Admin
 */

import { getAppDb, isFirestoreAvailable } from '../lib/db.js';

export interface ExerciseScienceSkill {
  id: string;
  title: string;
  indexSummary: string;
  autoTriggers: {
    limitationTags?: string[];
    keywords?: string[];
    hasPhotos?: boolean;
    frequencyOrGoal?: string[];
  };
  protocolMarkdown: string;
  coupledTools: string[];
}

export interface SkillOverrideRecord {
  isEnabled: boolean;
  customProtocolMarkdown?: string | null;
  updatedAt?: number;
  updatedBy?: string;
}

let cachedSkillOverrides: Record<string, SkillOverrideRecord> = {};
let skillOverridesCacheTime = 0;
const SKILL_OVERRIDES_TTL_MS = 60 * 1000;

export function invalidateSkillOverridesCache(): void {
  skillOverridesCacheTime = 0;
  cachedSkillOverrides = {};
}

export async function loadSkillOverridesFromDb(): Promise<Record<string, SkillOverrideRecord>> {
  const now = Date.now();
  if (skillOverridesCacheTime > 0 && now - skillOverridesCacheTime < SKILL_OVERRIDES_TTL_MS) {
    return cachedSkillOverrides;
  }

  if (!isFirestoreAvailable()) {
    skillOverridesCacheTime = now;
    return cachedSkillOverrides;
  }

  try {
    const db = getAppDb();
    const snap = await db.collection('system_config').doc('skills_overrides').get();
    if (snap.exists) {
      cachedSkillOverrides = (snap.data() as Record<string, SkillOverrideRecord>) || {};
    } else {
      cachedSkillOverrides = {};
    }
  } catch (err) {
    console.warn('[SkillRegistry] Aviso ao ler skills_overrides, mantendo padrão:', err);
  }

  skillOverridesCacheTime = now;
  return cachedSkillOverrides;
}

export const ALL_SCIENTIFIC_SKILLS: Record<string, ExerciseScienceSkill> = {
  '01_red_flags_confef_ethics': {
    id: '01_red_flags_confef_ethics',
    title: 'Triagem de Red Flags e Ética CONFEF/CREF',
    indexSummary: 'Identificação de sinais de alerta médicos e fronteira ética da Educação Física.',
    autoTriggers: {
      keywords: ['dor no peito', 'falta de ar', 'tontura', 'desmaio', 'formigamento', 'dormencia', 'perda de forca', 'trauma', 'febre', 'cirurgia recente'],
    },
    coupledTools: ['check_medical_red_flags'],
    protocolMarkdown: `### SKILL 01: Triagem de Red Flags e Limites Éticos CONFEF/CREF
- Sinais de Alerta Absolutos: dor torácica/anginosa, dispneia em repouso, síncope, irradiação neural com perda de reflexo/força ou parestesia progressiva, trauma agudo não avaliado ou febre.
- Regra de Conduta: Se detectado qualquer sinal de alerta, NÃO prescrever nem sugerir adaptação de treino pesado. Interromper imediatamente, acolher o relato e orientar busca por avaliação médica/fisioterapêutica formal.
- Princípio Ético CONFEF: Profissional de Educação Física prescreve exercício físico e gerencia sobrecarga mecânica adaptada. Não realiza diagnóstico nosológico de patologias nem trata lesões agudas, nem prescreve dietas restritivas ou medicamentos.`,
  },

  '02_acsm2026_volume_hypertrophy_strength': {
    id: '02_acsm2026_volume_hypertrophy_strength',
    title: 'ACSM 2026 & Volume Fracionado (Pelland/Schoenfeld)',
    indexSummary: 'Dosagem de volume semanal fracionado e equivalência de cargas.',
    autoTriggers: {
      frequencyOrGoal: ['hipertrofia', 'forca', 'massa_muscular', 'definicao'],
    },
    coupledTools: ['audit_weekly_fractional_volume', 'query_safe_exercises'],
    protocolMarkdown: `### SKILL 02: ACSM Position Stand 2026 & Volume Fracionado
- Consenso ACSM (Currier, Phillips, Schoenfeld et al.): Hipertrofia equivalente entre 30% e 85%+ de 1RM se os esforços forem levados próximos ao limiar efetivo (0-3 RIR).
- Volume Semanal Fracionado: Séries diretas = 1.0; séries em exercícios multiarticulares sinergistas = 0.5 por grupamento.
- Dose Mínima Eficaz (MED): 4 a 6 séries semanais por padrão funcional já produzem ganhos robustos de força e saúde em sessões curtas (15–25 min).
- Meta Hipertrófica Dedicada: 10 a 16 séries semanais por grupamento para rotinas com tempo disponível (30–45 min).
- Ordem Neuromuscular: Priorizar movimentos compostos multiarticulares no início da sessão quando o sistema nervoso central está descansado.`,
  },

  '03_autoregulation_rir_fatigue_deload': {
    id: '03_autoregulation_rir_fatigue_deload',
    title: 'Autorregulação, RIR e Gerenciamento de Fadiga',
    indexSummary: 'Prescrição por repetições em reserva (2-3 RIR), deload e retomada gradual.',
    autoTriggers: {
      keywords: ['cansado', 'exaustao', 'sono ruim', 'pesado', 'sem energia', 'parado ha tempo', 'voltando agora'],
    },
    coupledTools: ['audit_weekly_fractional_volume'],
    protocolMarkdown: `### SKILL 03: Autorregulação (RIR/RPE) & Prevenção de Fadiga
- Repetições em Reserva (RIR): Prescrever 2 a 3 RIR como alvo padrão. Evitar falha concêntrica involuntária frequente, que acumula fadiga neural desproporcional sem benefício hipertrófico adicional.
- Percepção Subjetiva de Esforço (sRPE Foster): Sessões com RPE > 4.5 repetidas exigem alívio de volume.
- Modo Suave (-25%): Quando o aluno relatar sono ruim, estresse elevado ou fadiga, reduzir 1 série por exercício e estender descansos em +15 a 30s.
- Rampa de Retomada Segura:
  * 7 a 14 dias ausente: Iniciar com 70% do volume anterior.
  * > 14 dias ausente: Primeira semana em ritmo de reiniciação (50% do volume, 3-4 RIR).`,
  },

  '04_home_biomechanics_resistance_curves': {
    id: '04_home_biomechanics_resistance_curves',
    title: 'Biomecânica Domiciliar e Curvas de Resistência Elástica',
    indexSummary: 'Mecânica de elásticos (ascendente) vs peso corporal e manipulação de tempo.',
    autoTriggers: {
      keywords: ['em casa', 'elastico', 'mini band', 'faixa longa', 'tubo', 'quarto', 'hotel'],
    },
    coupledTools: ['query_safe_exercises'],
    protocolMarkdown: `### SKILL 04: Biomecânica Domiciliar e Curva de Resistência
- Diferenciação Rígida de Elásticos: mini_band circular != faixa_longa aberta != tubos_elasticos com pegador. Nunca assumir equivalência de pegada ou amplitude.
- Curva Ascendente do Elástico: A tensão máxima ocorre no final da amplitude concêntrica. Para compensar a falta de carga inicial, utilizar isometria de pico (2s) e cadência excêntrica lenta (3-4s).
- Peso Corporal & Alavancas: Modular intensidade alterando o braço de momento (ex: flexão inclinada na parede -> cadeira -> solo) e trabalho unilateral (unipodal/unilateral).
- Otimização de Tempo: Supersets agonista-antagonista (ex: empurrar horizontal + puxar horizontal) reduzem o tempo da sessão sem comprometer a recuperação metabólica.`,
  },

  '05_spine_lumbar_cervical_care': {
    id: '05_spine_lumbar_cervical_care',
    title: 'Coluna Lombar, Cervical e Estabilidade de Core (McGill/JOSPT)',
    indexSummary: 'Manejo de lombalgia, hérnia discal, ciático e estabilidade tridimensional.',
    autoTriggers: {
      limitationTags: ['dor_lombar', 'lombar', 'hernia_discal', 'ciatico', 'cervical', 'postura'],
      keywords: ['coluna', 'lombar', 'costas', 'hernia', 'protusao', 'ciatico', 'pescoco', 'trapezio'],
    },
    coupledTools: ['query_safe_exercises'],
    protocolMarkdown: `### SKILL 05: Proteção da Coluna Vertebral (Diretrizes McGill/JOSPT)
- Princípio da Estabilidade Tridimensional: Priorizar exercícios anti-movimento (anti-extensão: prancha modificada/deadbug; anti-flexão lateral: ponte lateral/carregamento mala; anti-rotação: press pallof).
- Intolerância à Flexão Lombar (Hérnias/Protusões): Eliminar abdominais tradicionais com enrolamento de tronco. Ensinar dissociação lombo-pélvica (hip hinge neutro).
- Intolerância à Carga Axial: Substituir agachamento com barra nas costas ou compressão vertical por agachamento goblet, elevação pélvica ou apoio em banco.
- Desconforto Cervical/Trapézio: Evitar elevações acima da cabeça sob tensão extrema. Manter escápulas apoiadas e queixo recolhido neutro.`,
  },

  '06_lower_limb_knee_hip_tendon': {
    id: '06_lower_limb_knee_hip_tendon',
    title: 'Membros Inferiores, Joelho e Quadril (Condromalácia/JOSPT)',
    indexSummary: 'Proteção femoropatelar, modulação de amplitude e cadeia póstero-lateral.',
    autoTriggers: {
      limitationTags: ['dor_joelho', 'joelhos', 'condromalacia', 'quadril', 'patela'],
      keywords: ['joelho', 'patela', 'estalo', 'condromalacia', 'quadril', 'virilha', 'tendinite'],
    },
    coupledTools: ['query_safe_exercises'],
    protocolMarkdown: `### SKILL 06: Joelho, Quadril e Tendões (Consenso JOSPT)
- Síndrome Femoropatelar / Condromalácia: O estresse retropatelar cresce com flexões profundas em cadeia fechada (>60°-90°). Modular amplitude inicial confortável (agachamento caixa/cadeira a 60° ou ponte glútea).
- Efeito Analgésico da Isometria: Séries isométricas de 30-45s (como agachamento na parede em ângulo indolor) promovem inibição cortical e alívio de tendinopatias patelares.
- Fortalecimento da Cadeia Póstero-Lateral: Fortalecer glúteo médio e máximo (elevação pélvica, ostra lateral / abduções com mini band) para evitar o valgo dinâmico.
- Eliminação de Impacto: Substituir saltos e pliometria por movimentos controlados de baixa aceleração articular.`,
  },

  '07_upper_limb_shoulder_wrist_care': {
    id: '07_upper_limb_shoulder_wrist_care',
    title: 'Ombro, Escápula, Cotovelo e Punho (Manguito/JOSPT)',
    indexSummary: 'Plano escapular, conforto de manguito e alívio de punho no solo.',
    autoTriggers: {
      limitationTags: ['dor_ombro', 'ombros', 'dor_punho', 'punhos', 'manguito', 'cotovelo'],
      keywords: ['ombro', 'manguito', 'bursite', 'punho', 'pulso', 'cotovelo', 'epicondilite'],
    },
    coupledTools: ['query_safe_exercises'],
    protocolMarkdown: `### SKILL 07: Ombro, Manguito e Punho
- Conforto Escapular: Movimentos de elevação e empurrar devem respeitar o plano da escápula (30° a 45° anterior ao plano frontal), preferindo pegada neutra ou semipronada para ampliar o espaço subacromial.
- Razão Puxar:Empurrar: Garantir pelo menos 1.5 séries de puxadas (especialmente horizontais e neutras) para cada série de empurrar, restaurando a retração escapular.
- Alívio de Punho em Dorsiflexão: Substituir apoios em solo de mãos espalmadas por apoios em antebraço, punhos cerrados neutros, apoios elevados (parede/cadeira) ou exercícios em decúbito dorsal.`,
  },

  '08_longevity_sarcopenia_vestibular': {
    id: '08_longevity_sarcopenia_vestibular',
    title: 'Longevidade, Sarcopenia e Cuidado Vestibular (EWGSOP2)',
    indexSummary: 'Estímulo de potência para 55+, prevenção de quedas e evitar labirintite.',
    autoTriggers: {
      keywords: ['idoso', '55 anos', '60 anos', 'osteoporose', 'osteopenia', 'tontura', 'labirintite', 'desequilibrio', 'chao'],
    },
    coupledTools: ['query_safe_exercises'],
    protocolMarkdown: `### SKILL 08: Longevidade, Sarcopenia e Cuidado Vestibular
- Consensos EWGSOP2 / ICFSR: Preservar potência muscular (velocidade concêntrica intencional com carga controlada) para combater a dinapenia e proteger a autonomia funcional.
- Treino Neuromotor de Equilíbrio: Incluir posturas unipodais assistidas e transferências de peso com suporte seguro próximo (cadeira ou parede).
- Organização Postural por Blocos (Cuidado com Vertigem/Labirintite): Jamais alternar rapidamente entre exercícios em pé e deitados no solo. Se o aluno tiver histórico de labirintite, agrupar todos os exercícios em pé ou sentados.`,
  },

  '09_cardiometabolic_female_physiology': {
    id: '09_cardiometabolic_female_physiology',
    title: 'Fisiologia Cardiometabólica e Feminina',
    indexSummary: 'Hipertensão, respiração sem Valsalva, climatério e assoalho pélvico.',
    autoTriggers: {
      keywords: ['pressao alta', 'hipertensao', 'diabetes', 'menopausa', 'climaterio', 'diastase', 'pos parto', 'assoalho pelvico', 'glp1', 'ozempic', 'mounjaro'],
    },
    coupledTools: ['query_safe_exercises'],
    protocolMarkdown: `### SKILL 09: Cardiometabólica, GLP-1 & Fisiologia Feminina
- Hipertensão: Proibição estrita da manobra de Valsalva (prender o ar). Enfatizar expiração rítmica contínua durante o esforço. Evitar isometrias máximas sustentadas acima da cabeça.
- Preservação de Massa Magra (Emagrecimento / GLP-1): Priorizar estímulo mecânico resistido multiarticular (2-3x/semana) para proteger massa muscular e taxa metabólica basal.
- Climatério, Menopausa e Pós-Parto: Priorizar força resistida progressiva para saúde óssea e controle de pressão intra-abdominal com ativação coordenada do assoalho pélvico.`,
  },

  '10_mesocycle_periodization_ladders': {
    id: '10_mesocycle_periodization_ladders',
    title: 'Periodização de Mesociclo e Escadas Biomecânicas',
    indexSummary: 'Evolução estruturada de 4 semanas e progressão dupla de estímulo.',
    autoTriggers: {
      frequencyOrGoal: ['mesociclo', 'ciclo', 'evolucao_ficha', 'subir_degrau'],
    },
    coupledTools: ['audit_weekly_fractional_volume', 'query_safe_exercises'],
    protocolMarkdown: `### SKILL 10: Periodização de Mesociclo e Escadas Biomecânicas
- Progressão Dupla: Antes de aumentar carga ou trocar o degrau biomecânico da escada, o praticante deve atingir o teto de repetições com RPE <= 3 e técnica estável por 2 sessões consecutivas.
- Estrutura do Bloco:
  * Semana 1: Calibração e aquisição de padrão motor (RIR 3-4).
  * Semana 2: Consolidação e aumento gradual de reps (RIR 2-3).
  * Semana 3: Sobrecarga ótima com fluidez técnica (RIR 1-2).
  * Semana 4: Revisão e transição suave de estímulo.`,
  },

  '11_motivational_interviewing_adherence': {
    id: '11_motivational_interviewing_adherence',
    title: 'Entrevista Motivacional e Psicologia da Adesão',
    indexSummary: 'Comunicação acolhedora sem julgamento baseada em princípios OARS.',
    autoTriggers: {
      keywords: ['desanimo', 'preguica', 'culpa', 'falhei', 'nao consegui', 'frustrado', 'ansiedade', 'tdah', 'travado'],
    },
    coupledTools: [],
    protocolMarkdown: `### SKILL 11: Entrevista Motivacional (MI) & Psicologia da Adesão
- Princípios OARS: Perguntas abertas enxutas, Afirmação sincera do esforço, Escuta reflexiva (validando emoções) e Resumos práticos.
- Zero Linguagem Punitiva: Jamais usar termos de cobrança. Usar validação empática ("Semanas atípicas acontecem. Qualquer 5 a 10 minutos que você fizer hoje já mantém sua identidade ativa viva").
- Baixa Fricção Executiva: Quando o praticante estiver sobrecarregado mentalmente, ofereça 1 única escolha clara e curta em vez de listas longas.`,
  },

  '12_visual_posture_equipment_triage': {
    id: '12_visual_posture_equipment_triage',
    title: 'Triagem Postural Visual e Identificação de Equipamentos',
    indexSummary: 'Leitura estruturada de fotos da anamnese como hipótese para o professor.',
    autoTriggers: {
      hasPhotos: true,
    },
    coupledTools: ['query_safe_exercises'],
    protocolMarkdown: `### SKILL 12: Análise Visual de Postura e Equipamentos
- Triagem Postural Multimodal: Inspecionar simetria escapulotorácica, nivelamento de pelve e alinhamento de joelho. Registrar as observações SEMPRE como "indicadores visuais sugeridos para aferição presencial do professor", respeitando o protagonismo do profissional de Educação Física.
- Identificação de Equipamentos: Mapear na foto do ambiente objetos funcionais utilizáveis com segurança (pares de halteres, cadeiras firmes, tapetes, faixas) e alimentar detectedEquipments de forma confiável.`,
  },

  '13_cardio_mobility_active_recovery': {
    id: '13_cardio_mobility_active_recovery',
    title: 'Treinamento Concorrente, Mobilidade e Descanso Ativo',
    indexSummary: 'Integração de corrida/caminhada com força e sessões regenerativas.',
    autoTriggers: {
      keywords: ['caminhada', 'corrida', 'pedalar', 'bike', 'natacao', 'alongamento', 'mobilidade', 'descanso ativo', 'escritorio', 'sentado'],
    },
    coupledTools: ['query_safe_exercises'],
    protocolMarkdown: `### SKILL 13: Treinamento Concorrente, Pausa de Escritório e Descanso Ativo
- Gerenciamento de Interferência: Práticas aeróbicas intensas (corrida/ciclismo longo) pedem alívio de volume excêntrico de pernas nas 24h seguintes.
- Sessões de Descanso Ativo & Pausas de Escritório: Mobilidade torácica, flexores de quadril, tornozelo e descompressão cervical (8–12 min, RPE 1-2) restauram amplitude articular e fluxo sanguíneo sem gerar fadiga residual.`,
  },

  '14_martial_arts_combat_and_external_load': {
    id: '14_martial_arts_combat_and_external_load',
    title: 'Artes Marciais, Esportes de Combate e Carga Externa (BJJ/Muay Thai/Lutas)',
    indexSummary: 'Recuperação pós-tatame, proteção de pegada/punho/quadril e registro externo.',
    autoTriggers: {
      limitationTags: ['pegada_fadigada', 'pos_luta'],
      keywords: [
        'jiu-jitsu',
        'jiu jitsu',
        'bjj',
        'muay thai',
        'boxe',
        'judo',
        'karate',
        'taekwondo',
        'mma',
        'luta',
        'tatame',
        'arte marcial',
        'artes marciais',
        'kimono',
        'pegada',
        'sparring',
        'futebol',
        'beach tennis',
      ],
      frequencyOrGoal: ['artes_marciais', 'combate'],
    },
    coupledTools: ['query_safe_exercises'],
    protocolMarkdown: `### SKILL 14: Artes Marciais, Esportes de Combate e Carga Externa
- Fisiologia do Tatame/Ringue: Lutas de agarramento (Jiu-Jitsu/Judô) geram alta fadiga isométrica em flexores de dedos/punhos, antebraços, cadeia posterior/lombar (guarda/postura) e manguito rotador. Lutas de trocação (Muay Thai/Boxe/Karatê) exigem intensa rotação torácica, flexores de quadril e panturrilhas/tornozelos.
- Recuperação Pós-Luta (` + "`pos_luta_artes_marciais`" + `): Priorizar soltura de punhos/antebraços SEM apoiar mãos espalmadas no chão, rotação torácica (Open Book), alongamento de flexores de quadril/piriforme (Figura 4), descompressão cervical e respiração diafragmática (8–12 min).
- Registro de Prática Externa (` + "`log_external_practice`" + `): Sempre valorizar o treino de luta/esporte realizado fora do app como vitória real de constância na semana (modalidade ` + "`artes_marciais`" + ` ou ` + "`esporte_coletivo`" + `), ajustando o treino de força seguinte para evitar overtraining.`,
  },

  '15_long_term_periodization_and_contingency': {
    id: '15_long_term_periodization_and_contingency',
    title: 'Programas Evolutivos de 8 Semanas e Kit de Contingência',
    indexSummary: 'Gestão das 4 fases do programa de longo prazo e planos para imprevistos.',
    autoTriggers: {
      keywords: [
        'programa',
        '8 semanas',
        'longo prazo',
        'imprevisto',
        'correria',
        'dia corrido',
        'pouco tempo',
        '10 minutos',
        'contingencia',
        'evoluir',
        'proxima fase',
      ],
      frequencyOrGoal: ['programa_8_semanas', 'contingencia'],
    },
    coupledTools: ['audit_weekly_fractional_volume'],
    protocolMarkdown: `### SKILL 15: Programas de Longo Prazo (8 Semanas) e Kit de Contingência
- Periodização Evolutiva em 4 Fases (2 semanas por fase):
  1. Semanas 1-2 (Adaptação & Hábito): Foco em consistência, domínio técnico e zero dor tardia excessiva (RIR 3-4).
  2. Semanas 3-4 (Base & Estabilidade): Consolidação de volume e controle escapular/lombo-pélvico (RIR 2-3).
  3. Semanas 5-6 (Progressão Controlada): Incremento moderado de repetições, cadência ou degrau biomecânico (RIR 1-2).
  4. Semanas 7-8 (Consolidação & Deload): Semana 7 consolida ganhos; Semana 8 reduz ~25-30% de séries para supercompensação articular.
- Kit de Contingência Anti-Abandono:
  * Dia Caótico (<12 min): Acionar Plano Emergência Express ("Salva-Hábito") ou ` + "`soften_session`" + `.
  * Baixa Energia / Estresse: Acionar Plano Suave (-25% volume, descansos maiores).
  * Dia de Descanso / Pós-Esporte: Oferecer Recuperação Ativa (` + "`mobilidade_alongamento`" + ` ou ` + "`pos_luta_artes_marciais`" + `) sem cobrança.`,
  },
};

function applySkillOverride(
  skill: ExerciseScienceSkill,
  overrides: Record<string, SkillOverrideRecord>
): ExerciseScienceSkill | null {
  const ov = overrides[skill.id];
  if (!ov) return skill;
  if (ov.isEnabled === false && skill.id !== '01_red_flags_confef_ethics') {
    return null; // Skill 01 (Ética e Red Flags) jamais pode ser desativada por segurança clínica
  }
  if (ov.customProtocolMarkdown && ov.customProtocolMarkdown.trim().length > 10) {
    return {
      ...skill,
      protocolMarkdown: ov.customProtocolMarkdown.trim(),
    };
  }
  return skill;
}

/**
 * Constrói o bloco de índice leve (Camada 1) para o prefixo estático do sistema (~320 tokens)
 */
export function buildSkillsIndexPrompt(): string {
  const lines = Object.values(ALL_SCIENTIFIC_SKILLS)
    .map((s) => applySkillOverride(s, cachedSkillOverrides))
    .filter((s): s is ExerciseScienceSkill => Boolean(s))
    .map((s) => `- [${s.id}]: ${s.title} -> ${s.indexSummary}`);
  return `ÍNDICE DE SKILLS CIENTÍFICAS DISPONÍVEIS:\n${lines.join('\n')}`;
}

/**
 * Resolve e carrega os protocolos (Camada 2) com base nos gatilhos automáticos do aluno
 */
export function resolveSkillsForContext(params: {
  limitationTags?: string[];
  userText?: string;
  hasPhotos?: boolean;
  frequencyOrGoal?: string[];
  explicitSkillIds?: string[];
  overrides?: Record<string, SkillOverrideRecord>;
}): ExerciseScienceSkill[] {
  const activeOverrides = params.overrides || cachedSkillOverrides;
  const textLower = (params.userText || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const limitations = (params.limitationTags || []).map((l) => l.toLowerCase());
  const goals = (params.frequencyOrGoal || []).map((g) => g.toLowerCase());
  const selected = new Map<string, ExerciseScienceSkill>();

  // Inclusão explícita
  if (params.explicitSkillIds) {
    for (const id of params.explicitSkillIds) {
      const base = ALL_SCIENTIFIC_SKILLS[id];
      if (base) {
        const eff = applySkillOverride(base, activeOverrides);
        if (eff) selected.set(id, eff);
      }
    }
  }

  // Avaliação dos gatilhos
  for (const rawSkill of Object.values(ALL_SCIENTIFIC_SKILLS)) {
    if (selected.size >= 4) break; // Trava para nunca inflar além de 4 skills por turno!

    const skill = applySkillOverride(rawSkill, activeOverrides);
    if (!skill) continue;

    // Gatilho de fotos
    if (skill.autoTriggers.hasPhotos && params.hasPhotos) {
      selected.set(skill.id, skill);
      continue;
    }

    // Gatilho de limitações
    if (
      skill.autoTriggers.limitationTags?.some((l) =>
        limitations.some((userLim) => userLim.includes(l) || l.includes(userLim))
      )
    ) {
      selected.set(skill.id, skill);
      continue;
    }

    // Gatilho de palavras-chave no texto do usuário (normalizado sem acentos)
    if (
      skill.autoTriggers.keywords?.some((k) => {
        const kNorm = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return textLower.includes(kNorm);
      })
    ) {
      selected.set(skill.id, skill);
      continue;
    }

    // Gatilho de metas
    if (skill.autoTriggers.frequencyOrGoal?.some((g) => goals.some((goal) => goal.includes(g)))) {
      selected.set(skill.id, skill);
      continue;
    }
  }

  // Se nenhuma específica foi selecionada, garante a Skill 02 (Dose/Volume ACSM) e Skill 11 (MI)
  if (selected.size === 0) {
    const s02 = applySkillOverride(ALL_SCIENTIFIC_SKILLS['02_acsm2026_volume_hypertrophy_strength'], activeOverrides);
    const s11 = applySkillOverride(ALL_SCIENTIFIC_SKILLS['11_motivational_interviewing_adherence'], activeOverrides);
    if (s02) selected.set(s02.id, s02);
    if (s11) selected.set(s11.id, s11);
  }

  return Array.from(selected.values());
}

/**
 * Versão assíncrona para Cloud Functions que sincroniza overrides do Painel Admin antes de resolver
 */
export async function resolveSkillsForContextAsync(params: {
  limitationTags?: string[];
  userText?: string;
  hasPhotos?: boolean;
  frequencyOrGoal?: string[];
  explicitSkillIds?: string[];
}): Promise<ExerciseScienceSkill[]> {
  const overrides = await loadSkillOverridesFromDb();
  return resolveSkillsForContext({ ...params, overrides });
}
