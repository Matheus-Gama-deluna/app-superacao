/**
 * Co-Piloto Multimodal do Professor Parceiro (PartnerTeacherCopilotAgent) — v9.5 Produção
 * Modelo Titular: meta-llama/Llama-4-Scout-17B-16E-Instruct (~1.8s multimodal ao vivo)
 * Modelo Fallback: Qwen/Qwen3-VL-30B-A3B-Instruct
 */

import { callDeepInfraWithFixedFallback, ChatMessage } from '../config/agentModels.js';
import { checkUserQuota, recordAiExecutionMetrics } from '../admin/usageLedger.js';
import { resolveSkillsForContextAsync } from '../skills/skillRegistry.js';

export interface AnamnesisMultimodalInput {
  submissionId: string;
  studentName: string;
  teacherUid: string;
  answers: Record<string, any>;
  photos: Array<{
    category?: 'posture_front' | 'posture_side' | 'posture_back' | 'equipments' | 'general' | string;
    dataUrl: string;
    caption?: string;
  }>;
}

export interface TeacherCopilotAnalysisResult {
  // Campos unificados compatíveis com Backend e Frontend (AiAnamnesisAnalysis)
  clinicalSummary: string;
  summaryPt: string;
  suggestedLimitations: string[];
  avoidedMovements: string[];
  posturalFlags: string[];
  posturalObservations: string[];
  ergonomicAlerts: string[];
  detectedEquipments: string[];
  suggestedSplit: 'full_body' | 'upper_lower' | 'abc';
  recommendedTemplateFocus: string;
  suggestedFrequencyDays: number;
  confidenceScore: number;
  generatedAt: number;
  source: 'ai_model';
}

