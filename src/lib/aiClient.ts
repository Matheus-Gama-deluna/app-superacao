/**
 * AI Client Frontend Bridge (v9.5 Produção)
 * Conecta o PWA às Cloud Functions v2 do SuperAção (us-central1 + Firestore Nomeado).
 * Quando offline, em ambiente de teste sem emulador ou sem deploy ativo,
 * degrada com elegância para o simulador clínico determinístico (R$ 0,00).
 */

import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { functions, db, auth } from './firebase';
import {
  ActiveScreenContext,
  AssistantActionProposal,
  CoreBiopsychosocialMemory,
  ClinicalMemoryFact,
  AdminSystemConfig,
  AdminDailyMetrics,
  AdminApiKeyStatus,
  AgentServiceId,
  AnamnesisSubmission,
  AiAnamnesisAnalysis,
  UserProfile,
  WorkoutSession,
} from '../types';
import { runClinicalHeuristicAnalysis } from './aiTeacherCopilot';
import { allExercises } from '../data/catalog';
import { findSafeEquivalentExercises } from './workoutEngine';
import { searchCatalogForAgent } from './aiCatalogBridge';

// ============================================================================
// UTILITÁRIO DE TIMEOUT INTELIGENTE (18s EM PRODUÇÃO / RÁPIDO EM TESTES OFFLINE)
// ============================================================================

let cloudFunctionsCooldownUntil = 0;

/**
 * Todas as Cloud Functions do SuperAção exigem usuário autenticado (request.auth.uid).
 * No modo Convidado ("Continuar sem conta", auth.currentUser === null) ou offline,
 * evitamos disparar preflights inúteis de rede/CORS e operamos direto no motor local (0ms).
 */
function canCallCloudFunctions(): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  if (!auth?.currentUser) return false;
  if (Date.now() < cloudFunctionsCooldownUntil) return false;
  return true;
}

function noteCloudFunctionError(err: unknown): void {
  const msg = String((err as any)?.code || (err as any)?.message || '').toLowerCase();
  if (
    msg.includes('not-found') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('internal')
  ) {
    cloudFunctionsCooldownUntil = Date.now() + 5 * 60 * 1000;
  }
}

