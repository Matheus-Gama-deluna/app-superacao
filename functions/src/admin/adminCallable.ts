/**
 * Endpoints Administrativos Callable (v9.5 Produção)
 * Gestão de Modelos, Custos, Skills (15), Usuários e Auditoria no Banco Nomeado
 */

import { requireAdmin, writeAdminAuditLog } from './adminAuth.js';
import { getActiveSystemConfig, invalidateConfigCache } from './usageLedger.js';
import {
  callDeepInfraWithFixedFallback,
  getAdminApiKeyStatus,
  invalidateApiKeyCache,
  maskApiKey,
} from '../config/agentModels.js';
import {
  ALL_SCIENTIFIC_SKILLS,
  invalidateSkillOverridesCache,
  loadSkillOverridesFromDb,
} from '../skills/skillRegistry.js';
import { AdminDailyMetrics, AdminSystemConfig, AgentServiceId } from '../types/sharedAi.js';
import { getAppDb, isFirestoreAvailable } from '../lib/db.js';

function buildEmptyDailyMetrics(dateStr: string): AdminDailyMetrics {
  return {
    dateStr,
    totalCalls: 0,
    totalErrors: 0,
    totalFallbacksTriggered: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCachedTokens: 0,
    totalAudioSeconds: 0,
    estimatedCostUsd: 0,
    callsByAgent: {
      master_personal: 0,
      teacher_copilot: 0,
      telemetry_analyst: 0,
      habit_companion: 0,
      voice_asr: 0,
      memory_embedder: 0,
    },
    redFlagsBlocked: 0,
    proposalsCreated: 0,
    proposalsConfirmed: 0,
  };
}

/**
 * 1. Snapshot Agregado do Painel Admin (compatível com AdminDashboardView)
 */
export async function handleAdminGetDashboardSnapshot(authContext: any, days = 30): Promise<any> {
  const admin = await requireAdmin(authContext);
  const config = await getActiveSystemConfig();
  const todayStr = new Date().toISOString().split('T')[0];

  let dailyMetrics: AdminDailyMetrics[] = [];
  let recentLogs: any[] = [];
  let skillOverrides: Record<string, any> = {};

  if (isFirestoreAvailable()) {
    const db = getAppDb();
    const [metricsSnap, auditSnap, loadedOverrides] = await Promise.all([
      db.collection('system_metrics').orderBy('dateStr', 'desc').limit(days).get(),
      db.collection('admin_audit_logs').orderBy('timestamp', 'desc').limit(25).get(),
      loadSkillOverridesFromDb(),
    ]);

    dailyMetrics = metricsSnap.docs.map((d) => ({
      ...buildEmptyDailyMetrics(d.data()?.dateStr || todayStr),
      ...(d.data() as Partial<AdminDailyMetrics>),
    }));
    recentLogs = auditSnap.docs.map((d) => d.data());
    skillOverrides = loadedOverrides;
  }

  const todayMetric =
    dailyMetrics.find((m) => m.dateStr === todayStr) ||
    dailyMetrics[0] ||
    buildEmptyDailyMetrics(todayStr);

  const apiKeyStatus = await getAdminApiKeyStatus();

  return {
    adminEmail: admin.email,
    isSuperAdmin: admin.isSuperAdmin,
    config,
    metrics: todayMetric,
    dailyMetrics,
    recentAudits: recentLogs,
    recentLogs,
    skillOverrides,
    skillsCount: Object.keys(ALL_SCIENTIFIC_SKILLS).length,
    apiKeyStatus,
  };
}

/**
 * 2. Atualização das Configurações de IA e Modelos
 */
