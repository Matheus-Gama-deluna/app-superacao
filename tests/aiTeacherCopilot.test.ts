import { describe, it, expect } from 'vitest';
import {
  runClinicalHeuristicAnalysis,
  draftWeeklyPrescriptionForTeacher,
  evaluateTeacherRosterRadar,
} from '../src/lib/aiTeacherCopilot';
import {
  getPersonalizedExerciseCue,
  translateNaturalLanguageToFilters,
} from '../src/lib/aiStudentAssistant';
import { AnamnesisSubmission, TeacherStudentLink } from '../src/types';

describe('Sprint 3: Co-Piloto de IA do Professor e Assistente do Aluno', () => {
  const fakeSubmission: AnamnesisSubmission = {
    id: 'sub_test_1',
    studentUid: 'student_123',
    studentName: 'Ana Clara',
    teacherUid: 'teacher_999',
    templateId: 'template_teacher_999',
    answers: {
      q_primary_goal: 'forca',
      q_weekly_frequency: '3',
      q_joint_limitations: ['dor_lombar', 'dor_punho'],
      q_equipments_available: ['peso_corporal', 'elasticos'],
    },
    photos: [
      {
        id: 'p_1',
        questionId: 'photo_posture_front',
        category: 'posture_front',
        dataUrl: 'data:image/webp;base64,fake-data',
        uploadedAt: Date.now(),
      },
    ],
    submittedAt: Date.now(),
    status: 'pending_review',
  };

  it('1. Co-Piloto IA realiza triagem clínica completa das respostas e fotos', () => {
    const analysis = runClinicalHeuristicAnalysis(fakeSubmission);

    expect(analysis.suggestedLimitations.length).toBeGreaterThan(0);
    expect(analysis.avoidedMovements).toContain('sobrecarga_lombar');
    expect(analysis.avoidedMovements).toContain('flexao_chao');
    expect(analysis.detectedEquipments).toContain('mini_band');
    expect(analysis.suggestedSplit).toBe('full_body');
    expect(analysis.suggestedFrequencyDays).toBe(3);
    expect(analysis.posturalFlags.length).toBeGreaterThan(0);
    expect(analysis.clinicalSummary).toContain('Ana Clara');
    expect(analysis.confidenceScore).toBeGreaterThanOrEqual(0.85);
  });

  it('2. Co-Piloto IA monta rascunho de 7 dias com divisão equilibrada e descansos conscientes', () => {
    const analysis = runClinicalHeuristicAnalysis(fakeSubmission);
    const draft = draftWeeklyPrescriptionForTeacher('Ana Clara', analysis);

    expect(draft.assignedPlans.length).toBeGreaterThan(0);
    expect(draft.weeklyPrescriptions.length).toBe(7);

    // Deve conter dias de treino
    const workouts = draft.weeklyPrescriptions.filter((p) => p.regime === 'workout');
    expect(workouts.length).toBe(3);

    // Deve conter descanso total e descanso ativo
    const restTotal = draft.weeklyPrescriptions.filter((p) => p.regime === 'rest_total');
    expect(restTotal.length).toBeGreaterThanOrEqual(2);

    const restActive = draft.weeklyPrescriptions.filter((p) => p.regime === 'rest_active');
    expect(restActive.length).toBeGreaterThanOrEqual(1);
    expect(restActive[0].activeRestActivity).toBe('caminhada_leve');
  });

  it('3. Radar de alertas da carteira identifica anamneses pendentes e alunos em ciclo longo', () => {
    const links: TeacherStudentLink[] = [
      {
        id: 'link_1',
        teacherUid: 'teacher_999',
        teacherName: 'Prof. Treinador',
        studentUid: 'student_123',
        studentName: 'Ana Clara',
        status: 'pending',
        lastSubmissionId: 'sub_test_1',
        weeklyPrescriptions: [],
        assignedPlans: [],
        updatedAt: Date.now(),
      },
      {
        id: 'link_2',
        teacherUid: 'teacher_999',
        teacherName: 'Prof. Treinador',
        studentUid: 'student_456',
        studentName: 'Marcos Vinicius',
        status: 'active',
        lastPrescribedAt: Date.now() - 35 * 24 * 60 * 60 * 1000, // 5 semanas atrás
        weeklyPrescriptions: [],
        assignedPlans: [],
        updatedAt: Date.now(),
      },
    ];

    const alerts = evaluateTeacherRosterRadar(links, [fakeSubmission]);
    expect(alerts.length).toBe(2);

    const pendingAlert = alerts.find((a) => a.studentUid === 'student_123');
    expect(pendingAlert?.type).toBe('pending_anamnesis_review');
    expect(pendingAlert?.priority).toBe('high');

    const cycleAlert = alerts.find((a) => a.studentUid === 'student_456');
    expect(cycleAlert?.type).toBe('high_consistency_ready_for_upgrade');
    expect(cycleAlert?.priority).toBe('medium');
  });

  it('4. Assistente IA do Aluno fornece dicas protetoras focadas no corpo e articulações', () => {
    // Caso 1: Aluno com cuidado na lombar executando prancha
    const cueLumbar = getPersonalizedExerciseCue('Prancha Isométrica', ['dor_lombar']);
    expect(cueLumbar).toContain('lombar');
    expect(cueLumbar).toContain('abdômen');

    // Caso 2: Aluno com cuidado no joelho executando agachamento
    const cueKnee = getPersonalizedExerciseCue('Agachamento com Peso Corporal', ['dor_joelho']);
    expect(cueKnee).toContain('joelho');
    expect(cueKnee).toContain('patela');

    // Caso 3: Aluno sem restrições
    const cueGeneral = getPersonalizedExerciseCue('Alongamento Lateral', []);
    expect(cueGeneral.length).toBeGreaterThan(15);
  });

  it('5. Tradutor de queixas em linguagem natural extrai restrições biomecânicas corretas', () => {
    const input = 'Hoje estou com o joelho estalando e não quero deitar no chão';
    const translated = translateNaturalLanguageToFilters(input);

    expect(translated.limitations).toContain('dor_joelho');
    expect(translated.avoidedMovements).toContain('agachamento_profundo');
    expect(translated.avoidedMovements).toContain('exercicios_chao');
    expect(translated.explanation).toContain('joelho');
  });
});
