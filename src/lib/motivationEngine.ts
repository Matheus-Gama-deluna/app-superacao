import {
  UserProfile,
  WorkoutPlan,
  WorkoutSession,
  PersonalRecord,
  CalendarDay,
  MotivationStyle,
  CopingPlanRule,
  PreparationRitual,
  SessionFocusInvite,
  WeeklyReviewSummary,
  PreWorkoutMood,
  PostWorkoutMood,
} from '../types';
import { getLocalDateStr } from './dateUtils';

export type SituationalSetId =
  | 'C01_inicio_retomada'
  | 'C02_dia_corrido_energia_baixa'
  | 'C03_rotina_instavel_esquecimento'
  | 'C04_evolucao_superacao'
  | 'C05_aprendizagem_tecnica'
  | 'C06_bem_estar_alivio'
  | 'C07_monotonia_variedade'
  | 'C08_compromisso_social'
  | 'C09_plano_proprio_profissional';

export interface SituationalSetResolution {
  setId: SituationalSetId;
  name: string;
  rationale: string;
  techniques: string[]; // ex: ['T01', 'T05', 'T06', 'T08']
}

/**
 * 1. Resolve o Conjunto Situacional (C01–C09) com base nas escolhas da pessoa e sinais do momento.
 */
export function resolveSituationalSet(
  profile: Partial<UserProfile>,
  todaySessionOrPlan: WorkoutPlan | null,
  recentSessions: WorkoutSession[],
  currentDayPreMood?: PreWorkoutMood,
  activeObstacleId?: string
): SituationalSetResolution {
  // C09: Se o plano atual é profissional ou preferência por plano próprio sem desafios extras
  if (
    profile.motivationStyle === 'none' ||
    todaySessionOrPlan?.isProfessional ||
    profile.planSourcePreference === 'profissional'
  ) {
    return {
      setId: 'C09_plano_proprio_profissional',
      name: 'Respeito ao Plano Estruturado',
      rationale: 'Foco exclusivo na execução correta e pontual do plano, sem interferências de gamificação ou metas extras.',
      techniques: ['T04', 'T06', 'T07'],
    };
  }

  // C02: Dia corrido ou energia baixa
  if (
    currentDayPreMood === 'cansado' ||
    currentDayPreMood === 'tenso' ||
    activeObstacleId === 'falta_tempo' ||
    activeObstacleId === 'cansaco_mental'
  ) {
    return {
      setId: 'C02_dia_corrido_energia_baixa',
      name: 'Adaptação Acolhedora para Dia Difícil',
      rationale: 'Preservar a continuidade com suavização de volume ou versão mínima express de 5 min sem culpa.',
      techniques: ['T01', 'T05', 'T07', 'T08'],
    };
  }

  // C03: Inércia / Esquecimento de horário
  if (activeObstacleId === 'dificuldade_comecar' || activeObstacleId === 'esquecimento') {
    return {
      setId: 'C03_rotina_instavel_esquecimento',
      name: 'Redução de Inércia & Preparação Guiada',
      rationale: 'Ativação do ritual de preparação em 2 passos para romper a inércia do primeiro movimento.',
      techniques: ['T06', 'T07', 'T18'],
    };
  }

  // C01: Início absoluto (< 3 sessões) ou retomada prolongada
  const completedCount = recentSessions.filter((s) => s.status === 'completed' || s.status === 'parcial').length;
  if (completedCount < 3 || profile.experienceLevel === 'retomando') {
    return {
      setId: 'C01_inicio_retomada',
      name: 'Início & Retomada Acolhedora',
      rationale: 'Construção de segurança inicial, apoio na escolha diária e valorização da presença.',
      techniques: ['T01', 'T05', 'T06', 'T08'],
    };
  }

  // Resolução baseada no estilo de motivação explicitamente escolhido pelo praticante
  switch (profile.motivationStyle) {
    case 'mastery':
      return {
        setId: 'C05_aprendizagem_tecnica',
        name: 'Domínio Técnico & Consciência Corporal',
        rationale: 'Atenção focada na qualidade do gesto motor, controle articular e respiração.',
        techniques: ['T03', 'T01', 'T04'],
      };
    case 'wellbeing':
      return {
        setId: 'C06_bem_estar_alivio',
        name: 'Bem-Estar & Vitalidade Imediata',
        rationale: 'Busca por sensações positivas pós-prática, alívio de estresse e energia renovada.',
        techniques: ['T08', 'T01', 'T05'],
      };
    case 'performance':
      return {
        setId: 'C04_evolucao_superacao',
        name: 'Evolução & Superação Pessoal',
        rationale: 'Busca consciente e segura por marcas pessoais (PRs) sob esforço controlado.',
        techniques: ['T02', 'T04', 'T12'],
      };
    case 'variety':
      return {
        setId: 'C07_monotonia_variedade',
        name: 'Exploração & Descoberta Guiada',
        rationale: 'Variações biomecânicas seguras e novidades motoras compatíveis para combater o tédio.',
        techniques: ['T10', 'T09', 'T01'],
      };
    case 'social':
      return {
        setId: 'C08_compromisso_social',
        name: 'Compromisso & Apoio Escolhido',
        rationale: 'Pacto voluntário de processo compartilhado com alguém de confiança.',
        techniques: ['T13', 'T04', 'T06'],
      };
    case 'consistency':
    default:
      return {
        setId: 'C01_inicio_retomada',
        name: 'Constância & Ritmo Sustentável',
        rationale: 'Foco na regularidade do hábito semanal e na celebração do processo.',
        techniques: ['T04', 'T05', 'T06'],
      };
  }
}

