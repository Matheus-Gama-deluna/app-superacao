/**
 * Agente Principal de Personal (MasterPersonalAgent) — v9.5 Produção
 * Modelo Titular: zai-org/GLM-5.3-Flash (Homologado ~1.5s–2.0s, JSON estrito, pt-BR natural)
 * Modelo Fallback: deepseek-ai/DeepSeek-V3.2
 *
 * Capacidades Completas:
 * - Adaptação biomecânica em tempo real (Modo Foco) com IDs reais do Catálogo (900+ exercícios)
 * - Preparação de treinos sob medida para 8 propósitos (incluindo pós-luta/artes marciais, mobilidade, escritório, hotel)
 * - Gestão de Programas Evolutivos de 8 Semanas (4 fases) e Kit de Contingência Anti-Abandono
 * - Registro conversacional de práticas externas (Jiu-Jitsu, Muay Thai, corrida, etc.)
 * - Co-criação de Escuta Inicial (autofill_onboarding) e ajuste de agenda/perfil
 */

import { callDeepInfraWithFixedFallback, ChatMessage } from '../config/agentModels.js';
import { buildSkillsIndexPrompt, resolveSkillsForContextAsync } from '../skills/skillRegistry.js';
import {
  loadActiveCoreMemory,
  formatCoreMemoryForPrompt,
  updateCoreMemory,
  recordEpisodicMemory,
  retrieveRelevantEpisodes,
  autoExtractAndPersistTurnMemory,
} from '../memory/agentMemoryEngine.js';
import { checkMedicalRedFlags } from '../tools/biomechanicsTools.js';
import { recordAiExecutionMetrics, checkUserQuota } from '../admin/usageLedger.js';
import { ActiveScreenContext, AssistantActionProposal, ClinicalMemoryFact, ProposalDiff } from '../types/sharedAi.js';

export interface CatalogCandidateSummary {
  id: string;
  name_pt: string;
  pattern?: string;
  equipment?: string[];
}

export interface MasterPersonalRequest {
  uid: string;
  userMessage: string;
  historyTurns?: Array<{ role: 'user' | 'assistant'; text: string }>;
  activeScreenContext?: ActiveScreenContext;
  reportedLimitations?: string[];
  equipments?: string[];
  primaryGoal?: string;
  preferredDurationMinutes?: number;
  healthNotes?: string;
  userContextNotes?: string;
  isTeacherManaged?: boolean;
  sessionExercises?: Array<{ id: string; name_pt: string; sets?: number; reps?: number }>;
  catalogCandidates?: CatalogCandidateSummary[];
  programSummary?: {
    title?: string;
    currentWeek?: number;
    totalWeeks?: number;
    currentPhaseLabel?: string;
    scheduledDaysCount?: number;
  };
  /** Contexto vivo do aluno (perfil + dia atual + histórico recente) para respostas realmente personalizadas */
  userContext?: AiUserContext;
}

export interface AiUserContext {
  experienceLevel?: string;
  obstacles?: string[];
  availableDays?: number[];
  habitAnchor?: string;
  exerciseReason?: string;
  goalPriority?: string[];
  preferredTime?: string;
  environment?: string;
  today?: { kind?: string; planTitle?: string; completed?: boolean; dateStr?: string };
  recentSessions?: Array<{ date?: string; title?: string; rpe?: number; durationMin?: number; mood?: string; external?: boolean }>;
  daysSinceLastWorkout?: number;
  weeklyCompleted?: number;
  weeklyTarget?: number;
}

