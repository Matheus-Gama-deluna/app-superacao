/**
 * Motor de Memória dos Agentes em 4 Camadas (v9.5 Produção)
 * - M1: Working Memory (últimos 6 turnos) + Static Prefix Cache
 * - M2: Core Biopsychosocial Memory (~300 tokens) com TTL automático para dores temporárias
 * - M3: Episódios Atômicos (<= 240 chars) gravados automaticamente em eventos relevantes
 * - M4: Recall Semântico Híbrido (70% cosseno BAAI/bge-m3 256d + 30% recência temporal)
 */

import { CoreBiopsychosocialMemory, ClinicalMemoryFact } from '../types/sharedAi.js';
import { getAppDb, isFirestoreAvailable } from '../lib/db.js';
import { DEFAULT_AGENT_MODELS, getResolvedDeepInfraApiKey } from '../config/agentModels.js';
import { recordAiExecutionMetrics } from '../admin/usageLedger.js';

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
 * Gera vetor de embedding truncado e normalizado L2 (256 dimensões) via BAAI/bge-m3 / fallback
 */
export async function generateEmbeddingVector(
  text: string,
  options?: { uid?: string; apiKey?: string; forceMock?: boolean }
): Promise<number[]> {
  const cleanText = (text || '').trim().slice(0, 500);
  if (!cleanText) return [];

  const apiKey = options?.apiKey || (await getResolvedDeepInfraApiKey());
  if (!apiKey || options?.forceMock) {
    return [];
  }

  const startTime = Date.now();
  const spec = DEFAULT_AGENT_MODELS.memory_embedder;

  for (const model of [spec.primaryModel, spec.fallbackModel]) {
    try {
      const res = await fetch('https://api.deepinfra.com/v1/openai/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, input: cleanText }),
        signal: AbortSignal.timeout(spec.timeoutMs || 8000),
      });
      if (!res.ok) continue;

      const data: any = await res.json();
      const rawVec: number[] = data?.data?.[0]?.embedding || [];
      if (rawVec.length === 0) continue;

      // Trunca para 256d e normaliza L2 (Matryoshka / economia de armazenamento Firestore)
      const sliced = rawVec.slice(0, 256);
      const norm = Math.sqrt(sliced.reduce((acc, v) => acc + v * v, 0)) || 1;
      const normalized = sliced.map((v) => Number((v / norm).toFixed(5)));

      await recordAiExecutionMetrics({
        serviceId: 'memory_embedder',
        uid: options?.uid || 'system',
        tokensUsed: { inputTokens: data?.usage?.prompt_tokens || 25, outputTokens: 0 },
        durationMs: Date.now() - startTime,
        isFallback: model === spec.fallbackModel,
      });

      return normalized;
    } catch {
      // Tenta fallback ou encerra silenciosamente sem travar o agente principal
    }
  }

  return [];
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length) return 0;
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, dot));
}

/**
 * Lê a memória central M2 do usuário no banco nomeado, filtrando fatos temporários expirados
 */