/**
 * 2. Gera o Convite de Foco da Sessão (SessionFocusInvite)
 * Substitui o antigo microdesafio unicamente focado em PR de força.
 */
export function generateSessionFocusInvite(
  plan: WorkoutPlan | null,
  personalRecords: PersonalRecord[],
  profile: Partial<UserProfile>,
  todayPreMood?: PreWorkoutMood
): SessionFocusInvite | null {
  if (!plan || !plan.exercises || plan.exercises.length === 0) return null;

  // Se o usuário desativou desafios ou segue plano estritamente profissional
  if (profile.motivationStyle === 'none' || plan.isProfessional) {
    return null;
  }

  const firstEx = plan.exercises[0];
  const isMobility =
    plan.category === 'mobilidade' ||
    plan.title.toLowerCase().includes('mobilidade') ||
    plan.title.toLowerCase().includes('alongamento');

  // Se é mobilidade ou o usuário busca bem-estar
  if (isMobility || profile.motivationStyle === 'wellbeing' || todayPreMood === 'cansado' || todayPreMood === 'tenso') {
    return {
      type: 'wellbeing_flow',
      title: 'Fluidez & Respiração Livre',
      badgeText: 'Foco de Bem-Estar',
      description: `Mantenha a respiração calma em cada série de ${firstEx.exerciseName}. O objetivo hoje é sair da prática com a sensação de alívio e leveza.`,
      exerciseId: firstEx.exerciseId,
      exerciseName: firstEx.exerciseName,
    };
  }

  // Se o foco é maestria e técnica
  if (profile.motivationStyle === 'mastery') {
    return {
      type: 'technical_mastery',
      title: `Controle de Movimento em ${firstEx.exerciseName}`,
      badgeText: 'Foco de Domínio Técnico',
      description: 'Observe a cadência controlada de descida e a estabilidade do tronco durante todo o movimento.',
      exerciseId: firstEx.exerciseId,
      exerciseName: firstEx.exerciseName,
      cue: 'Mantenha a postura alinhada e evite prender a respiração.',
    };
  }

  // Se o foco é constância / processo
  if (profile.motivationStyle === 'consistency') {
    return {
      type: 'consistency_habit',
      title: 'Completar com Presença & Ritmo',
      badgeText: 'Foco de Constância',
      description: `Cumpra as séries planejadas de ${plan.title} no seu tempo, sem pressa. Cada série concluída fortalece seu hábito.`,
      exerciseId: firstEx.exerciseId,
      exerciseName: firstEx.exerciseName,
    };
  }

  // Se o foco é performance e a energia estiver boa
  if (profile.motivationStyle === 'performance') {
    // Procura exercício que tenha marca base ou PR comparável
    const candidate = plan.exercises.find((ex) => {
      const pr = personalRecords.find((p) => p.exerciseId === ex.exerciseId);
      return pr !== undefined;
    });

    if (candidate) {
      const pr = personalRecords.find((p) => p.exerciseId === candidate.exerciseId)!;
      const isTimeMode = candidate.trackingMode === 'time' || (candidate.targetDurationSeconds && candidate.targetDurationSeconds > 0);

      if (isTimeMode) {
        const baseTime = pr.bestDurationSeconds || candidate.targetDurationSeconds || 30;
        return {
          type: 'pr_challenge',
          title: `Superação em ${candidate.exerciseName}`,
          badgeText: 'Desafio Pessoal Opcional',
          description: `Sua marca atual é de ${baseTime}s. Se você se sentir confortável na última série, tente sustentar ${baseTime + 5}s com boa postura!`,
          targetMark: baseTime + 5,
          unit: 'seconds',
          exerciseId: candidate.exerciseId,
          exerciseName: candidate.exerciseName,
        };
      } else {
        const baseReps = pr.bestReps || candidate.targetReps || 10;
        return {
          type: 'pr_challenge',
          title: `Buscar +1 Repetição em ${candidate.exerciseName}`,
          badgeText: 'Desafio Pessoal Opcional',
          description: `Sua marca atual sob esta condição é de ${baseReps} reps. Que tal tentar buscar ${baseReps + 1} reps na última série se estiver se sentindo forte?`,
          targetMark: baseReps + 1,
          unit: 'reps',
          exerciseId: candidate.exerciseId,
          exerciseName: candidate.exerciseName,
        };
      }
    }
  }

  // Padrão amigável de constância
  return {
    type: 'consistency_habit',
    title: 'Manter a Prática em Movimento',
    badgeText: 'Foco do Dia · Desafio de Hoje',
    description: `Dedique os minutos de hoje para cuidar de si mesmo em ${plan.title}.`,
    exerciseId: firstEx.exerciseId,
    exerciseName: firstEx.exerciseName,
  };
}

