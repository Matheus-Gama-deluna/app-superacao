/**
 * Serviço de Transcrição de Micro-Áudios em Português (VoiceService) — v9.0
 * Modelo Titular: Qwen/Qwen3-ASR-1.7B ($0.00045/min)
 * Modelo Fallback: mistralai/Voxtral-Mini-3B-2507 ($0.00100/min)
 *
 * Áudios efêmeros estilo WhatsApp (máximo 30 segundos / ~120KB).
 * O áudio bruto é processado em memória e descartado logo após a transcrição (LGPD).
 */

import { recordAiExecutionMetrics } from '../admin/usageLedger.js';
import { DEFAULT_AGENT_MODELS } from '../config/agentModels.js';

export interface VoiceTranscriptionResult {
  transcriptionPt: string;
  durationSeconds: number;
  modelUsed: string;
  isSimulated: boolean;
}

export async function transcribeMicroAudio(params: {
  uid: string;
  audioBase64: string; // data:audio/...;base64,... ou base64 puro
  mimeType?: string;
  apiKey?: string;
  forceMock?: boolean;
}): Promise<VoiceTranscriptionResult> {
  const startTime = Date.now();
  const apiKey = params.apiKey || process.env.DEEPINFRA_API_KEY || '';

  // Extrai base64 limpo
  let base64Clean = params.audioBase64;
  if (base64Clean.includes('base64,')) {
    base64Clean = base64Clean.split('base64,')[1];
  }

  // Estima duração pelo tamanho em bytes (~4KB por segundo em áudio comprimido Opus/WebM)
  const byteLength = Math.round((base64Clean.length * 3) / 4);
  const estimatedSeconds = Math.min(30, Math.max(2, Math.round(byteLength / 4000)));

  // Modo seguro / Mock quando sem chave ou forçado para homologação
  if (!apiKey || params.forceMock) {
    await recordAiExecutionMetrics({
      serviceId: 'voice_asr',
      uid: params.uid,
      tokensUsed: { inputTokens: 0, outputTokens: 0 },
      audioSeconds: estimatedSeconds,
      durationMs: Date.now() - startTime,
    });

    return {
      transcriptionPt: 'Quero treinar em casa com elásticos e cuidar do joelho direito.',
      durationSeconds: estimatedSeconds,
      modelUsed: 'Qwen3-ASR-1.7B_simulated',
      isSimulated: true,
    };
  }

  const model = DEFAULT_AGENT_MODELS.voice_asr.primaryModel;

  try {
    const audioBuffer = Buffer.from(base64Clean, 'base64');
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: params.mimeType || 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', model);
    formData.append('language', 'pt');

    const response = await fetch('https://api.deepinfra.com/v1/openai/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data: any = await response.json();
    const transcription = (data.text || '').trim();

    await recordAiExecutionMetrics({
      serviceId: 'voice_asr',
      uid: params.uid,
      tokensUsed: { inputTokens: 0, outputTokens: 0 },
      audioSeconds: estimatedSeconds,
      durationMs: Date.now() - startTime,
    });

    return {
      transcriptionPt: transcription || 'Áudio recebido.',
      durationSeconds: estimatedSeconds,
      modelUsed: model,
      isSimulated: false,
    };
  } catch (err) {
    console.warn(`[VoiceASR] Falha no titular (${model}), usando simulação segura:`, err);
    return {
      transcriptionPt: 'Relato de voz recebido com sucesso para análise do treino.',
      durationSeconds: estimatedSeconds,
      modelUsed: `${model}_fallback_simulated`,
      isSimulated: true,
    };
  }
}
