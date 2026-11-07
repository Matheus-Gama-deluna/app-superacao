/**
 * Analista Longitudinal de Telemetria e Progresso (TelemetryAnalystAgent) — v9.0
 * Modelo Titular: openai/gpt-oss-120b (Precisão Matemática & JSON Schema MXFP4)
 * Modelo Fallback: deepseek-ai/DeepSeek-V4.1-Flash
 */

import { callDeepInfraWithFixedFallback, ChatMessage } from '../config/agentModels.js';
import { recordAiExecutionMetrics } from '../admin/usageLedger.js';

export interface TelemetryWeeklyInput {
  uid: string;
  completedWorkoutsCount: number;
  partialWorkoutsCount: number;
  externalPracticesCount: number;
  targetWeeklyGoal: number;
  averageRpe: number;
  predominantPreMood?: string;
  predominantPostMood?: string;
  frequentlySkippedExerciseNames?: string[];
  mesocycleWeek: number;
}

export interface TelemetryWeeklyOutput {
  weeklyAnalysisPt: string;
  motivationalPills: string[];
  suggestedWeeklyAction: 'manter_ritmo' | 'modo_suave_fadiga' | 'reajuste_dias_tempo' | 'avanco_escada_progresso';
  actionPromptPt?: string;
}

export async function runTelemetryAnalyst(input: TelemetryWeeklyInput): Promise<TelemetryWeeklyOutput> {
  const startTime = Date.now();

  const systemPrompt = `Você é o Analista de Dados e Progresso do Superação.
Sua missão é interpretar a semana concluída do aluno com base na ciência da adesão e autorregulação.
Você analisa:
- Meta semanal vs realizada (incluindo versões expressas e práticas externas);
- Relação de esforço percebido (RPE médio);
- Mudança de humor pré vs pós-treino (termômetro de bem-estar);
- Exercícios evitados ou pulados repetidamente.

Gere exatamente 5 pílulas motivacionais acolhedoras e sem clichês militares para o aluno ler ao longo da semana (Batching 7 em 1).

Retorne EXCLUSIVAMENTE um objeto JSON:
{
  "weeklyAnalysisPt": "análise de 2 a 3 frases acolhedoras e baseadas em fatos reais",
  "motivationalPills": [
    "frase 1 para segunda (máx 25 palavras)",
    "frase 2 para terça",
    "frase 3 para quarta",
    "frase 4 para quinta",
    "frase 5 para sexta"
  ],
  "suggestedWeeklyAction": "manter_ritmo" | "modo_suave_fadiga" | "reajuste_dias_tempo" | "avanco_escada_progresso",
  "actionPromptPt": "texto explicativo de 1 frase caso haja sugestão de ação"
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `DADOS DA SEMANA DO PRATICANTE:
- Treinos completos: ${input.completedWorkoutsCount} de ${input.targetWeeklyGoal} planejados
- Práticas expressas/parciais (salva-hábito): ${input.partialWorkoutsCount}
- Práticas externas (caminhada/corrida/outras): ${input.externalPracticesCount}
- Esforço médio (RPE 1 a 5): ${input.averageRpe}
- Humor mais comum antes: ${input.predominantPreMood || 'equilibrado'} -> depois: ${input.predominantPostMood || 'revigorado'}
- Movimentos pulados: ${input.frequentlySkippedExerciseNames?.join(', ') || 'Nenhum'}
- Semana do Ciclo: ${input.mesocycleWeek}/4`,
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

    const defaultPills = [
      'Constância não é perfeição: cada minuto de movimento já conta a seu favor.',
      'O importante é manter a ponte viva para o seu próximo treino.',
      'Ouça seu corpo hoje para continuar treinando amanhã com saúde.',
      'Treinar com calma constrói um hábito que dura a vida toda.',
      'Sua maior vitória semanal é a sua presença contínua.',
    ];

    return {
      weeklyAnalysisPt:
        parsed.weeklyAnalysisPt ||
        'Semana encerrada com dedicação! Seus esforços ajudam a consolidar sua saúde e constância.',
      motivationalPills:
        Array.isArray(parsed.motivationalPills) && parsed.motivationalPills.length >= 3
          ? parsed.motivationalPills.slice(0, 5)
          : defaultPills,
      suggestedWeeklyAction: parsed.suggestedWeeklyAction || 'manter_ritmo',
      actionPromptPt: parsed.actionPromptPt,
    };
  } catch (err) {
    console.error('[TelemetryAnalyst] Erro na análise semanal:', err);
    return {
      weeklyAnalysisPt: 'Mais uma semana de movimento realizada! Seguimos juntos na sua jornada.',
      motivationalPills: [
        'A constância suave é a chave da sua vitalidade.',
        'Respeite o ritmo de cada dia.',
        'Qualquer movimento é melhor que zero.',
        'Seu corpo agradece o cuidado que você tem com ele.',
        'Um passo por vez em direção à sua melhor versão.',
      ],
      suggestedWeeklyAction: 'manter_ritmo',
    };
  }
}