function formatUserContextForPrompt(ctx?: AiUserContext): string {
  if (!ctx) return '- Contexto pessoal adicional: não informado.';
  const dayNames = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const lines: string[] = [];
  if (ctx.experienceLevel) lines.push(`- Nível de experiência: ${ctx.experienceLevel}`);
  if (ctx.goalPriority?.length) lines.push(`- Objetivos (em ordem de prioridade): ${ctx.goalPriority.slice(0, 4).join(' > ')}`);
  if (ctx.exerciseReason) lines.push(`- Porquê pessoal: "${String(ctx.exerciseReason).slice(0, 140)}"`);
  if (ctx.obstacles?.length) lines.push(`- Obstáculos declarados: ${ctx.obstacles.slice(0, 5).join(', ')}`);
  if (ctx.availableDays?.length) lines.push(`- Dias disponíveis: ${ctx.availableDays.map((d) => dayNames[d] || d).join(', ')}${ctx.preferredTime ? ` (prefere ${ctx.preferredTime})` : ''}`);
  if (ctx.habitAnchor) lines.push(`- Âncora de hábito: ${String(ctx.habitAnchor).slice(0, 100)}`);
  if (ctx.environment) lines.push(`- Ambiente preferido: ${ctx.environment}`);
  if (ctx.today) {
    lines.push(`- HOJE: ${ctx.today.kind || 'livre'}${ctx.today.planTitle ? ` — "${ctx.today.planTitle}"` : ''}${ctx.today.completed ? ' (já concluído)' : ''}`);
  }
  if (typeof ctx.weeklyCompleted === 'number') lines.push(`- Semana: ${ctx.weeklyCompleted}/${ctx.weeklyTarget ?? '?'} sessões`);
  if (typeof ctx.daysSinceLastWorkout === 'number') lines.push(`- Dias desde o último treino: ${ctx.daysSinceLastWorkout}`);
  if (ctx.recentSessions?.length) {
    lines.push('- Últimas sessões (mais recente primeiro):');
    for (const r of ctx.recentSessions.slice(0, 5)) {
      lines.push(`  • ${r.date || '?'} ${r.external ? '[externo] ' : ''}${String(r.title || 'Treino').slice(0, 50)}${r.durationMin ? ` ${r.durationMin}min` : ''}${typeof r.rpe === 'number' ? ` RPE ${r.rpe}/5` : ''}${r.mood ? ` humor ${r.mood}` : ''}`);
    }
  }
  return lines.length ? lines.join('\n') : '- Contexto pessoal adicional: não informado.';
}

const TEACHER_LOCKED_ACTIONS = new Set([
  'update_routine',
  'create_program',
  'advance_program_phase',
  'evolve_program_variations',
  'update_schedule',
]);

