/**
 * Ferramentas Biomecânicas e de Segurança Determinísticas (v9.0)
 * Os modelos de IA NÃO fazem cálculos de cabeça nem inventam IDs.
 * Operam exclusivamente sobre estas funções verificáveis em TypeScript.
 */

export interface ExerciseCandidate {
  id: string;
  name_pt: string;
  functionalPattern: string;
  equipment: string[];
  jointStress: {
    knee: number;
    lumbar: number;
    shoulder: number;
    wrist: number;
  };
  instructionsSummary: string;
}

export interface VolumeAuditResult {
  totalDirectSets: number;
  fractionalVolumeByPattern: Record<string, number>;
  pushPullRatio: number;
  isPushPullBalanced: boolean;
  estimatedDurationMinutes: number;
  acsmDoseStatus: 'sub_dose' | 'dose_minima_eficaz' | 'volume_otimo_hipertrofia' | 'volume_excessivo';
  feedbackPt: string;
}

export interface RedFlagCheckResult {
  hasRedFlags: boolean;
  detectedFlags: string[];
  severity: 'none' | 'moderate_precaution' | 'critical_medical_referral';
  userAdvicePt: string;
}

const CRITICAL_RED_FLAG_PATTERNS = [
  { flag: 'dor_toracica', regex: /\b(dor no peito|aperto no peito|dor tor[aá]cica|queima[cç][aã]o no peito|dor no cora[cç][aã]o)\b/i },
  { flag: 'dispneia_grave', regex: /\b(falta de ar em repouso|n[aã]o consigo respirar|sufoco|arrepio e falta de ar)\b/i },
  { flag: 'sincope_vertigem', regex: /\b(desmaio|desmaiei|apaguei|quase desmaiei|tontura forte com perda de vis[aã]o)\b/i },
  { flag: 'deficit_neurologico', regex: /\b(perda de for[cç]a na perna|perna falhando|dorm[eê]ncia descendo|formigamento que n[aã]o passa|perda de controle da urina)\b/i },
  { flag: 'trauma_agudo', regex: /\b(quebrei|fratura|luxa[cç][aã]o|estalo muito forte com incha[cç]o imediato|ca[ií] e n[aã]o consigo apoiar)\b/i },
  { flag: 'febre_sistemica', regex: /\b(febre alta|calafrios intensos|infec[cç][aã]o ativa)\b/i },
];

/**
 * 1. Verificador determinístico de bandeiras vermelhas médicas
 */
export function checkMedicalRedFlags(text: string): RedFlagCheckResult {
  const detectedFlags: string[] = [];

  for (const item of CRITICAL_RED_FLAG_PATTERNS) {
    if (item.regex.test(text)) {
      detectedFlags.push(item.flag);
    }
  }

  if (detectedFlags.length > 0) {
    return {
      hasRedFlags: true,
      detectedFlags,
      severity: 'critical_medical_referral',
      userAdvicePt:
        'Atenção prioritária à sua saúde: identificamos sintomas que exigem avaliação médica presencial antes de qualquer prática de esforço físico. Por segurança, pause os treinos intensos e consulte um médico ou serviço de saúde.',
    };
  }

  return {
    hasRedFlags: false,
    detectedFlags: [],
    severity: 'none',
    userAdvicePt: 'Nenhuma bandeira vermelha crítica identificada.',
  };
}

/**
 * 2. Auditoria de Volume Fracionado (Consenso ACSM 2026 / Pelland & Schoenfeld)
 */
