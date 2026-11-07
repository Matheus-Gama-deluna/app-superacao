/**
 * Registro de Uso, Custos, Cotas e Travas Financeiras de Orçamento (v9.5 Produção)
 * Conectado ao banco Firestore nomeado oficial e integrado aos agentes em runtime.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { AgentServiceId, AdminSystemConfig } from '../types/sharedAi.js';
import { DEFAULT_ADMIN_CONFIG } from '../config/agentModels.js';
import { getAppDb, isFirestoreAvailable } from '../lib/db.js';

let cachedConfig: AdminSystemConfig | null = null;
let configCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 segundos

/**
 * Obtém as configurações do sistema com cache em memória (60s)
 */
export async function getActiveSystemConfig(): Promise<AdminSystemConfig> {
  const now = Date.now();
  if (cachedConfig && now - configCacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  if (!isFirestoreAvailable()) {
    cachedConfig = { ...DEFAULT_ADMIN_CONFIG };
    configCacheTime = now;
    return cachedConfig;
  }

  try {
    const db = getAppDb();
    const snap = await db.collection('system_config').doc('ai_settings').get();
    if (snap.exists) {
      const raw = snap.data() as Partial<AdminSystemConfig>;
      const mergedModels: AdminSystemConfig['models'] = { ...DEFAULT_ADMIN_CONFIG.models };
      if (raw?.models) {
        for (const key of Object.keys(DEFAULT_ADMIN_CONFIG.models) as AgentServiceId[]) {
          if (raw.models[key]) {
            mergedModels[key] = {
              ...DEFAULT_ADMIN_CONFIG.models[key],
              ...raw.models[key],
            };
          }
        }
      }
      cachedConfig = {
        ...DEFAULT_ADMIN_CONFIG,
        ...raw,
        models: mergedModels,
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
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getCurrentMonthPrefix(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

/**
 * Registra o consumo de uma execução de IA atomicamente no banco nomeado
 */
export async function recordAiExecutionMetrics(params: {
  serviceId: AgentServiceId;
  uid: string;
  tokensUsed: { inputTokens: number; outputTokens: number; cachedTokens?: number };
  durationMs: number;
  isError?: boolean;
  isFallback?: boolean;
  isRedFlagBlocked?: boolean;
  proposalCreated?: boolean;
  audioSeconds?: number;
}): Promise<{ estimatedCostUsd: number; hardStopReached: boolean }> {
  const config = await getActiveSystemConfig();
  const modelSpec = config.models[params.serviceId];

  // Cálculo preciso de custo com desconto de Prompt Cache
  const nonCachedInput = Math.max(0, params.tokensUsed.inputTokens - (params.tokensUsed.cachedTokens || 0));
  const cachedInput = params.tokensUsed.cachedTokens || 0;

  const inputCost = (nonCachedInput / 1_000_000) * (modelSpec?.pricingInputPerMillion || 0.15);
  const cachedInputCost = (cachedInput / 1_000_000) * (modelSpec?.pricingCachedInputPerMillion || 0.03);
  const outputCost = (params.tokensUsed.outputTokens / 1_000_000) * (modelSpec?.pricingOutputPerMillion || 0.5);
  const audioCost = params.audioSeconds ? (params.audioSeconds / 60) * 0.00045 : 0;

  const totalCostUsd = inputCost + cachedInputCost + outputCost + audioCost;

  if (!isFirestoreAvailable()) {
    return { estimatedCostUsd: totalCostUsd, hardStopReached: false };
  }

  const dateStr = getTodayDateStr();
  const monthPrefix = getCurrentMonthPrefix();
  let hardStopReached = false;

  try {
    const db = getAppDb();
    const metricsRef = db.collection('system_metrics').doc(`ai_daily_${dateStr}`);
    const monthlyRef = db.collection('system_metrics_monthly').doc(`ai_month_${monthPrefix}`);

    await Promise.all([
      metricsRef.set(
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
          proposalsCreated: FieldValue.increment(params.proposalCreated ? 1 : 0),
          updatedAt: Date.now(),
        },
        { merge: true }
      ),
      monthlyRef.set(
        {
          monthPrefix,
          estimatedCostUsd: FieldValue.increment(Number(totalCostUsd.toFixed(6))),
          totalCalls: FieldValue.increment(1),
          updatedAt: Date.now(),
        },
        { merge: true }
      ),
    ]);

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
    hardStopReached,
  };
}

/**
 * Checa Kill-Switch, teto financeiro diário/mensal (Hard-Stop USD), bloqueio de conta e cota diária do usuário
 */
export async function checkUserQuota(
  uid: string,
  options?: { isAudio?: boolean }
): Promise<{
  allowed: boolean;
  reason?: string;
  turnsUsedToday: number;
  maxTurns: number;
}> {
  const config = await getActiveSystemConfig();

  // 1. Kill-Switch Global ou IA Desativada pelo Admin
  if (config.emergencyKillSwitch || !config.aiEnabled) {
    return {
      allowed: false,
      reason: 'O assistente inteligente em nuvem está temporariamente pausado pelo administrador. Suas fichas e treinos continuam funcionando normalmente!',
      turnsUsedToday: 0,
      maxTurns: config.dailyUserTurnQuota,
    };
  }

  if (!isFirestoreAvailable()) {
    return {
      allowed: true,
      turnsUsedToday: 0,
      maxTurns: config.dailyUserTurnQuota,
    };
  }

  try {
    const db = getAppDb();
    const dateStr = getTodayDateStr();
    const monthPrefix = getCurrentMonthPrefix();

    // 2. Verifica Hard-Stop Financeiro Diário e Mensal da Plataforma
    const [dailySnap, monthlySnap] = await Promise.all([
      db.collection('system_metrics').doc(`ai_daily_${dateStr}`).get(),
      db.collection('system_metrics_monthly').doc(`ai_month_${monthPrefix}`).get(),
    ]);

    const dailySpent = Number(dailySnap.data()?.estimatedCostUsd || 0);
    const monthlySpent = Number(monthlySnap.data()?.estimatedCostUsd || 0);

    if (config.dailyHardStopUsd > 0 && dailySpent >= config.dailyHardStopUsd) {
      return {
        allowed: false,
        reason: 'O orçamento diário de IA da plataforma foi atingido. Voltaremos amanhã cedo — seus treinos seguem disponíveis!',
        turnsUsedToday: 0,
        maxTurns: config.dailyUserTurnQuota,
      };
    }

    if (config.monthlyHardStopUsd > 0 && monthlySpent >= config.monthlyHardStopUsd) {
      return {
        allowed: false,
        reason: 'O limite mensal de uso assistido foi atingido. Suas fichas e cronograma continuam ativos normalmente!',
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

    // 3. Verifica bloqueio individual e cota diária do usuário
    const [userSnap, quotaSnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('users').doc(uid).collection('aiQuota').doc(dateStr).get(),
    ]);

    if (userSnap.exists && userSnap.data()?.aiBlocked === true) {
      return {
        allowed: false,
        reason: 'O uso de IA para esta conta está temporariamente suspenso.',
        turnsUsedToday: 0,
        maxTurns: config.dailyUserTurnQuota,
      };
    }

    const quotaData = quotaSnap.data();
    const turnsToday = Number(quotaData?.turnsToday || 0);
    const audioSecondsToday = Number(quotaData?.audioSecondsToday || 0);

    if (options?.isAudio && config.dailyUserAudioQuota > 0) {
      const maxAudioSeconds = config.dailyUserAudioQuota * 30;
      if (audioSecondsToday >= maxAudioSeconds) {
        return {
          allowed: false,
          reason: `Você já utilizou sua cota diária de mensagens de voz (${config.dailyUserAudioQuota} áudios). Continue conversando por texto!`,
          turnsUsedToday: turnsToday,
          maxTurns: config.dailyUserTurnQuota,
        };
      }
    }

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
    console.warn('[UsageLedger] Falha não-bloqueante ao checar cota:', err);
    return {
      allowed: true,
      turnsUsedToday: 0,
      maxTurns: config.dailyUserTurnQuota,
    };
  }
}
