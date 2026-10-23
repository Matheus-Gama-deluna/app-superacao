import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  persistUserDoc,
  deleteUserDoc,
  persistCalendarDays,
  persistActiveProgram,
  persistUserProfile,
} from '../src/lib/persistence';

// Mock do Firestore
const mockSetDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockWriteBatch = vi.fn();
const mockDoc = vi.fn((_db, ...parts) => ({ path: parts.join('/') }));

vi.mock('firebase/firestore', () => ({
  doc: (_db: any, ...parts: string[]) => mockDoc(_db, ...parts),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  writeBatch: (...args: any[]) => mockWriteBatch(...args),
}));

vi.mock('../src/lib/firebase', () => ({
  db: {},
  handleFirestoreError: (err: any) => { throw err; },
  OperationType: {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    WRITE: 'write',
  },
}));

describe('Persistência Canônica do Usuário (persistence.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persistUserDoc deve injetar ownerUid e salvar com setDoc', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);
    await persistUserDoc('user_123', 'plans', 'plan_abc', { title: 'Treino A' });

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'user_123', 'plans', 'plan_abc');
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      { title: 'Treino A', ownerUid: 'user_123' },
      { merge: undefined }
    );
  });

  it('deleteUserDoc deve chamar deleteDoc no caminho correto', async () => {
    mockDeleteDoc.mockResolvedValueOnce(undefined);
    await deleteUserDoc('user_123', 'plans', 'plan_abc');

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'user_123', 'plans', 'plan_abc');
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('persistCalendarDays deve usar writeBatch para comitar dias da agenda', async () => {
    const mockBatchSet = vi.fn();
    const mockBatchCommit = vi.fn().mockResolvedValueOnce(undefined);
    mockWriteBatch.mockReturnValueOnce({
      set: mockBatchSet,
      commit: mockBatchCommit,
    });

    const mockDays = [
      { id: 'day_1', ownerUid: 'user_123', dateStr: '2026-10-24', dayOfWeek: 6, activityType: 'strength' as const, isCompleted: false },
      { id: 'day_2', ownerUid: 'user_123', dateStr: '2026-10-25', dayOfWeek: 0, activityType: 'rest' as const, isCompleted: true },
    ];

    await persistCalendarDays('user_123', mockDays);

    expect(mockWriteBatch).toHaveBeenCalled();
    expect(mockBatchSet).toHaveBeenCalledTimes(2);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('persistActiveProgram deve salvar em users/{uid}/programs/active_program quando presente', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);
    const mockProg: any = { id: 'prog_1', title: 'Força Total', durationWeeks: 4, currentWeek: 1 };

    await persistActiveProgram('user_123', mockProg);

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'user_123', 'programs', 'active_program');
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'prog_1', ownerUid: 'user_123' })
    );
  });

  it('persistActiveProgram deve chamar deleteDoc quando programa for null', async () => {
    mockDeleteDoc.mockResolvedValueOnce(undefined);
    await persistActiveProgram('user_123', null);

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'user_123', 'programs', 'active_program');
    expect(mockDeleteDoc).toHaveBeenCalled();
  });

  it('persistUserProfile deve atualizar na raiz do documento do usuário com merge', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined);
    await persistUserProfile('user_123', { needsReviewPrompt: false });

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'user_123');
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      { needsReviewPrompt: false },
      { merge: true }
    );
  });
});
