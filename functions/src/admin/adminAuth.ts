/**
 * Autenticação e Auditoria Administrativa (v9.5 Produção)
 * Blindagem estrita contra escalação de privilégios.
 * Autoridade reside em Custom Claims (token.admin == true) + system_admins/{uid} no banco nomeado.
 */

import { getAuth } from 'firebase-admin/auth';
import { getAppDb, isFirestoreAvailable } from '../lib/db.js';

export const ADMIN_OWNER_EMAILS = [
  'gamamatheus65@gmail.com',
  ...(process.env.ADMIN_OWNER_EMAILS
    ? process.env.ADMIN_OWNER_EMAILS.split(',').map((e) => e.trim().toLowerCase())
    : []),
];

export interface AdminUserContext {
  uid: string;
  email: string;
  isSuperAdmin: boolean;
}

/**
 * Valida se o usuário logado possui privilégio administrativo.
 * Se for o e-mail proprietário autenticado, realiza bootstrap automático seguro.
 */
export async function requireAdmin(
  authContext: { uid?: string; token?: any } | undefined
): Promise<AdminUserContext> {
  if (!authContext || !authContext.uid) {
    throw new Error('UNAUTHENTICATED: Acesso administrativo exige autenticação.');
  }

  const uid = authContext.uid;
  const email = (authContext.token?.email || '').toLowerCase().trim();
  const hasClaim = Boolean(authContext.token?.admin);

  // 1. Bootstrap seguro do e-mail proprietário
  if (email && ADMIN_OWNER_EMAILS.includes(email)) {
    if (isFirestoreAvailable()) {
      try {
        if (!hasClaim) {
          await getAuth().setCustomUserClaims(uid, { ...(authContext.token || {}), admin: true });
        }
        await ensureAdminDocument(uid, email, true);
      } catch (err) {
        console.warn('[AdminAuth] Aviso no bootstrap de claims/doc do proprietário:', err);
      }
    }
    return { uid, email, isSuperAdmin: true };
  }

  // 2. Verificação via Custom Claim
  if (hasClaim) {
    return { uid, email, isSuperAdmin: ADMIN_OWNER_EMAILS.includes(email) };
  }

  // 3. Verificação em system_admins/{uid} no banco nomeado
  if (isFirestoreAvailable()) {
    const db = getAppDb();
    const adminSnap = await db.collection('system_admins').doc(uid).get();
    if (adminSnap.exists) {
      const data = adminSnap.data();
      if (data?.active !== false) {
        return { uid, email, isSuperAdmin: Boolean(data?.isSuperAdmin) };
      }
    }
  }

  throw new Error('PERMISSION_DENIED: Esta conta não possui privilégio administrativo.');
}

async function ensureAdminDocument(uid: string, email: string, isSuperAdmin: boolean): Promise<void> {
  if (!isFirestoreAvailable()) return;
  const db = getAppDb();
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
  action: string;
  targetId?: string;
  details?: Record<string, any>;
}): Promise<void> {
  if (!isFirestoreAvailable()) return;
  try {
    const db = getAppDb();
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