export function auditWeeklyFractionalVolume(
  exercises: Array<{
    functionalPattern?: string;
    targetSets?: number;
    targetReps?: number;
    restSeconds?: number;
  }>,
  frequencyPerWeek = 3
): VolumeAuditResult {
  let totalSetsPerSession = 0;
  let totalSecondsPerSession = 0;
  const fractionalVolume: Record<string, number> = {
    empurrar: 0,
    puxar: 0,
    joelho_dominante: 0,
    quadril_dominante: 0,
    core_anti_movimento: 0,
    mobilidade_outro: 0,
  };

  let pushSets = 0;
  let pullSets = 0;

  for (const ex of exercises) {
    const sets = ex.targetSets || 3;
    const reps = ex.targetReps || 10;
    const rest = ex.restSeconds || 45;
    totalSetsPerSession += sets;

    // Tempo estimado: séries * (reps * 3s excêntrico/concêntrico + descanso) + 20s transição
    totalSecondsPerSession += sets * (reps * 3 + rest) + 20;

    const pattern = (ex.functionalPattern || 'mobilidade_outro').toLowerCase();

    if (pattern.includes('push') || pattern.includes('empurrar')) {
      fractionalVolume.empurrar += sets;
      pushSets += sets;
    } else if (pattern.includes('pull') || pattern.includes('puxar')) {
      fractionalVolume.puxar += sets;
      pullSets += sets;
    } else if (pattern.includes('squat') || pattern.includes('lunge') || pattern.includes('joelho')) {
      fractionalVolume.joelho_dominante += sets;
    } else if (pattern.includes('hinge') || pattern.includes('glute') || pattern.includes('quadril')) {
      fractionalVolume.quadril_dominante += sets;
    } else if (pattern.includes('core') || pattern.includes('plank') || pattern.includes('anti_')) {
      fractionalVolume.core_anti_movimento += sets;
    } else {
      fractionalVolume.mobilidade_outro += sets;
    }
  }

  const weeklySetsAverage = totalSetsPerSession * frequencyPerWeek;
  const estimatedDurationMinutes = Math.round(totalSecondsPerSession / 60);
  const pushPullRatio = pullSets > 0 ? Number((pushSets / pullSets).toFixed(2)) : pushSets > 0 ? 2.0 : 1.0;
  const isPushPullBalanced = pushPullRatio >= 0.7 && pushPullRatio <= 1.3;

  let acsmDoseStatus: VolumeAuditResult['acsmDoseStatus'] = 'dose_minima_eficaz';
  let feedbackPt = '';

  if (weeklySetsAverage < 6) {
    acsmDoseStatus = 'sub_dose';
    feedbackPt = 'Volume suave, ideal para recuperação ou primeiras semanas de adaptação.';
  } else if (weeklySetsAverage <= 15) {
    acsmDoseStatus = 'dose_minima_eficaz';
    feedbackPt = 'Dose Mínima Eficaz (MED) atingida com excelência: estímulo robusto em tempo otimizado.';
  } else if (weeklySetsAverage <= 40) {
    acsmDoseStatus = 'volume_otimo_hipertrofia';
    feedbackPt = 'Faixa ótima de volume para hipertrofia dedicada e desenvolvimento muscular equilibrado.';
  } else {
    acsmDoseStatus = 'volume_excessivo';
    feedbackPt = 'Volume alto para o tempo planejado: sugerido podar séries redundantes (junk volume).';
  }

  return {
    totalDirectSets: totalSetsPerSession,
    fractionalVolumeByPattern: fractionalVolume,
    pushPullRatio,
    isPushPullBalanced,
    estimatedDurationMinutes,
    acsmDoseStatus,
    feedbackPt,
  };
}

/**
 * 3. Validador de Proposta de Alteração de Treino com Trava para Professor Parceiro
 */
export function buildWorkoutProposalDiff(params: {
  actionType: 'swap_exercise' | 'soften_session' | 'reschedule_day' | 'update_routine';
  titlePt: string;
  descriptionPt: string;
  isTeacherManaged?: boolean;
  originalExerciseId?: string;
  replacementExerciseId?: string;
  replacementNamePt?: string;
  payload?: any;
}): {
  allowed: boolean;
  blockedReason?: string;
  proposalDiff?: any;
} {
  // Regra Inviolável: se a rotina é prescrita pelo Professor, a IA é proibida de alterar o plano permanente
  if (params.isTeacherManaged && params.actionType === 'update_routine') {
    return {
      allowed: false,
      blockedReason:
        'Sua ficha é personalizada e acompanhada pelo seu Professor Parceiro. A IA não pode alterar sua rotina permanente sem a validação do seu treinador. Sugerimos enviar uma mensagem a ele no painel.',
    };
  }

  return {
    allowed: true,
    proposalDiff: {
      actionType: params.actionType,
      titlePt: params.titlePt,
      descriptionPt: params.descriptionPt,
      originalId: params.originalExerciseId,
      replacementId: params.replacementExerciseId,
      replacementNamePt: params.replacementNamePt,
      payload: params.payload,
    },
  };
}
