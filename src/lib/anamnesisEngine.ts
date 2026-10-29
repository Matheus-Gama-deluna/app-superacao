import {
  CustomAnamnesisTemplate,
  AnamnesisQuestion,
  AnamnesisSubmission,
  AnamnesisPhotoAttachment,
} from '../types';
import { getLocal, setLocal } from './storage';

export const ANAMNESIS_STORAGE_KEYS = {
  TEMPLATES: 'superacao_anamnesis_templates',
  SUBMISSIONS: 'superacao_anamnesis_submissions',
  LINKS: 'superacao_teacher_student_links',
  ACTIVE_TEACHER_LINK: 'superacao_active_teacher_link',
};

/**
 * Cria um modelo de anamnese padrão bem estruturado para o professor,
 * cobrindo objetivos, limitações, rotina e slots fotográficos posturais e de equipamentos.
 */
export function createDefaultTeacherTemplate(
  teacherUid: string,
  teacherName?: string
): CustomAnamnesisTemplate {
  const questions: AnamnesisQuestion[] = [
    {
      id: 'q_primary_goal',
      title: 'Qual é o seu objetivo principal de treino?',
      subtitle: 'Isso ajudará seu professor a definir a carga e prioridades das semanas.',
      type: 'single_choice',
      required: true,
      options: [
        { label: 'Construir o hábito e me movimentar com saúde', value: 'habito' },
        { label: 'Ganho de força e tônus muscular', value: 'forca' },
        { label: 'Alívio de dores posturais e mobilidade', value: 'alivio_dores' },
        { label: 'Condicionamento físico e disposição diária', value: 'vitalidade' },
        { label: 'Emagrecimento com preservação muscular', value: 'emagrecimento' },
      ],
    },
    {
      id: 'q_weekly_frequency',
      title: 'Quantos dias por semana você consegue se dedicar?',
      subtitle: 'Sem exageros: escolha o que cabe com consistência na sua vida.',
      type: 'single_choice',
      required: true,
      options: [
        { label: '2 dias na semana (Ritmo essencial)', value: '2' },
        { label: '3 dias na semana (Ritmo equilibrado recomendado)', value: '3' },
        { label: '4 dias na semana (Ritmo consistente)', value: '4' },
        { label: '5 dias ou mais na semana (Ritmo avançado)', value: '5' },
      ],
    },
    {
      id: 'q_joint_limitations',
      title: 'Você tem alguma limitação, desconforto articular ou dor?',
      subtitle: 'Marque todas as que se aplicam. Seu professor adaptará os exercícios.',
      type: 'multiple_choice',
      required: false,
      options: [
        { label: 'Nenhum desconforto relevante', value: 'nenhuma' },
        { label: 'Sensibilidade ou dor no joelho', value: 'dor_joelho', flagsArticular: ['agachamento_profundo', 'impacto_saltos'] },
        { label: 'Desconforto ou dor na lombar / coluna', value: 'dor_lombar', flagsArticular: ['sobrecarga_lombar'] },
        { label: 'Dor no ombro ao erguer braços', value: 'dor_ombro', flagsArticular: ['push_vertical'] },
        { label: 'Dificuldade ou dor nos punhos em apoio', value: 'dor_punho', flagsArticular: ['flexao_chao'] },
        { label: 'Evito movimentos deitados no chão', value: 'evitar_chao', flagsArticular: ['exercicios_chao'] },
      ],
    },
    {
      id: 'q_equipments_available',
      title: 'Onde você vai treinar e quais equipamentos você tem por perto?',
      subtitle: 'Podemos montar treinos incríveis só com o peso do corpo ou com seus materiais.',
      type: 'multiple_choice',
      required: true,
      options: [
        { label: 'Apenas peso corporal (sem equipamentos)', value: 'peso_corporal' },
        { label: 'Cadeira firme ou parede livre para apoio', value: 'cadeira_parede' },
        { label: 'Faixas elásticas (mini band ou elástico longo)', value: 'elasticos' },
        { label: 'Halteres ou kettlebell', value: 'halteres' },
        { label: 'Colchonete / tapete confortável', value: 'colchonete' },
        { label: 'Academia completa ou condomínio', value: 'academia' },
      ],
    },
    {
      id: 'q_daily_routine_and_health',
      title: 'Histórico de saúde, cirurgias ou rotina diária:',
      subtitle: 'Conte se trabalha sentado, toma medicamentos relevantes ou passou por cirurgias.',
      type: 'text_long',
      required: false,
    },
    {
      id: 'q_stress_energy_level',
      title: 'Em uma escala de 1 a 10, como você avalia seu nível médio de energia e sono?',
      subtitle: '1 = Muito fadigado/sono irregular; 10 = Sono excelente e muita energia.',
      type: 'scale_1_10',
      required: false,
      minScale: 1,
      maxScale: 10,
      scaleLabels: { min: '1 - Muito fadigado', max: '10 - Energia alta' },
    },
    {
      id: 'photo_posture_front',
      title: 'Foto Postural Frontal (Opcional, mas muito recomendada)',
      subtitle: 'Fique em pé, braços soltos ao lado do corpo, com roupa confortável de treino.',
      type: 'photo_upload',
      photoCategory: 'posture_front',
      required: false,
    },
    {
      id: 'photo_posture_side',
      title: 'Foto Postural de Perfil / Lateral (Opcional)',
      subtitle: 'Fique de lado para a câmera para avaliarmos sua curvatura e alinhamento de coluna.',
      type: 'photo_upload',
      photoCategory: 'posture_side',
      required: false,
    },
    {
      id: 'photo_equipments',
      title: 'Foto do seu Espaço ou Equipamentos (Opcional)',
      subtitle: 'Tire uma foto rápida do cantinho onde vai treinar ou dos seus elásticos/pesos.',
      type: 'photo_upload',
      photoCategory: 'equipments',
      required: false,
    },
  ];

  return {
    id: `template_${teacherUid}`,
    teacherUid,
    teacherName: teacherName || 'Professor Parceiro',
    title: 'Anamnese e Avaliação Inicial do Aluno',
    description: 'Questionário personalizado para mapeamento corporal, limitações e objetivos.',
    questions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Gera um código de convite amigável de 6 a 8 caracteres no formato PROF-XXXX
 */
export function generateTeacherInviteCode(teacherUid: string): string {
  if (!teacherUid) return 'PROF-DEMO';
  const clean = teacherUid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = clean.length >= 4 ? clean.slice(-4) : clean.padEnd(4, 'X');
  return `PROF-${suffix}`;
}

/**
 * Validação rigorosa e segura do preenchimento da anamnese
 */
export function validateAnamnesisAnswers(
  template: CustomAnamnesisTemplate,
  answers: Record<string, any>,
  photos: AnamnesisPhotoAttachment[] = []
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const q of template.questions) {
    if (q.type === 'photo_upload') {
      if (q.required) {
        const hasPhoto = photos.some((p) => p.questionId === q.id && p.dataUrl);
        if (!hasPhoto) {
          errors.push(`A foto "${q.title}" é obrigatória.`);
        }
      }
      continue;
    }

    if (q.required) {
      const val = answers[q.id];
      if (val === undefined || val === null || val === '') {
        errors.push(`A pergunta "${q.title}" precisa ser respondida.`);
      } else if (Array.isArray(val) && val.length === 0) {
        errors.push(`Selecione ao menos uma opção em "${q.title}".`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Mapeia as respostas da anamnese para as restrições biomecânicas do sistema
 */
export function mapAnamnesisToUserProfileLimitations(
  template: CustomAnamnesisTemplate,
  answers: Record<string, any>
): {
  reportedLimitations: string[];
  avoidedMovements: string[];
  equipments: string[];
  primaryGoal: string;
  daysPerWeek: number;
} {
  const reportedLimitations: string[] = [];
  const avoidedMovements: string[] = [];
  const equipments: string[] = ['peso_corporal'];
  let primaryGoal = 'Construir o hábito e me movimentar com saúde';
  let daysPerWeek = 3;

  for (const q of template.questions) {
    const val = answers[q.id];
    if (!val) continue;

    if (q.id === 'q_primary_goal' && typeof val === 'string') {
      const opt = q.options?.find((o) => o.value === val);
      if (opt) primaryGoal = opt.label;
    }

    if (q.id === 'q_weekly_frequency') {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 0) daysPerWeek = num;
    }

    if (q.id === 'q_joint_limitations' && Array.isArray(val)) {
      for (const item of val) {
        if (item === 'nenhuma') continue;
        reportedLimitations.push(item);
        const opt = q.options?.find((o) => o.value === item);
        if (opt?.flagsArticular) {
          avoidedMovements.push(...opt.flagsArticular);
        }
      }
    }

    if (q.id === 'q_equipments_available' && Array.isArray(val)) {
      for (const eq of val) {
        if (eq === 'elasticos') {
          equipments.push('mini_band', 'faixa_longa');
        } else if (eq === 'halteres') {
          equipments.push('halteres');
        } else if (eq === 'cadeira_parede') {
          equipments.push('cadeira', 'parede');
        } else if (eq === 'colchonete') {
          equipments.push('colchonete');
        }
      }
    }
  }

  return {
    reportedLimitations: Array.from(new Set(reportedLimitations)),
    avoidedMovements: Array.from(new Set(avoidedMovements)),
    equipments: Array.from(new Set(equipments)),
    primaryGoal,
    daysPerWeek,
  };
}

/**
 * Helpers de storage local para professores e anamneses
 */
export function getSavedTeacherTemplate(teacherUid: string): CustomAnamnesisTemplate {
  const templates = getLocal<Record<string, CustomAnamnesisTemplate>>(
    ANAMNESIS_STORAGE_KEYS.TEMPLATES,
    {}
  );
  if (templates[teacherUid]) {
    return templates[teacherUid];
  }
  const defaultTemplate = createDefaultTeacherTemplate(teacherUid);
  templates[teacherUid] = defaultTemplate;
  setLocal(ANAMNESIS_STORAGE_KEYS.TEMPLATES, templates);
  return defaultTemplate;
}

export function saveTeacherTemplate(template: CustomAnamnesisTemplate): void {
  const templates = getLocal<Record<string, CustomAnamnesisTemplate>>(
    ANAMNESIS_STORAGE_KEYS.TEMPLATES,
    {}
  );
  templates[template.teacherUid] = {
    ...template,
    updatedAt: Date.now(),
  };
  setLocal(ANAMNESIS_STORAGE_KEYS.TEMPLATES, templates);
}

export function getSavedSubmissionsForTeacher(teacherUid: string): AnamnesisSubmission[] {
  const all = getLocal<AnamnesisSubmission[]>(ANAMNESIS_STORAGE_KEYS.SUBMISSIONS, []);
  return all.filter((s) => s.teacherUid === teacherUid);
}

export function saveAnamnesisSubmission(submission: AnamnesisSubmission): void {
  const all = getLocal<AnamnesisSubmission[]>(ANAMNESIS_STORAGE_KEYS.SUBMISSIONS, []);
  const idx = all.findIndex((s) => s.id === submission.id);
  if (idx >= 0) {
    all[idx] = submission;
  } else {
    all.push(submission);
  }
  setLocal(ANAMNESIS_STORAGE_KEYS.SUBMISSIONS, all);
}
