import { Exercise, FunctionalMovementPattern, JointStressRating } from '../../types';
import { EXERCISE_METADATA_OVERRIDES } from '../../data/exerciseOverrides';

/**
 * Enriquece um exercício com metadados estruturados (override curado ou heurística robusta).
 */
export function enrichExercise(ex: Exercise): Exercise {
  const override = EXERCISE_METADATA_OVERRIDES[ex.id];
  if (override) {
    return {
      ...ex,
      functionalPattern: override.functionalPattern,
      jointStress: override.jointStress,
      floorTransition: override.floorTransition,
      movementComplexity: override.movementComplexity,
      ladder: override.ladder,
    };
  }

  // Heurística baseada em target_muscle, modality e equipment
  const text = `${ex.name_pt || ''} ${ex.name_en || ''} ${ex.instructions_pt || ''}`.toLowerCase();
  const muscle = (ex.target_muscle || '').toLowerCase();

  const isHighImpactJump =
    text.includes('salto') ||
    text.includes('jump') ||
    text.includes('plyo') ||
    text.includes('burpee') ||
    text.includes('polichinelo') ||
    text.includes('skipping');

  let functionalPattern: FunctionalMovementPattern = 'core_anti_extension';

  if (isHighImpactJump) {
    functionalPattern = 'cardio_high_impact';
  } else if (ex.modality === 'mobilidade' || ex.modality === 'alongamento' || muscle.includes('pescoço') || text.includes('neck')) {
    functionalPattern = muscle.includes('quadril') ? 'mobility_hip' : 'mobility_spine';
  } else if (text.includes('agachamento') || text.includes('squat') || text.includes('sentar e levantar')) {
    functionalPattern = 'squat';
  } else if (text.includes('afundo') || text.includes('lunge') || text.includes('passada')) {
    functionalPattern = 'lunge';
  } else if (text.includes('flexão') || text.includes('push-up') || text.includes('supino') || muscle.includes('peitoral') || muscle.includes('tríceps')) {
    functionalPattern = 'push_horizontal';
  } else if (text.includes('desenvolvimento') || text.includes('overhead') || muscle.includes('ombro') || muscle.includes('deltoide')) {
    functionalPattern = 'push_vertical';
  } else if (text.includes('remada') || text.includes('row') || text.includes('escapular') || muscle.includes('costas') || muscle.includes('dorsais') || muscle.includes('latíssimo') || muscle.includes('bíceps')) {
    functionalPattern = 'pull_horizontal';
  } else if (text.includes('puxada') || text.includes('pulldown') || text.includes('barra fixa')) {
    functionalPattern = 'pull_vertical';
  } else if (text.includes('ponte') || text.includes('bridge') || text.includes('stiff') || text.includes('super-homem') || text.includes('superman') || muscle.includes('glúteo') || muscle.includes('posterior')) {
    functionalPattern = 'hinge';
  } else if (text.includes('prancha') || text.includes('plank') || text.includes('dead bug') || muscle.includes('abdômen') || muscle.includes('core')) {
    functionalPattern = 'core_anti_extension';
  } else if (muscle.includes('quadríceps') || muscle.includes('pernas')) {
    functionalPattern = 'squat';
  }

  // Estresse articular padrão
  const jointStress: JointStressRating = {
    knee: functionalPattern === 'squat' || functionalPattern === 'lunge' ? 1 : 0,
    lumbar: functionalPattern === 'hinge' ? 1 : 0,
    shoulder: functionalPattern === 'push_horizontal' || functionalPattern === 'push_vertical' ? 1 : 0,
    wrist: text.includes('solo') || text.includes('chão') || text.includes('flexão') ? 1 : 0,
  };

  // Se tem saltos no texto ou cardio de impacto, eleva estresse de joelho para 2 (incompatível com dor de joelho)
  if (isHighImpactJump) {
    jointStress.knee = 2;
    jointStress.lumbar = Math.max(jointStress.lumbar || 0, 1) as 0 | 1 | 2;
  }

  const floorTransition = text.includes('deite') || text.includes('chão') || text.includes('solo') || text.includes('bruços') || text.includes('costas no chão');
  const movementComplexity: 1 | 2 | 3 = ex.difficulty_candidate === 'avancado' ? 3 : ex.difficulty_candidate === 'intermediario' ? 2 : 1;

  return {
    ...ex,
    functionalPattern: ex.functionalPattern || functionalPattern,
    jointStress: ex.jointStress || jointStress,
    floorTransition: ex.floorTransition !== undefined ? ex.floorTransition : floorTransition,
    movementComplexity: ex.movementComplexity || movementComplexity,
  };
}

