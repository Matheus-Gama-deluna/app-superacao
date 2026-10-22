import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicialização segura do app Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicializa Firestore com persistência IndexedDB nativa para suporte offline completo
let firestoreInstance: Firestore;
const dbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
try {
  firestoreInstance = dbId
    ? initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      }, dbId)
    : initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
} catch {
  // Fallback caso já esteja inicializado ou em ambiente que não suporte multitab
  firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
}

export const db = firestoreInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Tipos de operação e tratamento de erros do Firestore (Skill Conformance)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Teste de conexão conforme exigido na skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Superação: Operando em modo offline (cache local ativo).');
    }
    return false;
  }
}

// Helpers de autenticação
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Erro ao autenticar com Google:', error);
    throw error;
  }
}

export async function signOutUser() {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged, enableNetwork, disableNetwork, waitForPendingWrites };
export type { FirebaseUser };