export async function runPartnerTeacherCopilot(input: AnamnesisMultimodalInput): Promise<TeacherCopilotAnalysisResult> {
  const quota = await checkUserQuota(input.teacherUid);
  if (!quota.allowed) {
    const msg = quota.reason || 'Cota diária atingida. Use as respostas brutas e fotos para prescrição.';
    return {
      clinicalSummary: msg,
      summaryPt: msg,
      suggestedLimitations: [],
      avoidedMovements: [],
      posturalFlags: [],
      posturalObservations: [],
      ergonomicAlerts: [],
      detectedEquipments: ['peso_corporal'],
      suggestedSplit: 'full_body',
      recommendedTemplateFocus: 'Adaptação Funcional Corpo Todo',
      suggestedFrequencyDays: 3,
      confidenceScore: 0.5,
      generatedAt: Date.now(),
      source: 'ai_model',
    };
  }

  const skills = await resolveSkillsForContextAsync({
    hasPhotos: (input.photos || []).length > 0,
    userText: JSON.stringify(input.answers || {}),
    explicitSkillIds: ['01_red_flags_confef_ethics', '12_visual_posture_equipment_triage'],
  });

  const skillsContext = skills.map((s) => s.protocolMarkdown).join('\n\n');

  const systemPrompt = `Você é o Co-Piloto Clínico Multimodal para Professores de Educação Física e Fisioterapeutas do SuperAção.
Sua função é apoiar a decisão do profissional humano (Human-in-the-Loop), jamais substituí-lo ou emitir diagnóstico médico nosológico.

DIRETRIZES CIENTÍFICAS E ÉTICAS ATIVAS:
${skillsContext}

Analise simultaneamente:
1. Respostas abertas e fechadas da anamnese;
2. Fotos posturais (gerando APENAS indicadores visuais para aferição presencial do professor);
3. Fotos de equipamentos disponíveis no ambiente do aluno.

Retorne EXCLUSIVAMENTE um objeto JSON válido:
{
  "clinicalSummary": "síntese técnica objetiva para o professor ler em 30 segundos",
  "suggestedLimitations": ["ex: Sensibilidade femoropatelar", "Tensão lombar sentado"],
  "avoidedMovements": ["ex: agachamento_profundo", "sobrecarga_lombar"],
  "posturalFlags": ["ex: Indicador visual de assimetria escapular leve para aferição presencial"],
  "ergonomicAlerts": ["ex: Confirmar estabilidade da cadeira e piso antiderrapante em casa"],
  "detectedEquipments": ["peso_corporal", "halteres", "mini_band", "cadeira"],
  "suggestedSplit": "full_body" | "upper_lower" | "abc",
  "recommendedTemplateFocus": "nome claro do foco de prescrição sugerido",
  "suggestedFrequencyDays": 2 | 3 | 4 | 5,
  "confidenceScore": 0.92
}`;

  const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: 'text',
      text: `DADOS DO ALUNO:
Nome: ${input.studentName}
Respostas da Anamnese:
${JSON.stringify(input.answers, null, 2)}
Fotos anexadas: ${(input.photos || []).length} imagens.`,
    },
  ];

  for (const photo of (input.photos || []).slice(0, 4)) {
    if (photo?.dataUrl && photo.dataUrl.startsWith('data:image/')) {
      contentParts.push({
        type: 'image_url',
        image_url: { url: photo.dataUrl },
      });
    }
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: contentParts },
  ];

  try {
    const aiResponse = await callDeepInfraWithFixedFallback('teacher_copilot', messages, {
      responseFormatJson: true,
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(aiResponse.text);
    } catch {
      parsed = {
        clinicalSummary: aiResponse.text.slice(0, 320),
      };
    }

    await recordAiExecutionMetrics({
      serviceId: 'teacher_copilot',
      uid: input.teacherUid,
      tokensUsed: aiResponse.tokensUsed,
      durationMs: aiResponse.tokensUsed ? aiResponse.durationMs : 0,
      isFallback: aiResponse.isFallback,
    });

    const summary = parsed.clinicalSummary || 'Análise clínica preliminar pronta para revisão do treinador.';
    const flags = Array.isArray(parsed.posturalFlags) ? parsed.posturalFlags : [];
    const split = parsed.suggestedSplit || 'full_body';

    return {
      clinicalSummary: summary,
      summaryPt: summary,
      suggestedLimitations: Array.isArray(parsed.suggestedLimitations) ? parsed.suggestedLimitations : [],
      avoidedMovements: Array.isArray(parsed.avoidedMovements) ? parsed.avoidedMovements : [],
      posturalFlags: flags,
      posturalObservations: flags,
      ergonomicAlerts: Array.isArray(parsed.ergonomicAlerts)
        ? parsed.ergonomicAlerts
        : ['Validar amplitude articular confortável na primeira sessão supervisionada.'],
      detectedEquipments: Array.isArray(parsed.detectedEquipments) && parsed.detectedEquipments.length > 0
        ? parsed.detectedEquipments
        : ['peso_corporal'],
      suggestedSplit: split,
      recommendedTemplateFocus:
        parsed.recommendedTemplateFocus ||
        (split === 'upper_lower'
          ? 'Divisão Superior/Inferior Equilibrada'
          : split === 'abc'
          ? 'Divisão ABC Estruturada'
          : 'Full Body Funcional & Estabilidade Articular'),
      suggestedFrequencyDays: Number(parsed.suggestedFrequencyDays) || 3,
      confidenceScore: Number(parsed.confidenceScore) || 0.9,
      generatedAt: Date.now(),
      source: 'ai_model',
    };
  } catch (err) {
    console.error('[PartnerTeacherCopilot] Erro na análise multimodal:', err);
    const fallbackText = 'Análise automática indisponível no momento. Utilize as respostas e fotos brutas para prescrição.';
    return {
      clinicalSummary: fallbackText,
      summaryPt: fallbackText,
      suggestedLimitations: [],
      avoidedMovements: [],
      posturalFlags: [],
      posturalObservations: [],
      ergonomicAlerts: [],
      detectedEquipments: ['peso_corporal'],
      suggestedSplit: 'full_body',
      recommendedTemplateFocus: 'Full Body Funcional',
      suggestedFrequencyDays: 3,
      confidenceScore: 0.5,
      generatedAt: Date.now(),
      source: 'ai_model',
    };
  }
}
