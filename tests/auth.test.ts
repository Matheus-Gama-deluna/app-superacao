import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translateFirebaseAuthError } from '../src/lib/firebase';
import {
  persistPersonalRecords,
  migrateGuestDataToFirestore,
} from '../src/lib/persistence';
import { STORAGE_KEYS } from '../src/lib/storage';

// Mock do localStorage para o runner Node do Vitest
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

// Mocks do Firestore
const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockWriteBatch = vi.fn(() => ({
  set: mockBatchSet,
  commit: mockBatchCommit,
}));
const mockDoc = vi.fn((_db, ...parts) => ({ path: parts.join('/') }));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    doc: (_db: any, ...parts: string[]) => mockDoc(_db, ...parts),
    getDoc: (...args: any[]) => mockGetDoc(...args),
    setDoc: (...args: any[]) => mockSetDoc(...args),
    deleteDoc: vi.fn(),
    writeBatch: () => mockWriteBatch(),
  };
});

describe('Sprint 3: Autenticação e Migração Zero-Perda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Tradução Acolhedora de Erros do Firebase Auth (translateFirebaseAuthError)', () => {
    it('traduz auth/email-already-in-use amigavelmente', () => {
      const msg = translateFirebaseAuthError({ code: 'auth/email-already-in-use' });
      expect(msg).toContain('já está cadastrado');
    });

    it('traduz auth/invalid-email amigavelmente', () => {
      const msg = translateFirebaseAuthError({ code: 'auth/invalid-email' });
      expect(msg).toContain('não parece ser válido');
    });

    it('traduz credenciais inválidas / senha incorreta', () => {
      const msg = translateFirebaseAuthError({ code: 'auth/invalid-credential' });
      expect(msg).toContain('E-mail ou senha incorretos');
    });

    it('traduz auth/weak-password avisando sobre mínimo de 6 caracteres', () => {
      const msg = translateFirebaseAuthError({ code: 'auth/weak-password' });
      expect(msg).toContain('mínimo 6 caracteres');
    });

    it('traduz auth/network-request-failed informando sobre rede e modo sem conta', () => {
      const msg = translateFirebaseAuthError({ code: 'auth/network-request-failed' });
      expect(msg).toContain('Sem conexão com a internet');
    });

    it('retorna mensagem de fallback em erros não previstos', () => {
      const msg = translateFirebaseAuthError({ message: 'Falha genérica' });
      expect(msg).toBe('Falha genérica');
    });
  });

  describe('Consolidação de Recordes Pessoais (persistPersonalRecords)', () => {
    it('persiste mapa estruturado em users/{uid}/stats/records', async () => {
      mockSetDoc.mockResolvedValueOnce(undefined);

      const prs = [
        {
          exerciseId: 'flexao_solo',
          exerciseName: 'Flexão no Solo',
          bestReps: 15,
          bestDurationSeconds: 0,
          recordedAt: 1700000000000,
          sessionId: 'session_1',
          isBaseline: false,
          prCount: 2,
        },
      ];

      await persistPersonalRecords('user_test_456', prs);

      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'users',
        'user_test_456',
        'stats',
        'records'
      );
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          records: {
            flexao_solo: prs[0],
          },
          ownerUid: 'user_test_456',
        }),
        { merge: true }
      );
    });

    it('não executa se lista de records for vazia', async () => {
      await persistPersonalRecords('user_test_456', []);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('Migração de Convidado para Firestore (migrateGuestDataToFirestore)', () => {
    it('migra perfil e sessões locais de convidado para a conta autenticada sem perda', async () => {
      // Configura dados no localStorage de convidado
      localStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Thiago Convidado',
          onboardingCompleted: true,
          availableDays: [1, 3, 5],
        })
      );

      localStorage.setItem(
        STORAGE_KEYS.SESSIONS,
        JSON.stringify([
          {
            id: 'session_convidado_1',
            planId: 'plan_a',
            planTitle: 'Treino A Convidado',
            startedAt: 1700000000000,
            completedAt: 1700001200000,
            completedExercises: 3,
            totalExercises: 3,
          },
        ])
      );

      mockGetDoc.mockResolvedValueOnce({
        exists: () => false, // Conta nova no Firestore
      });

      const result = await migrateGuestDataToFirestore('firebase_user_789');

      expect(result.migratedSessions).toBe(1);
      expect(mockBatchCommit).toHaveBeenCalled();

      // Confirma que o perfil foi migrado com o novo UID
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          uid: 'firebase_user_789',
          displayName: 'Thiago Convidado',
        }),
        { merge: true }
      );
    });
  });
});
