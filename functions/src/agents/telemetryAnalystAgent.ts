/**
 * Analista Longitudinal de Telemetria e Progresso (TelemetryAnalystAgent) — v9.5 Produção
 * Modelo Titular: openai/gpt-oss-120b ($0.037/1M in • Homologado ao vivo com 5/5 pílulas)
 * Modelo Fallback: deepseek-ai/DeepSeek-V3.2
 */

import { callDeepInfraWithFixedFallback, ChatMessage } from '../config/agentModels.js';
import { checkUserQuota, recordAiExecutionMetrics } from '../admin/usageLedger.js';

export interface TelemetryWeeklyInput {
  uid: string;
  displayName?: string;
  completedWorkoutsCount: number;
  partialWorkoutsCount: number;
  externalPracticesCount: number;
  targetWeeklyGoal: number;
  averageRpe: number;
  predominantPreMood?: string;
  predominantPostMood?: string;
  frequentlySkippedExerciseNames?: string[];
  mesocycleWeek: number;
  totalProgramWeeks?: number;
}

export interface TelemetryWeeklyOutput {
  weeklyAnalysisPt: string;
  motivationalPills: string[];
  weeklyMotivationalPills: string[]; // alias de compatibilidade com aiClient
  suggestedWeeklyAction: 'manter_ritmo' | 'modo_suave_fadiga' | 'reajuste_dias_tempo' | 'avanco_escada_progresso';
  actionPromptPt?: string;
}

export async function runTelemetryAnalyst(input: TelemetryWeeklyInput): Promise<TelemetryWeeklyOutput> {
  const defaultPills = [
    'Constância não é perfeição: cada minuto de movimento já conta a seu favor.',
    'O importante é manter a ponte viva para o seu próximo treino.',
    'Ouça seu corpo hoje para continuar treinando amanhã com saúde.',
    'Treinar com calma constrói um hábito que dura a vida toda.',
    'Sua maior vitória semanal é a sua presença contínua.',
  ];

  const quota = await checkUserQuota(input.uid);
  if (!quota.allowed) {
    return {
      weeklyAnalysisPt: 'Semana registrada com cuidado! Continue respeitando o ritmo do seu corpo.',
      motivationalPills: defaultPills,
      weeklyMotivationalPills: defaultPills,
      suggestedWeeklyAction: 'manter_ritmo',
    };
  }

  const systemPrompt = `Você é o Analista Longitudinal de Progresso e Adesão do SuperAção (pt-BR).
Sua missão é interpretar a semana do praticante com ciência comportamental, acolhimento genuíno e autorregulação de carga:
- Valorize treinos completos, versões expressas ("salva-hábito") E práticas externas (lutas, caminhada, esportes);
- Analise esforço percebido (RPE 1 a 5) e mudança de humor pré vs pós-treino;
- Gere exatamente 5 pílulas motivacionais curtas (máx 24 palavras cada), humanas e sem clichês militares para os dias da semana (Batching 5 em 1).

Retorne EXCLUSIVAMENTE um objeto JSON válido:
{
  "weeklyAnalysisPt": "síntese acolhedora de 2 a 3 frases baseada nos números reais da semana",
  "motivationalPills": [
    "pílula 1",
    "pílula 2",
    "pílula 3",
    "pílula 4",
    "pílula 5"
  ],
  "suggestedWeeklyAction": "manter_ritmo" | "modo_suave_fadiga" | "reajuste_dias_tempo" | "avanco_escada_progresso",
  "actionPromptPt": "sugestão prática de 1 frase para a próxima semana"
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `DADOS REAIS DA SEMANA (${input.displayName || 'Praticante'}):
- Treinos completos no app: ${input.completedWorkoutsCount} de ${input.targetWeeklyGoal} planejados
- Sessões expressas/contingência ("salva-hábito"): ${input.partialWorkoutsCount}
- Práticas externas (artes marciais, caminhada, esportes): ${input.externalPracticesCount}
- Esforço médio (RPE 1 a 5): ${input.averageRpe}
- Humor predominante antes: ${input.predominantPreMood || 'equilibrado'} -> depois: ${input.predominantPostMood || 'revigorado'}
- Exercícios frequentemente pulados: ${input.frequentlySkippedExerciseNames?.join(', ') || 'Nenhum'}
- Semana do Programa Evolutivo: ${input.mesocycleWeek}/${input.totalProgramWeeks || 8}`,
    },
  ];

  try {
    const aiResponse = await callDeepInfraWithFixedFallback('telemetry_analyst', messages, {
      responseFormatJson: true,
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(aiResponse.text);
    } catch {
      parsed = {};
    }

    await recordAiExecutionMetrics({
      serviceId: 'telemetry_analyst',
      uid: input.uid,
      tokensUsed: aiResponse.tokensUsed,
      durationMs: aiResponse.durationMs,
      isFallback: aiResponse.isFallback,
    });

    const pills =
      Array.isArray(parsed.motivationalPills) && parsed.motivationalPills.length >= 3
        ? parsed.motivationalPills.slice(0, 5)
        : defaultPills;

    return {
      weeklyAnalysisPt:
        parsed.weeklyAnalysisPt ||
        'Semana concluída com presença real! Cada sessão e prática externa soma diretamente na sua saúde articular e constância.',
      motivationalPills: pills,
      weeklyMotivationalPills: pills,
      suggestedWeeklyAction: parsed.suggestedWeeklyAction || 'manter_ritmo',
      actionPromptPt: parsed.actionPromptPt,
    };
  } catch (err) {
    console.error('[TelemetryAnalyst] Erro na análise semanal:', err);
    return {
      weeklyAnalysisPt: 'Mais uma semana de movimento registrada! Seguimos juntos construindo constância sem pressa.',
      motivationalPills: defaultPills,
      weeklyMotivationalPills: defaultPills,
      suggestedWeeklyAction: 'manter_ritmo',
    };
  }
}
