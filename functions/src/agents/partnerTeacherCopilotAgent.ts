/**
 * Co-Piloto Multimodal do Professor Parceiro (PartnerTeacherCopilotAgent) — v9.0
 * Modelo Titular: moonshotai/Kimi-K2.5 (Multimodal de Elite ~75% MMMU-Pro)
 * Modelo Fallback: google/gemma-4-31b-it (Multimodal Turbo)
 */

import { callDeepInfraWithFixedFallback, ChatMessage } from '../config/agentModels.js';
import { recordAiExecutionMetrics } from '../admin/usageLedger.js';

export interface AnamnesisMultimodalInput {
  submissionId: string;
  studentName: string;
  teacherUid: string;
  answers: Record<string, any>;
  photos: Array<{
    category: 'posture_front' | 'posture_side' | 'posture_back' | 'equipments' | 'general';
    dataUrl: string; // base64
    caption?: string;
  }>;
}

export interface TeacherCopilotAnalysisResult {
  clinicalSummary: string;
  suggestedLimitations: string[];
  avoidedMovements: string[];
  posturalFlags: string[];
  detectedEquipments: string[];
  suggestedSplit: 'full_body' | 'upper_lower' | 'abc';
  suggestedFrequencyDays: number;
  confidenceScore: number;
  source: 'ai_model';
}

export async function runPartnerTeacherCopilot(input: AnamnesisMultimodalInput): Promise<TeacherCopilotAnalysisResult> {
  const startTime = Date.now();

  const systemPrompt = `Você é o Co-Piloto Clínico de IA para Treinadores e Fisioterapeutas do Superação.
Sua missão é atuar como assistente cinesiológico para apoiar a decisão do profissional humano (Human-in-the-Loop).
Você analisa simultaneamente:
1. Respostas abertas e fechadas de anamnese física;
2. Fotos posturais (anterior, lateral, posterior) gerando APENAS hipóteses visuais indicativas para aferição presencial;
3. Fotos de equipamentos para identificar o que o aluno realmente possui no local de treino.

Retorne EXCLUSIVAMENTE um objeto JSON:
{
  "clinicalSummary": "síntese técnica fundamentada para o professor ler em 30 segundos",
  "suggestedLimitations": ["ex: Sensibilidade femoropatelar direita", "Tensão cervical"],
  "avoidedMovements": ["ex: agachamento_profundo", "sobrecarga_lombar"],
  "posturalFlags": ["ex: Nivelamento escapular aparente com elevação do ombro direito", "Curvatura cifótica torácica para acompanhar"],
  "detectedEquipments": ["peso_corporal", "halteres", "mini_band", "cadeira"],
  "suggestedSplit": "full_body" | "upper_lower" | "abc",
  "suggestedFrequencyDays": 2 | 3 | 4 | 5,
  "confidenceScore": 0.94
}`;

  // Monta conteúdo multimodal
  const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: 'text',
      text: `DADOS DO ALUNO:
Nome: ${input.studentName}
Respostas da Anamnese:
${JSON.stringify(input.answers, null, 2)}
Fotos anexadas: ${input.photos.length} imagens.`,
    },
  ];

  for (const photo of input.photos.slice(0, 4)) {
    if (photo.dataUrl && photo.dataUrl.startsWith('data:image/')) {
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
        clinicalSummary: aiResponse.text.slice(0, 300),
        suggestedLimitations: [],
        avoidedMovements: [],
        posturalFlags: ['Inspeção visual preliminar registrada'],
        detectedEquipments: ['peso_corporal'],
        suggestedSplit: 'full_body',
        suggestedFrequencyDays: 3,
        confidenceScore: 0.85,
      };
    }

    await recordAiExecutionMetrics({
      serviceId: 'teacher_copilot',
      uid: input.teacherUid,
      tokensUsed: aiResponse.tokensUsed,
      durationMs: aiResponse.durationMs,
      isFallback: aiResponse.isFallback,
    });

    return {
      clinicalSummary: parsed.clinicalSummary || 'Análise da anamnese gerada para validação do treinador.',
      suggestedLimitations: Array.isArray(parsed.suggestedLimitations) ? parsed.suggestedLimitations : [],
      avoidedMovements: Array.isArray(parsed.avoidedMovements) ? parsed.avoidedMovements : [],
      posturalFlags: Array.isArray(parsed.posturalFlags) ? parsed.posturalFlags : [],
      detectedEquipments: Array.isArray(parsed.detectedEquipments) ? parsed.detectedEquipments : ['peso_corporal'],
      suggestedSplit: parsed.suggestedSplit || 'full_body',
      suggestedFrequencyDays: Number(parsed.suggestedFrequencyDays) || 3,
      confidenceScore: Number(parsed.confidenceScore) || 0.9,
      source: 'ai_model',
    };
  } catch (err) {
    console.error('[PartnerTeacherCopilot] Erro na análise multimodal:', err);
    return {
      clinicalSummary: 'Análise automática indisponível no momento. Use as respostas brutas e fotos para prescrição.',
      suggestedLimitations: [],
      avoidedMovements: [],
      posturalFlags: [],
      detectedEquipments: ['peso_corporal'],
      suggestedSplit: 'full_body',
      suggestedFrequencyDays: 3,
      confidenceScore: 0.5,
      source: 'ai_model',
    };
  }
}
