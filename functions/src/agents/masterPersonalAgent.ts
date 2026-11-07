/**
 * Agente Principal de Personal (MasterPersonalAgent) — v9.0
 * Inteligência Máxima em Tudo que Envolve o Corpo, Saúde e Prescrição:
 * Modelo Titular: zai-org/GLM-5.3 (MoE 1.6T)
 * Modelo Fallback: deepseek-ai/DeepSeek-V4-Pro (1M ctx)
 */

import { callDeepInfraWithFixedFallback, ChatMessage } from '../config/agentModels.js';
import { buildSkillsIndexPrompt, resolveSkillsForContext } from '../skills/skillRegistry.js';
import { loadActiveCoreMemory, formatCoreMemoryForPrompt, updateCoreMemory, recordEpisodicMemory } from '../memory/agentMemoryEngine.js';
import { checkMedicalRedFlags, auditWeeklyFractionalVolume, buildWorkoutProposalDiff } from '../tools/biomechanicsTools.js';
import { recordAiExecutionMetrics, checkUserQuota } from '../admin/usageLedger.js';
import { ActiveScreenContext, AssistantActionProposal, ClinicalMemoryFact } from '../types/sharedAi.js';

export interface MasterPersonalRequest {
  uid: string;
  userMessage: string;
  historyTurns?: Array<{ role: 'user' | 'assistant'; text: string }>;
  activeScreenContext?: ActiveScreenContext;
  reportedLimitations?: string[];
  healthNotes?: string;
  userContextNotes?: string;
  isTeacherManaged?: boolean;
}

