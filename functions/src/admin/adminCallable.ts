/**
 * Endpoints Administrativos Callable (v9.0)
 * Gestão de Modelos, Custos, Skills, Usuários e Auditoria
 */

import { getFirestore } from 'firebase-admin/firestore';
import { requireAdmin, writeAdminAuditLog } from './adminAuth.js';
import { getActiveSystemConfig, invalidateConfigCache } from './usageLedger.js';
import { callDeepInfraWithFixedFallback } from '../config/agentModels.js';
import { ALL_SCIENTIFIC_SKILLS } from '../skills/skillRegistry.js';
import { AdminSystemConfig, AgentServiceId } from '../types/sharedAi.js';

/**
 * 1. Snapshot Agregado do Painel Admin (7 a 30 dias de métricas em ~30 leituras)
 */
export async function handleAdminGetDashboardSnapshot(authContext: any, days = 30): Promise<any> {
  const admin = await requireAdmin(authContext);
  const db = getFirestore();
  const config = await getActiveSystemConfig();

  // Busca métricas dos últimos N dias
  const metricsSnap = await db
    .collection('system_metrics')
    .orderBy('dateStr', 'desc')
    .limit(days)
    .get();

  const dailyMetrics = metricsSnap.docs.map((d) => d.data());

  // Busca últimos 20 logs de auditoria
  const auditSnap = await db
    .collection('admin_audit_logs')
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get();

  const recentLogs = auditSnap.docs.map((d) => d.data());

  return {
    adminEmail: admin.email,
    isSuperAdmin: admin.isSuperAdmin,
    config,
    dailyMetrics,
    recentLogs,
    skillsCount: Object.keys(ALL_SCIENTIFIC_SKILLS).length,
  };
}

/**
 * 2. Atualização das Configurações de IA e Modelos
 */
export async function handleAdminUpdateAiSettings(authContext: any, updates: Partial<AdminSystemConfig>): Promise<AdminSystemConfig> {
  const admin = await requireAdmin(authContext);
  const db = getFirestore();

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

  await db.collection('system_config').doc('ai_settings').set(nextConfig, { merge: true });
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
  params: { serviceId: AgentServiceId; prompt?: string; forceFallback?: boolean }
): Promise<any> {
  await requireAdmin(authContext);
  const testPrompt = params.prompt || 'Olá! Teste de verificação de conexão e latência.';

  const res = await callDeepInfraWithFixedFallback(
    params.serviceId,
    [
      { role: 'system', content: 'Você é um assistente de teste de conectividade. Responda brevemente.' },
      { role: 'user', content: testPrompt },
    ],
    { responseFormatJson: false }
  );

  return {
    success: true,
    modelUsed: res.modelUsed,
    isFallback: res.isFallback,
    durationMs: res.durationMs,
    replyText: res.text,
    tokensUsed: res.tokensUsed,
  };
}

/**
 * 4. Edição ou Customização de Skill Científica
 */
export async function handleAdminUpsertSkillOverride(
  authContext: any,
  params: { skillId: string; isEnabled: boolean; customProtocolMarkdown?: string }
): Promise<any> {
  const admin = await requireAdmin(authContext);
  const db = getFirestore();

  await db
    .collection('system_config')
    .doc('skills_overrides')
    .set(
      {
        [params.skillId]: {
          isEnabled: params.isEnabled,
          customProtocolMarkdown: params.customProtocolMarkdown || null,
          updatedAt: Date.now(),
          updatedBy: admin.email,
        },
      },
      { merge: true }
    );

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
 * 5. Gestão de Usuários e Reset de Cota (com privacidade LGPD por padrão)
 */
export async function handleAdminSearchAndManageUsers(
  authContext: any,
  params: {
    searchQuery?: string;
    action?: 'reset_daily_quota' | 'toggle_ai_block' | 'change_role';
    targetUid?: string;
    newRole?: 'student' | 'teacher';
  }
): Promise<any> {
  const admin = await requireAdmin(authContext);
  const db = getFirestore();

  // Execução de Ações
  if (params.action && params.targetUid) {
    if (params.action === 'reset_daily_quota') {
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

    if (params.action === 'change_role' && params.newRole) {
      await db.collection('users').doc(params.targetUid).update({
        userRole: params.newRole,
        updatedAt: Date.now(),
      });

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

  // Busca de Usuários com Minimização de Dados (LGPD)
  const usersSnap = await db.collection('users').limit(25).get();
  const results = usersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      displayName: data.displayName || 'Praticante',
      userRole: data.userRole || 'student',
      linkedTeacherName: data.linkedTeacherName,
      experienceLevel: data.experienceLevel,
      primaryGoal: data.primaryGoal,
      onboardingCompleted: Boolean(data.onboardingCompleted),
      updatedAt: data.updatedAt || 0,
      // Textos médicos e conversas NÃO são retornados na lista geral
    };
  });

  return {
    users: results,
  };
}
