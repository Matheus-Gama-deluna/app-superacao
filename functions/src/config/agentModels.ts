/**
 * Configuração Congelada de Modelos DeepInfra (v9.0)
 * Tabela Fixa: 1 Titular + 1 Fallback Equivalente de outra família
 * Sem motor de roteamento dinâmico.
 */

import { AgentServiceId, AdminModelSpec, AdminSystemConfig, AdminApiKeyStatus } from '../types/sharedAi.js';

export const DEFAULT_AGENT_MODELS: Record<AgentServiceId, AdminModelSpec> = {
  master_personal: {
    primaryModel: 'zai-org/GLM-5.3',
    fallbackModel: 'deepseek-ai/DeepSeek-V4-Pro',
    temperature: 0.2,
    maxOutputTokens: 1400,
    timeoutMs: 15000,
    pricingInputPerMillion: 0.56,
    pricingOutputPerMillion: 1.80,
    pricingCachedInputPerMillion: 0.10,
    isEnabled: true,
  },
  teacher_copilot: {
    primaryModel: 'moonshotai/Kimi-K2.5',
    fallbackModel: 'google/gemma-4-31b-it',
    temperature: 0.2,
    maxOutputTokens: 1400,
    timeoutMs: 20000,
    pricingInputPerMillion: 0.45,
    pricingOutputPerMillion: 2.25,
    pricingCachedInputPerMillion: 0.15,
    isEnabled: true,
  },
  telemetry_analyst: {
    primaryModel: 'openai/gpt-oss-120b',
    fallbackModel: 'deepseek-ai/DeepSeek-V4.1-Flash',
    temperature: 0.2,
    maxOutputTokens: 900,
    timeoutMs: 10000,
    pricingInputPerMillion: 0.08,
    pricingOutputPerMillion: 0.30,
    pricingCachedInputPerMillion: 0.02,
    isEnabled: true,
  },
  habit_companion: {
    primaryModel: 'deepseek-ai/DeepSeek-V4.1-Flash',
    fallbackModel: 'google/gemma-4-31b-it',
    temperature: 0.5,
    maxOutputTokens: 400,
    timeoutMs: 8000,
    pricingInputPerMillion: 0.098,
    pricingOutputPerMillion: 0.294,
    pricingCachedInputPerMillion: 0.003,
    isEnabled: true,
  },
  voice_asr: {
    primaryModel: 'Qwen/Qwen3-ASR-1.7B',
    fallbackModel: 'mistralai/Voxtral-Mini-3B-2507',
    temperature: 0.0,
    maxOutputTokens: 500,
    timeoutMs: 12000,
    pricingInputPerMillion: 0.27,
    pricingOutputPerMillion: 0.27,
    pricingCachedInputPerMillion: 0.0,
    isEnabled: true,
  },
  memory_embedder: {
    primaryModel: 'BAAI/bge-m3',
    fallbackModel: 'Qwen/Qwen3-Embedding-8B',
    temperature: 0.0,
    maxOutputTokens: 1024,
    timeoutMs: 6000,
    pricingInputPerMillion: 0.01,
    pricingOutputPerMillion: 0.0,
    pricingCachedInputPerMillion: 0.0,
    isEnabled: true,
  },
};

export const DEFAULT_ADMIN_CONFIG: AdminSystemConfig = {
  aiEnabled: true,
  emergencyKillSwitch: false,
  dailyHardStopUsd: 15.0, // Teto diário de segurança da plataforma
  monthlyHardStopUsd: 150.0, // Teto mensal de segurança da plataforma
  dailyUserTurnQuota: 20,
  dailyUserAudioQuota: 10,
  models: DEFAULT_AGENT_MODELS,
  updatedAt: Date.now(),
  updatedBy: 'system_default',
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface DeepInfraChatResponse {
  text: string;
  modelUsed: string;
  isFallback: boolean;
  tokensUsed: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
  };
  durationMs: number;
}

let cachedVaultApiKey: { key: string; expiresAt: number } | null = null;

export function maskApiKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '****';
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

/**
 * Resolução Segura de Chave DeepInfra:
 * 1. Secret Manager / Env Var (process.env.DEEPINFRA_API_KEY)
 * 2. Cache em memória do cofre seguro Firestore
 * 3. Documento blindado system_secrets/deepinfra no Firestore
 */