/**
 * Validação estrita de compatibilidade física, equipamentos e limitações declaradas.
 */
export function isExerciseSafeForUser(
  exRaw: Exercise,
  userEquipments: string[],
  avoidedMovements: string[] = [],
  reportedLimitations: string[] = []
): { safe: boolean; reason?: string } {
  const ex = enrichExercise(exRaw);

  // 1. Apoios estruturais obrigatórios (cadeira, parede, barra_fixa, banco, paralelas)
  if (ex.requires_supports && Array.isArray(ex.requires_supports)) {
    for (const sup of ex.requires_supports) {
      if (!userEquipments.includes(sup)) {
        return { safe: false, reason: `Requer o apoio obrigatório '${sup}' que não está disponível.` };
      }
    }
  }

  // 2. Equipamentos estritamente obrigatórios
  const requiresOtherEquip = ex.equipment.some(
    (eq: string) => eq !== 'nenhum' && eq !== 'colchonete' && !userEquipments.includes(eq)
  );
  if (requiresOtherEquip) {
    return { safe: false, reason: 'Requer equipamento que não está no seu inventário.' };
  }

  // 3. Limitações articulares relatadas no onboarding (reportedLimitations)
  if (reportedLimitations.includes('joelhos')) {
    if (ex.jointStress && ex.jointStress.knee >= 2) {
      return { safe: false, reason: 'Alto estresse ou impacto patelar incompatível com dores no joelho.' };
    }
  }

  if (reportedLimitations.includes('lombar')) {
    if (ex.jointStress && ex.jointStress.lumbar >= 2) {
      return { safe: false, reason: 'Sobrecarga axial ou flexão lombar incompatível com sensibilidade lombar.' };
    }
  }

  if (reportedLimitations.includes('ombros')) {
    if (ex.jointStress && ex.jointStress.shoulder >= 2) {
      return { safe: false, reason: 'Movimento com sobrecarga subacromial nos ombros.' };
    }
  }

  if (reportedLimitations.includes('punhos')) {
    if (ex.jointStress && ex.jointStress.wrist >= 2) {
      return { safe: false, reason: 'Exige suporte do peso do corpo sobre os punhos no solo.' };
    }
  }

  // 4. Movimentos expressamente evitados (avoidedMovements)
  if (avoidedMovements.includes('impacto_saltos')) {
    const textCorpus = `${ex.name_pt || ''} ${ex.instructions_pt || ''}`.toLowerCase();
    if (
      ex.functionalPattern === 'cardio_high_impact' ||
      (ex.jointStress && ex.jointStress.knee >= 2) ||
      textCorpus.includes('salto') ||
      textCorpus.includes('jump') ||
      textCorpus.includes('polichinelo') ||
      textCorpus.includes('burpee')
    ) {
      return { safe: false, reason: 'Movimento com impacto ou saltos.' };
    }
  }

  if (avoidedMovements.includes('flexao_chao')) {
    const textName = (ex.name_pt || '').toLowerCase();
    if (textName.includes('flexão de braço') && !textName.includes('parede') && !textName.includes('inclinada')) {
      return { safe: false, reason: 'Flexão tradicional no chão evitada por preferência.' };
    }
  }

  if (avoidedMovements.includes('agachamento_profundo')) {
    const textCorpus = `${ex.name_pt || ''} ${ex.instructions_pt || ''}`.toLowerCase();
    if (textCorpus.includes('agachamento profundo') || textCorpus.includes('pistol squat') || textCorpus.includes('búlgaro')) {
      return { safe: false, reason: 'Agachamento em amplitude profunda evitado.' };
    }
  }

  if (avoidedMovements.includes('sobrecarga_lombar')) {
    if (ex.jointStress && ex.jointStress.lumbar >= 1 && ex.functionalPattern === 'hinge' && !ex.equipment.includes('peso_corporal')) {
      return { safe: false, reason: 'Sobrecarga lombar evitada.' };
    }
  }

  if (avoidedMovements.includes('exercicios_chao')) {
    if (ex.floorTransition) {
      return { safe: false, reason: 'Exercício no solo evitado por preferência.' };
    }
  }

  return { safe: true };
}
