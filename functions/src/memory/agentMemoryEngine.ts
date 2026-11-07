/**
 * Motor de Memória dos Agentes em 4 Camadas (v9.0)
 * Padrão inspirado em Letta (MemGPT) + Mem0 sobre Firestore Enterprise:
 * - M1: Static Prefix KV-Cache determinístico
 * - M2: Core Biopsychosocial Memory (~300 tokens) com validade temporal (chronic vs temporary)
 * - M3: Compactação Episódica (resumos atômicos <= 240 chars)
 * - M4: Recall Vetorial sob demanda
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { CoreBiopsychosocialMemory, ClinicalMemoryFact } from '../types/sharedAi.js';

export const DEFAULT_CORE_MEMORY: CoreBiopsychosocialMemory = {
  schemaVersion: 1,
  updatedAt: Date.now(),
  clinicalFacts: [],
  likedExerciseIds: [],
  dislikedExerciseIds: [],
  routineInsights: {
    realisticDurationMinutes: 20,
    mainAdherenceBarriers: [],
    preferredCoachingTone: 'acolhedor_suave',
    personalMotivationSummary: '',
  },
  mesocycleState: {
    cycleWeek: 1,
    cycleStartedAt: Date.now(),
    currentFocusSummary: 'Construção inicial de constância e domínio de padrões motores',
  },
};

/**
 * Lê a memória central M2 do usuário, filtrando automaticamente fatos temporários expirados
 */
export async function loadActiveCoreMemory(uid: string): Promise<CoreBiopsychosocialMemory> {
  if (!uid || uid === 'guest' || uid.startsWith('test_')) {
    return { ...DEFAULT_CORE_MEMORY };
  }

  try {
    const db = getFirestore();
    const docRef = db.collection('users').doc(uid).collection('aiMemory').doc('core');
    const snap = await docRef.get();

    if (!snap.exists) {
      return { ...DEFAULT_CORE_MEMORY };
    }

    const data = snap.data() as CoreBiopsychosocialMemory;
    const now = Date.now();

    // Filtra automaticamente fatos temporários que já expiraram
    const activeFacts = (data.clinicalFacts || []).filter((fact) => {
      if (fact.persistence === 'temporary' && fact.expiresAt && fact.expiresAt <= now) {
        return false;
      }
      return true;
    });

    return {
      ...data,
      clinicalFacts: activeFacts,
    };
  } catch (err) {
    console.warn(`[AgentMemory] Erro ao carregar memória para ${uid}, usando default:`, err);
    return { ...DEFAULT_CORE_MEMORY };
  }
}

/**
 * Atualiza a memória central M2 com política Upsert-or-Supersede
 */
export async function updateCoreMemory(
  uid: string,
  updates: {
    newClinicalFacts?: ClinicalMemoryFact[];
    removeFactIds?: string[];
    addLikedExercises?: string[];
    addDislikedExercises?: string[];
    routineInsightsPartial?: Partial<CoreBiopsychosocialMemory['routineInsights']>;
    mesocyclePartial?: Partial<CoreBiopsychosocialMemory['mesocycleState']>;
  }
): Promise<CoreBiopsychosocialMemory> {
  if (!uid || uid === 'guest' || uid.startsWith('test_')) {
    return { ...DEFAULT_CORE_MEMORY };
  }

  try {
    const db = getFirestore();
    const docRef = db.collection('users').doc(uid).collection('aiMemory').doc('core');
    const current = await loadActiveCoreMemory(uid);

    // 1. Processa remoções
    let updatedFacts = current.clinicalFacts.filter((f) => !updates.removeFactIds?.includes(f.id));

    // 2. Processa novos fatos (Upsert por chave canônica)
    if (updates.newClinicalFacts && updates.newClinicalFacts.length > 0) {
      for (const newFact of updates.newClinicalFacts) {
        const existingIdx = updatedFacts.findIndex((f) => f.id === newFact.id);
        if (existingIdx >= 0) {
          // Substitui o fato antigo pelo mais recente (Supersede)
          updatedFacts[existingIdx] = { ...newFact, updatedAt: Date.now() };
        } else {
          updatedFacts.push({ ...newFact, createdAt: Date.now(), updatedAt: Date.now() });
        }
      }
    }

    // 3. Gostos e preferências (com deduplicação)
    const liked = Array.from(new Set([...current.likedExerciseIds, ...(updates.addLikedExercises || [])]));
    const disliked = Array.from(new Set([...current.dislikedExerciseIds, ...(updates.addDislikedExercises || [])]));

    const nextMemory: CoreBiopsychosocialMemory = {
      schemaVersion: 1,
      updatedAt: Date.now(),
      clinicalFacts: updatedFacts,
      likedExerciseIds: liked,
      dislikedExerciseIds: disliked,
      routineInsights: {
        ...current.routineInsights,
        ...(updates.routineInsightsPartial || {}),
      },
      mesocycleState: {
        ...current.mesocycleState,
        ...(updates.mesocyclePartial || {}),
      },
    };

    await docRef.set(nextMemory, { merge: true });
    return nextMemory;
  } catch (err) {
    console.error(`[AgentMemory] Erro ao salvar memória M2 para ${uid}:`, err);
    return { ...DEFAULT_CORE_MEMORY };
  }
}

/**
 * Serializa a memória M2 em um formato conciso para injeção no prompt (~250 a 350 tokens)
 */
export function formatCoreMemoryForPrompt(memory: CoreBiopsychosocialMemory): string {
  const factsLines =
    memory.clinicalFacts.length > 0
      ? memory.clinicalFacts
          .map((f) => {
            const tempTag = f.persistence === 'temporary' ? ' (temporário/recente)' : ' (crônico)';
            return `  - ${f.labelPt}${tempTag}. Cuidado: ${f.protectiveCuePt}`;
          })
          .join('\n')
      : '  - Sem restrições articulares registradas no momento.';

  const likedStr = memory.likedExerciseIds.length > 0 ? memory.likedExerciseIds.slice(0, 5).join(', ') : 'Nenhum específico';
  const dislikedStr = memory.dislikedExerciseIds.length > 0 ? memory.dislikedExerciseIds.slice(0, 5).join(', ') : 'Nenhum';

  return `MEMÓRIA ATIVA DO ALUNO (M2 - Core Profile):
Cuidados Físicos Ativos:
${factsLines}
Exercícios Preferidos: ${likedStr}
Exercícios Evitados pelo Aluno: ${dislikedStr}
Tempo Realista de Prática: ~${memory.routineInsights.realisticDurationMinutes || 20} minutos
Tom de Acolhimento Preferido: ${memory.routineInsights.preferredCoachingTone}
Estado do Ciclo: Semana ${memory.mesocycleState.cycleWeek}/4 - ${memory.mesocycleState.currentFocusSummary}`;
}

/**
 * Salva um episódio atômico M3 (máx. 240 chars)
 */
export async function recordEpisodicMemory(
  uid: string,
  category: 'clinical_note' | 'workout_adaptation' | 'weekly_review' | 'milestone',
  summaryPt: string
): Promise<void> {
  if (!uid || uid === 'guest' || uid.startsWith('test_')) return;

  try {
    const db = getFirestore();
    const episodeId = `ep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const epRef = db.collection('users').doc(uid).collection('aiMemory').doc('episodes').collection('items').doc(episodeId);

    await epRef.set({
      id: episodeId,
      createdAt: Date.now(),
      category,
      summaryPt: summaryPt.slice(0, 240),
    });
  } catch (err) {
    console.warn(`[AgentMemory] Aviso ao salvar episódio M3 para ${uid}:`, err);
  }
}