export async function handleAdminUpdateAiSettings(
  authContext: any,
  updates: Partial<AdminSystemConfig>
): Promise<AdminSystemConfig> {
  const admin = await requireAdmin(authContext);
  const current = await getActiveSystemConfig();

  const nextConfig: AdminSystemConfig = {
    ...current,
    ...updates,
    models: {
      ...current.models,
      ...(updates.models || {}),
    },
    updatedAt: Date.now(),
    updatedBy: admin.email,
  };

  if (isFirestoreAvailable()) {
    const db = getAppDb();
    await db.collection('system_config').doc('ai_settings').set(nextConfig, { merge: true });
  }
  invalidateConfigCache();

  await writeAdminAuditLog({
    adminUid: admin.uid,
    adminEmail: admin.email,
    action: 'update_ai_settings',
    targetId: 'system_config/ai_settings',
    details: { updatedKeys: Object.keys(updates) },
  });

  return nextConfig;
}

/**
 * 3. Teste de Conexão com Modelos no DeepInfra / Mini-Playground
 */
export async function handleAdminTestModelConnection(
  authContext: any,
  params: { serviceId: AgentServiceId; modelName?: string; prompt?: string; forceFallback?: boolean }
): Promise<any> {
  await requireAdmin(authContext);
  const testPrompt = params.prompt || 'Olá! Responda em 1 frase curta confirmando conexão ativa no SuperAção.';
  const activeConfig = await getActiveSystemConfig();
  const baseSpec = activeConfig.models[params.serviceId];
  const customSpec =
    params.modelName && baseSpec
      ? { ...baseSpec, primaryModel: params.modelName }
      : baseSpec;

  const res = await callDeepInfraWithFixedFallback(
    params.serviceId,
    [
      { role: 'system', content: 'Você é o diagnóstico de conectividade do SuperAção. Responda em 1 frase curta em português.' },
      { role: 'user', content: testPrompt },
    ],
    { responseFormatJson: false, modelConfig: customSpec }
  );

  return {
    success: true,
    modelUsed: res.modelUsed,
    isFallback: res.isFallback,
    durationMs: res.durationMs,
    latencyMs: res.durationMs,
    replyText: res.text,
    responsePreview: `[${res.modelUsed}${res.isFallback ? ' • Fallback' : ''}] ${res.text}`,
    tokensUsed: res.tokensUsed,
  };
}

/**
 * 4. Edição ou Customização de Skill Científica
 */
export async function handleAdminUpsertSkillOverride(
  authContext: any,
  params: { skillId: string; isEnabled: boolean; customProtocolMarkdown?: string; customProtocol?: string }
): Promise<any> {
  const admin = await requireAdmin(authContext);
  const customMarkdown = params.customProtocolMarkdown ?? params.customProtocol ?? null;

  if (isFirestoreAvailable() && params.skillId) {
    const db = getAppDb();
    await db
      .collection('system_config')
      .doc('skills_overrides')
      .set(
        {
          [params.skillId]: {
            isEnabled: params.isEnabled,
            customProtocolMarkdown: customMarkdown,
            updatedAt: Date.now(),
            updatedBy: admin.email,
          },
        },
        { merge: true }
      );
  }
  invalidateSkillOverridesCache();

  await writeAdminAuditLog({
    adminUid: admin.uid,
    adminEmail: admin.email,
    action: 'upsert_skill_override',
    targetId: params.skillId,
    details: { isEnabled: params.isEnabled },
  });

  return { success: true };
}

/**
 * 5. Gestão de Usuários, Bloqueio de IA e Reset de Cota (com minimização LGPD)
 */
