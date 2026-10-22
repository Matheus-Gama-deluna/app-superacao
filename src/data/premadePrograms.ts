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
];
