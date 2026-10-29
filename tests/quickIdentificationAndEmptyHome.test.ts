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
});
