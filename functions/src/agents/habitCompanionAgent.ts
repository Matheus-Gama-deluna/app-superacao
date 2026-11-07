/**
 * Companheiro de Hábito e Guia de Interface (HabitCompanionAgent) — v9.0
 * Modelo Titular: deepseek-ai/DeepSeek-V4.1-Flash (Ultra-Rápido & Cache a $0.003/1M)
 * Modelo Fallback: google/gemma-4-31b-it
 *
 * Restrito estritamente a interações leves sem impacto biomecânico direto:
 * apoio emocional, celebração de sequência e dúvidas de uso do sistema.
 */

import { callDeepInfraWithFixedFallback, ChatMessage } from '../config/agentModels.js';
import { recordAiExecutionMetrics } from '../admin/usageLedger.js';
import { AssistantActionProposal } from '../types/sharedAi.js';

export interface HabitCompanionInput {
  uid: string;
  userMessage: string;
  currentStreakDays?: number;
  completedThisWeek?: number;
}

export async function runHabitCompanion(input: HabitCompanionInput): Promise<AssistantActionProposal> {
  const startTime = Date.now();

  const systemPrompt = `Você é o Companheiro de Hábitos do Superação.
Seu papel é acolher o aluno com carinho, celebrar vitórias de constância e tirar dúvidas práticas sobre o aplicativo (como navegar entre Início, Treinos, Agenda e Progresso).
Tom de voz: empático, gentil, caloroso e encorajador.
Se o aluno fizer perguntas técnicas sobre lesões, dores fortes ou reestruturação completa de treino, você orienta com calma que o Personal Principal cuidará disso.

Retorne EXCLUSIVAMENTE um objeto JSON:
{
  "replyPt": "resposta acolhedora e direta (máximo 3 frases)",
  "requiresConfirmation": false
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `DADOS DO ALUNO:
- Dias de sequência: ${input.currentStreakDays || 0}
- Treinos esta semana: ${input.completedThisWeek || 0}
Mensagem: ${input.userMessage}`,
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
      parsed = { replyPt: aiResponse.text.slice(0, 250) };
    }

    await recordAiExecutionMetrics({
      serviceId: 'habit_companion',
      uid: input.uid,
      tokensUsed: aiResponse.tokensUsed,
      durationMs: aiResponse.durationMs,
      isFallback: aiResponse.isFallback,
    });

    return {
      replyPt: parsed.replyPt || 'Estou torcendo por você a cada passo! O importante é manter o movimento vivo.',
      requiresConfirmation: false,
      tokensUsed: aiResponse.tokensUsed,
    };
  } catch (err) {
    console.error('[HabitCompanion] Erro:', err);
    return {
      replyPt: 'Muito bom ver sua dedicação! Qualquer dúvida, conte sempre comigo.',
      requiresConfirmation: false,
    };
  }
}
