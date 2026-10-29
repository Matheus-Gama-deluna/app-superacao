import { describe, it, expect } from 'vitest';
import {
  createDefaultTeacherTemplate,
  generateTeacherInviteCode,
  validateAnamnesisAnswers,
  mapAnamnesisToUserProfileLimitations,
} from '../src/lib/anamnesisEngine';
import {
  applyTeacherPrescriptionToCalendar,
} from '../src/lib/teacherStudentSync';
import { isValidImageFile } from '../src/lib/photoUtils';
import { TeacherDayPrescription, CalendarDay, WorkoutPlan } from '../src/types';

describe('Sprint 2: Anamnese Customizável, Fotos e Prescrição de Descansos', () => {
  it('1. Valida geração de código amigável PROF-XXXX para o professor', () => {
    const code1 = generateTeacherInviteCode('teacher_user_a1b2');
    expect(code1).toMatch(/^PROF-[A-Z0-9]{4}$/);

    const code2 = generateTeacherInviteCode('');
    expect(code2).toBe('PROF-DEMO');
  });

  it('2. Template padrão do professor possui perguntas estruturadas e slots de fotos posturais e de materiais', () => {
    const template = createDefaultTeacherTemplate('teacher_123', 'Prof. Rafael');
    expect(template.teacherUid).toBe('teacher_123');
    expect(template.questions.length).toBeGreaterThanOrEqual(6);

    const photoSlots = template.questions.filter((q) => q.type === 'photo_upload');
    expect(photoSlots.length).toBeGreaterThanOrEqual(2);

    const frontPhoto = photoSlots.find((p) => p.photoCategory === 'posture_front');
    expect(frontPhoto).toBeDefined();

    const equipmentPhoto = photoSlots.find((p) => p.photoCategory === 'equipments');
    expect(equipmentPhoto).toBeDefined();
  });

  it('3. Validação de preenchimento da anamnese detecta campos obrigatórios faltantes', () => {
    const template = createDefaultTeacherTemplate('teacher_123');
    // Respostas vazias
    const resEmpty = validateAnamnesisAnswers(template, {});
    expect(resEmpty.valid).toBe(false);
    expect(resEmpty.errors.length).toBeGreaterThan(0);

    // Respostas preenchidas corretamente
    const resFilled = validateAnamnesisAnswers(template, {
      q_primary_goal: 'forca',
      q_weekly_frequency: '3',
      q_equipments_available: ['peso_corporal'],
    });
    expect(resFilled.valid).toBe(true);
    expect(resFilled.errors.length).toBe(0);
  });

  it('4. Mapeamento de respostas da anamnese extrai limitações e movimentos a evitar com segurança', () => {
    const template = createDefaultTeacherTemplate('teacher_123');
    const answers = {
      q_primary_goal: 'alivio_dores',
      q_weekly_frequency: '4',
      q_joint_limitations: ['dor_joelho', 'dor_lombar'],
      q_equipments_available: ['peso_corporal', 'elasticos'],
    };

    const mapped = mapAnamnesisToUserProfileLimitations(template, answers);
    expect(mapped.primaryGoal).toBe('Alívio de dores posturais e mobilidade');
    expect(mapped.daysPerWeek).toBe(4);
    expect(mapped.reportedLimitations).toContain('dor_joelho');
    expect(mapped.reportedLimitations).toContain('dor_lombar');
    expect(mapped.avoidedMovements).toContain('agachamento_profundo');
    expect(mapped.avoidedMovements).toContain('sobrecarga_lombar');
    expect(mapped.equipments).toContain('mini_band');
    expect(mapped.equipments).toContain('faixa_longa');
  });

  it('5. Validação de arquivo de fotos aceita imagens válidas e rejeita arquivos não suportados', () => {
    const dummyJpg = new File(['fake-content'], 'foto.jpg', { type: 'image/jpeg' });
    const dummyPng = new File(['fake-content'], 'foto.png', { type: 'image/png' });
    const dummyPdf = new File(['fake-content'], 'documento.pdf', { type: 'application/pdf' });

    expect(isValidImageFile(dummyJpg)).toBe(true);
    expect(isValidImageFile(dummyPng)).toBe(true);
    expect(isValidImageFile(dummyPdf)).toBe(false);
  });

  it('6. Prescrição do professor aplica corretamente Treino, Descanso Total e Descanso Ativo na agenda semanal', () => {
    const studentUid = 'student_789';
    const fakePlan: WorkoutPlan = {
      id: 'plan_treino_a',
      title: 'Treino A - Mobilidade & Força Base',
      description: 'Plano de adaptação',
      category: 'forca',
      level: 'iniciante',
      estimatedDurationMinutes: 20,
      exercises: [],
    };

    const prescriptions: TeacherDayPrescription[] = [
      {
        dayOfWeek: 1, // Segunda
        regime: 'workout',
        planId: fakePlan.id,
        planTitle: fakePlan.title,
        teacherNotes: 'Foque na respiração e execução limpa.',
      },
      {
        dayOfWeek: 2, // Terça: Descanso Ativo
        regime: 'rest_active',
        activeRestActivity: 'caminhada_leve',
        activeRestCustomLabel: 'Caminhada suave (25 min)',
        teacherNotes: 'Solte os braços e oxigene a musculatura.',
      },
      {
        dayOfWeek: 0, // Domingo: Descanso Total
        regime: 'rest_total',
        teacherNotes: 'Descanso total. Seu corpo cresce no repouso!',
      },
    ];

    const initialCalendar: CalendarDay[] = [];
    const updated = applyTeacherPrescriptionToCalendar(
      studentUid,
      prescriptions,
      [fakePlan],
      initialCalendar
    );

    expect(updated.length).toBe(7);

    // Segunda (dayOfWeek 1) -> Treino
    const monday = updated.find((d) => d.dayOfWeek === 1);
    expect(monday?.activityType).toBe('strength');
    expect(monday?.planId).toBe('plan_treino_a');
    expect(monday?.notes).toBe('Foque na respiração e execução limpa.');

    // Terça (dayOfWeek 2) -> Descanso Ativo
    const tuesday = updated.find((d) => d.dayOfWeek === 2);
    expect(tuesday?.activityType).toBe('active_recovery');
    expect(tuesday?.notes).toContain('Caminhada suave (25 min)');

    // Domingo (dayOfWeek 0) -> Descanso Total
    const sunday = updated.find((d) => d.dayOfWeek === 0);
    expect(sunday?.activityType).toBe('rest');
    expect(sunday?.notes).toContain('Descanso total');

    // Quarta (dayOfWeek 3) -> Não atribuído
    const wednesday = updated.find((d) => d.dayOfWeek === 3);
    expect(wednesday?.activityType).toBe('unassigned');
  });
});
