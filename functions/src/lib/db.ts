/**
 * Conexão Centralizada com o Banco Firestore Nomeado do SuperAção
 * Garante que todas as Cloud Functions (Memória M2/M3, Cofre Admin, Cotas, Skills e Auditoria)
 * leiam e gravem no mesmo banco utilizado pelo cliente Web/PWA.
 */

import { getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

export const APP_FIRESTORE_DB_ID =
  process.env.FIRESTORE_DATABASE_ID || 'ai-studio-9241b6d4-5ba0-4baa-83fb-3b97bb466615';

/**
 * Indica se o Firebase Admin está inicializado e autorizado a consultar o Firestore
 * (evita timeouts de metadata server em execuções locais isoladas de benchmark/teste).
 */
export function isFirestoreAvailable(): boolean {
  if (process.env.SKIP_FIRESTORE === '1') return false;
  return getApps().length > 0;
}

/**
 * Retorna a instância do Firestore conectada ao databaseId oficial do SuperAção.
 */
export function getAppDb(): Firestore {
  return getFirestore(APP_FIRESTORE_DB_ID);
}
