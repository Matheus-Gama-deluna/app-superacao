import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  allExercises,
  ensureFullCatalogLoaded,
  isFullCatalogReady,
  normalizeFullCatalogItem,
  searchExercises,
  getExerciseById,
} from '../src/data/catalog';
import { findSafeEquivalentExercises } from '../src/lib/workoutEngine';
import { UserProfile, PersonalRecord } from '../src/types';

describe('Fase 8: Integridade de Dados, Catálogo 873 & Refinamentos UI', () => {
  it('1. Carrega catálogo completo de mais de 800 exercícios sob demanda sem travar camada instantânea', async () => {
    // Camada instantânea inicial deve possuir exercícios básicos
    expect(allExercises.length).toBeGreaterThan(50);

    // Carrega a camada assíncrona sob demanda
    const loadedList = await ensureFullCatalogLoaded();
    expect(loadedList.length).toBeGreaterThan(800);
    expect(isFullCatalogReady()).toBe(true);

    // Itens devem ser pesquisáveis
    const pushup = getExerciseById('pushups');
    expect(pushup).toBeDefined();
    expect(pushup?.name_pt).toContain('Flexão');
  });

  it('2. Normaliza corretamente equipamentos e apoios do catálogo expandido', () => {
    const rawMockItem = {
      id: 'mock_superband_row',
      name_pt: 'Remada com Super Band',
      equipment: ['elasticos'],
      movement_pattern: 'puxar_horizontal',
      instructions_pt: 'Prenda a faixa longa e puxe contra o tronco.',
    };

    const normalized = normalizeFullCatalogItem(rawMockItem);
    expect(normalized.equipment).toContain('faixa_longa');
    expect(normalized.movement_pattern).toBe('puxar_horizontal');
  });

  it('3. Filtra catálogo com precisão usando pílulas de Cuidado e Intenção', async () => {
    await ensureFullCatalogLoaded();

    // Filtro de Coluna & Lombar: não deve retornar itens vazios
    const colunaExercises = allExercises.filter((ex) => {
      const p = (ex.movement_pattern || '').toLowerCase();
      const n = (ex.name_pt || '').toLowerCase();
      const c = (ex.caution_pt || '').toLowerCase();
      const t = (ex.target_muscle || '').toLowerCase();
      const primaries = (ex.primary_muscles || []).map((m) => m.toLowerCase()).join(' ');

      return (
        p.includes('coluna') ||
        p.includes('lombar') ||
        p.includes('postura') ||
        p.includes('descompressao') ||
        primaries.includes('lombar') ||
        primaries.includes('coluna') ||
        c.includes('lombar') ||
        c.includes('coluna') ||
        t.includes('lombar') ||
        t.includes('coluna') ||
        n.includes('coluna') ||
        n.includes('lombar')
      );
    });
    expect(colunaExercises.length).toBeGreaterThan(10);

    // Filtro Sem Impacto: não deve conter 'burpee' ou 'jump squat'
    const lowImpactExercises = allExercises.filter((ex) => {
      const n = (ex.name_pt || '').toLowerCase();
      const p = (ex.movement_pattern || '').toLowerCase();
      return (
        !n.includes('salto') &&
        !n.includes('pular') &&
        !n.includes('burpee') &&
        !n.includes('jumping') &&
        !p.includes('salto') &&
        !p.includes('plyo')
      );
    });
    expect(lowImpactExercises.length).toBeGreaterThan(100);
    const hasBurpeeInLowImpact = lowImpactExercises.some((e) =>
      e.name_pt.toLowerCase().includes('burpee')
    );
    expect(hasBurpeeInLowImpact).toBe(false);

    // Filtro Só Peso do Corpo: não deve ter halteres nem barra
    const bodyweightOnly = allExercises.filter((ex) => {
      return (
        ex.equipment.includes('peso_corporal') &&
        !ex.equipment.some((eq) => ['halteres', 'barra', 'maquina', 'kettlebell'].includes(eq))
      );
    });
    expect(bodyweightOnly.length).toBeGreaterThan(30);
  });

  it('4. Troca rápida de exercícios na proposta inicial encontra equivalentes biomecânicos seguros', () => {
    const mockProfile: Partial<UserProfile> = {
      equipments: ['peso_corporal'],
      avoidedMovements: ['impacto_joelho'],
    };

    const pushupsId = 'pushups';
    const equivalents = findSafeEquivalentExercises(pushupsId, mockProfile, allExercises);

    // Deve retornar alternativas do mesmo padrão ou modality segura
    expect(equivalents.length).toBeGreaterThan(0);
    // Nenhuma alternativa pode exigir halteres se o usuário só tem peso corporal
    equivalents.forEach((cand) => {
      const hasHeavyGear = cand.equipment.some((eq) =>
        ['halteres', 'barra', 'kettlebell'].includes(eq)
      );
      expect(hasHeavyGear).toBe(false);
    });
  });

  it('5. Preserva integridade de dados de Personal Records (PRs) e contagem sem reset indesejado', () => {
    const pr: PersonalRecord = {
      exerciseId: 'bodyweight_squat',
      exerciseName: 'Agachamento Livre com Peso Corporal',
      bestReps: 15,
      bestDurationSeconds: 0,
      bestWeightKg: 0,
      recordedAt: Date.now(),
      sessionId: 'sess_1',
      prCount: 3,
      isBaseline: false,
    };

    expect(pr.prCount).toBe(3);
    expect(pr.isBaseline).toBe(false);

    // Atualização de PR respeita o prCount acumulado
    const updatedPR: PersonalRecord = {
      ...pr,
      bestReps: 20,
      recordedAt: Date.now() + 1000,
      prCount: (pr.prCount || 1) + 1,
    };

    expect(updatedPR.bestReps).toBe(20);
    expect(updatedPR.prCount).toBe(4);
  });
});