export async function getResolvedDeepInfraApiKey(): Promise<string> {
  // 1. Prioridade: Chave injetada via Secret Manager / Variável de Ambiente
  if (process.env.DEEPINFRA_API_KEY && process.env.DEEPINFRA_API_KEY.trim() !== '') {
    return process.env.DEEPINFRA_API_KEY.trim();
  }

  // 2. Cache em memória para minimizar acessos ao Firestore
  if (cachedVaultApiKey && Date.now() < cachedVaultApiKey.expiresAt) {
    return cachedVaultApiKey.key;
  }

  // 3. Consulta ao cofre restrito system_secrets/deepinfra
  try {
    const { getApps } = await import('firebase-admin/app');
    if (getApps().length === 0) {
      return '';
    }
    const { getFirestore } = await import('firebase-admin/firestore');
    const secretDoc = await getFirestore().collection('system_secrets').doc('deepinfra').get();
    if (secretDoc.exists) {
      const data = secretDoc.data();
      const vaultKey = (data?.apiKey || '').trim();
      if (vaultKey) {
        cachedVaultApiKey = {
          key: vaultKey,
          expiresAt: Date.now() + 5 * 60 * 1000, // 5 min TTL
        };
        return vaultKey;
      }
    }
  } catch (err: any) {
    console.warn('[agentModels] Falha ao consultar cofre system_secrets/deepinfra:', err?.message || err);
  }

  return '';
}

export function invalidateApiKeyCache(): void {
  cachedVaultApiKey = null;
}

/**
 * Retorna o status da chave sem jamais expor o conteúdo bruto ao cliente
 */
export async function getAdminApiKeyStatus(): Promise<AdminApiKeyStatus> {
  // 1. Checa Secret Manager
  if (process.env.DEEPINFRA_API_KEY && process.env.DEEPINFRA_API_KEY.trim() !== '') {
    return {
      isConfigured: true,
      maskedKey: maskApiKey(process.env.DEEPINFRA_API_KEY),
      source: 'secret_manager',
    };
  }

  // 2. Checa Cofre do Firestore
  try {
    const { getApps } = await import('firebase-admin/app');
    if (getApps().length === 0) {
      return {
        isConfigured: false,
        maskedKey: '',
        source: 'none',
      };
    }
    const { getFirestore } = await import('firebase-admin/firestore');
    const secretDoc = await getFirestore().collection('system_secrets').doc('deepinfra').get();
    if (secretDoc.exists) {
      const data = secretDoc.data();
      if (data?.apiKey) {
        return {
          isConfigured: true,
          maskedKey: data.maskedKey || maskApiKey(data.apiKey),
          source: 'admin_vault',
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
        };
      }
    }
  } catch (err: any) {
    console.warn('[agentModels] Falha ao verificar status da chave no Firestore:', err?.message || err);
  }

  return {
    isConfigured: false,
    maskedKey: '',
    source: 'none',
  };
}

/**
 * Cliente HTTP Resiliente para DeepInfra
 * Executa chamada com Titular e, sob falha (timeout, 5xx, 429), tenta Fallback de outra família.
 * Se nenhuma chave configurada, retorna simulação clínica segura sem gerar custos.
 */
