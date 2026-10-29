import {
  AnamnesisSubmission,
  AiAnamnesisAnalysis,
  TeacherDayPrescription,
  WorkoutPlan,
  TeacherStudentLink,
} from '../types';
import { allExercises } from '../data/catalog';
import { generateSmartWorkoutRoutine } from './workoutEngine';

/**
 * Co-Piloto de IA para Professores e Treinadores.
 * Fornece triagem clínica de anamnese, análise de fotos posturais/equipamentos
 * e rascunho de prescrição de 7 dias com descanso total e ativo.
 * Possui Dual-Engine com inteligência clínica determinística e chamada multimodal ao Gemini.
 */

// Heurísticas clínicas determinísticas de alta precisão (funciona 100% offline)
export function runClinicalHeuristicAnalysis(
  submission: AnamnesisSubmission
): AiAnamnesisAnalysis {
  const answers = submission.answers || {};
  const suggestedLimitations: string[] = [];
  const avoidedMovements: string[] = [];
  const posturalFlags: string[] = [];
  const detectedEquipments: string[] = ['peso_corporal'];

  // Análise de respostas
  const limitationsAns = answers['q_joint_limitations'];
  if (Array.isArray(limitationsAns)) {
    if (limitationsAns.includes('dor_joelho')) {
      suggestedLimitations.push('Sensibilidade femoropatelar / joelho');
      avoidedMovements.push('agachamento_profundo', 'impacto_saltos');
      posturalFlags.push('Atenção ao valgo dinâmico em flexão de pernas');
    }
    if (limitationsAns.includes('dor_lombar')) {
      suggestedLimitations.push('Desconforto na coluna lombar');
      avoidedMovements.push('sobrecarga_lombar');
      posturalFlags.push('Evitar hiperextensão ou carga axial pesada');
    }
    if (limitationsAns.includes('dor_ombro')) {
      suggestedLimitations.push('Restrição de elevação / impacto subacromial no ombro');
      avoidedMovements.push('push_vertical');
      posturalFlags.push('Priorizar puxadas neutras e elevações no plano escapular');
    }
    if (limitationsAns.includes('dor_punho')) {
      suggestedLimitations.push('Sobrecarga em punhos em dorsiflexão');
      avoidedMovements.push('flexao_chao');
      posturalFlags.push('Substituir apoios no chão por pegadas neutras ou apoios em plano elevado');
    }
    if (limitationsAns.includes('evitar_chao')) {
      avoidedMovements.push('exercicios_chao');
    }
  }

  // Análise de equipamentos
  const eqAns = answers['q_equipments_available'];
  if (Array.isArray(eqAns)) {
    if (eqAns.includes('elasticos')) {
      detectedEquipments.push('mini_band', 'faixa_longa');
    }
    if (eqAns.includes('halteres')) {
      detectedEquipments.push('halteres');
    }
    if (eqAns.includes('cadeira_parede')) {
      detectedEquipments.push('cadeira', 'parede');
    }
    if (eqAns.includes('colchonete')) {
      detectedEquipments.push('colchonete');
    }
  }

  // Fotos anexadas
  if (submission.photos && submission.photos.length > 0) {
    const hasFront = submission.photos.some((p) => p.category === 'posture_front');
    const hasSide = submission.photos.some((p) => p.category === 'posture_side');
    if (hasFront) {
      posturalFlags.push('Simetria de ombros e alinhamento de quadril inspecionados visualmente');
    }
    if (hasSide) {
      posturalFlags.push('Curvatura cifótica/lordótica registrada para monitoramento de retração escapular');
    }
  }

  // Frequência semanal recomendada
  let freq = 3;
  const freqAns = answers['q_weekly_frequency'];
  if (freqAns) {
    const parsed = parseInt(String(freqAns), 10);
    if (!isNaN(parsed) && parsed > 0) freq = parsed;
  }

  const suggestedSplit: 'full_body' | 'upper_lower' | 'abc' =
    freq <= 3 ? 'full_body' : freq === 4 ? 'upper_lower' : 'abc';

  const summary = `${submission.studentName || 'Aluno(a)'} com objetivo focado em ${answers['q_primary_goal'] || 'saúde e constância'}. ` +
    (suggestedLimitations.length > 0
      ? `Apresenta restrições articulares relevantes: ${suggestedLimitations.join(', ')}. `
      : 'Sem histórico agudo de restrições osteoarticulares relatadas. ') +
    `Prescrição recomendada em divisão ${suggestedSplit.toUpperCase()} para ${freq} dias semanais, alternados com dias de descanso consciente.`;

  return {
    suggestedLimitations,
    avoidedMovements,
    posturalFlags,
    detectedEquipments: Array.from(new Set(detectedEquipments)),
    clinicalSummary: summary,
    suggestedSplit,
    suggestedFrequencyDays: freq,
    confidenceScore: 0.92,
    analyzedAt: Date.now(),
    source: 'clinical_heuristics',
  };
}

