import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
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


export function translateFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Você pode entrar ou redefinir sua senha.';
    case 'auth/invalid-email':
      return 'O endereço de e-mail informado não parece ser válido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos. Por favor, verifique os dados digitados.';
    case 'auth/weak-password':
      return 'A senha precisa ter no mínimo 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet. Verifique sua rede para autenticar ou continue como convidado.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.';
    case 'auth/popup-closed-by-user':
      return 'Login com Google cancelado. Seus dados locais continuam seguros neste aparelho.';
    default:
      return error?.message || 'Ocorreu um erro ao processar sua solicitação. Tente novamente.';
  }
}

export async function createUserWithEmail(email: string, pass: string, displayName?: string) {
  try {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && displayName.trim()) {
      await updateProfile(res.user, { displayName: displayName.trim() });
    }
    return res.user;
  } catch (error) {
    console.error('Erro ao cadastrar com e-mail:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string) {
  try {
    const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return res.user;
  } catch (error) {
    console.error('Erro ao autenticar com e-mail:', error);
    throw error;
  }
}

export async function sendPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    console.error('Erro ao enviar recuperação de senha:', error);
    throw error;
  }
}

export async function signOutUser() {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged, enableNetwork, disableNetwork, waitForPendingWrites };
export type { FirebaseUser };