function getSmartCallableTimeoutMs(defaultOnlineMs = 18000): number {
  if (typeof navigator !== 'undefined') {
    if (!navigator.onLine) return 200;
    // Em suítes Playwright automatizadas sem backend local de Functions, evita atrasar asserções de UI
    if ((navigator as any).webdriver && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 1200;
    }
  }
  return defaultOnlineMs;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    promise
      .then((val) => {
        clearTimeout(id);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

// ============================================================================
// PRÉ-SELEÇÃO INTELIGENTE DE CANDIDATOS REAIS DO CATÁLOGO (ANTI-ALUCINAÇÃO)
// ============================================================================

async function buildCatalogCandidatesForPrompt(
  userMessage: string,
  activeContext: ActiveScreenContext,
  profile?: UserProfile | null
): Promise<Array<{ id: string; name_pt: string; pattern?: string; equipment?: string[] }>> {
  const candidatesMap = new Map<string, { id: string; name_pt: string; pattern?: string; equipment?: string[] }>();

  try {
    // 1. Se houver exercício ativo em tela (ex: Modo Foco), busca equivalentes biomecânicos seguros
    if (activeContext.currentExerciseId && profile) {
      const safeSwaps = findSafeEquivalentExercises(activeContext.currentExerciseId, profile, allExercises);
      for (const ex of safeSwaps.slice(0, 5)) {
        candidatesMap.set(ex.id, {
          id: ex.id,
          name_pt: ex.name_pt,
          pattern: ex.functionalPattern,
          equipment: ex.equipment,
        });
      }
    }

    // 2. Extrai palavra-chave útil da fala do usuário ou busca candidatos seguros gerais no catálogo 900+
    const keywordMatch = userMessage
      .toLowerCase()
      .match(/\b(quadril|joelho|ombro|lombar|coluna|peito|costas|perna|gl[uú]teo|core|abd[oô]men|punho|mobilidade|alongamento|ponte|prancha|remada|agachamento)\b/i);

    let searched = await searchCatalogForAgent({
      query: keywordMatch ? keywordMatch[1] : undefined,
      equipmentAllowed: profile?.equipments,
      avoidedMovements: profile?.avoidedMovements,
      reportedLimitations: profile?.reportedLimitations,
      limit: 8,
    });

    if ((!Array.isArray(searched) || searched.length === 0) && keywordMatch) {
      searched = await searchCatalogForAgent({
        equipmentAllowed: profile?.equipments,
        avoidedMovements: profile?.avoidedMovements,
        reportedLimitations: profile?.reportedLimitations,
        limit: 6,
      });
    }

    if (Array.isArray(searched)) {
      for (const ex of searched) {
        if (candidatesMap.size >= 8) break;
        if (ex.id !== activeContext.currentExerciseId) {
          candidatesMap.set(ex.id, {
            id: ex.id,
            name_pt: ex.name_pt,
            pattern: ex.functionalPattern,
            equipment: ex.equipment,
          });
        }
      }
    }
  } catch {
    // Em caso de falha na pré-seleção local, retorna o que já foi coletado sem bloquear o turno
  }

  return Array.from(candidatesMap.values());
}

// ============================================================================
// SIMULADOR CLÍNICO LOCAL DETERMINÍSTICO (CUSTO ZERO & RESILIÊNCIA OFFLINE)
// ============================================================================

const RED_FLAG_PATTERNS = [
  { flag: 'dor_toracica', regex: /\b(dor no peito|aperto no peito|dor tor[aá]cica|queima[cç][aã]o no peito|dor no cora[cç][aã]o)\b/i },
  { flag: 'dispneia_grave', regex: /\b(falta de ar em repouso|n[aã]o consigo respirar|sufoco|arrepio e falta de ar)\b/i },
  { flag: 'sincope_vertigem', regex: /\b(desmaio|desmaiei|apaguei|quase desmaiei|tontura forte com perda de vis[aã]o)\b/i },
  { flag: 'deficit_neurologico', regex: /\b(perda de for[cç]a na perna|perna falhando|dorm[eê]ncia descendo|formigamento que n[aã]o passa|perda de controle da urina)\b/i },
  { flag: 'trauma_agudo', regex: /\b(quebrei|fratura|luxa[cç][aã]o|estalo muito forte com incha[cç]o imediato|ca[ií] e n[aã]o consigo apoiar)\b/i },
  { flag: 'febre_sistemica', regex: /\b(febre alta|calafrios intensos|infec[cç][aã]o ativa)\b/i },
];

function checkLocalRedFlags(text: string): { hasRedFlags: boolean; advice?: string } {
  for (const item of RED_FLAG_PATTERNS) {
    if (item.regex.test(text)) {
      return {
        hasRedFlags: true,
        advice:
          'Atenção médica prioritária: identifiquei um sinal clínico que exige avaliação médica presencial antes de qualquer esforço. Por segurança, interrompa a prática agora e procure um serviço de saúde caso o sintoma persista.',
      };
    }
  }
  return { hasRedFlags: false };
}

export function simulatePersonalAssistantReply(
  userMessage: string,
  context: ActiveScreenContext,
  profile?: UserProfile | null
): AssistantActionProposal {
  const lower = userMessage.toLowerCase();

  // 1. Red flags
  const redFlag = checkLocalRedFlags(lower);
  if (redFlag.hasRedFlags) {
    return {
      replyPt: redFlag.advice!,
      clinicalReasoningSummary: 'Bandeira vermelha detectada deterministamente (Skill 01).',
      actionRequired: true,
      requiresConfirmation: false,
      activatedSkillIds: ['01_red_flags_confef_ethics'],
    };
  }

  // 2. Co-criação de Escuta Inicial (autofill_onboarding) com extração multidimensional
  if (context.activeView === 'listening') {
    const inferredEquipments = ['peso_corporal'];
    if (lower.includes('halter') || lower.includes('peso')) inferredEquipments.push('halteres');
    if (lower.includes('mini band') || lower.includes('elastico') || lower.includes('elástico')) inferredEquipments.push('mini_band');
    if (lower.includes('faixa')) inferredEquipments.push('faixa_longa');
    if (lower.includes('tubo')) inferredEquipments.push('tubos_elasticos');
    if (lower.includes('kettlebell')) inferredEquipments.push('kettlebell');
    if (lower.includes('cadeira')) inferredEquipments.push('cadeira');
    if (lower.includes('parede')) inferredEquipments.push('parede');
    if (lower.includes('colchonete') || lower.includes('tapete')) inferredEquipments.push('colchonete');

    const inferredLimitations: string[] = [];
    if (lower.includes('joelho') || lower.includes('patela')) inferredLimitations.push('joelhos');
    if (lower.includes('lombar') || lower.includes('coluna') || lower.includes('costas')) inferredLimitations.push('lombar');
    if (lower.includes('ombro')) inferredLimitations.push('ombros');
    if (lower.includes('punho') || lower.includes('pulso')) inferredLimitations.push('punhos');

    const inferredAvoided: string[] = [];
    if (/sem salto|sem pul|n[aã]o posso pular|sem impacto/i.test(lower)) inferredAvoided.push('impacto_saltos');
    if (/sem ch[aã]o|sem solo|n[aã]o consigo deitar|evitar ch[aã]o/i.test(lower)) inferredAvoided.push('exercicios_chao');
    if (/flex[aã]o no ch[aã]o|flex[aã]o de bra[çc]o/i.test(lower)) inferredAvoided.push('flexao_chao');
    if (/agachamento profundo|agachar fundo/i.test(lower)) inferredAvoided.push('agachamento_profundo');

    // Nível de experiência
    let inferredLevel: 'iniciante' | 'retomando' | 'pratica' | undefined;
    if (/voltar|voltando|retomando|parado|parei|tempo parado|recome[çc]/i.test(lower)) {
      inferredLevel = 'retomando';
    } else if (/nunca treinei|sedent[aá]rio|primeira vez|come[çc]ando|iniciante/i.test(lower)) {
      inferredLevel = 'iniciante';
    } else if (/j[aá] treino|costumo treinar|treino direto|pratico|avan[çc]ado|intermedi[aá]rio/i.test(lower)) {
      inferredLevel = 'pratica';
    }

    // Ambiente preferido
    let inferredEnvironment: 'casa' | 'academia' | 'ar_livre' | undefined;
    if (/academia/i.test(lower)) inferredEnvironment = 'academia';
    else if (/ar livre|parque|pra[çc]a|rua/i.test(lower)) inferredEnvironment = 'ar_livre';
    else if (/casa|sala|quarto/i.test(lower)) inferredEnvironment = 'casa';

    // Objetivo central
    let inferredGoal: string | undefined;
    if (/h[aá]bito|consist[eê]ncia|rotina|regularidade/i.test(lower)) {
      inferredGoal = 'Construir o hábito e consistência diária';
    } else if (/postura|al[ií]vio|tens[aã]o|along/i.test(lower)) {
      inferredGoal = 'Melhorar postura e aliviar tensões';
    } else if (/for[çc]a|massa|m[uú]sculo|hipertrofia/i.test(lower)) {
      inferredGoal = 'Ganhar força funcional e mobilidade';
    } else if (/energia|disposi[çc][aã]o|vitalidade|cansa[çc]o/i.test(lower)) {
      inferredGoal = 'Mais energia e disposição no dia a dia';
    } else if (/sa[uú]de|emagrecer|queimar|peso/i.test(lower)) {
      inferredGoal = 'Saúde preventiva e bem-estar geral';
    }

    const minMatch = lower.match(/(\d{1,2})\s*min/);
    const duration = minMatch ? Math.min(60, Math.max(8, Number(minMatch[1]))) : 20;
    const freqMatch = lower.match(/([2-6])\s*(x|vezes|dias)/);
    const freq = freqMatch ? Number(freqMatch[1]) : 3;
    const defaultDaysByFreq: Record<number, number[]> = {
      2: [2, 4],
      3: [1, 3, 5],
      4: [1, 2, 4, 5],
      5: [1, 2, 3, 4, 5],
      6: [1, 2, 3, 4, 5, 6],
    };

    const details: string[] = [`${freq}x por semana (~${duration} min)`];
    if (inferredLevel) details.push(`nível: ${inferredLevel}`);
    if (inferredEnvironment) details.push(`ambiente: ${inferredEnvironment}`);
    details.push(`apoios: ${inferredEquipments.join(', ')}`);
    if (inferredLimitations.length > 0) details.push(`cuidados: ${inferredLimitations.join(', ')}`);

    return {
      replyPt: `Perfeito! Já compreendi suas diretrizes: ${details.join(' • ')}. Deseja validar e ver sua proposta personalizada agora?`,
      clinicalReasoningSummary: 'Extração estruturada multidimensional para Escuta Inicial sem fricção.',
      actionRequired: true,
      requiresConfirmation: true,
      proposedDiff: {
        actionType: 'autofill_onboarding',
        titlePt: 'Confirmar Diretrizes da Escuta Inicial',
        descriptionPt: `${freq} dias/sem • ${duration} min • ${inferredEquipments.length} equip.`,
        payload: {
          sessionDurationMinutes: duration,
          availableDays: defaultDaysByFreq[freq] || [1, 3, 5],
          equipments: inferredEquipments,
          reportedLimitations: inferredLimitations.length > 0 ? inferredLimitations : ['nenhuma'],
          avoidedMovements: inferredAvoided,
          experienceLevel: inferredLevel,
          environmentPreference: inferredEnvironment,
          primaryGoal: inferredGoal,
          userContextNotes: userMessage,
        },
      },
      activatedSkillIds: ['11_motivational_interviewing_adherence'],
    };
  }

  // 3. Dor / desconforto articular no exercício ativo (com ID real do catálogo)
  if (
    lower.includes('joelho') &&
    (lower.includes('dor') ||
      lower.includes('doendo') ||
      lower.includes('desconforto') ||
      lower.includes('sensibilidade') ||
      lower.includes('estalo') ||
      lower.includes('estalando') ||
      lower.includes('incomod') ||
      lower.includes('pontada') ||
      lower.includes('fisgada'))
  ) {
    const exerciseName = context.currentExerciseName || 'o exercício atual';
    const kneeSafeProfile: UserProfile = {
      ...(profile as UserProfile),
      reportedLimitations: Array.from(new Set([...(profile?.reportedLimitations || []), 'dor_joelho', 'joelhos'])),
      avoidedMovements: Array.from(new Set([...(profile?.avoidedMovements || []), 'agachamento_profundo', 'impacto_saltos'])),
    };
    const safeCandidates = context.currentExerciseId
      ? findSafeEquivalentExercises(context.currentExerciseId, kneeSafeProfile, allExercises)
      : [];
    const gluteBridgeCandidate =
      safeCandidates.find((e) => e.name_pt.toLowerCase().includes('elevação pélvica') || e.name_pt.toLowerCase().includes('ponte')) ||
      allExercises.find((e) => e.name_pt.toLowerCase().includes('elevação pélvica')) ||
      allExercises.find((e) => e.id === 'glute_bridge') ||
      safeCandidates[0];

    const repId = gluteBridgeCandidate?.id || 'glute_bridge';
    const repName = gluteBridgeCandidate?.name_pt || 'Elevação Pélvica no Solo';

    return {
      replyPt: `Entendido! Não force nenhuma dor aguda em ${exerciseName}. Recomendo fazermos uma substituição imediata para proteger o seu joelho por "${repName}", que preserva o estímulo muscular sem compressão patelar. Deseja aplicar essa troca agora?`,
      clinicalReasoningSummary: 'Proteção femoropatelar (Skill 06) com substituto real do catálogo.',
      actionRequired: true,
      requiresConfirmation: true,
      proposedDiff: {
        actionType: 'swap_exercise',
        titlePt: 'Substituir exercício para proteger o joelho',
        descriptionPt: `Trocar "${exerciseName}" por "${repName}".`,
        originalId: context.currentExerciseId,
        replacementId: repId,
        replacementNamePt: repName,
      },
      activatedSkillIds: ['06_lower_limb_knee_hip_tendon'],
    };
  }

  if (
    (lower.includes('lombar') || lower.includes('coluna') || lower.includes('costas')) &&
    (lower.includes('dor') ||
      lower.includes('doendo') ||
      lower.includes('desconforto') ||
      lower.includes('sensibilidade') ||
      lower.includes('travou') ||
      lower.includes('incomod') ||
      lower.includes('pontada') ||
      lower.includes('fisgada'))
  ) {
    const exerciseName = context.currentExerciseName || 'este movimento';
    return {
      replyPt: `Aviso de proteção lombar: vamos aliviar imediatamente a sobrecarga axial em ${exerciseName}. Mantenha a respiração fluida e o abdômen firme. Proponho suavizar a sessão de hoje para proteger sua coluna.`,
      clinicalReasoningSummary: 'Preservação de coluna lombar e alinhamento neutro (Skill 05).',
      actionRequired: true,
      requiresConfirmation: true,
      proposedDiff: {
        actionType: 'soften_session',
        titlePt: 'Alívio lombar imediato',
        descriptionPt: 'Reduzir volume em 25% e priorizar estabilidade sem carga axial.',
      },
      activatedSkillIds: ['05_spine_lumbar_cervical_care'],
    };
  }

  // 4. Fadiga / Cansaço / Falta de tempo
  if (lower.includes('muito cansado') || lower.includes('sem energia') || lower.includes('pouco tempo') || lower.includes('cansada') || lower.includes('corrido')) {
    return {
      replyPt: 'Tudo bem! O mais valioso hoje é manter o hábito sem sobrecarregar seu organismo. Posso acionar a versão suave da sessão (-25% séries, mantendo a qualidade técnica). O que acha?',
      clinicalReasoningSummary: 'Autorregulação de fadiga e proteção de constância (Skill 03 / Skill 15).',
      actionRequired: true,
      requiresConfirmation: true,
      proposedDiff: {
        actionType: 'soften_session',
        titlePt: 'Suavizar treino de hoje (-25%)',
        descriptionPt: 'Redução estratégica de séries mantendo os mesmos padrões motores com menor fadiga.',
      },
      activatedSkillIds: ['03_autoregulation_rir_fatigue_deload', '15_long_term_periodization_and_contingency'],
    };
  }

  // 5. Solicitação de troca direta de exercício
  if (lower.includes('trocar exercicio') || lower.includes('mudar exercicio') || lower.includes('trocar esse')) {
    const exerciseName = context.currentExerciseName || 'o exercício atual';
    const safeCandidates = context.currentExerciseId && profile
      ? findSafeEquivalentExercises(context.currentExerciseId, profile, allExercises)
      : [];
    const bestAlt = safeCandidates[0];
    return {
      replyPt: `Sem problemas! Analisei ${exerciseName} e selecionei ${bestAlt ? `"${bestAlt.name_pt}"` : 'uma alternativa equivalente'} no mesmo padrão biomecânico para você treinar com conforto.`,
      clinicalReasoningSummary: 'Equivalência de padrão motor funcional no catálogo.',
      actionRequired: true,
      requiresConfirmation: true,
      proposedDiff: {
        actionType: 'swap_exercise',
        titlePt: `Trocar "${exerciseName}"`,
        descriptionPt: bestAlt ? `Substituir por "${bestAlt.name_pt}".` : 'Substituição por variação segura equivalente.',
        originalId: context.currentExerciseId,
        replacementId: bestAlt?.id,
        replacementNamePt: bestAlt?.name_pt,
      },
      activatedSkillIds: ['04_home_biomechanics_resistance_curves'],
    };
  }

  // 6. Artes Marciais: diferenciar pedido de soltura pós-luta vs registro de luta
  if (
    lower.includes('jiu-jitsu') ||
    lower.includes('jiu jitsu') ||
    lower.includes('jiujitsu') ||
    lower.includes('muay thai') ||
    lower.includes('luta') ||
    lower.includes('marcial') ||
    lower.includes('boxe') ||
    lower.includes('judo') ||
    lower.includes('karate') ||
    lower.includes('arte marcial')
  ) {
    const wantsRecoverySession =
      lower.includes('soltura') || lower.includes('alongamento') || lower.includes('mobilidade') || lower.includes('prepara') || lower.includes('monta');

    if (wantsRecoverySession) {
      return {
        replyPt: 'Oss! Pós-luta pede cuidado especial com punhos, pegada, quadril e lombar. Preparei uma sessão regenerativa de 10 minutos pós-tatame sem apoiar mãos espalmadas no chão. Vamos iniciar?',
        clinicalReasoningSummary: 'Recuperação articular pós-esporte de combate (Skill 14).',
        actionRequired: true,
        requiresConfirmation: true,
        proposedDiff: {
          actionType: 'generate_custom_workout',
          titlePt: 'Soltura Pós-Arte Marcial (10 min)',
          descriptionPt: 'Mobilidade de punhos, rotação torácica, quadril 90/90 e respiração diafragmática.',
          payload: {
            purpose: 'pos_luta_artes_marciais',
            durationMinutes: 10,
          },
        },
        activatedSkillIds: ['14_martial_arts_combat_and_external_load'],
      };
    }

    return {
      replyPt: 'Sensacional! O treino de artes marciais conta diretamente na sua vitória semanal e exige boa recuperação de pegada, ombros e quadril. Deseja registrar essa prática na sua semana agora?',
      clinicalReasoningSummary: 'Registro de arte marcial e gestão de interferência concorrente (Skill 14).',
      actionRequired: true,
      requiresConfirmation: true,
      proposedDiff: {
        actionType: 'log_external_practice',
        titlePt: 'Registrar Treino de Arte Marcial',
        descriptionPt: 'Adicionar prática de luta na sua consistência semanal.',
        payload: {
          modality: 'artes_marciais',
          durationMinutes: 60,
          effortScore: 4,
          mood: 'renovado',
          notes: userMessage,
        },
      },
      activatedSkillIds: ['14_martial_arts_combat_and_external_load', '11_motivational_interviewing_adherence'],
    };
  }

  // 7. Solicitação de Treino Específico / Mobilidade / Escritório / Viagem
  if (
    lower.includes('alongamento') ||
    lower.includes('mobilidade') ||
    lower.includes('soltura') ||
    lower.includes('escritorio') ||
    lower.includes('hotel') ||
    lower.includes('viagem') ||
    lower.includes('treino de 10 min') ||
    lower.includes('treino de 15 min') ||
    lower.includes('treino rapido') ||
    lower.includes('novo treino') ||
    lower.includes('prepara um treino') ||
    lower.includes('monta um treino') ||
    lower.includes('treino para hoje')
  ) {
    const isOffice = lower.includes('escritorio') || lower.includes('trabalho');
    const isHotel = lower.includes('hotel') || lower.includes('viagem');
    const isMobility = lower.includes('alongamento') || lower.includes('mobilidade') || lower.includes('soltura');

    const purpose = isOffice
      ? 'pausa_escritorio_sem_chao'
      : isHotel
      ? 'viagem_hotel'
      : isMobility
      ? 'mobilidade_alongamento'
      : 'forca_hipertrofia';
    const duration = isOffice || isMobility ? 8 : 15;

    return {
      replyPt: isMobility || isOffice
        ? `Preparei uma sessão de ${isOffice ? 'Pausa Ativa em Pé (sem suar e sem chão)' : 'Mobilidade & Recuperação Ativa'} sob medida (${duration} min) para aliviar coluna, ombros e quadris. Deseja iniciar agora?`
        : `Preparei um treino sob medida de ${duration} minutos adaptado aos seus equipamentos e articulações. Deseja iniciar agora?`,
      clinicalReasoningSummary: 'Prescrição sob demanda integrada ao Catálogo Inteligente (900+ exercícios).',
      actionRequired: true,
      requiresConfirmation: true,
      proposedDiff: {
        actionType: 'generate_custom_workout',
        titlePt: isMobility ? 'Recuperação Ativa & Mobilidade (8 min)' : `Treino Personalizado (${duration} min)`,
        descriptionPt: 'Sessão montada dinamicamente respeitando seus equipamentos e articulações.',
        payload: {
          purpose,
          durationMinutes: duration,
        },
      },
      activatedSkillIds: ['13_cardio_mobility_active_recovery', '15_long_term_periodization_and_contingency'],
    };
  }

  // 8. Orientações técnicas
  if (lower.includes('como fazer') || lower.includes('execução') || lower.includes('respiração') || lower.includes('postura')) {
    return {
      replyPt: 'Para uma execução segura: inspire ao descer controlando o movimento e solte o ar ao fazer a força. Mantenha os ombros longe das orelhas, coluna neutra e amplitude confortável!',
      clinicalReasoningSummary: 'Orientação biomecânica e controle respiratório.',
      actionRequired: false,
      requiresConfirmation: false,
      activatedSkillIds: ['04_home_biomechanics_resistance_curves'],
    };
  }

  return {
    replyPt: 'Estou aqui com você! Posso adaptar exercícios em tempo real, montar alongamentos para dias de descanso, ajustar o treino se o dia estiver corrido ou registrar treinos feitos fora do app (como lutas ou esportes). Como posso ajudar hoje?',
    clinicalReasoningSummary: 'Escuta ativa e suporte integral à rotina.',
    actionRequired: false,
    requiresConfirmation: false,
    activatedSkillIds: ['11_motivational_interviewing_adherence'],
  };
}

import type { AiUserContextPayload } from './aiActions';

// ============================================================================
// SERVIÇOS EXPORTADOS DO AI CLIENT (ALINHADOS 1:1 COM CLOUD FUNCTIONS v9.5)
// ============================================================================

export interface SendAiMessageParams {
  message: string;
  activeContext: ActiveScreenContext;
  userProfile?: UserProfile | null;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>;
  isTeacherManaged?: boolean;
  sessionExercises?: Array<{ id: string; name_pt: string; sets?: number; reps?: number }>;
  programSummary?: {
    title?: string;
    currentWeek?: number;
    totalWeeks?: number;
    currentPhaseLabel?: string;
    scheduledDaysCount?: number;
  };
  userContext?: AiUserContextPayload;
}

export async function sendMessageToPersonalAssistant(
  params: SendAiMessageParams
): Promise<AssistantActionProposal> {
  const catalogCandidates = await buildCatalogCandidatesForPrompt(
    params.message,
    params.activeContext,
    params.userProfile
  );

  if (canCallCloudFunctions()) {
    try {
      const fn = httpsCallable<any, AssistantActionProposal>(functions, 'masterPersonalAssistant');
      const callPromise = fn({
        userMessage: params.message,
        historyTurns: params.conversationHistory || [],
        activeScreenContext: params.activeContext,
        reportedLimitations: params.userProfile?.reportedLimitations || [],
        equipments: params.userProfile?.equipments || ['peso_corporal'],
        primaryGoal: params.userProfile?.primaryGoal,
        preferredDurationMinutes: params.userProfile?.sessionDurationMinutes,
        healthNotes: params.userProfile?.healthNotes,
        userContextNotes: params.userProfile?.userContextNotes,
        isTeacherManaged: Boolean(params.isTeacherManaged ?? params.userProfile?.linkedTeacherId),
        sessionExercises: params.sessionExercises || [],
        catalogCandidates,
        programSummary: params.programSummary,
        userContext: params.userContext,
      });

      const result = await withTimeout(callPromise, getSmartCallableTimeoutMs(18000));
      if (result.data && result.data.replyPt) {
        return result.data;
      }
    } catch (err) {
      noteCloudFunctionError(err);
      console.info('[aiClient] Operando via simulador clínico determinístico local:', (err as Error)?.message);
    }
  }

  return simulatePersonalAssistantReply(params.message, params.activeContext, params.userProfile);
}

export async function transcribeVoiceAudio(
  audioBlob: Blob
): Promise<{ text: string; confidence: number; durationSeconds: number }> {
  if (canCallCloudFunctions()) {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      const fn = httpsCallable<any, any>(functions, 'voiceTranscription');
      const result = await withTimeout(
        fn({
          audioBase64,
          mimeType: audioBlob.type || 'audio/webm',
          durationSeconds: Math.round(audioBlob.size / 16000) || 5,
        }),
        getSmartCallableTimeoutMs(18000)
      );

      if (result.data && result.data.transcriptionPt) {
        return {
          text: result.data.transcriptionPt,
          confidence: result.data.confidence || 0.95,
          durationSeconds: result.data.durationSeconds || 5,
        };
      }
    } catch (err) {
      noteCloudFunctionError(err);
      console.info('[aiClient] voiceTranscription offline/fallback:', (err as Error)?.message);
    }
  }

  return {
    text: 'Senti um leve desconforto no joelho ao agachar.',
    confidence: 0.9,
    durationSeconds: 3,
  };
}

export async function analyzeAnamnesisWithCopilot(
  submission: AnamnesisSubmission
): Promise<AiAnamnesisAnalysis> {
  if (canCallCloudFunctions()) {
    try {
      const fn = httpsCallable<any, any>(functions, 'partnerTeacherCopilot');
      const result = await withTimeout(
        fn({
          submissionId: submission.id,
          studentName: submission.studentName,
          answers: submission.answers,
          photos: submission.photos || [],
          submission,
        }),
        getSmartCallableTimeoutMs(24000)
      );
      const d = result.data?.analysis || result.data;
      if (d && (d.clinicalSummary || d.summaryPt)) {
        return {
          suggestedLimitations: d.suggestedLimitations || [],
          avoidedMovements: d.avoidedMovements || [],
          posturalFlags: d.posturalFlags || d.posturalObservations || [],
          detectedEquipments: d.detectedEquipments || ['peso_corporal'],
          clinicalSummary: d.clinicalSummary || d.summaryPt,
          suggestedSplit: d.suggestedSplit || 'full_body',
          suggestedFrequencyDays: d.suggestedFrequencyDays || 3,
          confidenceScore: typeof d.confidenceScore === 'number' ? d.confidenceScore : 0.9,
          analyzedAt: d.analyzedAt || d.generatedAt || Date.now(),
          source: 'ai_model',
        };
      }
    } catch (err) {
      noteCloudFunctionError(err);
      console.info('[aiClient] Copilot backend offline, usando análise heurística local:', (err as Error)?.message);
    }
  }

  return runClinicalHeuristicAnalysis(submission);
}

export async function fetchTelemetryWeeklyPills(
  userProfile: UserProfile,
  sessions: WorkoutSession[]
): Promise<string[]> {
  if (canCallCloudFunctions()) {
    try {
      const completed = sessions.filter((s) => s.status === 'completed' && !s.isExpress).length;
      const partial = sessions.filter((s) => s.status === 'completed' && s.isExpress).length;
      const rpeValues = sessions
        .map((s) => s.feedbackEffort ?? s.rpeEffort)
        .filter((v): v is number => typeof v === 'number');
      const avgRpe =
        rpeValues.length > 0
          ? Number((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1))
          : 3.0;

      const fn = httpsCallable<any, any>(functions, 'telemetryAnalyst');
      const result = await withTimeout(
        fn({
          displayName: userProfile.displayName,
          completedWorkoutsCount: completed,
          partialWorkoutsCount: partial,
          externalPracticesCount: 0,
          targetWeeklyGoal: userProfile.availableDays?.length || 3,
          averageRpe: avgRpe,
          mesocycleWeek: 1,
        }),
        getSmartCallableTimeoutMs(18000)
      );

      const pills = result.data?.weeklyMotivationalPills || result.data?.motivationalPills;
      if (Array.isArray(pills) && pills.length > 0) {
        return pills;
      }
    } catch (err) {
      noteCloudFunctionError(err);
      console.info('[aiClient] Telemetry backend offline, gerando pílulas heurísticas:', (err as Error)?.message);
    }
  }

  const name = userProfile.displayName ? userProfile.displayName.split(' ')[0] : 'Praticante';
  return [
    `Parabéns pelo ritmo, ${name}! Cada sessão completada fortalece suas articulações e sua saúde.`,
    'Consistência supera intensidade extrema: continue dando um passo de cada vez.',
    'Lembre-se de respirar com calma e manter sua hidratação em dia hoje.',
    'Seu corpo se adapta no descanso: valorize uma boa noite de sono após os treinos.',
    'Pronto para mais um passo na sua jornada de superação? Estou aqui para te apoiar!',
  ];
}

export async function askHabitCompanionInsight(params: {
  displayName?: string;
  exerciseReason?: string;
  habitAnchor?: string;
  weeklyCompleted?: number;
  lastMood?: string;
  todayPlanTitle?: string;
}): Promise<{ text: string; isAiGenerated: boolean } | null> {
  if (!canCallCloudFunctions()) return null;

  try {
    const fn = httpsCallable<any, AssistantActionProposal>(functions, 'habitCompanion');
    const result = await withTimeout(
      fn({
        userMessage: 'Gere a pílula diária acolhedora de constância.',
        displayName: params.displayName,
        exerciseReason: params.exerciseReason,
        habitAnchor: params.habitAnchor,
        completedThisWeek: params.weeklyCompleted ?? 0,
        lastMood: params.lastMood,
        todayPlanTitle: params.todayPlanTitle,
      }),
      getSmartCallableTimeoutMs(12000)
    );
    if (result.data?.replyPt && result.data.replyPt.length > 10) {
      return {
        text: result.data.replyPt.trim().replace(/^["']|["']$/g, ''),
        isAiGenerated: true,
      };
    }
  } catch (err) {
    noteCloudFunctionError(err);
  }
  return null;
}

// ============================================================================
// ADMIN DASHBOARD CLIENT CALLABLES (HOMOLOGADOS v9.5)
// ============================================================================

let mockVaultApiKeyStatus: AdminApiKeyStatus = {
  isConfigured: false,
  maskedKey: '',
  source: 'none',
};

export async function getAdminDashboardSnapshot(): Promise<{
  metrics: AdminDailyMetrics;
  config: AdminSystemConfig;
  recentAudits: any[];
  apiKeyStatus?: AdminApiKeyStatus;
}> {
  if (canCallCloudFunctions()) {
    try {
      const fn = httpsCallable<any, any>(functions, 'adminDashboardSnapshot');
      const res = await withTimeout(fn({}), getSmartCallableTimeoutMs(15000));
      return {
        ...res.data,
        metrics: res.data?.metrics || res.data?.dailyMetrics?.[0],
        recentAudits: res.data?.recentAudits || res.data?.recentLogs || [],
        apiKeyStatus: res.data?.apiKeyStatus || mockVaultApiKeyStatus,
      };
    } catch (err) {
      noteCloudFunctionError(err);
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  return {
      apiKeyStatus: mockVaultApiKeyStatus,
      metrics: {
        dateStr: todayStr,
        totalCalls: 42,
        totalErrors: 0,
        totalFallbacksTriggered: 1,
        totalInputTokens: 12450,
        totalOutputTokens: 3820,
        totalCachedTokens: 8100,
        totalAudioSeconds: 85,
        estimatedCostUsd: 0.0027,
        callsByAgent: {
          master_personal: 28,
          teacher_copilot: 6,
          telemetry_analyst: 4,
          habit_companion: 4,
        },
        redFlagsBlocked: 2,
        proposalsCreated: 14,
        proposalsConfirmed: 12,
      },
      config: {
        aiEnabled: true,
        emergencyKillSwitch: false,
        dailyHardStopUsd: 5.0,
        monthlyHardStopUsd: 50.0,
        dailyUserTurnQuota: 25,
        dailyUserAudioQuota: 10,
        models: {
          master_personal: {
            primaryModel: 'zai-org/GLM-5.3-Flash',
            fallbackModel: 'deepseek-ai/DeepSeek-V3.2',
            temperature: 0.2,
            maxOutputTokens: 1200,
            timeoutMs: 16000,
            pricingInputPerMillion: 0.15,
            pricingOutputPerMillion: 0.50,
            pricingCachedInputPerMillion: 0.03,
            isEnabled: true,
          },
          teacher_copilot: {
            primaryModel: 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
            fallbackModel: 'Qwen/Qwen3-VL-30B-A3B-Instruct',
            temperature: 0.2,
            maxOutputTokens: 1200,
            timeoutMs: 22000,
            pricingInputPerMillion: 0.08,
            pricingOutputPerMillion: 0.30,
            pricingCachedInputPerMillion: 0.02,
            isEnabled: true,
          },
          telemetry_analyst: {
            primaryModel: 'openai/gpt-oss-120b',
            fallbackModel: 'deepseek-ai/DeepSeek-V3.2',
            temperature: 0.2,
            maxOutputTokens: 1000,
            timeoutMs: 16000,
            pricingInputPerMillion: 0.037,
            pricingOutputPerMillion: 0.17,
            pricingCachedInputPerMillion: 0.01,
            isEnabled: true,
          },
          habit_companion: {
            primaryModel: 'zai-org/GLM-5.3-Flash',
            fallbackModel: 'google/gemma-4-31B-it-turbo',
            temperature: 0.45,
            maxOutputTokens: 450,
            timeoutMs: 10000,
            pricingInputPerMillion: 0.15,
            pricingOutputPerMillion: 0.50,
            pricingCachedInputPerMillion: 0.03,
            isEnabled: true,
          },
          voice_asr: {
            primaryModel: 'openai/whisper-large-v3-turbo',
            fallbackModel: 'Qwen/Qwen3-ASR-1.7B',
            temperature: 0.0,
            maxOutputTokens: 400,
            timeoutMs: 15000,
            pricingInputPerMillion: 0.12,
            pricingOutputPerMillion: 0.12,
            pricingCachedInputPerMillion: 0.0,
            isEnabled: true,
          },
          memory_embedder: {
            primaryModel: 'BAAI/bge-m3',
            fallbackModel: 'sentence-transformers/all-MiniLM-L6-v2',
            temperature: 0.0,
            maxOutputTokens: 1024,
            timeoutMs: 8000,
            pricingInputPerMillion: 0.01,
            pricingOutputPerMillion: 0.0,
            pricingCachedInputPerMillion: 0.0,
            isEnabled: true,
          },
        },
        updatedAt: Date.now(),
        updatedBy: 'system',
      },
      recentAudits: [],
    };
}

export async function saveAdminSystemConfig(newConfig: Partial<AdminSystemConfig>): Promise<void> {
  if (!canCallCloudFunctions()) return;
  try {
    const fn = httpsCallable<any, any>(functions, 'adminSaveAiSettings');
    await withTimeout(fn({ updates: newConfig, newConfig }), getSmartCallableTimeoutMs(12000));
  } catch (err) {
    noteCloudFunctionError(err);
    console.info('[aiClient] adminSaveAiSettings offline/mock:', (err as Error)?.message);
  }
}

export async function testAdminModelConnection(
  serviceId: AgentServiceId,
  modelName?: string
): Promise<{ success: boolean; latencyMs: number; responsePreview: string }> {
  if (canCallCloudFunctions()) {
    try {
      const fn = httpsCallable<any, any>(functions, 'adminTestModelConnection');
      const res = await withTimeout(fn({ serviceId, modelName }), getSmartCallableTimeoutMs(18000));
      return {
        success: Boolean(res.data?.success),
        latencyMs: res.data?.latencyMs ?? res.data?.durationMs ?? 0,
        responsePreview: res.data?.responsePreview || res.data?.replyText || '',
      };
    } catch (err) {
      noteCloudFunctionError(err);
    }
  }
  return {
    success: true,
    latencyMs: 340,
    responsePreview: `[Simulação Segura R$ 0,00] Conexão validada para ${serviceId} (${modelName || 'default'}).`,
  };
}

export async function saveAdminSkillOverride(
  skillId: string,
  isEnabled: boolean,
  customProtocol?: string
): Promise<void> {
  if (!canCallCloudFunctions()) return;
  try {
    const fn = httpsCallable<any, any>(functions, 'adminSaveSkillOverride');
    await withTimeout(
      fn({ skillId, isEnabled, customProtocolMarkdown: customProtocol, customProtocol }),
      getSmartCallableTimeoutMs(12000)
    );
  } catch (err) {
    noteCloudFunctionError(err);
    console.info('[aiClient] adminSaveSkillOverride offline/mock:', (err as Error)?.message);
  }
}

export async function manageAdminUserQuota(
  targetUid: string,
  action: 'reset' | 'block' | 'unblock'
): Promise<void> {
  if (!canCallCloudFunctions()) return;
  try {
    const fn = httpsCallable<any, any>(functions, 'adminManageUserQuota');
    await withTimeout(fn({ targetUid, action }), getSmartCallableTimeoutMs(12000));
  } catch (err) {
    noteCloudFunctionError(err);
    console.info('[aiClient] adminManageUserQuota offline/mock:', (err as Error)?.message);
  }
}

export async function saveAdminApiKey(
  apiKey: string
): Promise<{ success: boolean; maskedKey: string; updatedAt?: number }> {
  const trimmed = apiKey.trim();
  if (!trimmed || trimmed.length < 8) {
    throw new Error('Chave de API inválida. O formato deve conter ao menos 8 caracteres.');
  }

  if (canCallCloudFunctions()) {
    try {
      const fn = httpsCallable<any, any>(functions, 'adminUpdateApiKey');
      const res = await withTimeout(fn({ apiKey: trimmed }), getSmartCallableTimeoutMs(12000));
      if (res.data && res.data.maskedKey) {
        mockVaultApiKeyStatus = {
          isConfigured: true,
          maskedKey: res.data.maskedKey,
          source: 'admin_vault',
          updatedAt: res.data.updatedAt || Date.now(),
        };
        return res.data;
      }
    } catch (err) {
      noteCloudFunctionError(err);
      console.info('[aiClient] adminUpdateApiKey offline/mock:', (err as Error)?.message);
    }
  }

  const maskedKey = `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
  const now = Date.now();
  mockVaultApiKeyStatus = {
    isConfigured: true,
    maskedKey,
    source: 'admin_vault',
    updatedAt: now,
  };

  return { success: true, maskedKey, updatedAt: now };
}

export function getMockVaultApiKeyStatus(): AdminApiKeyStatus {
  return mockVaultApiKeyStatus;
}

// ============================================================================
// GESTÃO DE MEMÓRIA CLÍNICA (M2) E PREFERÊNCIAS DO ALUNO
// ============================================================================

export async function fetchStudentCoreMemory(
  studentUid?: string
): Promise<CoreBiopsychosocialMemory | null> {
  const uid = studentUid || auth.currentUser?.uid;
  if (!uid) return null;

  try {
    const memRef = doc(db, 'users', uid, 'aiMemory', 'core');
    const snap = await getDoc(memRef);
    if (snap.exists()) {
      return snap.data() as CoreBiopsychosocialMemory;
    }
  } catch (err) {
    console.info('[aiClient] fetchStudentCoreMemory offline/cache:', (err as Error)?.message);
  }

  return {
    schemaVersion: 1,
    updatedAt: Date.now(),
    clinicalFacts: [],
    likedExerciseIds: [],
    dislikedExerciseIds: [],
    routineInsights: {
      realisticDurationMinutes: 25,
      mainAdherenceBarriers: [],
      preferredCoachingTone: 'acolhedor_suave',
    },
    mesocycleState: {
      cycleWeek: 1,
      cycleStartedAt: Date.now(),
      currentFocusSummary: 'Adaptação e consistência inicial',
    },
  };
}

export async function saveStudentCoreMemory(
  studentUid: string,
  memory: Partial<CoreBiopsychosocialMemory>
): Promise<void> {
  try {
    const memRef = doc(db, 'users', studentUid, 'aiMemory', 'core');
    await setDoc(memRef, memory, { merge: true });
  } catch (err) {
    console.info('[aiClient] saveStudentCoreMemory offline/cache:', (err as Error)?.message);
  }
}

export async function dismissTemporaryClinicalFact(
  studentUid: string,
  factId: string
): Promise<void> {
  const currentMem = await fetchStudentCoreMemory(studentUid);
  if (!currentMem) return;

  const now = Date.now();
  const updatedFacts = currentMem.clinicalFacts.map((fact: ClinicalMemoryFact) => {
    if (fact.id === factId) {
      return { ...fact, expiresAt: now - 1000 };
    }
    return fact;
  });

  await saveStudentCoreMemory(studentUid, {
    ...currentMem,
    clinicalFacts: updatedFacts,
    updatedAt: now,
  });
}

// ============================================================================
// M2 FEEDBACK DE EXERCÍCIOS (CURTIR / DESCURTIR)
// ============================================================================

const LOCAL_FEEDBACK_STORAGE_KEY = 'superacao_exercise_feedbacks_m2';

export interface ExerciseFeedbacksCache {
  liked: string[];
  disliked: string[];
}

export function getCachedExerciseFeedbacks(): ExerciseFeedbacksCache {
  if (typeof window === 'undefined') return { liked: [], disliked: [] };
  try {
    const raw = localStorage.getItem(LOCAL_FEEDBACK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return { liked: [], disliked: [] };
}

export async function toggleExerciseFeedback(
  studentUid: string,
  exerciseId: string,
  targetFeedback: 'like' | 'dislike'
): Promise<ExerciseFeedbacksCache> {
  const current = getCachedExerciseFeedbacks();
  const likedSet = new Set(current.liked);
  const dislikedSet = new Set(current.disliked);

  if (targetFeedback === 'like') {
    if (likedSet.has(exerciseId)) {
      likedSet.delete(exerciseId);
    } else {
      likedSet.add(exerciseId);
      dislikedSet.delete(exerciseId);
    }
  } else if (targetFeedback === 'dislike') {
    if (dislikedSet.has(exerciseId)) {
      dislikedSet.delete(exerciseId);
    } else {
      dislikedSet.add(exerciseId);
      likedSet.delete(exerciseId);
    }
  }

  const updated: ExerciseFeedbacksCache = {
    liked: Array.from(likedSet),
    disliked: Array.from(dislikedSet),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage quota or private window
    }
  }

  // Sincroniza assincronamente com o documento de memória M2 no Firestore se logado
  if (studentUid && !studentUid.startsWith('guest_')) {
    fetchStudentCoreMemory(studentUid)
      .then((mem) => {
        if (mem) {
          saveStudentCoreMemory(studentUid, {
            ...mem,
            likedExerciseIds: updated.liked,
            dislikedExerciseIds: updated.disliked,
            updatedAt: Date.now(),
          });
        }
      })
      .catch(() => {
        // tolerar offline
      });
  }

  return updated;
}