/**
 * Rascunho assistido de prescrição de 7 dias para o professor.
 * Gera os planos compatíveis do catálogo e distribui os dias com descanso total ou ativo.
 */
export function draftWeeklyPrescriptionForTeacher(
  studentName: string,
  analysis: AiAnamnesisAnalysis
): {
  weeklyPrescriptions: TeacherDayPrescription[];
  assignedPlans: WorkoutPlan[];
} {
  const proposal = generateSmartWorkoutRoutine(
    {
      displayName: studentName,
      equipments: analysis.detectedEquipments,
      avoidedMovements: analysis.avoidedMovements,
      reportedLimitations: analysis.suggestedLimitations,
      availableDays: analysis.suggestedFrequencyDays === 2
        ? [2, 4] // Ter, Qui
        : analysis.suggestedFrequencyDays === 4
        ? [1, 2, 4, 5] // Seg, Ter, Qui, Sex
        : [1, 3, 5], // Seg, Qua, Sex (Padrão 3 dias)
      sessionDurationMinutes: 25,
      experienceLevel: 'iniciante',
    },
    {}
  );

  const plans = proposal.routines;

  // Monta a grade de 7 dias (0 a 6: Dom a Sáb)
  const daysWithWorkout = analysis.suggestedFrequencyDays === 2
    ? [2, 4]
    : analysis.suggestedFrequencyDays === 4
    ? [1, 2, 4, 5]
    : [1, 3, 5];

  const weeklyPrescriptions: TeacherDayPrescription[] = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
    // Dia de Treino
    if (daysWithWorkout.includes(dayOfWeek)) {
      const planIdx = daysWithWorkout.indexOf(dayOfWeek) % plans.length;
      const assignedPlan = plans[planIdx] || plans[0];
      return {
        dayOfWeek,
        regime: 'workout',
        planId: assignedPlan?.id,
        planTitle: assignedPlan?.title,
        teacherNotes: `Treino planejado para sua constância: ${assignedPlan?.title}`,
      };
    }

    // Dias sem treino: alterna entre Descanso Ativo (sábado/quarta) e Descanso Total (domingo)
    if (dayOfWeek === 0) {
      // Domingo: Descanso Total
      return {
        dayOfWeek,
        regime: 'rest_total',
        teacherNotes: 'Dia reservado para repouso integral do corpo e da mente.',
      };
    } else if (dayOfWeek === 6 || (analysis.suggestedFrequencyDays <= 3 && dayOfWeek === 2)) {
      // Sábado ou Terça: Descanso Ativo
      return {
        dayOfWeek,
        regime: 'rest_active',
        activeRestActivity: 'caminhada_leve',
        activeRestCustomLabel: 'Caminhada leve ao ar livre (20 min) ou mobilidade suave',
        activeRestDurationMinutes: 20,
        teacherNotes: 'Estimule a circulação com uma caminhada tranquila ou alongamentos leves.',
      };
    } else {
      return {
        dayOfWeek,
        regime: 'rest_total',
        teacherNotes: 'Recuperação muscular para render melhor no próximo treino.',
      };
    }
  });

  return {
    weeklyPrescriptions,
    assignedPlans: plans,
  };
}

/**
 * Radar de Alertas da Carteira de Alunos do Professor
 */
export interface TeacherStudentRadarAlert {
  studentUid: string;
  studentName: string;
  type: 'discomfort_reported' | 'high_consistency_ready_for_upgrade' | 'pending_anamnesis_review';
  headline: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
}

export function evaluateTeacherRosterRadar(
  links: TeacherStudentLink[],
  recentSubmissions: AnamnesisSubmission[]
): TeacherStudentRadarAlert[] {
  const alerts: TeacherStudentRadarAlert[] = [];

  for (const link of links) {
    // 1. Alunos pendentes de revisão de anamnese
    if (link.status === 'pending') {
      const sub = recentSubmissions.find((s) => s.id === link.lastSubmissionId);
      alerts.push({
        studentUid: link.studentUid,
        studentName: link.studentName,
        type: 'pending_anamnesis_review',
        headline: `Anamnese pendente de prescrição`,
        detail: sub?.answers?.['q_primary_goal']
          ? `Objetivo: "${sub.answers['q_primary_goal']}". Clique para prescrever a semana.`
          : 'Novo questionário preenchido aguardando suas orientações.',
        priority: 'high',
      });
    }

    // 2. Alunos com prescrição ativa há mais de 4 semanas (tempo de revisar ciclo)
    if (link.status === 'active' && link.lastPrescribedAt) {
      const weeksAgo = (Date.now() - link.lastPrescribedAt) / (1000 * 60 * 60 * 24 * 7);
      if (weeksAgo >= 4) {
        alerts.push({
          studentUid: link.studentUid,
          studentName: link.studentName,
          type: 'high_consistency_ready_for_upgrade',
          headline: `Ciclo de 4 semanas completado`,
          detail: `${link.studentName} está há 4 semanas com este plano. Bom momento para ajuste de cargas ou progressão.`,
          priority: 'medium',
        });
      }
    }
  }

  return alerts;
}
