import { WorkoutProgram } from '../types';
import { premadeWorkouts } from './premadeWorkouts';

// Helper para buscar planos pelo ID dentro de premadeWorkouts
const getPlan = (id: string) => {
  const p = premadeWorkouts.find((w) => w.id === id);
  if (!p) throw new Error(`Plano com id ${id} não encontrado nos premadeWorkouts.`);
  return p;
};

export const premadePrograms: WorkoutProgram[] = [
  // 1. Programa Hábito Ativo em Casa: 21 Dias de Consistência
  {
    id: 'prog_habito_ativo_21d',
    title: 'Hábito Ativo em Casa (21 Dias de Consistência)',
    description: 'Construa o hábito inabalável de se exercitar diariamente sem sofrimento. 15 minutos por sessão, 3 vezes por semana, com suporte a micro-treino de 5 min.',
    objective: 'habito',
    environment: 'casa',
    durationWeeks: 3,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 3,
    habitAnchor: 'Logo após o café matinal ou ao encerrar o expediente',
    phases: [
      {
        name: 'Semana 1: Despertar do Corpo',
        weeks: [1],
        description: 'Movimentos suaves para destravar as articulações e romper a inércia sem dor muscular excessiva.',
        focusNotes: 'Foco em aparecer todos os dias programados, mesmo que faça menos repetições.',
      },
      {
        name: 'Semana 2: Ritmo e Respiração',
        weeks: [2],
        description: 'Fluidez motora, firmeza nas pernas e alívio do estresse do dia a dia.',
        focusNotes: 'Mantenha a respiração constante durante os exercícios.',
      },
      {
        name: 'Semana 3: Consolidação da Rotina',
        weeks: [3],
        description: 'Constância sustentável: consolidar um momento do seu dia para cuidar do corpo com tranquilidade.',
        focusNotes: 'Celebre cada sessão concluída no seu próprio ritmo.',
      },
    ],
    routines: [
      getPlan('plan_habito_dia_a'),
      getPlan('plan_habito_dia_b'),
      getPlan('plan_habito_dia_c'),
    ],
    weeklySchedule: {
      1: 'plan_habito_dia_a', // Segunda
      3: 'plan_habito_dia_b', // Quarta
      5: 'plan_habito_dia_c', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 2. Coluna Confortável & Apoio Postural (4 Semanas)
  {
    id: 'prog_coluna_saudavel_4w',
    title: 'Coluna Confortável & Apoio Postural (4 Semanas)',
    description: 'Sugestões de mobilidade suave e fortalecimento de suporte para quem passa longos períodos sentado ou sente rigidez postural.',
    objective: 'postura',
    environment: 'casa',
    durationWeeks: 4,
    currentWeek: 1,
    splitType: 'habito_express',
    weeklyFrequency: 3,
    habitAnchor: 'No final da tarde, ao levantar da cadeira de trabalho',
    phases: [
      {
        name: 'Bloco 1: Descompressão e Ativação',
        weeks: [1, 2],
        description: 'Mobilidade torácica, descompressão lombar e ativação dos glúteos.',
        focusNotes: 'Sem movimentos bruscos; sinta o relaxamento a cada expiração.',
      },
      {
        name: 'Bloco 2: Sustentação e Força Postural',
        weeks: [3, 4],
        description: 'Firmeza de core e cinturão abdominal para proteger a coluna o dia todo.',
        focusNotes: 'Contraia o abdômen suavemente como se fosse fechar um zíper.',
      },
    ],
    routines: [
      getPlan('plan_coluna_alivio_a'),
      getPlan('plan_coluna_alivio_b'),
    ],
    weeklySchedule: {
      1: 'plan_coluna_alivio_a', // Segunda
      3: 'plan_coluna_alivio_b', // Quarta
      5: 'plan_coluna_alivio_a', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 3. Vitalidade & Energia em Casa (8 Semanas)
  {
    id: 'prog_vitalidade_funcional_8w',
    title: 'Vitalidade & Energia em Casa (8 Semanas)',
    description: 'Melhora cardiovascular, tônus muscular e disposição diária com o peso corporal. 4 sessões semanais de 20 minutos.',
    objective: 'vitalidade',
    environment: 'casa',
    durationWeeks: 8,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 4,
    habitAnchor: 'Antes do banho pela manhã ou antes do jantar',
    phases: [
      {
        name: 'Fase 1: Condicionamento de Base',
        weeks: [1, 2, 3, 4],
        description: 'Construção da capacidade pulmonar e resistência muscular localizada.',
      },
      {
        name: 'Fase 2: Intensidade e Firmeza',
        weeks: [5, 6, 7],
        description: 'Aumento do ritmo e redução sutil dos tempos de descanso.',
      },
      {
        name: 'Semana 8: Desafio de Conquista',
        weeks: [8],
        description: 'Avaliando sua evolução de força e fôlego em relação ao primeiro dia.',
      },
    ],
    routines: [
      getPlan('plan_vitalidade_funcional_a'),
      getPlan('plan_vitalidade_funcional_b'),
    ],
    weeklySchedule: {
      1: 'plan_vitalidade_funcional_a', // Segunda
      2: 'plan_vitalidade_funcional_b', // Terça
      4: 'plan_vitalidade_funcional_a', // Quinta
      5: 'plan_vitalidade_funcional_b', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 4. Mesociclo ABC Hipertrofia Academia (8 Semanas)
  {
    id: 'prog_abc_hipertrofia_8w',
    title: 'Mesociclo ABC • Hipertrofia na Academia (8 Semanas)',
    description: 'A divisão clássica Push / Pull / Legs com progressão linear e ondulatória para ganho consistente de massa muscular.',
    objective: 'hipertrofia',
    environment: 'academia',
    durationWeeks: 8,
    currentWeek: 1,
    splitType: 'abc',
    weeklyFrequency: 5,
    habitAnchor: 'Horário fixo no treino pós-trabalho',
    phases: [
      {
        name: 'Mesociclo 1: Acúmulo de Volume',
        weeks: [1, 2, 3, 4],
        description: 'Séries de 10 a 12 repetições priorizando amplitude máxima e controle de carga.',
      },
      {
        name: 'Mesociclo 2: Intensificação',
        weeks: [5, 6, 7],
        description: 'Aumento gradual de sobrecarga em séries de 8 a 10 repetições.',
      },
      {
        name: 'Semana 8: Deload Ativo',
        weeks: [8],
        description: 'Volume reduzido pela metade para regeneração articular e do SNC.',
      },
    ],
    routines: [
      getPlan('plan_abc_push'),
      getPlan('plan_abc_pull'),
      getPlan('plan_abc_legs'),
    ],
    weeklySchedule: {
      1: 'plan_abc_push', // Segunda
      2: 'plan_abc_pull', // Terça
      3: 'plan_abc_legs', // Quarta
      4: 'plan_abc_push', // Quinta
      5: 'plan_abc_pull', // Sexta
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 5. Upper / Lower Força & Tônus (12 Semanas)
  {
    id: 'prog_upper_lower_12w',
    title: 'Upper / Lower • Força & Tônus (12 Semanas)',
    description: '4 dias por semana intercalando membros superiores e inferiores. Equilíbrio perfeito entre descanso, recuperação e hipertrofia.',
    objective: 'forca',
    environment: 'academia',
    durationWeeks: 12,
    currentWeek: 1,
    splitType: 'upper_lower',
    weeklyFrequency: 4,
    phases: [
      {
        name: 'Fase 1: Estruturação de Força',
        weeks: [1, 2, 3, 4],
        description: 'Consolidação da mecânica nos grandes levantamentos.',
      },
      {
        name: 'Fase 2: Sobrecarga Progressiva',
        weeks: [5, 6, 7, 8],
        description: 'Incrementos sistemáticos de carga ou repetições semana a semana.',
      },
      {
        name: 'Fase 3: Pico de Performance & Regeneração',
        weeks: [9, 10, 11, 12],
        description: 'Superação de marcas pessoais e preparação para novos ciclos.',
      },
    ],
    routines: [
      getPlan('plan_upper_strength'),
      getPlan('plan_lower_strength'),
    ],
    weeklySchedule: {
      1: 'plan_upper_strength', // Segunda
      2: 'plan_lower_strength', // Terça
      4: 'plan_upper_strength', // Quinta
      5: 'plan_lower_strength', // Sexta
    },
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  // 6. Anti-Sedentarismo: Cadeira & Parede (Iniciante Absoluto)
  {
    id: 'prog_anti_sedentarismo_cadeira',
    title: 'Anti-Sedentarismo • Cadeira & Parede (4 Semanas)',
    description: 'Movimentos seguros em pé ou com cadeira firme. Zero deitar no chão, zero impacto nos joelhos. Perfeito para recomeçar com tranquilidade.',
    objective: 'habito',
    environment: 'casa',
    durationWeeks: 4,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 3,
    habitAnchor: 'Logo antes do almoço ou no final do expediente',
    phases: [
      {
        name: 'Fase 1: Reconexão e Segurança',
        weeks: [1, 2],
        description: 'Construção da confiança em movimentos cotidianos (sentar, levantar e respirar com calma).',
      },
      {
        name: 'Fase 2: Ritmo Diário Sustentável',
        weeks: [3, 4],
        description: 'Sensação revigorante de dever cumprido em 12 minutos por dia.',
      },
    ],
    routines: [
      getPlan('plan_anti_sedentarismo_cadeira_a'),
      getPlan('plan_anti_sedentarismo_cadeira_b'),
    ],
    weeklySchedule: {
      1: 'plan_anti_sedentarismo_cadeira_a', // Segunda
      3: 'plan_anti_sedentarismo_cadeira_b', // Quarta
      5: 'plan_anti_sedentarismo_cadeira_a', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 7. Coluna Blindada McGill (Alívio & Estabilidade)
  {
    id: 'prog_coluna_blindada_mcgill',
    title: 'Coluna Blindada McGill • Saúde Vertebral (6 Semanas)',
    description: 'Protocolo de estabilização do tronco baseado nas diretrizes do Prof. Stuart McGill para alívio duradouro de dores e rigidez lombar.',
    objective: 'postura',
    environment: 'casa',
    durationWeeks: 6,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 3,
    habitAnchor: 'Ao término do dia para descomprimir a coluna',
    phases: [
      {
        name: 'Fase 1: Ativação dos Estabilizadores Profundos',
        weeks: [1, 2, 3],
        description: 'Mobilidade suave e controle do core neutro com o Big 3.',
      },
      {
        name: 'Fase 2: Resistência Postural e Proteção Contínua',
        weeks: [4, 5, 6],
        description: 'Aumento gradual do tempo de sustentação isométrica sem dor.',
      },
    ],
    routines: [
      getPlan('plan_coluna_mcgill_a'),
      getPlan('plan_coluna_mcgill_b'),
    ],
    weeklySchedule: {
      1: 'plan_coluna_mcgill_a', // Segunda
      3: 'plan_coluna_mcgill_b', // Quarta
      5: 'plan_coluna_mcgill_a', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 8. Calistenia de Base Progressiva (Força Funcional em Casa)
  {
    id: 'prog_calistenia_base',
    title: 'Calistenia de Base Progressiva (8 Semanas)',
    description: 'Ganhe força, definição e controle muscular com agachamentos, flexões e remadas usando apenas o peso do corpo e móveis seguros.',
    objective: 'forca',
    environment: 'casa',
    durationWeeks: 8,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 3,
    habitAnchor: 'Pela manhã para acordar o corpo com energia',
    phases: [
      {
        name: 'Fase 1: Alavancas Inclinadas & Padrões',
        weeks: [1, 2, 3, 4],
        description: 'Ajuste biomecânico dos movimentos essenciais.',
      },
      {
        name: 'Fase 2: Sobrecarga em Volume e Densidade',
        weeks: [5, 6, 7, 8],
        description: 'Transição segura para maiores repetições e controle de descida.',
      },
    ],
    routines: [
      getPlan('plan_calistenia_base_a'),
      getPlan('plan_calistenia_base_b'),
    ],
    weeklySchedule: {
      1: 'plan_calistenia_base_a', // Segunda
      3: 'plan_calistenia_base_b', // Quarta
      5: 'plan_calistenia_base_a', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 9. Joelhos Protegidos & Pernas Fortes
  {
    id: 'prog_joelhos_protegidos',
    title: 'Joelhos Protegidos & Pernas Fortes (6 Semanas)',
    description: 'Protocolo focado em fortalecer vasto medial, isquiotibiais e glúteo médio sem impacto patelar e sem flexão profunda dos joelhos.',
    objective: 'alivio_dores',
    environment: 'casa',
    durationWeeks: 6,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 3,
    phases: [
      {
        name: 'Fase 1: Fortalecimento Isométrico e Cadeia Posterior',
        weeks: [1, 2, 3],
        description: 'Ativação glútea potente e descompressão articular.',
      },
      {
        name: 'Fase 2: Estabilidade e Equilíbrio Dinâmico',
        weeks: [4, 5, 6],
        description: 'Reforço de alinhamento patelar em movimentos funcionais.',
      },
    ],
    routines: [
      getPlan('plan_joelhos_protegidos_a'),
      getPlan('plan_joelhos_protegidos_b'),
    ],
    weeklySchedule: {
      1: 'plan_joelhos_protegidos_a', // Segunda
      3: 'plan_joelhos_protegidos_b', // Quarta
      5: 'plan_joelhos_protegidos_a', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 10. Mini Band Total em Casa
  {
    id: 'prog_mini_band_total',
    title: 'Mini Band Total em Casa (6 Semanas)',
    description: 'Aproveite a resistência progressiva da mini band para tonificar glúteos, costas e ombros com total segurança e comodidade.',
    objective: 'vitalidade',
    environment: 'casa',
    durationWeeks: 6,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 3,
    phases: [
      {
        name: 'Fase 1: Ativação e Tensão Constante',
        weeks: [1, 2, 3],
        description: 'Familiarização com a resistência elástica e controle motor.',
      },
      {
        name: 'Fase 2: Resistência e Firmeza Muscular',
        weeks: [4, 5, 6],
        description: 'Aumento das repetições e contrações de pico nos glúteos e costas.',
      },
    ],
    routines: [
      getPlan('plan_mini_band_total_a'),
      getPlan('plan_mini_band_total_b'),
    ],
    weeklySchedule: {
      1: 'plan_mini_band_total_a', // Segunda
      3: 'plan_mini_band_total_b', // Quarta
      5: 'plan_mini_band_total_a', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 11. Calistenia Primer • Fundação do Peso Corporal (r/bodyweightfitness)
  {
    id: 'prog_calistenia_primer_6w',
    title: 'Calistenia Primer (Fundação de Peso Corporal - 6 Semanas)',
    description: 'Inspirado na rotina de introdução do r/bodyweightfitness: constrói a tolerância dos punhos, escápulas, abdômen e pernas antes de exigir movimentos avançados.',
    objective: 'calistenia',
    environment: 'casa',
    durationWeeks: 6,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 3,
    habitAnchor: 'Pela manhã para despertar o controle motor e começar o dia com energia',
    phases: [
      {
        name: 'Fase 1: Tolerância Articular & Alavancas Inclinadas',
        weeks: [1, 2, 3],
        description: 'Mecânica escapular, fortalecimento do carpo/punho e prancha anti-extensão.',
        focusNotes: 'Foco no controle da descida e estabilidade dos punhos.',
      },
      {
        name: 'Fase 2: Sobrecarga Biomecânica & Alavancas Longas',
        weeks: [4, 5, 6],
        description: 'Aumento gradual de volume e controle em amplitude profunda.',
        focusNotes: 'Mantenha o peito aberto e postura firme.',
      },
    ],
    routines: [
      getPlan('plan_calistenia_primer_a'),
      getPlan('plan_calistenia_primer_b'),
    ],
    weeklySchedule: {
      1: 'plan_calistenia_primer_a', // Segunda
      3: 'plan_calistenia_primer_b', // Quarta
      5: 'plan_calistenia_primer_a', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 12. Desk Worker Reset • Neutralização da Cadeira (Kelly Starrett & Stuart McGill)
  {
    id: 'prog_desk_worker_reset_4w',
    title: 'Desk Worker Reset (Neutralização da Cadeira - 4 Semanas)',
    description: 'Projetado para quem passa horas sentado: alivia o encurtamento do psoas, desativa a dor lombar postural e acorda os glúteos e escápulas em sessões de 12 a 15 min.',
    objective: 'postura',
    environment: 'casa',
    durationWeeks: 4,
    currentWeek: 1,
    splitType: 'habito_express',
    weeklyFrequency: 4,
    habitAnchor: 'Às 18h, imediatamente ao fechar o notebook e encerrar o expediente',
    phases: [
      {
        name: 'Bloco 1: Destravar Articulações & Descompressão',
        weeks: [1, 2],
        description: 'Abertura de flexores de quadril, soltura de torácica e descompressão discal suave.',
        focusNotes: 'Respire profundamente nas posições mantidas.',
      },
      {
        name: 'Bloco 2: Firmeza Postural & Sustentação Ereta',
        weeks: [3, 4],
        description: 'Fortalecimento de romboides, latíssimo e estabilizadores lombares.',
        focusNotes: 'Sinta os ombros abertos e o alívio na nuca.',
      },
    ],
    routines: [
      getPlan('plan_desk_worker_a'),
      getPlan('plan_desk_worker_b'),
    ],
    weeklySchedule: {
      1: 'plan_desk_worker_a', // Segunda
      2: 'plan_desk_worker_b', // Terça
      4: 'plan_desk_worker_a', // Quinta
      5: 'plan_desk_worker_b', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 13. Força Minimalista com Halteres (Dan John / Pavel Tsatsouline)
  {
    id: 'prog_halteres_minimalista_8w',
    title: 'Força Minimalista com Halteres (Método Dan John - 8 Semanas)',
    description: 'Apenas 1 par de halteres para treinar os 5 grandes padrões humanos: Agachar, Empurrar, Puxar, Dobradiça (Hinge) e Carregar (Farmer Walk).',
    objective: 'forca',
    environment: 'casa',
    durationWeeks: 8,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 3,
    habitAnchor: 'Antes do almoço ou no final da tarde',
    phases: [
      {
        name: 'Mesociclo 1: Mecânica dos Padrões (10 a 12 reps)',
        weeks: [1, 2, 3, 4],
        description: 'Cadência controlada e tempo sob tensão para consolidação da técnica.',
        focusNotes: 'Priorize a postura correta e a respiração ritmada.',
      },
      {
        name: 'Mesociclo 2: Densidade & Força Funcional (8 a 10 reps)',
        weeks: [5, 6, 7, 8],
        description: 'Aumento gradual de carga ou tempo sob tensão para tônus e densidade óssea.',
        focusNotes: 'Foco na pegada firme e contração máxima nos carregamentos.',
      },
    ],
    routines: [
      getPlan('plan_halteres_minimalista_a'),
      getPlan('plan_halteres_minimalista_b'),
    ],
    weeklySchedule: {
      1: 'plan_halteres_minimalista_a', // Segunda
      3: 'plan_halteres_minimalista_b', // Quarta
      5: 'plan_halteres_minimalista_a', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 14. Do Zero à Corrida & Caminhada (Couch to Move / C25K Adaptado)
  {
    id: 'prog_couch_to_move_6w',
    title: 'Do Zero à Corrida & Caminhada (Couch to Move - 6 Semanas)',
    description: 'Protocolo intervalado adaptado por fisioterapeutas esportivos: intercala caminhada com trotes leves e reforço em casa para canelas, joelhos e panturrilhas.',
    objective: 'corrida',
    environment: 'qualquer',
    durationWeeks: 6,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 3,
    habitAnchor: 'Início da manhã com ar fresco ou no cair da tarde',
    phases: [
      {
        name: 'Fase 1: Construção de Base Aeróbica & Tibiais',
        weeks: [1, 2],
        description: 'Caminhada rápida intervalada com reforço anti-canelite em casa.',
        focusNotes: 'Passadas suaves sem bater os calcanhares no solo.',
      },
      {
        name: 'Fase 2: Introdução do Trote Suave',
        weeks: [3, 4],
        description: '1 minuto de trote muito suave intercalado com 2 minutos de caminhada.',
        focusNotes: 'Ritmo confortável em que consiga manter conversa sem falta de ar.',
      },
      {
        name: 'Fase 3: Autonomia e Fôlego Sustentado',
        weeks: [5, 6],
        description: 'Intervalos contínuos de 2 a 3 minutos com excelente recuperação.',
        focusNotes: 'Sinta o fôlego expandido e pernas estáveis.',
      },
    ],
    routines: [
      getPlan('plan_c25k_corrida_rua'),
      getPlan('plan_c25k_reforco_casa'),
    ],
    weeklySchedule: {
      1: 'plan_c25k_corrida_rua', // Segunda
      3: 'plan_c25k_reforco_casa', // Quarta
      5: 'plan_c25k_corrida_rua', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 15. Glúteos, Pelve & Estabilidade Articular (Bret Contreras)
  {
    id: 'prog_gluteos_pelve_6w',
    title: 'Glúteos, Pelve & Estabilidade Articular (Bret Contreras - 6 Semanas)',
    description: 'Fortalecimento específico dos três motores do quadril (glúteo máximo, médio e mínimo) e suporte para a pelve e coluna com mini band.',
    objective: 'gluteos',
    environment: 'casa',
    durationWeeks: 6,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 3,
    habitAnchor: 'Pela manhã ou antes do banho noturno',
    phases: [
      {
        name: 'Fase 1: Ativação & Conexão Mente-Músculo',
        weeks: [1, 2, 3],
        description: 'Isometria e abduções com mini band para despertar o glúteo médio inibido.',
        focusNotes: 'Aperte os glúteos no topo sem forçar a lombar.',
      },
      {
        name: 'Fase 2: Sobrecarga Progressiva com Elásticos',
        weeks: [4, 5, 6],
        description: 'Pontes sob tensão contínua, passos de calcanhares e agachamentos com faixa.',
        focusNotes: 'Mantenha os joelhos afastados contra a faixa o tempo todo.',
      },
    ],
    routines: [
      getPlan('plan_gluteos_pelve_a'),
      getPlan('plan_gluteos_pelve_b'),
    ],
    weeklySchedule: {
      1: 'plan_gluteos_pelve_a', // Segunda
      3: 'plan_gluteos_pelve_b', // Quarta
      5: 'plan_gluteos_pelve_a', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 16. Desaceleração Noturna • Sono Profundo & Higiene Nervosa
  {
    id: 'prog_desaceleracao_noturna_4w',
    title: 'Desaceleração Noturna (Sono Profundo & Vagal - 4 Semanas)',
    description: 'Rotina curta de 10 minutos para realizar antes de deitar: estimulação parassimpática através de respiração diafragmática, torções suaves e elevação de pernas na parede.',
    objective: 'sono',
    environment: 'casa',
    durationWeeks: 4,
    currentWeek: 1,
    splitType: 'habito_express',
    weeklyFrequency: 4,
    habitAnchor: '30 minutos antes de deitar, com luzes baixas',
    phases: [
      {
        name: 'Hábito Noturno: Desativação do Estresse Simpático',
        weeks: [1, 2, 3, 4],
        description: 'Posturas restaurativas no chão e respiração lenta para induzir o relaxamento profundo.',
        focusNotes: 'Sem esforço, deixe a gravidade alongar seu corpo.',
      },
    ],
    routines: [
      getPlan('plan_desaceleracao_noturna'),
    ],
    weeklySchedule: {
      1: 'plan_desaceleracao_noturna', // Segunda
      2: 'plan_desaceleracao_noturna', // Terça
      4: 'plan_desaceleracao_noturna', // Quinta
      6: 'plan_desaceleracao_noturna', // Sábado
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },

  // 17. Longevidade Ativa • Década Centenária (Dr. Peter Attia)
  {
    id: 'prog_longevidade_attia_8w',
    title: 'Longevidade Ativa (Década Centenária Peter Attia - 8 Semanas)',
    description: 'Inspirado no Decatlo do Centenário: preserve a autonomia física para os 80 ou 90 anos treinando equilíbrio de 1 perna, subida em degrau, sentar/levantar e caminhada em linha reta.',
    objective: 'longevidade',
    environment: 'casa',
    durationWeeks: 8,
    currentWeek: 1,
    splitType: 'full_body',
    weeklyFrequency: 3,
    habitAnchor: 'Pela manhã para nutrir a vitalidade diária',
    phases: [
      {
        name: 'Mesociclo 1: Fundação de Equilíbrio & Estabilidade',
        weeks: [1, 2, 3, 4],
        description: 'Propriocepção dos tornozelos, controle de descida na cadeira e postura segura.',
        focusNotes: 'Mantenha um ponto fixo no olhar para estabilidade.',
      },
      {
        name: 'Mesociclo 2: Autonomia Funcional & Agilidade',
        weeks: [5, 6, 7, 8],
        description: 'Subida controlada em degraus, remada protetora e marcha calcanhar-ponta.',
        focusNotes: 'Sinta a firmeza a cada passo.',
      },
    ],
    routines: [
      getPlan('plan_longevidade_attia_a'),
      getPlan('plan_longevidade_attia_b'),
    ],
    weeklySchedule: {
      1: 'plan_longevidade_attia_a', // Segunda
      3: 'plan_longevidade_attia_b', // Quarta
      5: 'plan_longevidade_attia_a', // Sexta
    },
    emergencyPlanId: 'plan_emergencia_salvar_habito_5m',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
];