export async function runMasterPersonalAgent(req: MasterPersonalRequest): Promise<AssistantActionProposal> {
  const startTime = Date.now();
  const uid = req.uid || 'guest';

  // 1. Verificação de cota e guardrails
  const quota = await checkUserQuota(uid);
  if (!quota.allowed) {
    return {
      replyPt: quota.reason || 'Limite de interações atingido por hoje. Suas fichas e treinos seguem ativos!',
      requiresConfirmation: false,
    };
  }

  // 2. Triagem Determinística de Red Flags Médicas
  const combinedUserText = `${req.userMessage} ${req.healthNotes || ''} ${req.userContextNotes || ''}`.trim();
  const redFlagCheck = checkMedicalRedFlags(combinedUserText);

  if (redFlagCheck.hasRedFlags && redFlagCheck.severity === 'critical_medical_referral') {
    await recordAiExecutionMetrics({
      serviceId: 'master_personal',
      uid,
      tokensUsed: { inputTokens: 50, outputTokens: 50 },
      durationMs: Date.now() - startTime,
      isRedFlagBlocked: true,
    });

    return {
      replyPt: redFlagCheck.userAdvicePt,
      clinicalReasoningSummary: `Bandeira vermelha médica acionada: ${redFlagCheck.detectedFlags.join(', ')}. Prescrição bloqueada para segurança do praticante.`,
      requiresConfirmation: false,
      activatedSkillIds: ['01_red_flags_confef_ethics'],
    };
  }

  // 3. Carregamento de Memória Hierárquica M2
  const coreMemory = await loadActiveCoreMemory(uid);
  const coreMemoryText = formatCoreMemoryForPrompt(coreMemory);

  // 4. Progressive Disclosure de Skills Científicas
  const activeLimitationTags = Array.from(
    new Set([
      ...(req.reportedLimitations || []),
      ...coreMemory.clinicalFacts.map((f) => f.avoidedMovements).flat(),
    ])
  );

  const resolvedSkills = resolveSkillsForContext({
    limitationTags: activeLimitationTags,
    userText: combinedUserText,
    frequencyOrGoal: [coreMemory.mesocycleState.currentFocusSummary],
  });

  const skillsIndexPrompt = buildSkillsIndexPrompt();
  const activeSkillsProtocols = resolvedSkills.map((s) => s.protocolMarkdown).join('\n\n');
  const activeSkillIds = resolvedSkills.map((s) => s.id);

  // 5. Montagem do Prefixo Determinístico (Alinhado ao KV-Cache)
  const systemInstruction = `Você é o Agente Principal de Personal do Superação.
Você possui formação aprofundada em Educação Física, Cinesiologia, Fisiologia e Prescrição Baseada em Evidências (Consensos ACSM 2026, Pelland/Schoenfeld, JOSPT, McGill, NSCA e Guia Brasileiro do MS/OMS).
Seu tom é empático, acolhedor, fundamentado e encorajador, sem clichês militares nem julgamento.

${skillsIndexPrompt}

CAPÍTULOS CIENTÍFICOS ATIVOS PARA ESTE PRATICANTE:
${activeSkillsProtocols}

${coreMemoryText}

CONDIÇÕES DO APLICATIVO NO MOMENTO:
- Tela atual: ${req.activeScreenContext?.currentTab || 'home'}
- Exercício em tela: ${req.activeScreenContext?.currentExerciseName || 'Nenhum'} (Série ${req.activeScreenContext?.currentSetIndex || 1} de ${req.activeScreenContext?.totalSets || 3})
- Ficha gerenciada por Professor Parceiro: ${req.isTeacherManaged ? 'SIM (Proibido alterar ficha permanente sem consentimento do professor)' : 'NÃO'}

INSTRUÇÕES DE EXECUÇÃO OBRIGATÓRIAS:
1. Responda em Português do Brasil com clareza, empatia e sem enrolação (estilo mensagem direta no WhatsApp).
2. Se o aluno relatar uma dor, desconforto, viagem ou falta de tempo, ofereça uma adaptação segura para HOJE.
3. Se o aluno pedir para trocar um exercício ou suavizar a sessão, sugira uma ação prática estruturada via "proposedDiff".
4. Se identificar uma nova dor ou preferência que valha a pena lembrar nas próximas sessões, preencha "newClinicalFacts".
5. Devolva EXCLUSIVAMENTE um objeto JSON conforme o schema:
{
  "replyPt": "sua resposta em texto acolhedor e direto (máximo 4 frases)",
  "clinicalReasoningSummary": "racional científico em 1 linha citando a Skill",
  "requiresConfirmation": boolean (true se envolver alteração de treino ou descanso),
  "actionRequired": boolean,
  "proposedDiff": {
    "actionType": "swap_exercise" | "soften_session" | "reschedule_day" | "update_routine" | "navigate",
    "titlePt": "título da ação em 1 clique",
    "descriptionPt": "descrição concisa do que muda",
    "originalId": "id se aplicável",
    "replacementId": "id se aplicável",
    "replacementNamePt": "nome amigável"
  } ou null,
  "newClinicalFacts": [
    {
      "id": "chave_canonica",
      "labelPt": "descrição concisa da condição",
      "persistence": "chronic" | "temporary",
      "avoidedMovements": ["tags"],
      "protectiveCuePt": "dica de execução protetora",
      "expiresInDays": 4 (se temporary)
    }
  ] ou []
}`;

  const messages: ChatMessage[] = [{ role: 'system', content: systemInstruction }];

  // Histórico recente (máx 4 turnos para não poluir tokens)
  if (req.historyTurns && req.historyTurns.length > 0) {
    for (const turn of req.historyTurns.slice(-4)) {
      messages.push({ role: turn.role, content: turn.text });
    }
  }

  messages.push({ role: 'user', content: req.userMessage });

  // 6. Chamada ao Modelo Titular (GLM-5.3) com Fallback (DeepSeek-V4-Pro)
  try {
    const aiResponse = await callDeepInfraWithFixedFallback('master_personal', messages, {
      responseFormatJson: true,
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(aiResponse.text);
    } catch {
      parsed = {
        replyPt: aiResponse.text.slice(0, 300),
        clinicalReasoningSummary: 'Resposta clínica direta.',
        requiresConfirmation: false,
      };
    }

    // Registra métricas atômicas
    await recordAiExecutionMetrics({
      serviceId: 'master_personal',
      uid,
      tokensUsed: aiResponse.tokensUsed,
      durationMs: aiResponse.durationMs,
      isFallback: aiResponse.isFallback,
    });

    // 7. Atualização assíncrona da Memória M2 se novos fatos foram identificados
    if (parsed.newClinicalFacts && Array.isArray(parsed.newClinicalFacts) && parsed.newClinicalFacts.length > 0) {
      const now = Date.now();
      const factsToSave: ClinicalMemoryFact[] = parsed.newClinicalFacts.map((f: any) => ({
        id: f.id || `fact_${now}`,
        labelPt: f.labelPt || 'Cuidado físico observado',
        persistence: f.persistence === 'chronic' ? 'chronic' : 'temporary',
        avoidedMovements: Array.isArray(f.avoidedMovements) ? f.avoidedMovements : [],
        protectiveCuePt: f.protectiveCuePt || 'Manter ritmo suave e respeitar amplitudes confortáveis.',
        createdAt: now,
        updatedAt: now,
        expiresAt: f.persistence === 'temporary' ? now + (f.expiresInDays || 4) * 86400 * 1000 : undefined,
      }));

      await updateCoreMemory(uid, { newClinicalFacts: factsToSave });
      await recordEpisodicMemory(uid, 'clinical_note', `Registrado: ${factsToSave.map((f) => f.labelPt).join('; ')}`);
    }

    // 8. Valida trava do professor sobre a proposta
    if (parsed.proposedDiff && req.isTeacherManaged && parsed.proposedDiff.actionType === 'update_routine') {
      parsed.proposedDiff = null;
      parsed.requiresConfirmation = false;
      parsed.replyPt += ' (Como você treina com um Professor Parceiro, mantive sua ficha permanente intacta).';
    }

    return {
      replyPt: parsed.replyPt || 'Pronto! Vamos seguir em frente com foco na sua constância e saúde.',
      clinicalReasoningSummary: parsed.clinicalReasoningSummary || 'Prescrição adaptada com foco em evidências científicas.',
      requiresConfirmation: Boolean(parsed.requiresConfirmation),
      actionRequired: Boolean(parsed.actionRequired || parsed.proposedDiff),
      proposedDiff: parsed.proposedDiff || undefined,
      activatedSkillIds: activeSkillIds,
      tokensUsed: aiResponse.tokensUsed,
    };
  } catch (err: any) {
    console.error('[MasterPersonalAgent] Erro na execução:', err);
    return {
      replyPt: 'Estou com você! Vamos continuar no seu ritmo hoje com foco no movimento que for confortável para o seu corpo.',
      requiresConfirmation: false,
    };
  }
}
