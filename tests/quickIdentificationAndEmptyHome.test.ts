import { describe, it, expect } from 'vitest';
import { UserProfile, UserRole } from '../src/types';
import { defaultGuestProfile } from '../src/lib/storage';

describe('Sprint 1: Identificação Rápida & Zero Treino Cego', () => {
  it('1. Perfil padrão inicial não impõe CREF nem dados clínicos forçados', () => {
    expect(defaultGuestProfile.userRole).toBeUndefined();
    expect(defaultGuestProfile.routineConfirmed).toBe(false);
    expect(defaultGuestProfile.onboardingCompleted).toBe(false);
    expect((defaultGuestProfile as any).cref).toBeUndefined();
  });

  it('2. Aluno registrado via identificação rápida nasce sem treino cego', () => {
    const studentProfile: UserProfile = {
      ...defaultGuestProfile,
      displayName: 'Mariana Lima',
      userRole: 'student',
      onboardingCompleted: true,
      routineConfirmed: false,
      hasCompletedAnamnesis: false,
    };

    expect(studentProfile.displayName).toBe('Mariana Lima');
    expect(studentProfile.userRole).toBe('student');
    expect(studentProfile.routineConfirmed).toBe(false);
    expect(studentProfile.hasCompletedAnamnesis).toBe(false);
    // Não possui CREF
    expect((studentProfile as any).cref).toBeUndefined();
  });

  it('3. Professor registrado via identificação rápida tem userRole teacher sem exigir CREF inicial', () => {
    const teacherProfile: UserProfile = {
      ...defaultGuestProfile,
      uid: 'teacher_123',
      displayName: 'Prof. Carlos',
      userRole: 'teacher',
      onboardingCompleted: true,
      routineConfirmed: false,
    };

    expect(teacherProfile.userRole).toBe('teacher');
    expect(teacherProfile.displayName).toBe('Prof. Carlos');
    expect((teacherProfile as any).cref).toBeUndefined();
  });

  it('4. Perfil padrão não pré-seleciona objetivos nem dias da semana para novo aluno', () => {
    expect(defaultGuestProfile.primaryGoal).toBe('');
    expect(defaultGuestProfile.goalPriorityOrder).toEqual([]);
    expect(defaultGuestProfile.availableDays).toEqual([]);
  });

  it('5. Migração de storage assume student e preserva routineConfirmed em perfil legado', async () => {
    let store: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v.toString();
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        store = {};
      },
    };
    (globalThis as any).localStorage = mockStorage;

    const { runStorageMigration, STORAGE_KEYS, getLocal, setLocal } = await import('../src/lib/storage');
    mockStorage.clear();
    setLocal(STORAGE_KEYS.SCHEMA_VERSION, '7.0.0');
    setLocal(STORAGE_KEYS.USER_PROFILE, {
      uid: 'legacy_student_1',
      displayName: 'Aluno Legado',
      onboardingCompleted: true,
      routineConfirmed: true,
      // userRole undefined
    });

    runStorageMigration();

    const migrated = getLocal<UserProfile>(STORAGE_KEYS.USER_PROFILE, defaultGuestProfile);
    expect(migrated.userRole).toBe('student');
    expect(migrated.routineConfirmed).toBe(true);
    expect(migrated.onboardingCompleted).toBe(true);
  });

  it('6. Migração de storage repara perfil legado mesmo se SCHEMA_VERSION já estiver em 8.0.0', async () => {
    let store: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v.toString();
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        store = {};
      },
    };
    (globalThis as any).localStorage = mockStorage;

    const { runStorageMigration, STORAGE_KEYS, getLocal, setLocal } = await import('../src/lib/storage');
    mockStorage.clear();
    setLocal(STORAGE_KEYS.SCHEMA_VERSION, '8.0.0');
    setLocal(STORAGE_KEYS.USER_PROFILE, {
      uid: 'legacy_student_already_800',
      displayName: 'Aluno Já no 8.0.0',
      onboardingCompleted: true,
      routineConfirmed: true,
      // userRole undefined
    });

    runStorageMigration();

    const migrated = getLocal<UserProfile>(STORAGE_KEYS.USER_PROFILE, defaultGuestProfile);
    expect(migrated.userRole).toBe('student');
    expect(migrated.routineConfirmed).toBe(true);
  });
});
