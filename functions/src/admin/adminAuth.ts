/**
 * Autenticação e Auditoria Administrativa (v9.0)
 * Blindagem estrita contra escalação de privilégios.
 * Autoridade reside em Custom Claims (token.admin == true) + system_admins/{uid}.
 */

import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const ADMIN_OWNER_EMAILS = [
  'gamamatheus65@gmail.com',
  ...(process.env.ADMIN_OWNER_EMAILS ? process.env.ADMIN_OWNER_EMAILS.split(',').map((e) => e.trim().toLowerCase()) : []),
];

export interface AdminUserContext {
  uid: string;
  email: string;
  isSuperAdmin: boolean;
}

/**
 * Valida se o usuário logado possui privilégio administrativo
 * Se for o e-mail proprietário com e-mail verificado, realiza o bootstrap automático seguro.
 */
export async function requireAdmin(authContext: { uid?: string; token?: any } | undefined): Promise<AdminUserContext> {
  if (!authContext || !authContext.uid) {
    throw new Error('UNAUTHENTICATED: Acesso administrativo exige autenticação.');
  }

  const uid = authContext.uid;
  const email = (authContext.token?.email || '').toLowerCase().trim();
  const emailVerified = Boolean(authContext.token?.email_verified);
  const hasClaim = Boolean(authContext.token?.admin);

  // 1. Bootstrap seguro do e-mail proprietário (com email_verified obrigatório)
  if (email && emailVerified && ADMIN_OWNER_EMAILS.includes(email)) {
    if (!hasClaim) {
      await getAuth().setCustomUserClaims(uid, { ...(authContext.token || {}), admin: true });
    }
    await ensureAdminDocument(uid, email, true);
    return { uid, email, isSuperAdmin: true };
  }

  // 2. Verificação via Custom Claim
  if (hasClaim) {
    return { uid, email, isSuperAdmin: ADMIN_OWNER_EMAILS.includes(email) };
  }

  // 3. Verificação em system_admins/{uid}
  const db = getFirestore();
  const adminSnap = await db.collection('system_admins').doc(uid).get();
  if (adminSnap.exists) {
    const data = adminSnap.data();
    if (data?.active !== false) {
      return { uid, email, isSuperAdmin: Boolean(data?.isSuperAdmin) };
    }
  }

  throw new Error('PERMISSION_DENIED: Esta conta não possui privilégio administrativo.');
}

async function ensureAdminDocument(uid: string, email: string, isSuperAdmin: boolean): Promise<void> {
  const db = getFirestore();
  const docRef = db.collection('system_admins').doc(uid);
  const snap = await docRef.get();
  if (!snap.exists) {
    await docRef.set({
      uid,
      email,
      isSuperAdmin,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}

/**
 * Trilha Imutável de Auditoria Administrativa (admin_audit_logs)
 */
export async function writeAdminAuditLog(params: {
  adminUid: string;
  adminEmail: string;
  action: string; // ex: 'update_ai_settings' | 'reset_user_quota' | 'update_skill_override'
  targetId?: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    const db = getFirestore();
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.collection('admin_audit_logs').doc(logId).set({
      id: logId,
      timestamp: Date.now(),
      adminUid: params.adminUid,
      adminEmail: params.adminEmail,
      action: params.action,
      targetId: params.targetId || 'platform',
      details: params.details || {},
    });
  } catch (err) {
    console.error('[AdminAudit] Erro ao gravar audit log:', err);
  }
}