export async function loadActiveCoreMemory(uid: string): Promise<CoreBiopsychosocialMemory> {
  if (!uid || uid === 'guest' || uid.startsWith('test_') || !isFirestoreAvailable()) {
    return { ...DEFAULT_CORE_MEMORY };
  }

  try {
    const db = getAppDb();
    const docRef = db.collection('users').doc(uid).collection('aiMemory').doc('core');
    const snap = await docRef.get();

    if (!snap.exists) {
      return { ...DEFAULT_CORE_MEMORY };
    }

    const data = snap.data() as CoreBiopsychosocialMemory;
    const now = Date.now();

    const activeFacts = (data.clinicalFacts || []).filter((fact) => {
      if (fact.persistence === 'temporary' && fact.expiresAt && fact.expiresAt <= now) {
        return false;
      }
      return true;
    });

    return {
      ...DEFAULT_CORE_MEMORY,
      ...data,
      routineInsights: {
        ...DEFAULT_CORE_MEMORY.routineInsights,
        ...(data.routineInsights || {}),
      },
      mesocycleState: {
        ...DEFAULT_CORE_MEMORY.mesocycleState,
        ...(data.mesocycleState || {}),
      },
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
  if (!uid || uid === 'guest' || uid.startsWith('test_') || !isFirestoreAvailable()) {
    return { ...DEFAULT_CORE_MEMORY };
  }

  try {
    const db = getAppDb();
    const docRef = db.collection('users').doc(uid).collection('aiMemory').doc('core');
    const current = await loadActiveCoreMemory(uid);

    let updatedFacts = current.clinicalFacts.filter((f) => !updates.removeFactIds?.includes(f.id));

    if (updates.newClinicalFacts && updates.newClinicalFacts.length > 0) {
      for (const newFact of updates.newClinicalFacts) {
        const existingIdx = updatedFacts.findIndex((f) => f.id === newFact.id);
        if (existingIdx >= 0) {
          updatedFacts[existingIdx] = { ...newFact, updatedAt: Date.now() };
        } else {
          updatedFacts.push({ ...newFact, createdAt: Date.now(), updatedAt: Date.now() });
        }
      }
    }

    // Limita no máximo 10 fatos ativos para nunca estourar orçamento de tokens M2
    if (updatedFacts.length > 10) {
      updatedFacts = updatedFacts.slice(-10);
    }

    const liked = Array.from(new Set([...current.likedExerciseIds, ...(updates.addLikedExercises || [])])).slice(-15);
    const disliked = Array.from(new Set([...current.dislikedExerciseIds, ...(updates.addDislikedExercises || [])])).slice(-15);

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
 * Serializa a memória M2 + Episódios M3/M4 recuperados para injeção enxuta no prompt
 */
export function formatCoreMemoryForPrompt(
  memory: CoreBiopsychosocialMemory,
  relevantEpisodes: string[] = []
): string {
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
  const episodesBlock =
    relevantEpisodes.length > 0
      ? `\nHistórico Recente Relevante (M3/M4):\n${relevantEpisodes.map((e) => `  * ${e}`).join('\n')}`
      : '';

  return `MEMÓRIA ATIVA DO ALUNO (M2 - Core Profile):
Cuidados Físicos Ativos:
${factsLines}
Exercícios Preferidos: ${likedStr}
Exercícios Evitados pelo Aluno: ${dislikedStr}
Tempo Realista de Prática: ~${memory.routineInsights.realisticDurationMinutes || 20} minutos
Tom de Acolhimento Preferido: ${memory.routineInsights.preferredCoachingTone}
Estado do Ciclo: Semana ${memory.mesocycleState.cycleWeek}/8 - ${memory.mesocycleState.currentFocusSummary}${episodesBlock}`;
}

/**
 * Salva um episódio atômico M3 (máx. 240 chars) com vetor semântico M4 opcional
 */
export async function recordEpisodicMemory(
  uid: string,
  category: 'clinical_note' | 'workout_adaptation' | 'weekly_review' | 'milestone',
  summaryPt: string,
  withEmbedding = false
): Promise<void> {
  if (!uid || uid === 'guest' || uid.startsWith('test_') || !isFirestoreAvailable()) return;

  try {
    const db = getAppDb();
    const episodeId = `ep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const epRef = db.collection('users').doc(uid).collection('aiMemory').doc('episodes').collection('items').doc(episodeId);
    const trimmed = summaryPt.slice(0, 240);
    const embedding = withEmbedding ? await generateEmbeddingVector(trimmed, { uid }) : [];

    await epRef.set({
      id: episodeId,
      createdAt: Date.now(),
      category,
      summaryPt: trimmed,
      ...(embedding.length > 0 ? { embedding256: embedding } : {}),
    });
  } catch (err) {
    console.warn(`[AgentMemory] Aviso ao salvar episódio M3 para ${uid}:`, err);
  }
}

/**
 * Recupera Top-K episódios relevantes combinando similaridade vetorial (70%) + recência (30%)
 */
export async function retrieveRelevantEpisodes(
  uid: string,
  queryText: string,
  topK = 3
): Promise<string[]> {
  if (!uid || uid === 'guest' || uid.startsWith('test_') || !isFirestoreAvailable()) {
    return [];
  }

  try {
    const db = getAppDb();
    const snap = await db
      .collection('users')
      .doc(uid)
      .collection('aiMemory')
      .doc('episodes')
      .collection('items')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    if (snap.empty) return [];

    const docs = snap.docs.map((d) => d.data());
    const hasAnyVector = docs.some((d) => Array.isArray(d.embedding256) && d.embedding256.length > 0);
    const queryVec = hasAnyVector ? await generateEmbeddingVector(queryText, { uid }) : [];
    const now = Date.now();

    const scored = docs.map((d) => {
      const ageDays = Math.max(0, (now - Number(d.createdAt || now)) / (1000 * 60 * 60 * 24));
      const recencyScore = Math.exp(-ageDays / 21); // meia-vida suave de ~3 semanas
      const semanticScore =
        queryVec.length > 0 && Array.isArray(d.embedding256)
          ? cosineSimilarity(queryVec, d.embedding256)
          : 0.5;
      const finalScore = queryVec.length > 0 ? 0.7 * semanticScore + 0.3 * recencyScore : recencyScore;
      return { summaryPt: String(d.summaryPt || ''), finalScore };
    });

    return scored
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, topK)
      .map((s) => s.summaryPt)
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Extrai fatos clínicos/contextuais do turno (custo zero de LLM) e atualiza M2 + M3 em background
 */
export async function autoExtractAndPersistTurnMemory(params: {
  uid: string;
  userMessage: string;
  actionType?: string | null;
  summaryTextPt?: string;
}): Promise<void> {
  const { uid, userMessage, actionType, summaryTextPt } = params;
  if (!uid || uid === 'guest' || uid.startsWith('test_') || !isFirestoreAvailable()) return;

  const textNorm = (userMessage || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const isChronic = /cronica|hernia|condromalacia|artrose|sempre|antiga|protusao|tendinite/.test(textNorm);
  const newFacts: ClinicalMemoryFact[] = [];

  if (/joelho|patela|agach/.test(textNorm) && /dor|fisgada|incomodo|sensivel|estalo|travad/.test(textNorm)) {
    newFacts.push({
      id: 'fact_knee_care',
      labelPt: 'Sensibilidade articular reportada nos joelhos',
      persistence: isChronic ? 'chronic' : 'temporary',
      avoidedMovements: ['agachamento_profundo', 'impacto_saltos'],
      expiresAt: isChronic ? undefined : now + sevenDaysMs,
      protectiveCuePt: 'Preferir elevação pélvica, isometria indolor ou agachamento em amplitude reduzida.',
      createdAt: now,
      updatedAt: now,
    });
  }

  if (/lombar|coluna|costas|ciatico/.test(textNorm) && /dor|fisgada|incomodo|travad|tens/.test(textNorm)) {
    newFacts.push({
      id: 'fact_lumbar_care',
      labelPt: 'Tensão/sensibilidade lombar reportada',
      persistence: isChronic ? 'chronic' : 'temporary',
      avoidedMovements: ['sobrecarga_lombar'],
      expiresAt: isChronic ? undefined : now + sevenDaysMs,
      protectiveCuePt: 'Evitar carga axial pesada e flexão lombar sob carga; priorizar core neutro.',
      createdAt: now,
      updatedAt: now,
    });
  }

  if (/ombro|manguito|punho|pulso|pegada/.test(textNorm) && /dor|fisgada|incomodo|travad|fadig/.test(textNorm)) {
    newFacts.push({
      id: 'fact_upper_limb_care',
      labelPt: 'Sensibilidade em ombros/punhos ou fadiga de pegada',
      persistence: isChronic ? 'chronic' : 'temporary',
      avoidedMovements: ['flexao_chao'],
      expiresAt: isChronic ? undefined : now + sevenDaysMs,
      protectiveCuePt: 'Evitar apoio palmar espalmado no solo e elevações acima da cabeça desconfortáveis.',
      createdAt: now,
      updatedAt: now,
    });
  }

  if (/jiu-jitsu|jiu jitsu|bjj|muay thai|boxe|judo|karate|luta|tatame/.test(textNorm)) {
    newFacts.push({
      id: 'fact_combat_sport_practitioner',
      labelPt: 'Praticante de Arte Marcial / Esporte de Combate',
      persistence: 'chronic',
      avoidedMovements: [],
      protectiveCuePt: 'Gerenciar interferência de pegada, quadril, ombros e coluna em dias pós-tatame.',
      createdAt: now,
      updatedAt: now,
    });
  }

  if (newFacts.length > 0) {
    await updateCoreMemory(uid, { newClinicalFacts: newFacts });
  }

  if (newFacts.length > 0 || actionType) {
    const epSummary = summaryTextPt
      ? `Relato: "${userMessage.slice(0, 100)}" -> Ajuste: ${summaryTextPt.slice(0, 110)}`
      : `Relato clínico/contextual: "${userMessage.slice(0, 200)}"`;
    await recordEpisodicMemory(
      uid,
      newFacts.length > 0 ? 'clinical_note' : 'workout_adaptation',
      epSummary,
      newFacts.length > 0
    );
  }
}
