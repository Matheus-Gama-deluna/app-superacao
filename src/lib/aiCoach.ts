/**
 * AI Coach - Assistente de Constância e Hábitos Superação
 *
 * Arquitetura de Custo Mínimo & Inteligência Máxima:
 * 1. Modelo oficial: gemini-2.5-flash-lite (ultra-rápido, econômico e eficiente).
 * 2. Cache Determinístico em localStorage: Chave baseada em dia (YYYY-MM-DD) + contexto do praticante.
 *    Se o dia ou estado não mudou, o retorno é instantâneo (0ms) e custo ZERO.
 * 3. Lazy Loading do SDK: O pacote @google/genai só é baixado pelo navegador quando há chave de API ativa.
 * 4. Fallback Heurístico Resiliente: Sem chave ou offline, fornece pílulas empáticas baseadas no porquê pessoal e histórico.
 */

export interface CoachContext {
  displayName?: string;
  exerciseReason?: string;
  habitAnchor?: string;
  weeklyCompleted?: number;
  lastMood?: string;
  todayPlanTitle?: string;
}

export interface CoachInsightResult {
  insight: string;
  isAiGenerated: boolean;
  timestamp: number;
}

const CACHE_STORAGE_KEY = 'superacao_ai_coach_cache';

/**
 * Constrói uma chave determinística diária baseada no estado do usuário.
 */
export function buildCoachCacheKey(ctx: CoachContext): string {
  const today = new Date().toISOString().slice(0, 10);
  const name = (ctx.displayName || 'user').trim().toLowerCase();
  const reason = (ctx.exerciseReason || 'health').trim().toLowerCase();
  const weekly = ctx.weeklyCompleted ?? 0;
  const mood = (ctx.lastMood || 'neutral').trim().toLowerCase();
  const plan = (ctx.todayPlanTitle || 'rest').trim().toLowerCase();
  return `${today}_${name}_${weekly}_${mood}_${reason.slice(0, 15)}_${plan.slice(0, 15)}`;
}

/**
 * Recupera o insight em cache determinístico se ainda for válido.
 */
export function getCachedInsight(cacheKey: string): CoachInsightResult | null {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    const cacheMap: Record<string, CoachInsightResult> = JSON.parse(raw);
    return cacheMap[cacheKey] || null;
  } catch {
    return null;
  }
}

/**
 * Salva o insight no cache determinístico.
 */
export function saveCachedInsight(cacheKey: string, result: CoachInsightResult): void {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    const cacheMap: Record<string, CoachInsightResult> = raw ? JSON.parse(raw) : {};
    cacheMap[cacheKey] = result;
    // Mantém no máximo os 10 últimos registros para poupar espaço
    const keys = Object.keys(cacheMap);
    if (keys.length > 10) {
      delete cacheMap[keys[0]];
    }
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheMap));
  } catch {
    // Falha silenciosa para não quebrar a aplicação
  }
}

/**
 * Motor heurístico 100% offline para momentos sem conexão ou sem API Key.
 * Utiliza psicologia comportamental acolhedora e o porquê pessoal do praticante.
 */
export function getHeuristicInsight(ctx: CoachContext): string {
  const name = ctx.displayName ? `${ctx.displayName}, ` : '';
  const reason = ctx.exerciseReason?.trim();
  const weekly = ctx.weeklyCompleted ?? 0;
  const mood = ctx.lastMood?.toLowerCase();

  if (reason && reason.length > 3) {
    return `${name}lembre-se do que te move: "${reason}". Cada repetição com carinho e presença te aproxima dessa vida que você escolheu construir.`;
  }

  if (mood && (mood.includes('renov') || mood.includes('leve') || mood.includes('energ'))) {
    return `${name}guarde a sensação boa do seu último treino! O movimento regular é o melhor remédio preventivo para o seu corpo e mente.`;
  }

  if (weekly > 0) {
    return `${name}você já somou ${weekly} momento(s) de autocuidado nesta semana! A constância no seu ritmo é o maior ato de respeito ao seu corpo.`;
  }

  if (ctx.habitAnchor) {
    return `${name}que tal aproveitar o seu momento "${ctx.habitAnchor}" para movimentar o corpo suavemente? Pequenos passos repetidos geram grandes transformações.`;
  }

  return `${name}hoje é um dia especial para honrar o seu corpo sem pressa. Não precisa ser perfeito, basta ser possível!`;
}

/**
 * Gera ou recupera a pílula de sabedoria do dia.
 */
export async function generateDailyInsight(
  ctx: CoachContext,
  forceRefresh: boolean = false
): Promise<CoachInsightResult> {
  const cacheKey = buildCoachCacheKey(ctx);

  // 1. Verifica cache determinístico
  if (!forceRefresh) {
    const cached = getCachedInsight(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // 2. Verifica disponibilidade da API Key do Google Gemini
  // Suporta VITE_GEMINI_API_KEY ou VITE_GOOGLE_GENAI_API_KEY
  const apiKey =
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_GENAI_API_KEY
      : undefined) || '';

  // Se não houver chave ou estiver explicitamente offline, usa o motor heurístico
  if (!apiKey || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    const heuristicResult: CoachInsightResult = {
      insight: getHeuristicInsight(ctx),
      isAiGenerated: false,
      timestamp: Date.now(),
    };
    saveCachedInsight(cacheKey, heuristicResult);
    return heuristicResult;
  }

  // 3. Chamada inteligente ao Gemini 2.5 Flash Lite via lazy import
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é o Coach de Constância e Hábitos do aplicativo Superação.
Seu tom é acolhedor, empático, gentil, centrado na saúde e sem jargões agressivos de academia.
Dados do Praticante:
- Nome: ${ctx.displayName || 'Praticante'}
- Motivo pessoal para treinar: ${ctx.exerciseReason || 'Qualidade de vida'}
- Âncora de rotina: ${ctx.habitAnchor || 'Rotina diária'}
- Treinos concluídos nesta semana: ${ctx.weeklyCompleted ?? 0}
- Sensação recente pós-treino: ${ctx.lastMood || 'Equilibrada'}
- Treino sugerido hoje: ${ctx.todayPlanTitle || 'Movimento do dia'}

Escreva uma reflexão inspiradora de no MÁXIMO 2 frases curtas (máximo 35 palavras). Seja conciso, humano e acolhedor. Não use clichês militares nem agressividade.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 90,
      },
    });

    const text = response.text ? response.text.trim().replace(/^["']|["']$/g, '') : '';
    if (text && text.length > 10) {
      const result: CoachInsightResult = {
        insight: text,
        isAiGenerated: true,
        timestamp: Date.now(),
      };
      saveCachedInsight(cacheKey, result);
      return result;
    }

    throw new Error('Resposta vazia da IA');
  } catch (error) {
    // Fallback gracioso para a heurística
    const fallbackResult: CoachInsightResult = {
      insight: getHeuristicInsight(ctx),
      isAiGenerated: false,
      timestamp: Date.now(),
    };
    saveCachedInsight(cacheKey, fallbackResult);
    return fallbackResult;
  }
}
