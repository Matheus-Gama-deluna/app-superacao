import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildCoachCacheKey,
  getHeuristicInsight,
  getCachedInsight,
  saveCachedInsight,
  generateDailyInsight,
  CoachContext,
} from '../src/lib/aiCoach';

describe('Sprint 5: Coach IA de Constância (aiCoach.ts)', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    });
  });

  it('1. Gera chaves de cache determinísticas consistentes', () => {
    const ctx1: CoachContext = {
      displayName: 'Carlos',
      exerciseReason: 'Brincar com filhos',
      weeklyCompleted: 2,
      lastMood: 'renovado',
      todayPlanTitle: 'Corpo Inteiro',
    };

    const ctx2: CoachContext = {
      displayName: 'Carlos',
      exerciseReason: 'Brincar com filhos',
      weeklyCompleted: 2,
      lastMood: 'renovado',
      todayPlanTitle: 'Corpo Inteiro',
    };

    const key1 = buildCoachCacheKey(ctx1);
    const key2 = buildCoachCacheKey(ctx2);

    expect(key1).toBe(key2);
    expect(key1).toContain('carlos');
    expect(key1).toContain('2');
    expect(key1).toContain('renovado');
  });

  it('2. getHeuristicInsight prioriza o porquê pessoal do praticante', () => {
    const ctx: CoachContext = {
      displayName: 'Renata',
      exerciseReason: 'Mais disposição no trabalho',
    };

    const text = getHeuristicInsight(ctx);
    expect(text).toContain('Renata, ');
    expect(text).toContain('Mais disposição no trabalho');
  });

  it('3. getHeuristicInsight incentiva celebração de vitórias da semana', () => {
    const ctx: CoachContext = {
      displayName: 'Lucas',
      weeklyCompleted: 3,
    };

    const text = getHeuristicInsight(ctx);
    expect(text).toContain('Lucas, ');
    expect(text).toContain('3 momento(s) de autocuidado');
  });

  it('4. Salva e recupera insights no cache determinístico', () => {
    const cacheKey = 'test_key_2026';
    const insightPayload = {
      insight: 'Cada repetição é um voto na sua saúde futura.',
      isAiGenerated: false,
      timestamp: Date.now(),
    };

    saveCachedInsight(cacheKey, insightPayload);
    const retrieved = getCachedInsight(cacheKey);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.insight).toBe(insightPayload.insight);
  });

  it('5. generateDailyInsight usa fallback heurístico sem API Key e grava em cache', async () => {
    const ctx: CoachContext = {
      displayName: 'Beatriz',
      exerciseReason: 'Alívio de dores nas costas',
      weeklyCompleted: 1,
    };

    const result = await generateDailyInsight(ctx, false);

    expect(result.insight).toContain('Alívio de dores nas costas');
    expect(result.isAiGenerated).toBe(false);

    // Valida que foi gravado em cache
    const key = buildCoachCacheKey(ctx);
    const cached = getCachedInsight(key);
    expect(cached).not.toBeNull();
    expect(cached?.insight).toBe(result.insight);
  });

  it('6. generateDailyInsight reutiliza cache sem reprocessar quando forceRefresh=false', async () => {
    const ctx: CoachContext = {
      displayName: 'Marcos',
      exerciseReason: 'Subir escadas sem cansar',
    };

    const key = buildCoachCacheKey(ctx);
    saveCachedInsight(key, {
      insight: 'Insight em cache persistido anteriormente.',
      isAiGenerated: true,
      timestamp: Date.now(),
    });

    const result = await generateDailyInsight(ctx, false);
    expect(result.insight).toBe('Insight em cache persistido anteriormente.');
    expect(result.isAiGenerated).toBe(true);
  });
});
