/**
 * Assistente de IA para Alunos e Praticantes.
 * Fornece dicas contextuais e protetoras durante os exercícios ("Para o meu corpo")
 * e traduz queixas em linguagem natural para ajustes imediatos na rotina.
 */

export function getPersonalizedExerciseCue(
  exerciseName: string,
  reportedLimitations: string[] = []
): string {
  const nameLower = (exerciseName || '').toLowerCase();
  const hasKneeLimitation = reportedLimitations.some(
    (l) => l.includes('joelho') || l.includes('patel')
  );
  const hasLumbarLimitation = reportedLimitations.some(
    (l) => l.includes('lombar') || l.includes('coluna')
  );
  const hasShoulderLimitation = reportedLimitations.some(
    (l) => l.includes('ombro')
  );
  const hasWristLimitation = reportedLimitations.some(
    (l) => l.includes('punho')
  );

  // Dicas específicas para joelho
  if (hasKneeLimitation && (nameLower.includes('agach') || nameLower.includes('afundo') || nameLower.includes('leg'))) {
    return 'Cuidado com o joelho: mantenha o alinhamento da patela com o segundo dedo do pé e desça apenas até a amplitude em que não sinta pontadas.';
  }

  // Dicas específicas para lombar
  if (hasLumbarLimitation && (nameLower.includes('prancha') || nameLower.includes('agach') || nameLower.includes('ponte') || nameLower.includes('remada'))) {
    return 'Proteja sua lombar: ative o abdômen como se fosse abotoar uma calça justa e preserve as curvaturas naturais da coluna.';
  }

  // Dicas específicas para ombro
  if (hasShoulderLimitation && (nameLower.includes('elev') || nameLower.includes('push') || nameLower.includes('remada') || nameLower.includes('flex'))) {
    return 'Conforto escapular: mantenha os ombros afastados das orelhas e realize o movimento sem forçar o topo da articulação.';
  }

  // Dicas específicas para punho
  if (hasWristLimitation && (nameLower.includes('chão') || nameLower.includes('flexão') || nameLower.includes('prancha'))) {
    return 'Alívio nos punhos: distribua o peso na ponta dos dedos ou use punhos cerrados / apoio elevado para não hiperestender.';
  }

  // Dicas gerais de maestria técnica e acolhimento
  if (nameLower.includes('respir') || nameLower.includes('along')) {
    return 'Solte o ar suavemente pela boca em cada expiração e permita que as tensões musculares se dissipem.';
  }

  return 'Mantenha o ritmo respiratório fluido e execute o movimento com calma e controle total.';
}

/**
 * Tradutor de queixas em linguagem natural para filtros biomecânicos
 */
export function translateNaturalLanguageToFilters(text: string): {
  limitations: string[];
  avoidedMovements: string[];
  explanation: string;
} {
  const lower = (text || '').toLowerCase();
  const limitations: string[] = [];
  const avoidedMovements: string[] = [];
  const details: string[] = [];

  if (lower.includes('joelho') || lower.includes('perna doendo') || lower.includes('estalando')) {
    limitations.push('dor_joelho');
    avoidedMovements.push('agachamento_profundo', 'impacto_saltos');
    details.push('joelho protegido de impactos e flexões profundas');
  }

  if (lower.includes('lombar') || lower.includes('costas') || lower.includes('coluna')) {
    limitations.push('dor_lombar');
    avoidedMovements.push('sobrecarga_lombar');
    details.push('coluna lombar protegida de cargas axiais');
  }

  if (lower.includes('ombro') || lower.includes('manguito') || lower.includes('pescoço')) {
    limitations.push('dor_ombro');
    avoidedMovements.push('push_vertical');
    details.push('ombros protegidos de elevações acima da cabeça');
  }

  if (lower.includes('punho') || lower.includes('pulso') || lower.includes('mão')) {
    limitations.push('dor_punho');
    avoidedMovements.push('flexao_chao');
    details.push('apoio em solo no punho substituído');
  }

  if (lower.includes('chão') || lower.includes('deitar') || lower.includes('solo')) {
    avoidedMovements.push('exercicios_chao');
    details.push('exercícios no chão desativados');
  }

  return {
    limitations,
    avoidedMovements,
    explanation: details.length > 0
      ? `Identificamos que você precisa de cuidado com: ${details.join(', ')}.`
      : 'Nenhuma restrição aguda identificada no seu relato.',
  };
}
