import { FunctionalMovementPattern } from '../../types';

export interface FunctionalSlotDefinition {
  slotKey: string;
  name: string;
  primaryPattern: FunctionalMovementPattern;
  fallbackPatterns: FunctionalMovementPattern[];
  rationale: string;
}

export interface RoutineTemplate {
  name: string;
  description: string;
  slots: FunctionalSlotDefinition[];
}

/**
 * Normaliza qualquer chave ou texto de objetivo vindo do Onboarding ou Modal
 * para uma das 5 categorias canônicas do motor v2.
 */
export function normalizeGoalKey(
  rawGoal?: string
): 'habito' | 'forca' | 'postura' | 'alivio_dores' | 'vitalidade' {
  if (!rawGoal) return 'habito';
  const g = rawGoal.toLowerCase();

  if (g.includes('força') || g.includes('forca') || g.includes('hipertrofia') || g.includes('massa')) {
    return 'forca';
  }
  if (g.includes('postura') || g.includes('coluna')) {
    return 'postura';
  }
  if (g.includes('dor') || g.includes('dores') || g.includes('alívio') || g.includes('alivio')) {
    return 'alivio_dores';
  }
  if (g.includes('vitalidade') || g.includes('energia') || g.includes('disposição') || g.includes('disposicao') || g.includes('cardio')) {
    return 'vitalidade';
  }
  return 'habito';
}

/**
 * Templates funcionais canônicos.
 * Garantem equilíbrio motor real (empurrar, puxar, agachar, dobradiça, core e mobilidade)
 * eliminando fichas desbalanceadas.
 */
export const FUNCTIONAL_SLOT_TEMPLATES: Record<
  'habito' | 'forca' | 'postura' | 'alivio_dores' | 'vitalidade',
  { templateA: RoutineTemplate; templateB: RoutineTemplate }