/**
 * 3. Planos Se-Então Padrão para Obstáculos (T07 Coping Planning)
 */
export function getDefaultCopingPlans(obstacles: string[] = []): CopingPlanRule[] {
  const rulesMap: Record<string, CopingPlanRule> = {
    falta_tempo: {
      obstacleId: 'falta_tempo',
      ifTriggerLabel: 'Se meu tempo ficar curto ou o dia for imprevisível',
      thenActionType: 'express_5min',
      thenActionLabel: 'Faço a Opção Rápida de 5 min para honrar meu hábito sem estresse',
    },
    cansaco_mental: {
      obstacleId: 'cansaco_mental',
      ifTriggerLabel: 'Se eu terminar o dia com a mente pesada e sem energia',
      thenActionType: 'soften_25pct',
      thenActionLabel: 'Suavizo o treino de hoje em -25% ou faço mobilidade regenerativa',
    },
    dificuldade_comecar: {
      obstacleId: 'dificuldade_comecar',
      ifTriggerLabel: 'Se bater a preguiça ou a inércia para começar',
      thenActionType: 'guided_form_focus',
      thenActionLabel: 'Concluo apenas meu ritual de 2 passos e faço a primeira série teste',
    },
    desanimo_falhar: {
      obstacleId: 'desanimo_falhar',
      ifTriggerLabel: 'Se eu perder um dia planejado na semana',
      thenActionType: 'reschedule_day',
      thenActionLabel: 'Reajusto a agenda da semana com calma: 1 dia perdido não anula meu progresso',
    },
    dor_articular: {
      obstacleId: 'dor_articular',
      ifTriggerLabel: 'Se surgir algum desconforto articular leve',
      thenActionType: 'swap_mobility',
      thenActionLabel: 'Troco o movimento por um equivalente sem impacto ou faço alongamento suave',
    },
  };

  const selected = obstacles.map((obs) => rulesMap[obs]).filter(Boolean);
  if (selected.length > 0) return selected;

  // Padrões se nenhum for informado
  return [rulesMap.falta_tempo, rulesMap.cansaco_mental];
}