export async function handleAdminSearchAndManageUsers(
  authContext: any,
  params: {
    searchQuery?: string;
    action?: 'reset_daily_quota' | 'toggle_ai_block' | 'change_role' | 'reset' | 'block' | 'unblock';
    targetUid?: string;
    newRole?: 'student' | 'teacher';
  }
): Promise<any> {
  const admin = await requireAdmin(authContext);

  if (!isFirestoreAvailable()) {
    return { users: [] };
  }

  const db = getAppDb();

  if (params.action && params.targetUid) {
    if (params.action === 'reset_daily_quota' || params.action === 'reset') {
      const today = new Date().toISOString().split('T')[0];
      await db.collection('users').doc(params.targetUid).collection('aiQuota').doc(today).delete();

      await writeAdminAuditLog({
        adminUid: admin.uid,
        adminEmail: admin.email,
        action: 'reset_daily_quota',
        targetId: params.targetUid,
      });

      return { success: true, message: 'Cota diária resetada com sucesso.' };
    }

    if (
      params.action === 'toggle_ai_block' ||
      params.action === 'block' ||
      params.action === 'unblock'
    ) {
      const userRef = db.collection('users').doc(params.targetUid);
      const snap = await userRef.get();
      const currentlyBlocked = Boolean(snap.data()?.aiBlocked);
      const nextBlocked =
        params.action === 'block'
          ? true
          : params.action === 'unblock'
          ? false
          : !currentlyBlocked;

      await userRef.set({ aiBlocked: nextBlocked, updatedAt: Date.now() }, { merge: true });

      await writeAdminAuditLog({
        adminUid: admin.uid,
        adminEmail: admin.email,
        action: nextBlocked ? 'block_user_ai' : 'unblock_user_ai',
        targetId: params.targetUid,
      });

      return {
        success: true,
        aiBlocked: nextBlocked,
        message: nextBlocked ? 'Uso de IA bloqueado para o usuário.' : 'Uso de IA liberado para o usuário.',
      };
    }

    if (params.action === 'change_role' && params.newRole) {
      await db.collection('users').doc(params.targetUid).set(
        {
          userRole: params.newRole,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      await writeAdminAuditLog({
        adminUid: admin.uid,
        adminEmail: admin.email,
        action: 'change_user_role',
        targetId: params.targetUid,
        details: { newRole: params.newRole },
      });

      return { success: true, message: `Papel alterado para ${params.newRole}.` };
    }
  }

  const usersSnap = await db.collection('users').limit(30).get();
  const qLower = (params.searchQuery || '').trim().toLowerCase();
  const results = usersSnap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        displayName: data.displayName || 'Praticante',
        userRole: data.userRole || 'student',
        aiBlocked: Boolean(data.aiBlocked),
        linkedTeacherName: data.linkedTeacherName,
        experienceLevel: data.experienceLevel,
        primaryGoal: data.primaryGoal,
        onboardingCompleted: Boolean(data.onboardingCompleted),
        updatedAt: data.updatedAt || 0,
      };
    })
    .filter((u) => !qLower || u.displayName.toLowerCase().includes(qLower) || u.uid.toLowerCase().includes(qLower));

  return { users: results };
}

/**
 * 6. Atualização Segura da Chave de API da DeepInfra no Cofre do Servidor
 */
export async function handleAdminUpdateApiKey(
  authContext: any,
  params: { apiKey: string }
): Promise<{ success: boolean; maskedKey: string; updatedAt: number }> {
  const admin = await requireAdmin(authContext);
  if (!admin.isSuperAdmin) {
    throw new Error('PERMISSION_DENIED: Somente o Super Administrador pode atualizar credenciais do sistema.');
  }

  const rawKey = (params.apiKey || '').trim();
  if (!rawKey || rawKey.length < 8) {
    throw new Error('INVALID_ARGUMENT: Chave de API inválida. O formato deve conter ao menos 8 caracteres.');
  }

  const maskedKey = maskApiKey(rawKey);
  const now = Date.now();

  if (isFirestoreAvailable()) {
    const db = getAppDb();
    await db.collection('system_secrets').doc('deepinfra').set({
      apiKey: rawKey,
      maskedKey,
      source: 'admin_vault',
      updatedAt: now,
      updatedBy: admin.email,
    });

    invalidateApiKeyCache();

    await writeAdminAuditLog({
      adminUid: admin.uid,
      adminEmail: admin.email,
      action: 'rotate_deepinfra_api_key',
      targetId: 'system_secrets/deepinfra',
      details: { maskedKey },
    });
  }

  return {
    success: true,
    maskedKey,
    updatedAt: now,
  };
}