> = {
  forca: {
    templateA: {
      name: 'Treino A (Força Base: Empurrar & Pernas)',
      description: 'Construção de força nos membros inferiores, empurrada e estabilidade do tronco.',
      slots: [
        {
          slotKey: 'squat_pattern',
          name: 'Padrão Agachamento',
          primaryPattern: 'squat',
          fallbackPatterns: ['lunge', 'hinge'],
          rationale: 'Fortalece quadríceps, glúteos e joelhos com amplitude segura.',
        },
        {
          slotKey: 'push_horizontal_pattern',
          name: 'Empurrar Horizontal',
          primaryPattern: 'push_horizontal',
          fallbackPatterns: ['push_vertical'],
          rationale: 'Trabalha peitorais, deltoides anteriores e tríceps.',
        },
        {
          slotKey: 'pull_horizontal_pattern',
          name: 'Puxar Horizontal / Escapular',
          primaryPattern: 'pull_horizontal',
          fallbackPatterns: ['pull_vertical', 'hinge'],
          rationale: 'Equilibra a cintura escapular, ativando dorsais e trapézio médio.',
        },
        {
          slotKey: 'core_pattern',
          name: 'Estabilidade de Tronco (Core)',
          primaryPattern: 'core_anti_extension',
          fallbackPatterns: ['core_anti_rotation', 'hinge'],
          rationale: 'Firmeza abdominal profunda sem flexões repetitivas da coluna.',
        },
        {
          slotKey: 'push_vertical_or_accessory',
          name: 'Ombros ou Acessório',
          primaryPattern: 'push_vertical',
          fallbackPatterns: ['lunge', 'mobility_shoulder'],
          rationale: 'Desenvolvimento equilibrado dos ombros e estabilizadores superiores.',
        },
      ],
    },
    templateB: {
      name: 'Treino B (Força Cadeia Posterior: Puxar & Quadril)',
      description: 'Foco na cadeia posterior, glúteos, dorsais e sustentação lombar.',
      slots: [
        {
          slotKey: 'hinge_pattern',
          name: 'Padrão Dobradiça de Quadril',
          primaryPattern: 'hinge',
          fallbackPatterns: ['squat', 'lunge'],
          rationale: 'Ativa glúteos e posteriores de coxa preservando a coluna.',
        },
        {
          slotKey: 'lunge_pattern',
          name: 'Padrão Unilateral de Pernas',
          primaryPattern: 'lunge',
          fallbackPatterns: ['squat', 'hinge'],
          rationale: 'Corrige assimetrias de força e melhora o equilíbrio articular.',
        },
        {
          slotKey: 'pull_vertical_or_horizontal',
          name: 'Puxar Vertical ou Escapular',
          primaryPattern: 'pull_vertical',
          fallbackPatterns: ['pull_horizontal', 'hinge'],
          rationale: 'Desenvolvimento das costas e saúde postural.',
        },
        {
          slotKey: 'core_anti_rotation',
          name: 'Core Anti-Rotação / Lateral',
          primaryPattern: 'core_anti_rotation',
          fallbackPatterns: ['core_anti_lateral_flexion', 'core_anti_extension'],
          rationale: 'Proteção lombar contra torções e instabilidade.',
        },
        {
          slotKey: 'mobility_recovery',
          name: 'Descompressão Articular',
          primaryPattern: 'mobility_hip',
          fallbackPatterns: ['mobility_spine', 'mobility_shoulder'],
          rationale: 'Manutenção de amplitude funcional pós-esforço.',
        },
      ],
    },
  },

  habito: {
    templateA: {
      name: 'Treino A (Ativação Corporal Diária)',
      description: 'Movimentos acessíveis e fluidos para manter a consistência e sensação de leveza.',
      slots: [
        {
          slotKey: 'mobility_prep',
          name: 'Mobilidade Preparatória',
          primaryPattern: 'mobility_spine',
          fallbackPatterns: ['mobility_hip'],
          rationale: 'Acorda as articulações e alivia tensões de ficar sentado.',
        },
        {
          slotKey: 'legs_base',
          name: 'Fortalecimento de Pernas',
          primaryPattern: 'squat',
          fallbackPatterns: ['lunge', 'hinge'],
          rationale: 'Grande ativação muscular e circulatória com esforço confortável.',
        },
        {
          slotKey: 'upper_body',
          name: 'Membros Superiores Conscientes',
          primaryPattern: 'push_horizontal',
          fallbackPatterns: ['pull_horizontal', 'push_vertical'],
          rationale: 'Firmeza de braços e peitoral com técnica adaptada.',
        },
        {
          slotKey: 'core_gentle',
          name: 'Core & Sustentação',
          primaryPattern: 'hinge',
          fallbackPatterns: ['core_anti_rotation', 'core_anti_extension'],
          rationale: 'Ativa glúteos e abdômen sem causar fadiga excessiva.',
        },
        {
          slotKey: 'cooldown_mobility',
          name: 'Mobilidade Finalizadora',
          primaryPattern: 'mobility_hip',
          fallbackPatterns: ['mobility_spine'],
          rationale: 'Relaxa a musculatura e deixa o corpo solto para o resto do dia.',
        },
      ],
    },
    templateB: {
      name: 'Treino B (Fluidez & Vitalidade)',
      description: 'Alternativa suave focando em equilíbrio, postura e cadeia posterior.',
      slots: [
        {
          slotKey: 'mobility_prep_hip',
          name: 'Mobilidade de Quadril',
          primaryPattern: 'mobility_hip',
          fallbackPatterns: ['mobility_spine'],
          rationale: 'Soltura da bacia e lombar.',
        },
        {
          slotKey: 'posterior_legs',
          name: 'Cadeia Posterior & Glúteos',
          primaryPattern: 'hinge',
          fallbackPatterns: ['squat', 'lunge'],
          rationale: 'Fortalece a parte de trás do corpo.',
        },
        {
          slotKey: 'pull_gentle',
          name: 'Costas e Escápulas',
          primaryPattern: 'pull_horizontal',
          fallbackPatterns: ['pull_vertical', 'push_horizontal'],
          rationale: 'Abre a região do peito e alivia tensão nos ombros.',
        },
        {
          slotKey: 'core_bird_dog',
          name: 'Estabilidade Isométrica',
          primaryPattern: 'core_anti_rotation',
          fallbackPatterns: ['core_anti_extension', 'hinge'],
          rationale: 'Equilíbrio e coordenação em ritmo calmo.',
        },
      ],
    },
  },

  postura: {
    templateA: {
      name: 'Treino A (Coluna Ereta & Escápulas)',
      description: 'Abertura de peito, ativação de romboides e extensão torácica.',
      slots: [
        {
          slotKey: 'thoracic_mobility',
          name: 'Mobilidade Torácica & Coluna',
          primaryPattern: 'mobility_spine',
          fallbackPatterns: ['mobility_shoulder'],
          rationale: 'Destrava a rigidez da coluna dorsal acumulada na cadeira.',
        },
        {
          slotKey: 'scapular_pull',
          name: 'Fortalecimento Escapular',
          primaryPattern: 'pull_horizontal',
          fallbackPatterns: ['pull_vertical'],
          rationale: 'Puxa os ombros para trás corrigindo a postura caída.',
        },
        {
          slotKey: 'glute_activation',
          name: 'Ativação Glútea Anti-Sentado',
          primaryPattern: 'hinge',
          fallbackPatterns: ['squat', 'lunge'],
          rationale: 'Reativa glúteos inibidos por longas horas sentado.',
        },
        {
          slotKey: 'core_anti_rotation',
          name: 'Estabilização de Tronco Neutro',
          primaryPattern: 'core_anti_rotation',
          fallbackPatterns: ['core_anti_extension'],
          rationale: 'Ensina o tronco a manter alinhamento sob movimento.',
        },
        {
          slotKey: 'shoulder_mobility',
          name: 'Soltura de Ombros e Peito',
          primaryPattern: 'mobility_shoulder',
          fallbackPatterns: ['mobility_spine'],
          rationale: 'Alongamento dos peitorais e soltura subacromial.',
        },
      ],
    },
    templateB: {
      name: 'Treino B (Descompressão & Cadeia Posterior)',
      description: 'Sustentação dos paravertebrais, lombar neutra e estabilidade pélvica.',
      slots: [
        {
          slotKey: 'hip_open_mobility',
          name: 'Mobilidade de Flexores e Quadril',
          primaryPattern: 'mobility_hip',
          fallbackPatterns: ['mobility_spine'],
          rationale: 'Alivia a tração anterior da bacia que sobrecarrega a lombar.',
        },
        {
          slotKey: 'posterior_chain',
          name: 'Cadeia Posterior Integrada',
          primaryPattern: 'hinge',
          fallbackPatterns: ['pull_vertical', 'lunge'],
          rationale: 'Fortalece eretores da espinha e isquiotibiais.',
        },
        {
          slotKey: 'upper_back',
          name: 'Retração e Depressão Escapular',
          primaryPattern: 'pull_vertical',
          fallbackPatterns: ['pull_horizontal'],
          rationale: 'Sustentação vertical e suporte do pescoço.',
        },
        {
          slotKey: 'core_deep_stability',
          name: 'Estabilidade Abdominal Profunda',
          primaryPattern: 'core_anti_extension',
          fallbackPatterns: ['core_anti_lateral_flexion'],
          rationale: 'Controle respiratório e sustentação da pressão intra-abdominal.',
        },
      ],
    },
  },

  alivio_dores: {
    templateA: {
      name: 'Treino A (Descompressão & Joelhos/Lombar Livres)',
      description: 'Baixo impacto articular, isometrias de proteção e respiração consciente.',
      slots: [
        {
          slotKey: 'gentle_spine_mob',
          name: 'Mobilidade Fluida de Coluna',
          primaryPattern: 'mobility_spine',
          fallbackPatterns: ['mobility_hip'],
          rationale: 'Lubrificação das facetas articulares sem sobrecarga de peso.',
        },
        {
          slotKey: 'isometric_glutes',
          name: 'Fortalecimento Glúteo Seguro',
          primaryPattern: 'hinge',
          fallbackPatterns: ['squat'],
          rationale: 'Estabiliza a pelve sem pressionar patela ou discos lombares.',
        },
        {
          slotKey: 'safe_upper',
          name: 'Ativação Suave de Superiores',
          primaryPattern: 'push_horizontal',
          fallbackPatterns: ['pull_horizontal'],
          rationale: 'Mantém a força dos braços e peitoral com apoio em parede ou inclinado.',
        },
        {
          slotKey: 'safe_core',
          name: 'Estabilização Lombar Isométrica',
          primaryPattern: 'core_anti_rotation',
          fallbackPatterns: ['core_anti_extension'],
          rationale: 'Trabalho de core em 4 apoios com mínimo estresse na coluna.',
        },
      ],
    },
    templateB: {
      name: 'Treino B (Mobilidade Integrada & Soltura)',
      description: 'Alívio de rigidez nos quadris e ombros com reforço isométrico.',
      slots: [
        {
          slotKey: 'hip_decompression',
          name: 'Mobilidade Suave de Quadril',
          primaryPattern: 'mobility_hip',
          fallbackPatterns: ['mobility_spine'],
          rationale: 'Libera o quadril para poupar joelhos e lombar.',
        },
        {
          slotKey: 'scapular_relief',
          name: 'Ativação Postural Escapular',
          primaryPattern: 'pull_horizontal',
          fallbackPatterns: ['mobility_shoulder'],
          rationale: 'Alívio de tensão nos trapézios e pescoço.',
        },
        {
          slotKey: 'legs_supported',
          name: 'Pernas com Apoio Suave',
          primaryPattern: 'squat',
          fallbackPatterns: ['hinge', 'lunge'],
          rationale: 'Manutenção de força para sentar e levantar sem dor.',
        },
        {
          slotKey: 'breathing_core',
          name: 'Core & Respiração Consciente',
          primaryPattern: 'core_anti_extension',
          fallbackPatterns: ['hinge'],
          rationale: 'Ativação suave do transverso do abdômen.',
        },
      ],
    },
  },

  vitalidade: {
    templateA: {
      name: 'Treino A (Ativação Funcional & Ritmo)',
      description: 'Movimentos globais de baixo impacto para aumentar a energia e circulação.',
      slots: [
        {
          slotKey: 'flow_warmup',
          name: 'Ativação Dinâmica',
          primaryPattern: 'cardio_low_impact',
          fallbackPatterns: ['mobility_hip', 'mobility_spine'],
          rationale: 'Aquece grandes grupos musculares elevando a frequência cardíaca suavemente.',
        },
        {
          slotKey: 'power_legs',
          name: 'Força de Pernas e Glúteos',
          primaryPattern: 'squat',
          fallbackPatterns: ['lunge', 'hinge'],
          rationale: 'Ativa o maior motor metabólico do corpo humano.',
        },
        {
          slotKey: 'flow_push',
          name: 'Membros Superiores Dinâmicos',
          primaryPattern: 'push_horizontal',
          fallbackPatterns: ['push_vertical'],
          rationale: 'Firmeza e vigor nos braços.',
        },
        {
          slotKey: 'flow_pull',
          name: 'Puxada e Postura',
          primaryPattern: 'pull_horizontal',
          fallbackPatterns: ['hinge', 'pull_vertical'],
          rationale: 'Equilíbrio corporal e sustentação ereta.',
        },
        {
          slotKey: 'core_dynamic',
          name: 'Core Funcional',
          primaryPattern: 'core_anti_extension',
          fallbackPatterns: ['core_anti_rotation'],
          rationale: 'Transmissão eficiente de força entre membros inferiores e superiores.',
        },
      ],
    },
    templateB: {
      name: 'Treino B (Condicionamento & Mobilidade Global)',
      description: 'Circuito equilibrado de resistência muscular e flexibilidade funcional.',
      slots: [
        {
          slotKey: 'dynamic_mobility',
          name: 'Mobilidade Rítmica',
          primaryPattern: 'mobility_spine',
          fallbackPatterns: ['mobility_hip'],
          rationale: 'Amplitude articular com ritmo dinâmico.',
        },
        {
          slotKey: 'unilateral_legs',
          name: 'Passadas / Pernas Unilateral',
          primaryPattern: 'lunge',
          fallbackPatterns: ['hinge', 'squat'],
          rationale: 'Coordenação motora, queima energética e estabilidade de joelhos.',
        },
        {
          slotKey: 'posture_pull',
          name: 'Cadeia Posterior & Dorsais',
          primaryPattern: 'pull_vertical',
          fallbackPatterns: ['pull_horizontal', 'hinge'],
          rationale: 'Vigor postural e descompressão torácica.',
        },
        {
          slotKey: 'core_lateral',
          name: 'Core Lateral & Estabilidade',
          primaryPattern: 'core_anti_lateral_flexion',
          fallbackPatterns: ['core_anti_rotation', 'core_anti_extension'],
          rationale: 'Proteção pélvica e firmeza lateral.',
        },
      ],
    },
  },
};

/**
 * Retorna a lista de slots a serem preenchidos de acordo com o objetivo,
 * se é treino A ou B, e a quantidade máxima desejada (baseada no tempo da sessão).
 */
export function getSlotsForGoal(
  goalKey: string,
  variant: 'A' | 'B' = 'A',
  maxSlots: number = 4
): { template: RoutineTemplate; slots: FunctionalSlotDefinition[] } {
  const norm = normalizeGoalKey(goalKey);
  const pair = FUNCTIONAL_SLOT_TEMPLATES[norm];
  const template = variant === 'A' ? pair.templateA : pair.templateB;

  // Garante pelo menos 2 (para rotinas express de 5 min) e no máximo o solicitado
  const count = Math.max(2, Math.min(maxSlots, template.slots.length));
  const slots = template.slots.slice(0, count);

  return { template, slots };
}