/**
 * 4. Ritual de Preparação Padrão (T06 Implementation Intentions)
 */
export function getDefaultPreparationRitual(habitAnchor?: string): PreparationRitual {
  const anchor = habitAnchor && habitAnchor.trim().length > 0
    ? habitAnchor.trim()
    : 'Após terminar meu primeiro compromisso do dia';

  return {
    anchorTrigger: anchor,
    steps: [
      'Separar o espaço livre e calçar o calçado/roupa confortável',
      'Abrir o aplicativo e respirar fundo por 10 segundos',
    ],
    enableGuidedImagery: true,
  };
}

/**
 * 5. Revisão Semanal de Processo (T04, T05, T17)
 */
export function generateWeeklyProcessReview(
  sessions: WorkoutSession[],
  calendar: CalendarDay[],
  targetDaysCount: number
): WeeklyReviewSummary {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 a 6
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const startStr = getLocalDateStr(startOfWeek);
  const endStr = getLocalDateStr(endOfWeek);

  // Filtra sessões da semana corrente
  const weekSessions = sessions.filter((s) => {
    const sDate = s.date || (s.startedAt ? getLocalDateStr(new Date(s.startedAt)) : '');
    return sDate >= startStr && sDate <= endStr;
  });

  const completedCount = weekSessions.filter(
    (s) => s.status === 'completed' && !s.isExpress && s.originType !== 'external_practice'
  ).length;

  const expressOrPartialCount = weekSessions.filter(
    (s) => (s.status === 'parcial' || s.isExpress || s.wasPlannedHabit) && s.originType !== 'external_practice'
  ).length;

  const externalCount = weekSessions.filter(
    (s) => s.originType === 'external_practice'
  ).length;

  const totalEfforts = weekSessions
    .map((s) => s.feedbackEffort || s.rpeEffort || 0)
    .filter((e) => e > 0);

  const averageRpe = totalEfforts.length > 0
    ? Number((totalEfforts.reduce((acc, curr) => acc + curr, 0) / totalEfforts.length).toFixed(1))
    : 3;

  // Humor predominante
  const moods = weekSessions.map((s) => s.postMood).filter(Boolean) as PostWorkoutMood[];
  const predominantMood = moods.length > 0 ? moods[moods.length - 1] : undefined;

  const totalPractices = completedCount + expressOrPartialCount + externalCount;

  let suggestedAction: 'maintain' | 'soften' | 'advance' = 'maintain';
  let suggestedDaysTarget = targetDaysCount;

  if (totalPractices >= targetDaysCount && averageRpe <= 2.5 && totalPractices >= 3) {
    suggestedAction = 'advance';
    suggestedDaysTarget = Math.min(6, targetDaysCount + 1);
  } else if (totalPractices < Math.max(1, targetDaysCount - 1) || averageRpe >= 4.5) {
    suggestedAction = 'soften';
    suggestedDaysTarget = Math.max(1, targetDaysCount - 1);
  }

  return {
    weekStartDate: startStr,
    weekEndDate: endStr,
    completedCount,
    expressOrPartialCount,
    externalCount,
    averageRpe,
    predominantMood,
    currentTargetDays: targetDaysCount,
    suggestedAction,
    suggestedDaysTarget,
  };
}
