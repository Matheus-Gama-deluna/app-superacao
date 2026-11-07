import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  signInWithGoogle,
  createUserWithEmail,
  signInWithEmail,
  sendPasswordReset,
  translateFirebaseAuthError,
  signOutUser,
  onAuthStateChanged,
  FirebaseUser,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';
import { defaultGuestProfile, getLocal, setLocal, STORAGE_KEYS } from '../lib/storage';
import { migrateGuestDataToFirestore } from '../lib/persistence';

interface ConflictState {
  remoteProfile: UserProfile;
  localProfile: UserProfile;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile;
  isGuest: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  loginError: string | null;
  pendingConflict: ConflictState | null;
  loginGoogle: () => Promise<boolean>;
  loginEmail: (email: string, pass: string) => Promise<boolean>;
  registerEmail: (email: string, pass: string, displayName?: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  setGuestMode: () => void;
  updateUserProfile: (partial: Partial<UserProfile>) => Promise<void>;
  resolveConflict: (choice: 'keep_remote' | 'merge_local') => Promise<void>;
  clearLoginError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return getLocal<boolean>('superacao_is_guest', true);
  });
  const [profile, setProfile] = useState<UserProfile>(() => {
    return getLocal<UserProfile>('superacao_user_profile', defaultGuestProfile);
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingConflict, setPendingConflict] = useState<ConflictState | null>(null);

  // Escuta mudanças de autenticação do Firebase
  useEffect(() => {
    let stopProfileListener: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(false);
        setLocal('superacao_is_guest', false);

        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          // Checa primeiro se já existe documento remoto no Firestore antes de qualquer migração
          const userSnap = await getDoc(userRef);
          const localSessions = getLocal<any[]>('superacao_sessions', []);

          if (userSnap.exists()) {
            const remoteData = userSnap.data() as UserProfile;
            // Se o usuário local tinha sessões reais concluídas como convidado, detecta necessidade de resolução explícita (C34)
            if (localSessions.length > 0 && !profile.uid.startsWith('firebase_')) {
              setPendingConflict({
                remoteProfile: remoteData,
                localProfile: profile,
              });
            } else {
              setProfile(remoteData);
              setLocal('superacao_user_profile', remoteData);
            }
          } else {
            // Conta nova: migra dados locais do convidado sem perda de histórico (C31)
            try {
              await migrateGuestDataToFirestore(firebaseUser.uid);
            } catch (migErr) {
              console.warn('Superação: Aviso durante migração de convidado:', migErr);
            }

            const newProfile: UserProfile = {
              ...profile,
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || profile.displayName || 'Praticante',
              email: firebaseUser.email || '',
              updatedAt: Date.now(),
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
            setLocal('superacao_user_profile', newProfile);
          }
        } catch (err) {
          console.warn('Usando perfil local em cache (offline ou erro de conexão):', err);
        }

        // Listener reativo do perfil
        if (stopProfileListener) {
          stopProfileListener();
        }
        stopProfileListener = onSnapshot(userRef, { includeMetadataChanges: true }, (snap) => {
          if (snap.exists() && !pendingConflict) {
            const data = snap.data() as UserProfile;
            setProfile(data);
            setLocal('superacao_user_profile', data);
          }
        });

        setIsLoading(false);
      } else {
        if (stopProfileListener) {
          stopProfileListener();
          stopProfileListener = null;
        }
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      if (stopProfileListener) {
        stopProfileListener();
      }
      unsubscribe();
    };
  }, []);

  const loginEmail = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setLoginError(null);
    try {
      await signInWithEmail(email, pass);
      return true;
    } catch (err: any) {
      console.warn('Erro ao autenticar com e-mail:', err);
      setLoginError(translateFirebaseAuthError(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const registerEmail = async (email: string, pass: string, displayName?: string): Promise<boolean> => {
    setIsLoading(true);
    setLoginError(null);
    try {
      await createUserWithEmail(email, pass, displayName);
      if (displayName?.trim()) {
        const updated = {
          ...profile,
          displayName: displayName.trim(),
          email,
          updatedAt: Date.now(),
        };
        setProfile(updated);
        setLocal('superacao_user_profile', updated);
      }
      return true;
    } catch (err: any) {
      console.warn('Erro ao registrar conta com e-mail:', err);
      setLoginError(translateFirebaseAuthError(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    setLoginError(null);
    try {
      await sendPasswordReset(email);
      return {
        success: true,
        message: 'Link de redefinição de senha enviado para seu e-mail! Verifique sua caixa de entrada.',
      };
    } catch (err: any) {
      console.warn('Erro ao solicitar redefinição de senha:', err);
      const msg = translateFirebaseAuthError(err);
      setLoginError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    setLoginError(null);
    try {
      await signInWithGoogle();
      return true;
    } catch (err: any) {
      console.warn('Login Google falhou:', err);
      const msg = translateFirebaseAuthError(err);
      setLoginError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resolveConflict = async (choice: 'keep_remote' | 'merge_local') => {
    if (!pendingConflict || !user) return;

    if (choice === 'keep_remote') {
      setProfile(pendingConflict.remoteProfile);
      setLocal('superacao_user_profile', pendingConflict.remoteProfile);
    } else {
      // Mescla perfil e mantém treinos locais
      const merged: UserProfile = {
        ...pendingConflict.remoteProfile,
        ...pendingConflict.localProfile,
        uid: user.uid,
        email: user.email || pendingConflict.remoteProfile.email,
        displayName: user.displayName || pendingConflict.remoteProfile.displayName,
        updatedAt: Date.now(),
      };
      setProfile(merged);
      setLocal('superacao_user_profile', merged);
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, merged, { merge: true });
      } catch (e) {
        console.warn('Erro ao atualizar mesclagem no Firestore:', e);
      }
    }

    setPendingConflict(null);
  };

  const clearLoginError = () => setLoginError(null);

  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
      setIsGuest(true);
      setLocal('superacao_is_guest', true);
      setProfile(defaultGuestProfile);
      setPendingConflict(null);
      // Limpeza completa de dados locais para evitar contaminação entre contas no mesmo dispositivo
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.PLANS);
      localStorage.removeItem(STORAGE_KEYS.SET_EVENTS);
      localStorage.removeItem(STORAGE_KEYS.CALENDAR);
      localStorage.removeItem(STORAGE_KEYS.PERSONAL_RECORDS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROGRAM);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_CHOICE);
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_DRAFT);
      localStorage.removeItem(STORAGE_KEYS.PROPOSAL);
      setLocal(STORAGE_KEYS.USER_PROFILE, defaultGuestProfile);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const setGuestMode = () => {
    setIsGuest(true);
    setLocal('superacao_is_guest', true);
  };

  const updateUserProfile = async (partial: Partial<UserProfile>) => {
    const updated: UserProfile = {
      ...profile,
      ...partial,
      updatedAt: Date.now(),
    };

    setProfile(updated);
    setLocal('superacao_user_profile', updated);

    if (user && !isGuest) {
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, updated, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };


  const isAdmin = Boolean(
    (user?.email && user.email.toLowerCase() === 'gamamatheus65@gmail.com') ||
    profile.isAdmin === true
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isGuest,
        isAdmin,
        isLoading,
        loginError,
        pendingConflict,
        loginGoogle,
        loginEmail,
        registerEmail,
        resetPassword,
        logout,
        setGuestMode,
        updateUserProfile,
        resolveConflict,
        clearLoginError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
}
