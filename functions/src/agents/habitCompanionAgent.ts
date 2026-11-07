/**
 * Companheiro de Hábito, Constância e Acolhimento Diário (HabitCompanionAgent) — v9.5 Produção
 * Modelo Titular: zai-org/GLM-5.3-Flash (~1.4s, pt-BR caloroso)
 * Modelo Fallback: google/gemma-4-31B-it-turbo
 */

import { callDeepInfraWithFixedFallback, ChatMessage } from '../config/agentModels.js';
import { checkUserQuota, recordAiExecutionMetrics } from '../admin/usageLedger.js';
import { loadActiveCoreMemory } from '../memory/agentMemoryEngine.js';
import { AssistantActionProposal } from '../types/sharedAi.js';

export interface HabitCompanionInput {
  uid: string;
  userMessage: string;
  displayName?: string;
  exerciseReason?: string;
  habitAnchor?: string;
  todayPlanTitle?: string;
  lastMood?: string;
  currentStreakDays?: number;
  completedThisWeek?: number;
}

export async function runHabitCompanion(input: HabitCompanionInput): Promise<AssistantActionProposal> {
  const uid = input.uid || 'guest';
  const quota = await checkUserQuota(uid);
  if (!quota.allowed) {
    return {
      replyPt: 'Hoje é um ótimo dia para cuidar do seu corpo no seu próprio ritmo, sem pressa e sem cobrança.',
      requiresConfirmation: false,
    };
  }

  const coreMemory = await loadActiveCoreMemory(uid);
  const tone = coreMemory.routineInsights.preferredCoachingTone || 'acolhedor_suave';

  const systemPrompt = `Você é o Companheiro de Hábitos e Constância do aplicativo SuperAção (pt-BR).
Seu papel é gerar reflexões diárias personalizadas, celebrar vitórias reais (inclusive treinos curtos ou dias de descanso ativo) e acolher dias difíceis sem culpa (Entrevista Motivacional / SDT).
Tom preferido do praticante: ${tone}. Sem clichês agressivos de academia.
Se houver dúvida sobre dor aguda ou prescrição técnica, oriente abrir o Personal IA.

Retorne EXCLUSIVAMENTE um objeto JSON válido:
{
  "replyPt": "mensagem humana, calorosa e concisa em no máximo 2 frases curtas (até 38 palavras)",
  "requiresConfirmation": false
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `CONTEXTO DO DIA:
- Nome: ${input.displayName || 'Praticante'}
- Porquê pessoal: ${input.exerciseReason || coreMemory.routineInsights.personalMotivationSummary || 'Saúde e vitalidade diária'}
- Âncora de rotina: ${input.habitAnchor || 'Seu melhor horário'}
- Treinos na semana: ${input.completedThisWeek ?? 0} (Sequência: ${input.currentStreakDays ?? 0}d)
- Sensação recente: ${input.lastMood || 'Equilibrada'}
- Proposta de hoje: ${input.todayPlanTitle || 'Recuperação ativa / Movimento livre'}
- Pedido/Momento: ${input.userMessage || 'Gere a pílula de sabedoria acolhedora de hoje.'}`,
    },
  ];

  try {
    const aiResponse = await callDeepInfraWithFixedFallback('habit_companion', messages, {
      responseFormatJson: true,
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(aiResponse.text);
    } catch {
      parsed = { replyPt: aiResponse.text.replace(/^["']|["']$/g, '').slice(0, 220) };
    }

    await recordAiExecutionMetrics({
      serviceId: 'habit_companion',
      uid,
      tokensUsed: aiResponse.tokensUsed,
      durationMs: aiResponse.durationMs,
      isFallback: aiResponse.isFallback,
    });

    return {
      replyPt: parsed.replyPt || 'Cada pequeno gesto de movimento hoje mantém viva a ponte com a sua saúde.',
      requiresConfirmation: false,
      tokensUsed: aiResponse.tokensUsed,
    };
  } catch (err) {
    console.error('[HabitCompanion] Erro:', err);
    return {
      replyPt: 'Honre seu ritmo hoje: até 8 minutos de movimento consciente já renovam sua energia.',
      requiresConfirmation: false,
    };
  }
}