export async function callDeepInfraWithFixedFallback(
  serviceId: AgentServiceId,
  messages: ChatMessage[],
  options: {
    responseFormatJson?: boolean;
    apiKey?: string;
    modelConfig?: AdminModelSpec;
    forceMock?: boolean;
  } = {}
): Promise<DeepInfraChatResponse> {
  const config = options.modelConfig || DEFAULT_AGENT_MODELS[serviceId];
  const apiKey = options.apiKey || (await getResolvedDeepInfraApiKey());
  const startTime = Date.now();

  // Modo seguro / Mock quando sem chave ou forçado para homologação visual
  if (!apiKey || options.forceMock) {
    return generateSafeMockResponse(serviceId, messages, config.primaryModel, startTime);
  }

  // 1. Tentativa com Modelo Titular
  try {
    const res = await callModelEndpoint(config.primaryModel, messages, config, apiKey, options.responseFormatJson);
    return {
      text: res.text,
      modelUsed: config.primaryModel,
      isFallback: false,
      tokensUsed: res.tokensUsed,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    console.warn(`[DeepInfra] Falha no titular (${config.primaryModel}) para ${serviceId}:`, err?.message || err);

    // 2. Fallback automático para o Modelo Equivalente
    try {
      const fallbackRes = await callModelEndpoint(
        config.fallbackModel,
        messages,
        { ...config, timeoutMs: Math.min(config.timeoutMs, 10000) },
        apiKey,
        options.responseFormatJson
      );
      return {
        text: fallbackRes.text,
        modelUsed: config.fallbackModel,
        isFallback: true,
        tokensUsed: fallbackRes.tokensUsed,
        durationMs: Date.now() - startTime,
      };
    } catch (fallbackErr: any) {
      console.error(`[DeepInfra] Falha também no fallback (${config.fallbackModel}):`, fallbackErr?.message || fallbackErr);
      // Fallback final gracioso para simulação determinística sem derrubar a tela do usuário
      return generateSafeMockResponse(serviceId, messages, config.fallbackModel, startTime, true);
    }
  }
}

async function callModelEndpoint(
  model: string,
  messages: ChatMessage[],
  config: AdminModelSpec,
  apiKey: string,
  responseFormatJson?: boolean
): Promise<{ text: string; tokensUsed: { inputTokens: number; outputTokens: number; cachedTokens?: number } }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const body: Record<string, any> = {
      model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxOutputTokens,
      prompt_cache_key: `superacao_${model.replace(/[^a-zA-Z0-9]/g, '_')}_v1`,
    };

    if (responseFormatJson) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data: any = await response.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content || '';
    const usage = data.usage || {};

    return {
      text,
      tokensUsed: {
        inputTokens: usage.prompt_tokens || 0,
        outputTokens: usage.completion_tokens || 0,
        cachedTokens: usage.prompt_tokens_details?.cached_tokens || 0,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function generateSafeMockResponse(
  serviceId: AgentServiceId,
  messages: ChatMessage[],
  modelUsed: string,
  startTime: number,
  isFallback = false
): DeepInfraChatResponse {
  const lastUserMsg = messages
    .filter((m) => m.role === 'user')
    .pop()?.content || '';

  const userText = typeof lastUserMsg === 'string' ? lastUserMsg : JSON.stringify(lastUserMsg);

  let mockReply = '';
  if (serviceId === 'master_personal') {
    mockReply = JSON.stringify({
      replyPt: `Entendido com cuidado e respeito ao seu corpo. Analisei sua observação ("${userText.slice(0, 60)}...") e organizei as adaptações mais seguras mantendo sua constância sem sobrecarga articular.`,
      clinicalReasoningSummary: 'Prescrição adaptada com foco em proteção articular (Skill 05/06) e dosagem de volume fracionado (Skill 02).',
      requiresConfirmation: true,
      activatedSkillIds: ['02_acsm2026_volume_hypertrophy_strength', '05_spine_lumbar_cervical_care'],
      actionRequired: true,
      proposedDiff: {
        actionType: 'soften_session',
        titlePt: 'Adaptação Suave da Sessão',
        descriptionPt: 'Volume reduzido em 25% com ampliação de descansos para proteger sua recuperação.',
      },
    });
  } else if (serviceId === 'telemetry_analyst') {
    mockReply = JSON.stringify({
      weeklyAnalysisPt: 'Excelente consistência observada! Suas práticas mantiveram um esforço equilibrado (RPE médio confortável), consolidando o hábito semanal.',
      motivationalPills: [
        'Constância não é perfeição, é voltar amanhã sem culpa.',
        'Cada repetição feita hoje construiu sua reserva de saúde.',
        'Respeitar seu cansaço também faz parte da evolução.',
        'O movimento gentil transforma sua energia diária.',
        'Mais uma semana de vitória pessoal conquistada.',
      ],
      suggestedWeeklyAction: 'manter_ritmo',
    });
  } else {
    mockReply = JSON.stringify({
      replyPt: 'Estou aqui com você! Qualquer dúvida sobre os movimentos, ajustes no dia ou motivação para continuar, pode contar comigo.',
      requiresConfirmation: false,
    });
  }

  return {
    text: mockReply,
    modelUsed: `${modelUsed}_simulated`,
    isFallback,
    tokensUsed: { inputTokens: 450, outputTokens: 180, cachedTokens: 250 },
    durationMs: Date.now() - startTime,
  };
}
