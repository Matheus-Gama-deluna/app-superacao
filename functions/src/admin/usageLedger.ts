/**
 * Registro de Uso, Custos e Trava Financeira de Orçamento (v9.0)
 * Agregação atômica no Firestore (1 escrita por execução, 0 consultas recursivas)
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { AgentServiceId, AdminSystemConfig } from '../types/sharedAi.js';
import { DEFAULT_ADMIN_CONFIG } from '../config/agentModels.js';

let cachedConfig: AdminSystemConfig | null = null;
let configCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 segundos

/**
 * Obtém as configurações do sistema com cache em memória
 */
export async function getActiveSystemConfig(): Promise<AdminSystemConfig> {
  const now = Date.now();
  if (cachedConfig && now - configCacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const db = getFirestore();
    const snap = await db.collection('system_config').doc('ai_settings').get();
    if (snap.exists) {
      cachedConfig = {
        ...DEFAULT_ADMIN_CONFIG,
        ...(snap.data() as Partial<AdminSystemConfig>),
        models: {
          ...DEFAULT_ADMIN_CONFIG.models,
          ...((snap.data() as any)?.models || {}),
        },
      };
    } else {
      cachedConfig = { ...DEFAULT_ADMIN_CONFIG };
    }
  } catch (err) {
    console.warn('[UsageLedger] Aviso ao buscar system_config/ai_settings, usando default:', err);
    cachedConfig = { ...DEFAULT_ADMIN_CONFIG };
  }

  configCacheTime = now;
  return cachedConfig;
}

export function invalidateConfigCache(): void {
  cachedConfig = null;
  configCacheTime = 0;
}

function getTodayDateStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Registra o consumo de uma execução de IA atomicamente
 */
export async function recordAiExecutionMetrics(params: {
  serviceId: AgentServiceId;
  uid: string;
  tokensUsed: { inputTokens: number; outputTokens: number; cachedTokens?: number };
  durationMs: number;
  isError?: boolean;
  isFallback?: boolean;
  isRedFlagBlocked?: boolean;
  audioSeconds?: number;
}): Promise<{ estimatedCostUsd: number; hardStopReached: boolean }> {
  const config = await getActiveSystemConfig();
  const modelSpec = config.models[params.serviceId];

  // Cálculo de custo com desconto de cache
  const nonCachedInput = Math.max(0, params.tokensUsed.inputTokens - (params.tokensUsed.cachedTokens || 0));
  const cachedInput = params.tokensUsed.cachedTokens || 0;

  const inputCost = (nonCachedInput / 1_000_000) * (modelSpec?.pricingInputPerMillion || 0.1);
  const cachedInputCost = (cachedInput / 1_000_000) * (modelSpec?.pricingCachedInputPerMillion || 0.01);
  const outputCost = (params.tokensUsed.outputTokens / 1_000_000) * (modelSpec?.pricingOutputPerMillion || 0.3);
  const audioCost = params.audioSeconds ? (params.audioSeconds / 60) * 0.00045 : 0;

  const totalCostUsd = inputCost + cachedInputCost + outputCost + audioCost;

  const dateStr = getTodayDateStr();

  try {
    const db = getFirestore();
    const metricsRef = db.collection('system_metrics').doc(`ai_daily_${dateStr}`);

    await metricsRef.set(
      {
        dateStr,
        totalCalls: FieldValue.increment(1),
        totalErrors: FieldValue.increment(params.isError ? 1 : 0),
        totalFallbacksTriggered: FieldValue.increment(params.isFallback ? 1 : 0),
        totalInputTokens: FieldValue.increment(params.tokensUsed.inputTokens),
        totalOutputTokens: FieldValue.increment(params.tokensUsed.outputTokens),
        totalCachedTokens: FieldValue.increment(params.tokensUsed.cachedTokens || 0),
        totalAudioSeconds: FieldValue.increment(params.audioSeconds || 0),
        estimatedCostUsd: FieldValue.increment(Number(totalCostUsd.toFixed(6))),
        [`callsByAgent.${params.serviceId}`]: FieldValue.increment(1),
        redFlagsBlocked: FieldValue.increment(params.isRedFlagBlocked ? 1 : 0),
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    // Registra cota do usuário se autenticado
    if (params.uid && params.uid !== 'guest' && !params.uid.startsWith('test_')) {
      const userQuotaRef = db.collection('users').doc(params.uid).collection('aiQuota').doc(dateStr);
      await userQuotaRef.set(
        {
          turnsToday: FieldValue.increment(1),
          audioSecondsToday: FieldValue.increment(params.audioSeconds || 0),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('[UsageLedger] Aviso ao atualizar métricas atômicas:', err);
  }

  return {
    estimatedCostUsd: totalCostUsd,
    hardStopReached: false,
  };
}

/**
 * Checa se o usuário excedeu a cota diária ou se o sistema está em hard-stop
 */
export async function checkUserQuota(uid: string): Promise<{
  allowed: boolean;
  reason?: string;
  turnsUsedToday: number;
  maxTurns: number;
}> {
  const config = await getActiveSystemConfig();

  if (config.emergencyKillSwitch || !config.aiEnabled) {
    return {
      allowed: false,
      reason: 'O serviço de assistência inteligente está temporariamente em manutenção técnica.',
      turnsUsedToday: 0,
      maxTurns: config.dailyUserTurnQuota,
    };
  }

  if (!uid || uid === 'guest') {
    return {
      allowed: true,
      turnsUsedToday: 0,
      maxTurns: config.dailyUserTurnQuota,
    };
  }

  try {
    const db = getFirestore();
    const dateStr = getTodayDateStr();
    const quotaSnap = await db.collection('users').doc(uid).collection('aiQuota').doc(dateStr).get();

    const data = quotaSnap.data();
    const turnsToday = data?.turnsToday || 0;

    if (turnsToday >= config.dailyUserTurnQuota) {
      return {
        allowed: false,
        reason: `Você utilizou suas ${config.dailyUserTurnQuota} interações assistidas de hoje. Suas fichas e treinos continuam funcionando normalmente!`,
        turnsUsedToday: turnsToday,
        maxTurns: config.dailyUserTurnQuota,
      };
    }

    return {
      allowed: true,
      turnsUsedToday: turnsToday,
      maxTurns: config.dailyUserTurnQuota,
    };
  } catch (err) {
    return {
      allowed: true,
      turnsUsedToday: 0,
      maxTurns: config.dailyUserTurnQuota,
    };
  }
}
