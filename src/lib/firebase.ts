import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFunctions, Functions } from 'firebase/functions';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

let functionsInstance: Functions;
try {
  functionsInstance = getFunctions(app, 'southamerica-east1');
} catch {
  functionsInstance = getFunctions(app);
}
export const functions = functionsInstance;

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
  } catch (error: any) {
    if (error?.code === 'auth/popup-blocked') {
      console.info('[Firebase] Popup bloqueado pelo navegador, tentando fallback com redirecionamento...');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    console.error('Erro ao autenticar com Google:', error);
    throw error;
  }
}

export function translateFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'atual';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Selecione a aba "Entrar" acima ou redefina sua senha.';
    case 'auth/invalid-email':
      return 'O endereço de e-mail informado não parece ser válido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos. Por favor, verifique os dados digitados ou use a recuperação de senha.';
    case 'auth/weak-password':
      return 'A senha precisa ter no mínimo 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet ou restrição de rede para autenticar. Tente novamente.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.';
    case 'auth/popup-closed-by-user':
      return 'A janela do Google foi fechada antes de concluir o login. Seus dados continuam salvos no aparelho.';
    case 'auth/popup-blocked':
      return 'A janela pop-up do Google foi bloqueada pelo navegador. Permita pop-ups para esta página ou entre com seu E-mail e Senha abaixo.';
    case 'auth/unauthorized-domain':
      return `O domínio atual (${currentHost}) não está autorizado no Firebase Authentication (Console > Authentication > Settings > Authorized domains). Você pode entrar com seu E-mail e Senha abaixo ou adicionar este domínio no console.`;
    case 'auth/operation-not-allowed':
      return 'O login com Google não está ativado no Firebase Console para este projeto. Utilize o login com E-mail e Senha abaixo.';
    case 'auth/cancelled-popup-request':
      return 'Uma janela de login do Google já estava em andamento. Conclua nela ou tente novamente.';
    default:
      return error?.message || 'Ocorreu um erro ao processar sua solicitação de login. Tente novamente.';
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