export async function runMasterPersonalAgent(req: MasterPersonalRequest): Promise<AssistantActionProposal> {
  const startTime = Date.now();
  const uid = req.uid || 'guest';
  const cleanMessage = (req.userMessage || '').trim();

  if (!cleanMessage) {
    return {
      replyPt: 'Olá! Estou pronto para te ajudar com seu treino, adaptações articulares ou rotina da semana. O que você precisa hoje?',
      requiresConfirmation: false,
    };
  }

  // 1. Verificação de cota, Kill-Switch e Hard-Stop financeiro USD
  const quota = await checkUserQuota(uid);
  if (!quota.allowed) {
    return {
      replyPt: quota.reason || 'Limite de interações atingido por hoje. Suas fichas e treinos seguem ativos!',
      requiresConfirmation: false,
    };
  }

  // 2. Triagem Determinística Pré-LLM de Red Flags Médicas (0ms / US$ 0)
  const combinedUserText = `${cleanMessage} ${req.healthNotes || ''} ${req.userContextNotes || ''}`.trim();
  const redFlagCheck = checkMedicalRedFlags(combinedUserText);

  if (redFlagCheck.hasRedFlags && redFlagCheck.severity === 'critical_medical_referral') {
    await recordAiExecutionMetrics({
      serviceId: 'master_personal',
      uid,
      tokensUsed: { inputTokens: 40, outputTokens: 40 },
      durationMs: Date.now() - startTime,
      isRedFlagBlocked: true,
    });

    return {
      replyPt: redFlagCheck.userAdvicePt,
      clinicalReasoningSummary: `Bandeira vermelha médica acionada (${redFlagCheck.detectedFlags.join(', ')}). Esforço físico bloqueado preventivamente.`,
      requiresConfirmation: false,
      activatedSkillIds: ['01_red_flags_confef_ethics'],
    };
  }

  // 3. Carregamento paralelo de Memória M2 + Episódios Semânticos M3/M4 + Skills com Overrides Admin
  const [coreMemory, relevantEpisodes] = await Promise.all([
    loadActiveCoreMemory(uid),
    retrieveRelevantEpisodes(uid, cleanMessage, 3),
  ]);
  const coreMemoryText = formatCoreMemoryForPrompt(coreMemory, relevantEpisodes);

  const activeLimitationTags = Array.from(
    new Set([
      ...(req.reportedLimitations || []),
      ...coreMemory.clinicalFacts.map((f) => f.avoidedMovements || []).flat(),
    ])
  );

  const resolvedSkills = await resolveSkillsForContextAsync({
    limitationTags: activeLimitationTags,
    userText: combinedUserText,
    frequencyOrGoal: [
      req.primaryGoal || '',
      coreMemory.mesocycleState.currentFocusSummary || '',
      req.programSummary ? 'programa_8_semanas' : '',
    ].filter(Boolean),
  });

  const skillsIndexPrompt = buildSkillsIndexPrompt();
  const activeSkillsProtocols = resolvedSkills.map((s) => s.protocolMarkdown).join('\n\n');
  const activeSkillIds = resolvedSkills.map((s) => s.id);

  // 4. Contexto de Catálogo Real (Anti-Alucinação de IDs) e Programa de Longo Prazo
  const sessionListText =
    req.sessionExercises && req.sessionExercises.length > 0
      ? req.sessionExercises
          .slice(0, 8)
          .map((e) => `  - id="${e.id}" (${e.name_pt}${e.sets ? `, ${e.sets}x${e.reps || 10}` : ''})`)
          .join('\n')
      : '  - Nenhuma sessão aberta no momento.';

  const candidatesText =
    req.catalogCandidates && req.catalogCandidates.length > 0
      ? req.catalogCandidates
          .slice(0, 10)
          .map((c) => `  - id="${c.id}" -> ${c.name_pt} [${c.pattern || 'geral'} | ${(c.equipment || ['peso_corporal']).join(', ')}]`)
          .join('\n')
      : '  - Use actionType="generate_custom_workout" para criar sessão completa ou mantenha replacementId apenas se conhecer o ID exato.';

  const programText = req.programSummary?.title
    ? `${req.programSummary.title} • Semana ${req.programSummary.currentWeek || 1}/${req.programSummary.totalWeeks || 8} (${req.programSummary.currentPhaseLabel || 'Adaptação'})`
    : 'Programa autônomo flexível';

  // 5. System Prompt Estruturado com as 13 Ações Reais do SuperAção
  const systemInstruction = `Você é o Agente Principal de Personal do SuperAção (pt-BR).
Formação: Educação Física, Cinesiologia, Biomecânica e Psicologia do Hábito (Consensos ACSM 2026, JOSPT, McGill, NSCA, Guia MS/OMS e Ética CONFEF/CREF).
Tom: empático, humano, acolhedor, direto (estilo mensagem de WhatsApp de um ótimo personal), zero culpa ou jargão militar.

${skillsIndexPrompt}

PROTOCOLOS CIENTÍFICOS ATIVOS NESTE TURNO:
${activeSkillsProtocols}

${coreMemoryText}

CONTEXTO VIVO DO ALUNO E DO APLICATIVO:
- Tela atual: ${req.activeScreenContext?.currentTab || 'home'} (${req.activeScreenContext?.activeView || 'visão principal'}${req.activeScreenContext?.isFocusModeActive ? ' • MODO FOCO EM TEMPO REAL' : ''})
- Exercício atual em execução: ${req.activeScreenContext?.currentExerciseName ? `${req.activeScreenContext.currentExerciseName} (id="${req.activeScreenContext.currentExerciseId || ''}", Série ${req.activeScreenContext.currentSetIndex || 1}/${req.activeScreenContext.totalSets || 3})` : 'Nenhum'}
- Programa de Longo Prazo: ${programText}
- Equipamentos disponíveis: ${(req.equipments && req.equipments.length > 0 ? req.equipments : ['peso_corporal']).join(', ')}
- Limitações reportadas: ${(activeLimitationTags.length > 0 ? activeLimitationTags : ['nenhuma']).join(', ')}
${formatUserContextForPrompt(req.userContext)}
- Ficha gerenciada por Professor Parceiro: ${req.isTeacherManaged ? 'SIM (PROIBIDO alterar ficha permanente/programa com update_routine/create_program; permitido apenas ajuste pontual de hoje como soften_session, swap_exercise por dor aguda ou log_external_practice)' : 'NÃO (autonomia completa com confirmação do aluno)'}

EXERCÍCIOS DA SESSÃO ATUAL:
${sessionListText}

CANDIDATOS SEGUROS DO CATÁLOGO (900+ EXERCÍCIOS — SE USAR "swap_exercise", ESCOLHA ESTRITAMENTE UM "id" DESTA LISTA):
${candidatesText}

CATÁLOGO DE AÇÕES ESTRUTURADAS ("proposedDiff.actionType"):
- "swap_exercise": trocar o exercício atual por dor, falta de equipamento ou preferência. Preencha "originalId", "replacementId" (OBRIGATORIAMENTE um id da lista de candidatos acima) e "replacementNamePt".
- "soften_session": suavizar o treino de hoje (-25% volume / modo gentil) por cansaço, pouco tempo, sono ruim ou estresse.
- "adjust_exercise_target": ajustar meta de repetições do exercício atual -> payload: { "targetReps": numero }.
- "generate_custom_workout": montar e iniciar na hora um treino sob medida! Use quando o aluno pedir treino específico, alongamento/mobilidade em dia de descanso, soltura pós-arte marcial, relaxamento muscular, treino rápido de viagem/hotel ou foco muscular -> payload: { "purpose": "forca_hipertrofia" | "mobilidade_alongamento" | "relaxamento_muscular" | "membros_superiores" | "membros_inferiores" | "costas_postura" | "gluteos_pernas" | "pos_luta_artes_marciais" | "pos_esporte_descompressao" | "cardio_sem_impacto" | "viagem_hotel" | "pausa_escritorio_sem_chao" | "core_estabilidade", "durationMinutes": 8 a 60, "targetMusclesOrFocus"?: string[] }.
- "log_external_practice": registrar atividade que o aluno contou ter feito fora do app (Jiu-Jitsu, Muay Thai, corrida, futebol, caminhada, etc.) -> payload: { "modality": "artes_marciais" | "caminhada" | "corrida" | "ciclismo" | "natacao" | "yoga_mobilidade" | "esporte_coletivo" | "outro", "durationMinutes": numero, "effortScore": 1 a 5, "mood": "renovado", "notes": "resumo curto" }.
- "advance_program_phase": avançar semana/fase do programa evolutivo quando solicitado e consistente.
- "update_profile" / "autofill_onboarding": salvar preferências, equipamentos, limitações ou preencher Escuta Inicial -> payload com campos relevantes ({ "sessionDurationMinutes"?: numero, "equipments"?: string[], "reportedLimitations"?: string[], "availableDays"?: number[], "experienceLevel"?: "iniciante" | "retomando" | "pratica", "environmentPreference"?: "casa" | "academia" | "ar_livre", "avoidedMovements"?: string[], "primaryGoal"?: string, "exerciseReason"?: string, "habitAnchor"?: string }).
- "navigate": levar o aluno para outra aba -> payload: { "tab": "home" | "workouts" | "calendar" | "progress" }.
- Se for apenas conversa/orientação sem ação no sistema, retorne "proposedDiff": null e "requiresConfirmation": false.

Retorne EXCLUSIVAMENTE um objeto JSON válido:
{
  "replyPt": "resposta acolhedora, clara e prática (2 a 4 frases)",
  "clinicalReasoningSummary": "racional cinesiológico em 1 linha citando a Skill aplicada",
  "requiresConfirmation": boolean,
  "actionRequired": boolean,
  "proposedDiff": {
    "actionType": "uma das ações acima",
    "titlePt": "título curto do botão/card de confirmação",
    "descriptionPt": "explicação clara em 1 frase do que será aplicado",
    "originalId": "opcional",
    "replacementId": "opcional (ID real da lista de candidatos)",
    "replacementNamePt": "opcional",
    "payload": {}
  } ou null,
  "newClinicalFacts": [
    {
      "id": "chave_canonica_curta",
      "labelPt": "condição ou preferência relevante para lembrar",
      "persistence": "chronic" | "temporary",
      "avoidedMovements": ["tags"],
      "protectiveCuePt": "cuidado biomecânico",
      "expiresInDays": 5
    }
  ]
}`;

  const messages: ChatMessage[] = [{ role: 'system', content: systemInstruction }];

  if (req.historyTurns && req.historyTurns.length > 0) {
    for (const turn of req.historyTurns.slice(-6)) {
      if (turn?.text) {
        messages.push({ role: turn.role === 'assistant' ? 'assistant' : 'user', content: turn.text });
      }
    }
  }

  messages.push({ role: 'user', content: cleanMessage });

  try {
    const aiResponse = await callDeepInfraWithFixedFallback('master_personal', messages, {
      responseFormatJson: true,
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(aiResponse.text);
    } catch {
      parsed = {
        replyPt: aiResponse.text.slice(0, 350),
        clinicalReasoningSummary: 'Orientação clínica direta.',
        requiresConfirmation: false,
      };
    }

    let finalDiff: ProposalDiff | undefined = parsed.proposedDiff || undefined;

    // Normaliza payload caso o modelo tenha colocado campos direto em proposedDiff
    if (finalDiff) {
      if (finalDiff.actionType === 'generate_custom_workout') {
        const rawAny = finalDiff as any;
        finalDiff.payload = {
          purpose: finalDiff.payload?.purpose || rawAny.customWorkoutPurpose || rawAny.purpose || 'mobilidade_alongamento',
          durationMinutes: Number(finalDiff.payload?.durationMinutes || rawAny.durationMinutes || 12),
        };
      } else if (finalDiff.actionType === 'log_external_practice') {
        const rawAny = finalDiff as any;
        finalDiff.payload = {
          modality: finalDiff.payload?.modality || rawAny.externalModality || rawAny.modality || 'artes_marciais',
          durationMinutes: Number(finalDiff.payload?.durationMinutes || rawAny.durationMinutes || 60),
          effortScore: Number(finalDiff.payload?.effortScore || 4),
          mood: finalDiff.payload?.mood || 'renovado',
          notes: finalDiff.payload?.notes || finalDiff.descriptionPt,
        };
      } else if (finalDiff.actionType === 'swap_exercise' && req.catalogCandidates && req.catalogCandidates.length > 0) {
        // Garante que o replacementId exista nos candidatos reais enviados; se não existir, usa o 1º candidato seguro!
        const candidateMatch = req.catalogCandidates.find((c) => c.id === finalDiff?.replacementId);
        if (!candidateMatch) {
          const bestSafe = req.catalogCandidates[0];
          finalDiff.replacementId = bestSafe.id;
          finalDiff.replacementNamePt = bestSafe.name_pt;
        } else if (!finalDiff.replacementNamePt) {
          finalDiff.replacementNamePt = candidateMatch.name_pt;
        }
      }
    }

    // Trava inviolável de Professor Parceiro
    if (finalDiff && req.isTeacherManaged && TEACHER_LOCKED_ACTIONS.has(finalDiff.actionType)) {
      finalDiff = undefined;
      parsed.requiresConfirmation = false;
      parsed.replyPt = `${parsed.replyPt || ''} Como seu plano é acompanhado pelo seu Professor Parceiro, mantive sua prescrição oficial intacta — posso apenas suavizar a sessão de hoje caso precise!`.trim();
    }

    await recordAiExecutionMetrics({
      serviceId: 'master_personal',
      uid,
      tokensUsed: aiResponse.tokensUsed,
      durationMs: aiResponse.durationMs,
      isFallback: aiResponse.isFallback,
      proposalCreated: Boolean(finalDiff),
    });

    // Persistência de Memória M2 (explícita do modelo + extrator determinístico M2/M3)
    if (Array.isArray(parsed.newClinicalFacts) && parsed.newClinicalFacts.length > 0) {
      const now = Date.now();
      const factsToSave: ClinicalMemoryFact[] = parsed.newClinicalFacts.slice(0, 3).map((f: any) => ({
        id: String(f.id || `fact_${now}`),
        labelPt: String(f.labelPt || 'Cuidado físico observado'),
        persistence: f.persistence === 'chronic' ? 'chronic' : 'temporary',
        avoidedMovements: Array.isArray(f.avoidedMovements) ? f.avoidedMovements : [],
        protectiveCuePt: String(f.protectiveCuePt || 'Respeitar amplitude indolor e controle motor.'),
        createdAt: now,
        updatedAt: now,
        expiresAt: f.persistence === 'temporary' ? now + Number(f.expiresInDays || 5) * 86400 * 1000 : undefined,
      }));
      await updateCoreMemory(uid, { newClinicalFacts: factsToSave });
      await recordEpisodicMemory(uid, 'clinical_note', `Fato registrado: ${factsToSave.map((f) => f.labelPt).join('; ')}`, true);
    } else {
      await autoExtractAndPersistTurnMemory({
        uid,
        userMessage: cleanMessage,
        actionType: finalDiff?.actionType || null,
        summaryTextPt: finalDiff?.titlePt,
      });
    }

    return {
      replyPt: parsed.replyPt || 'Pronto! Vamos seguir no seu ritmo com segurança e constância.',
      clinicalReasoningSummary: parsed.clinicalReasoningSummary || 'Prescrição fundamentada em evidências cinesiológicas.',
      requiresConfirmation: Boolean(finalDiff ? true : parsed.requiresConfirmation),
      actionRequired: Boolean(finalDiff),
      proposedDiff: finalDiff,
      activatedSkillIds: activeSkillIds,
      activeMemoriesCount: coreMemory.clinicalFacts.length + relevantEpisodes.length,
      tokensUsed: aiResponse.tokensUsed,
    };
  } catch (err: any) {
    console.error('[MasterPersonalAgent] Erro na execução:', err);
    return {
      replyPt: 'Estou com você! Vamos continuar no seu ritmo hoje priorizando amplitude confortável e boa postura.',
      requiresConfirmation: false,
    };
  }
}
