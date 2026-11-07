/**
 * Serviço de Transcrição de Micro-Áudios em Português (VoiceService) — v9.5 Produção
 * Modelo Titular: openai/whisper-large-v3-turbo (~0.99s ao vivo, $0.00020/min)
 * Modelo Fallback: Qwen/Qwen3-ASR-1.7B ($0.00045/min)
 *
 * Áudios efêmeros estilo WhatsApp (máximo 30 segundos).
 * Processado estritamente em memória e descartado após transcrição (LGPD).
 */

import { checkUserQuota, getActiveSystemConfig, recordAiExecutionMetrics } from '../admin/usageLedger.js';
import { DEFAULT_AGENT_MODELS, getResolvedDeepInfraApiKey } from '../config/agentModels.js';

export interface VoiceTranscriptionResult {
  transcriptionPt: string;
  confidence: number;
  durationSeconds: number;
  modelUsed: string;
  isSimulated: boolean;
}

async function callDeepInfraAudioTranscription(params: {
  audioBuffer: Buffer;
  mimeType: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
}): Promise<string> {
  const ext = params.mimeType.includes('wav')
    ? 'wav'
    : params.mimeType.includes('mp4') || params.mimeType.includes('m4a')
    ? 'm4a'
    : params.mimeType.includes('ogg')
    ? 'ogg'
    : 'webm';

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(params.audioBuffer)], { type: params.mimeType });
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', params.model);
  formData.append('language', 'pt');

  const response = await fetch('https://api.deepinfra.com/v1/openai/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: formData,
    signal: AbortSignal.timeout(params.timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data: any = await response.json();
  return (data.text || '').trim();
}

export async function transcribeMicroAudio(params: {
  uid: string;
  audioBase64: string;
  mimeType?: string;
  apiKey?: string;
  forceMock?: boolean;
}): Promise<VoiceTranscriptionResult> {
  const startTime = Date.now();
  const uid = params.uid || 'guest';

  const quota = await checkUserQuota(uid, { isAudio: true });
  if (!quota.allowed) {
    return {
      transcriptionPt: quota.reason || 'Cota diária de áudio atingida.',
      confidence: 1.0,
      durationSeconds: 0,
      modelUsed: 'quota_guardrail',
      isSimulated: true,
    };
  }

  const apiKey = params.apiKey || (await getResolvedDeepInfraApiKey());

  let base64Clean = params.audioBase64 || '';
  if (base64Clean.includes('base64,')) {
    base64Clean = base64Clean.split('base64,')[1];
  }

  const byteLength = Math.round((base64Clean.length * 3) / 4);
  const estimatedSeconds = Math.min(30, Math.max(2, Math.round(byteLength / 4000)));
  const mimeType = params.mimeType || 'audio/webm';

  if (!apiKey || params.forceMock) {
    await recordAiExecutionMetrics({
      serviceId: 'voice_asr',
      uid,
      tokensUsed: { inputTokens: 0, outputTokens: 0 },
      audioSeconds: estimatedSeconds,
      durationMs: Date.now() - startTime,
    });

    return {
      transcriptionPt: 'Quero treinar em casa com elásticos e cuidar do joelho direito.',
      confidence: 0.95,
      durationSeconds: estimatedSeconds,
      modelUsed: 'whisper-large-v3-turbo_simulated',
      isSimulated: true,
    };
  }

  const sysConfig = await getActiveSystemConfig();
  const voiceSpec = sysConfig.models?.voice_asr || DEFAULT_AGENT_MODELS.voice_asr;
  const audioBuffer = Buffer.from(base64Clean, 'base64');

  // 1. Tentativa com Titular (openai/whisper-large-v3-turbo ~0.99s)
  try {
    const transcription = await callDeepInfraAudioTranscription({
      audioBuffer,
      mimeType,
      model: voiceSpec.primaryModel,
      apiKey,
      timeoutMs: voiceSpec.timeoutMs || 15000,
    });

    await recordAiExecutionMetrics({
      serviceId: 'voice_asr',
      uid,
      tokensUsed: { inputTokens: 0, outputTokens: 0 },
      audioSeconds: estimatedSeconds,
      durationMs: Date.now() - startTime,
      isFallback: false,
    });

    return {
      transcriptionPt: transcription || 'Áudio recebido.',
      confidence: 0.96,
      durationSeconds: estimatedSeconds,
      modelUsed: voiceSpec.primaryModel,
      isSimulated: false,
    };
  } catch (primaryErr: any) {
    console.warn(`[VoiceASR] Falha no titular (${voiceSpec.primaryModel}), tentando fallback (${voiceSpec.fallbackModel}):`, primaryErr?.message);

    // 2. Fallback Real (Qwen/Qwen3-ASR-1.7B)
    try {
      const fallbackTranscription = await callDeepInfraAudioTranscription({
        audioBuffer,
        mimeType,
        model: voiceSpec.fallbackModel,
        apiKey,
        timeoutMs: 20000,
      });

      await recordAiExecutionMetrics({
        serviceId: 'voice_asr',
        uid,
        tokensUsed: { inputTokens: 0, outputTokens: 0 },
        audioSeconds: estimatedSeconds,
        durationMs: Date.now() - startTime,
        isFallback: true,
      });

      return {
        transcriptionPt: fallbackTranscription || 'Áudio recebido.',
        confidence: 0.92,
        durationSeconds: estimatedSeconds,
        modelUsed: voiceSpec.fallbackModel,
        isSimulated: false,
      };
    } catch (fallbackErr: any) {
      console.error('[VoiceASR] Falha também no fallback ASR:', fallbackErr?.message);
      return {
        transcriptionPt: 'Relato de voz recebido para adaptação do treino.',
        confidence: 0.7,
        durationSeconds: estimatedSeconds,
        modelUsed: `${voiceSpec.fallbackModel}_fallback_simulated`,
        isSimulated: true,
      };
    }
  }
}
