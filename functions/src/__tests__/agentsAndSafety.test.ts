import { describe, it, expect } from 'vitest';
import { checkMedicalRedFlags, auditWeeklyFractionalVolume, buildWorkoutProposalDiff } from '../tools/biomechanicsTools.js';
import { resolveSkillsForContext, ALL_SCIENTIFIC_SKILLS } from '../skills/skillRegistry.js';
import { DEFAULT_CORE_MEMORY } from '../memory/agentMemoryEngine.js';
import { callDeepInfraWithFixedFallback } from '../config/agentModels.js';

describe('Suite de Testes Unitários de Segurança e Biomecânica dos Agentes (v9.0)', () => {
  it('deve detectar Red Flags médicas críticas e bloquear treino', () => {
    const textComRedFlag = 'Senti uma dor no peito forte que irradia pro braço esquerdo';
    const result = checkMedicalRedFlags(textComRedFlag);

    expect(result.hasRedFlags).toBe(true);
    expect(result.severity).toBe('critical_medical_referral');
    expect(result.detectedFlags).toContain('dor_toracica');
    expect(result.userAdvicePt).toContain('avaliação médica presencial');
  });

  it('não deve disparar Red Flag para dor muscular normal de treino', () => {
    const textNormal = 'Estou com a perna cansada do treino de ontem e dormi pouco';
    const result = checkMedicalRedFlags(textNormal);

    expect(result.hasRedFlags).toBe(false);
    expect(result.severity).toBe('none');
  });

  it('deve calcular volume fracionado ACSM 2026 e razão empurrar:puxar corretamente', () => {
    const exercises = [
      { functionalPattern: 'push_horizontal', targetSets: 3, targetReps: 10 },
      { functionalPattern: 'pull_horizontal', targetSets: 3, targetReps: 10 },
      { functionalPattern: 'squat_lunge', targetSets: 3, targetReps: 12 },
      { functionalPattern: 'hinge_glute', targetSets: 3, targetReps: 12 },
    ];

    const audit = auditWeeklyFractionalVolume(exercises, 3);

    expect(audit.totalDirectSets).toBe(12);
    expect(audit.isPushPullBalanced).toBe(true);
    expect(audit.pushPullRatio).toBe(1.0);
    expect(audit.fractionalVolumeByPattern.empurrar).toBe(3);
    expect(audit.fractionalVolumeByPattern.puxar).toBe(3);
    expect(audit.acsmDoseStatus).toBe('volume_otimo_hipertrofia');
  });

  it('deve bloquear alteração permanente de rotina se o plano for gerenciado por Professor', () => {
    const result = buildWorkoutProposalDiff({
      actionType: 'update_routine',
      titlePt: 'Nova Ficha Gerada',
      descriptionPt: 'Troca de exercícios',
      isTeacherManaged: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.blockedReason).toContain('Professor Parceiro');
  });

  it('deve permitir alteração de rotina se o plano for do próprio aluno autônomo', () => {
    const result = buildWorkoutProposalDiff({
      actionType: 'update_routine',
      titlePt: 'Nova Ficha Gerada',
      descriptionPt: 'Troca de exercícios',
      isTeacherManaged: false,
    });

    expect(result.allowed).toBe(true);
    expect(result.proposalDiff).toBeDefined();
    expect(result.proposalDiff.actionType).toBe('update_routine');
  });

  it('deve carregar Skills corretas baseadas nos gatilhos automáticos do aluno', () => {
    const skills = resolveSkillsForContext({
      limitationTags: ['dor_joelho'],
      userText: 'Gostaria de treinar em casa com elásticos',
      frequencyOrGoal: ['hipertrofia'],
    });

    const ids = skills.map((s) => s.id);
    expect(ids).toContain('06_lower_limb_knee_hip_tendon');
    expect(ids).toContain('04_home_biomechanics_resistance_curves');
    expect(ids).toContain('02_acsm2026_volume_hypertrophy_strength');
  });

  it('deve executar fallback simulado seguro sem quebrar nem gastar tokens quando sem API Key', async () => {
    const res = await callDeepInfraWithFixedFallback('master_personal', [
      { role: 'user', content: 'Hoje estou no hotel sem halteres' },
    ], { forceMock: true });

    expect(res.text).toBeDefined();
    const parsed = JSON.parse(res.text);
    expect(parsed.replyPt).toBeDefined();
    expect(parsed.requiresConfirmation).toBe(true);
    expect(res.tokensUsed).toBeDefined();
  });
});
